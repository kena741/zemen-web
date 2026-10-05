import { verifyAuth } from "../_shared/auth.ts";
import { handleCors, requestOrigin } from "../_shared/cors.ts";
import {
	AppError,
	errorResponse,
	errorStatus,
	jsonResponse,
	safeError,
} from "../_shared/errors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";
import type { CompleteBookingBody } from "../_shared/types.ts";

function asNumber(value: unknown): number {
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
}

function adminCommissionAmount(
	gross: number,
	rule: Record<string, unknown> | null,
): number {
	if (!rule || rule.active !== true) return 0;
	const value = asNumber(rule.value);
	if (value <= 0) return 0;
	if (rule.isFix === true) return value;
	return Math.round(((gross * value) / 100) * 100) / 100;
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

		const body = (await req.json()) as CompleteBookingBody;
		const bookingId = String(body.bookingId ?? "").trim();
		if (!bookingId) {
			throw new AppError("Missing booking id", 400);
		}

		const { data: booking, error: bookErr } = await admin
			.from("booked_service")
			.select("*")
			.eq("id", bookingId)
			.maybeSingle();

		if (bookErr) {
			console.error(bookErr);
			throw new AppError("Server error", 500);
		}
		if (!booking) {
			throw new AppError("Booking not found", 404);
		}

		const row = booking as Record<string, unknown>;
		const customerId = String(row.customer_id ?? row.customerId ?? "");
		if (customerId !== userId) {
			throw new AppError("Forbidden", 403);
		}

		const status = String(row.status ?? "")
			.trim()
			.toLowerCase();
		if (status === "completed") {
			return jsonResponse({ ok: true }, 200, origin);
		}
		if (status !== "pending_approval") {
			throw new AppError("Booking is not ready to complete", 400);
		}

		const providerId = String(row.provider_id ?? row.providerId ?? "").trim();
		if (!providerId) {
			throw new AppError("Provider not found", 400);
		}

		const { error: statusErr } = await admin
			.from("booked_service")
			.update({ status: "completed" })
			.eq("id", bookingId)
			.eq("status", "pending_approval");

		if (statusErr) {
			console.error(statusErr);
			throw new AppError("Server error", 500);
		}

		const { data: existingTx } = await admin
			.from("wallet_transaction")
			.select("id")
			.eq("transactionId", bookingId)
			.eq("type", "provider")
			.eq("isCredit", true)
			.maybeSingle();

		if (existingTx) {
			return jsonResponse({ ok: true }, 200, origin);
		}

		const gross = Math.max(
			0,
			asNumber(row.totalAmount) || asNumber(row.subTotal),
		);

		let commissionRule =
			row.adminCommission && typeof row.adminCommission === "object"
				? (row.adminCommission as Record<string, unknown>)
				: null;

		if (!commissionRule) {
			const { data: settingsRow } = await admin
				.from("settings")
				.select("*")
				.eq("id", "admin_commission")
				.maybeSingle();
			if (settingsRow) {
				commissionRule = settingsRow as Record<string, unknown>;
			}
		}

		const commission = adminCommissionAmount(gross, commissionRule);
		const payout = Math.max(0, Math.round((gross - commission) * 100) / 100);
		if (payout <= 0) {
			return jsonResponse({ ok: true }, 200, origin);
		}

		const { data: provider } = await admin
			.from("provider")
			.select("id, walletAmount, user_id")
			.eq("id", providerId)
			.maybeSingle();

		if (!provider) {
			return jsonResponse(
				{ ok: true, warning: "Provider wallet skipped" },
				200,
				origin,
			);
		}

		const providerRow = provider as Record<string, unknown>;
		const current = asNumber(providerRow.walletAmount);
		const next = (current + payout).toFixed(2);
		const txUserId = String(providerRow.user_id ?? "").trim() || providerId;

		const orderShort = bookingId.slice(0, 6);
		const { error: txErr } = await admin.from("wallet_transaction").insert({
			id: crypto.randomUUID(),
			userId: txUserId,
			amount: payout.toFixed(2),
			createdDate: new Date().toISOString(),
			paymentType: String(row.paymentType ?? "Wallet"),
			transactionId: bookingId,
			isCredit: true,
			type: "provider",
			note: `Order #${orderShort} completed (payout after admin commission)`,
		});

		if (txErr) {
			console.error("complete booking provider tx", txErr);
			return jsonResponse(
				{ ok: true, warning: "Completed but provider payout failed" },
				200,
				origin,
			);
		}

		const { error: walletErr } = await admin
			.from("provider")
			.update({ walletAmount: next })
			.eq("id", providerId);

		if (walletErr) {
			console.error("complete booking provider wallet", walletErr);
			return jsonResponse(
				{ ok: true, warning: "Completed but provider wallet update failed" },
				200,
				origin,
			);
		}

		return jsonResponse({ ok: true }, 200, origin);
	} catch (e) {
		const message = safeError(e);
		return errorResponse(message, errorStatus(e), origin);
	}
});
