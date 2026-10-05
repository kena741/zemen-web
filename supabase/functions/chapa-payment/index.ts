import { verifyAuth } from "../_shared/auth.ts";
import {
	loadChapaSecretKey,
	normalizeChapaPhone,
} from "../_shared/chapa.ts";
import { handleCors, requestOrigin } from "../_shared/cors.ts";
import { getSiteUrl } from "../_shared/env.ts";
import {
	AppError,
	errorResponse,
	errorStatus,
	jsonResponse,
	safeError,
} from "../_shared/errors.ts";
import {
	getSupabaseAdmin,
	resolveProviderIdForAuthUser,
} from "../_shared/supabase.ts";
import type { ChapaPaymentBody } from "../_shared/types.ts";

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 500_000;

function parseAmount(value: number | string | undefined): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim()) {
		const n = Number.parseFloat(value.trim());
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

Deno.serve(async (req) => {
	const origin = requestOrigin(req);
	const preflight = handleCors(req);
	if (preflight) return preflight;

	if (req.method !== "POST") {
		return errorResponse("Method not allowed", 405, origin);
	}

	try {
		const admin = getSupabaseAdmin();
		const userId = await verifyAuth(req, admin);

		const body = (await req.json()) as ChapaPaymentBody;
		const amount = parseAmount(body.amount);
		if (amount == null || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
			throw new AppError(
				`Amount must be between ETB ${MIN_AMOUNT} and ${MAX_AMOUNT.toLocaleString()}`,
				400,
			);
		}

		const chapaSecretKey = await loadChapaSecretKey(admin);
		if (!chapaSecretKey) {
			throw new AppError("Chapa is not configured", 500);
		}

		const appBaseUrl = getSiteUrl();
		const txRef =
			`web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.slice(0, 50);
		const returnPath =
			String(body.return_path ?? "/pay/done").trim() || "/pay/done";
		const email = String(body.email ?? "").trim() || "payments@zemen.app";
		const firstName = String(body.first_name ?? "").trim() || "Customer";
		const lastName = String(body.last_name ?? "").trim() || "";
		const phoneNumber = normalizeChapaPhone(body.phone_number);
		const purpose = String(body.purpose ?? "wallet").trim();

		const chapaPayload: Record<string, string> = {
			amount: amount.toFixed(2),
			currency: "ETB",
			email,
			first_name: firstName,
			last_name: lastName,
			tx_ref: txRef,
			return_url: `${appBaseUrl}${returnPath}?tx_ref=${encodeURIComponent(txRef)}&purpose=${encodeURIComponent(purpose)}&amount=${amount.toFixed(2)}`,
			"customization[title]": "Zemen Service",
			"customization[description]": `${purpose} ETB ${amount.toFixed(2)}`,
		};
		if (phoneNumber) chapaPayload.phone_number = phoneNumber;

		// Direct fetch to Chapa REST API (no Node SDK).
		const chapaResponse = await fetch(
			"https://api.chapa.co/v1/transaction/initialize",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${chapaSecretKey}`,
				},
				body: JSON.stringify(chapaPayload),
			},
		);

		const chapaData = (await chapaResponse.json()) as {
			status?: string;
			message?: string;
			data?: { checkout_url?: string };
		};

		if (
			!chapaResponse.ok ||
			chapaData.status !== "success" ||
			!chapaData.data?.checkout_url
		) {
			throw new AppError(
				chapaData.message || "Failed to initialize Chapa checkout",
				400,
			);
		}

		if (purpose === "activation") {
			const providerId = await resolveProviderIdForAuthUser(admin, userId);
			if (providerId) {
				await admin
					.from("provider")
					.update({ activation_tx_ref: txRef })
					.eq("id", providerId);
			}
		}

		return jsonResponse(
			{
				status: "success",
				checkout_url: chapaData.data.checkout_url,
				tx_ref: txRef,
				amount: amount.toFixed(2),
			},
			200,
			origin,
		);
	} catch (e) {
		return errorResponse(safeError(e), errorStatus(e), origin);
	}
});
