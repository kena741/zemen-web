import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/env";
import { loadChapaSecretKey, normalizeChapaPhone } from "@/lib/chapa";
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

		const admin = getSupabaseAdmin();
		const chapaSecretKey = await loadChapaSecretKey(admin);
		if (!chapaSecretKey) {
			return NextResponse.json({ error: "Chapa is not configured" }, { status: 500 });
		}

		const appBaseUrl = getSiteUrl();
		const txRef = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.slice(0, 50);
		const returnPath = (body.return_path ?? "/pay/done").trim() || "/pay/done";
		const email = (body.email ?? "").trim() || "payments@zemen.app";
		const firstName = (body.first_name ?? "").trim() || "Customer";
		const lastName = (body.last_name ?? "").trim() || "";
		const phoneNumber = normalizeChapaPhone(body.phone_number);
		const purpose = (body.purpose ?? "wallet").trim();

		const chapaPayload: Record<string, string> = {
			amount: amount.toFixed(2),
			currency: "ETB",
			email,
			first_name: firstName,
			last_name: lastName,
			tx_ref: txRef,
			return_url: `${appBaseUrl}${returnPath}?tx_ref=${encodeURIComponent(txRef)}&purpose=${encodeURIComponent(purpose)}&amount=${amount.toFixed(2)}`,
			"customization[title]": "Zemen",
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

		if (purpose === "activation" && body.provider_id?.trim()) {
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
