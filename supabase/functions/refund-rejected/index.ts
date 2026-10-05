import { verifyAuth } from "../_shared/auth.ts";
import { handleCors, requestOrigin } from "../_shared/cors.ts";
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

function parseAmount(value: unknown): number {
	const n = Number(value ?? 0);
	return Number.isFinite(n) ? n : 0;
}

function isRejected(status: unknown): boolean {
	const s = String(status ?? "")
		.trim()
		.toLowerCase();
	return s === "rejected" || s === "failed" || s === "declined";
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

		const providerId = await resolveProviderIdForAuthUser(admin, userId);
		if (!providerId) {
			throw new AppError("Provider not found", 404);
		}

		const { data: provider, error: providerErr } = await admin
			.from("provider")
			.select("id, walletAmount")
			.eq("id", providerId)
			.maybeSingle();
		if (providerErr) {
			console.error(providerErr);
			throw new AppError("Server error", 500);
		}
		if (!provider) {
			throw new AppError("Provider not found", 404);
		}

		const { data: txs } = await admin
			.from("wallet_transaction")
			.select("amount, isCredit, transactionId, userId")
			.or(`userId.eq.${providerId},userId.eq.${userId}`);

		const restoredIds = new Set<string>();
		const debitByWithdrawal = new Map<string, number>();
		for (const row of txs ?? []) {
			const r = row as {
				amount?: unknown;
				isCredit?: boolean;
				transactionId?: string | null;
			};
			const amt = parseAmount(r.amount);
			const txId = String(r.transactionId ?? "");
			if (txId.startsWith("withdrawal-refund:")) {
				restoredIds.add(txId.slice("withdrawal-refund:".length));
			}
			if (txId.startsWith("withdrawal:") && !r.isCredit) {
				debitByWithdrawal.set(txId.slice("withdrawal:".length), amt);
			}
		}

		let balance = parseAmount(
			(provider as { walletAmount?: unknown }).walletAmount,
		);

		const { data: withdrawals } = await admin
			.from("withdrawal_history")
			.select("id, amount, paymentStatus")
			.eq("providerId", providerId)
			.order("createdDate", { ascending: true });

		let refunded = 0;
		for (const row of withdrawals ?? []) {
			const id = String((row as { id?: string }).id ?? "");
			const amount = parseAmount((row as { amount?: unknown }).amount);
			const status = (row as { paymentStatus?: unknown }).paymentStatus;
			if (!id || amount <= 0 || restoredIds.has(id)) continue;
			if (!isRejected(status)) continue;

			const debitAmt = debitByWithdrawal.get(id) ?? 0;
			if (debitAmt < 0.01) continue;

			const credit = debitAmt;
			const refundTxId = `withdrawal-refund:${id}`;
			const note = `Withdrawal rejected — funds restored (${id})`;
			const next = Math.round((balance + credit) * 100) / 100;

			const { error: txErr } = await admin.from("wallet_transaction").insert({
				amount: credit.toFixed(2),
				createdDate: new Date().toISOString(),
				isCredit: true,
				note,
				paymentType: "wallet",
				transactionId: refundTxId,
				type: "provider",
				userId: providerId,
			});
			if (txErr) {
				console.error(txErr);
				continue;
			}

			const { error: walletErr } = await admin
				.from("provider")
				.update({ walletAmount: next.toFixed(2) })
				.eq("id", providerId);
			if (walletErr) {
				console.error(walletErr);
				continue;
			}

			balance = next;
			refunded += credit;
			restoredIds.add(id);
		}

		return jsonResponse(
			{
				refunded: Math.round(refunded * 100) / 100,
				balance,
			},
			200,
			origin,
		);
	} catch (e) {
		return errorResponse(safeError(e), errorStatus(e), origin);
	}
});
