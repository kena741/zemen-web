import { NextResponse } from "next/server";

import {
	getAuthUserFromRequest,
	getSupabaseAdmin,
	resolveProviderIdForAuthUser,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

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

function isPending(status: unknown): boolean {
	const s = String(status ?? "pending")
		.trim()
		.toLowerCase();
	return s === "pending" || s === "" || s === "hold";
}

/**
 * Restore wallet funds for withdrawals that older web clients deducted
 * immediately (no ledger row). Mobile never deducted, so we only credit
 * when walletAmount is short vs wallet_transaction net.
 * Covers rejected (money return) and still-pending (avoid double-hold /
 * double-deduct on admin complete).
 */
export async function POST(req: Request) {
	const auth = await getAuthUserFromRequest(req);
	if (!auth.userId || auth.error) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let admin;
	try {
		admin = getSupabaseAdmin();
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Admin unavailable" },
			{ status: 500 },
		);
	}

	const providerId = await resolveProviderIdForAuthUser(admin, auth.userId);
	if (!providerId) {
		return NextResponse.json({ error: "Provider not found" }, { status: 404 });
	}

	const { data: provider, error: providerErr } = await admin
		.from("provider")
		.select("id, walletAmount")
		.eq("id", providerId)
		.maybeSingle();
	if (providerErr || !provider) {
		return NextResponse.json(
			{ error: providerErr?.message ?? "Provider not found" },
			{ status: 404 },
		);
	}

	const { data: txs } = await admin
		.from("wallet_transaction")
		.select("amount, isCredit, transactionId, userId")
		.or(`userId.eq.${providerId},userId.eq.${auth.userId}`);

	let ledgerNet = 0;
	const restoredIds = new Set<string>();
	const completedIds = new Set<string>();
	for (const row of txs ?? []) {
		const r = row as {
			amount?: unknown;
			isCredit?: boolean;
			transactionId?: string | null;
		};
		const amt = parseAmount(r.amount);
		ledgerNet += r.isCredit ? amt : -amt;
		const txId = String(r.transactionId ?? "");
		if (txId.startsWith("withdrawal-refund:")) {
			restoredIds.add(txId.slice("withdrawal-refund:".length));
		}
		if (txId.startsWith("withdrawal-restore:")) {
			restoredIds.add(txId.slice("withdrawal-restore:".length));
		}
		if (txId.startsWith("withdrawal:") && !r.isCredit) {
			completedIds.add(txId.slice("withdrawal:".length));
		}
	}

	let balance = parseAmount(
		(provider as { walletAmount?: unknown }).walletAmount,
	);
	let shortfall = Math.round((ledgerNet - balance) * 100) / 100;
	if (shortfall < 0.01) {
		return NextResponse.json({ refunded: 0, balance });
	}

	const { data: withdrawals } = await admin
		.from("withdrawal_history")
		.select("id, amount, paymentStatus")
		.eq("providerId", providerId)
		.order("createdDate", { ascending: true });

	let refunded = 0;
	for (const row of withdrawals ?? []) {
		if (shortfall < 0.01) break;
		const id = String((row as { id?: string }).id ?? "");
		const amount = parseAmount((row as { amount?: unknown }).amount);
		const status = (row as { paymentStatus?: unknown }).paymentStatus;
		if (!id || amount <= 0) continue;
		if (!isRejected(status) && !isPending(status)) continue;
		if (restoredIds.has(id) || completedIds.has(id)) continue;
		if (amount > shortfall + 0.009) continue;

		const refundTxId = isRejected(status)
			? `withdrawal-refund:${id}`
			: `withdrawal-restore:${id}`;
		const note = isRejected(status)
			? `Withdrawal rejected — funds restored (${id})`
			: `Withdrawal hold restored to soft-hold (${id})`;
		const next = Math.round((balance + amount) * 100) / 100;

		const { error: txErr } = await admin.from("wallet_transaction").insert({
			amount: amount.toFixed(2),
			createdDate: new Date().toISOString(),
			isCredit: true,
			note,
			paymentType: "wallet",
			transactionId: refundTxId,
			type: "provider",
			userId: providerId,
		});
		if (txErr) continue;

		const { error: walletErr } = await admin
			.from("provider")
			.update({ walletAmount: next.toFixed(2) })
			.eq("id", providerId);
		if (walletErr) continue;

		balance = next;
		shortfall = Math.round((shortfall - amount) * 100) / 100;
		refunded += amount;
	}

	return NextResponse.json({
		refunded: Math.round(refunded * 100) / 100,
		balance,
	});
}
