import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSiteUrl } from "@/lib/env";
import {
	createTelebirrCheckout,
	generateMerchOrderId,
	loadTelebirrConfig,
	type TelebirrCheckoutMode,
} from "@/lib/telebirr";
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
	/** Client detects SuperApp and sends miniapp | h5. */
	mode?: TelebirrCheckoutMode;
}

function parseAmount(value: number | string | undefined): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim()) {
		const n = Number.parseFloat(value.trim());
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

function tryGetAdmin(): SupabaseClient | null {
	try {
		return getSupabaseAdmin();
	} catch {
		return null;
	}
}

export async function POST(request: Request) {
	let mode: TelebirrCheckoutMode = "h5";
	let amountLog: number | null = null;
	let purposeLog = "wallet";
	let txRefLog: string | null = null;

	try {
		const body = (await request.json()) as PayBody;
		const amount = parseAmount(body.amount);
		amountLog = amount;
		if (amount == null || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
			console.warn("[telebirr] invalid amount", { amount: body.amount });
			return NextResponse.json(
				{
					error: `Amount must be between ETB ${MIN_AMOUNT} and ${MAX_AMOUNT.toLocaleString()}`,
				},
				{ status: 400 },
			);
		}

		const admin = tryGetAdmin();
		const config = await loadTelebirrConfig(admin ?? undefined);
		if (!config) {
			console.error("[telebirr] not configured");
			return NextResponse.json(
				{ error: "Telebirr is not configured" },
				{ status: 500 },
			);
		}

		const appBaseUrl = getSiteUrl().replace(/\/$/, "");
		const txRef = generateMerchOrderId("web");
		txRefLog = txRef;
		const purpose = (body.purpose ?? "wallet").trim();
		purposeLog = purpose;
		const returnPath =
			(body.return_path ?? "/pay/done").trim() || "/pay/done";
		const returnUrl = new URL(
			returnPath.startsWith("http")
				? returnPath
				: `${appBaseUrl}${returnPath.startsWith("/") ? "" : "/"}${returnPath}`,
		);
		returnUrl.searchParams.set("tx_ref", txRef);
		returnUrl.searchParams.set("purpose", purpose);
		returnUrl.searchParams.set("amount", amount.toFixed(2));

		mode = body.mode === "miniapp" ? "miniapp" : "h5";

		console.info("[telebirr] create order", {
			mode,
			purpose,
			amount: amount.toFixed(2),
			tx_ref: txRef,
			merch_code: config.merchantCode,
			merchant_app_id: config.merchantAppId,
			base_url: config.baseUrl,
		});

		const checkout = await createTelebirrCheckout({
			config,
			title: `Zemen ${purpose} ETB ${amount.toFixed(2)}`,
			amount,
			merchOrderId: txRef,
			redirectUrl: returnUrl.toString(),
			mode,
		});

		if (purpose === "activation" && body.provider_id?.trim()) {
			if (!admin) {
				console.error("[telebirr] activation missing service role");
				return NextResponse.json(
					{
						error:
							"SUPABASE_SERVICE_ROLE_KEY is required for activation payments",
					},
					{ status: 500 },
				);
			}
			await admin
				.from("provider")
				.update({ activation_tx_ref: checkout.merchOrderId })
				.eq("id", body.provider_id.trim());
		}

		console.info("[telebirr] create order ok", {
			mode,
			tx_ref: checkout.merchOrderId,
			prepay_id: checkout.prepayId,
			has_raw_request: Boolean(checkout.rawRequest),
			raw_request_len: checkout.rawRequest.length,
			raw_request_prefix: checkout.rawRequest.slice(0, 64),
			has_checkout_url: Boolean(checkout.checkoutUrl),
		});

		return NextResponse.json({
			status: "success",
			checkout_url: checkout.checkoutUrl,
			raw_request: checkout.rawRequest,
			tx_ref: checkout.merchOrderId,
			prepay_id: checkout.prepayId,
			merchant_app_id: checkout.merchantAppId,
			merch_code: checkout.merchCode,
			amount: amount.toFixed(2),
			mode,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unexpected error";
		console.error("[telebirr] create order failed", {
			mode,
			purpose: purposeLog,
			amount: amountLog,
			tx_ref: txRefLog,
			error: message,
		});
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
