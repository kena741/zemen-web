import { NextResponse } from "next/server";

import { getSiteUrlFromRequest, isBackendMode } from "@/lib/env";
import { loadChapaSecretKey, normalizeChapaPhone } from "@/lib/chapa";
import { proxyToBackend } from "@/lib/backend/proxy";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 500_000;

interface PayBody {
	amount?: number | string;
	email?: string;
	first_name?: string;
	last_name?: string;
	phone_number?: string;
	purpose?: string;
	return_path?: string;
	provider_id?: string;
	booking_id?: string;
	service_id?: string;
	plan_id?: number;
	to_tier_max?: number;
	from_tier_max?: number;
}

function parseAmount(value: number | string | undefined): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim()) {
		const n = Number.parseFloat(value.trim());
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as PayBody;
		const amount = parseAmount(body.amount);
		if (amount == null || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
			return NextResponse.json(
				{ error: `Amount must be between ETB ${MIN_AMOUNT} and ${MAX_AMOUNT.toLocaleString()}` },
				{ status: 400 },
			);
		}

		const purpose = (body.purpose ?? "wallet").trim();
		const appBaseUrl = getSiteUrlFromRequest(request);
		const returnPath = (body.return_path ?? "/pay/done").trim() || "/pay/done";
		const returnUrl = new URL(
			returnPath.startsWith("http")
				? returnPath
				: `${appBaseUrl}${returnPath.startsWith("/") ? "" : "/"}${returnPath}`,
		);

		if (isBackendMode() && body.booking_id?.trim()) {
			const proxied = await proxyToBackend(
				`/admin/bookings/${body.booking_id.trim()}/payment`,
				request,
				{
					method: "POST",
					body: {
						amount,
						email: body.email,
						first_name: body.first_name,
						last_name: body.last_name,
						phone_number: body.phone_number,
						return_path: body.return_path,
						purpose: body.purpose,
					},
				},
			);
			if (proxied) return proxied;
		}

		// Staging tier purchase is Chapa via backend (Telebirr not in paymentMethods).
		if (
			isBackendMode() &&
			(purpose === "tier" || purpose === "service-tier")
		) {
			returnUrl.searchParams.set("purpose", purpose);
			returnUrl.searchParams.set("amount", amount.toFixed(2));
			const proxied = await proxyToBackend(
				"/payments/service-tier/initiate",
				request,
				{
					method: "POST",
					body: {
						planId: body.plan_id ?? null,
						tierMax: body.to_tier_max ?? null,
						returnUrl: returnUrl.toString(),
						callbackUrl: `${appBaseUrl}/api/pay/verify`,
					},
				},
			);
			if (!proxied) {
				return NextResponse.json(
					{ error: "Backend payment proxy unavailable" },
					{ status: 500 },
				);
			}
			const raw = await proxied.json().catch(() => null);
			const data =
				raw && typeof raw === "object"
					? (raw as Record<string, unknown>)
					: {};
			if (!proxied.ok) {
				return NextResponse.json(
					{
						error:
							String(data.message ?? data.detail ?? data.error ?? "").trim() ||
							"Failed to start plan payment",
					},
					{ status: proxied.status },
				);
			}
			const checkoutUrl = String(
				data.checkoutUrl ?? data.checkout_url ?? "",
			).trim();
			const txRef = String(data.txRef ?? data.tx_ref ?? "").trim();
			if (!checkoutUrl) {
				return NextResponse.json(
					{ error: "No checkout URL from payment service" },
					{ status: 502 },
				);
			}
			return NextResponse.json({
				status: "success",
				checkout_url: checkoutUrl,
				tx_ref: txRef,
				amount: amount.toFixed(2),
			});
		}

		let chapaSecretKey = (process.env.CHAPA_SECRET_KEY || "").trim();
		if (!isBackendMode()) {
			const admin = getSupabaseAdmin();
			chapaSecretKey = await loadChapaSecretKey(admin);
		}
		if (!chapaSecretKey) {
			return NextResponse.json({ error: "Chapa is not configured" }, { status: 500 });
		}

		const txRef = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.slice(0, 50);
		const email = (body.email ?? "").trim() || "payments@zemen.app";
		const firstName = (body.first_name ?? "").trim() || "Customer";
		const lastName = (body.last_name ?? "").trim() || "";
		const phoneNumber = normalizeChapaPhone(body.phone_number);

		const chapaPayload: Record<string, string> = {
			amount: amount.toFixed(2),
			currency: "ETB",
			email,
			first_name: firstName,
			last_name: lastName,
			tx_ref: txRef,
			return_url: `${returnUrl.origin}${returnUrl.pathname}${returnUrl.search ? `${returnUrl.search}&` : "?"}tx_ref=${encodeURIComponent(txRef)}&purpose=${encodeURIComponent(purpose)}&amount=${amount.toFixed(2)}`,
			"customization[title]": "Zemen Service",
			"customization[description]": `${purpose} ETB ${amount.toFixed(2)}`,
		};
		if (phoneNumber) chapaPayload.phone_number = phoneNumber;

		const chapaResponse = await fetch("https://api.chapa.co/v1/transaction/initialize", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${chapaSecretKey}`,
			},
			body: JSON.stringify(chapaPayload),
		});

		const chapaData = (await chapaResponse.json()) as {
			status?: string;
			message?: string;
			data?: { checkout_url?: string };
		};

		if (!chapaResponse.ok || chapaData.status !== "success" || !chapaData.data?.checkout_url) {
			return NextResponse.json(
				{ error: chapaData.message || "Failed to initialize Chapa checkout" },
				{ status: 400 },
			);
		}

		if (
			!isBackendMode() &&
			purpose === "activation" &&
			body.provider_id?.trim()
		) {
			const admin = getSupabaseAdmin();
			await admin
				.from("provider")
				.update({ activation_tx_ref: txRef })
				.eq("id", body.provider_id.trim());
		}

		return NextResponse.json({
			status: "success",
			checkout_url: chapaData.data.checkout_url,
			tx_ref: txRef,
			amount: amount.toFixed(2),
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unexpected error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
