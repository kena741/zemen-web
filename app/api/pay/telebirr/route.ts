import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSiteUrl } from "@/lib/env";
import {
	createTelebirrCheckout,
	generateMerchOrderId,
	loadTelebirrConfig,
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
	try {
		const body = (await request.json()) as PayBody;
		const amount = parseAmount(body.amount);
		if (amount == null || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
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
			return NextResponse.json(
				{ error: "Telebirr is not configured" },
				{ status: 500 },
			);
		}

		const appBaseUrl = getSiteUrl().replace(/\/$/, "");
		const txRef = generateMerchOrderId("web");
		const purpose = (body.purpose ?? "wallet").trim();
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

		const checkout = await createTelebirrCheckout({
			config,
			title: `Zemen ${purpose} ETB ${amount.toFixed(2)}`,
			amount,
			merchOrderId: txRef,
			redirectUrl: returnUrl.toString(),
		});

		if (purpose === "activation" && body.provider_id?.trim()) {
			if (!admin) {
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

		return NextResponse.json({
			status: "success",
			checkout_url: checkout.checkoutUrl,
			tx_ref: checkout.merchOrderId,
			prepay_id: checkout.prepayId,
			amount: amount.toFixed(2),
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unexpected error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
