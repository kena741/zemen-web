import { getSupabase } from "@/lib/supabase/client";
import {
	mapWalletTxRow,
	mapWithdrawRow,
	type WalletTransaction,
	type WithdrawRequest,
} from "./types";

function ownerIds(authUserId: string, providerId: string | null): string[] {
	const ids = new Set<string>();
	if (authUserId) ids.add(authUserId);
	if (providerId) ids.add(providerId);
	return [...ids];
}

export async function fetchWalletBalance(
	providerId: string,
): Promise<{ balance: number; error: string | null }> {
	const { data, error } = await getSupabase()
		.from("provider")
		.select("walletAmount")
		.eq("id", providerId)
		.maybeSingle();

	if (error) {
		console.error("fetchWalletBalance", error);
		return { balance: 0, error: error.message };
	}
	return {
		balance: Number(data?.walletAmount ?? 0) || 0,
		error: null,
	};
}

export async function fetchWalletTransactions(params: {
	authUserId: string;
	providerId: string | null;
	type?: "provider" | "customer";
}): Promise<{ transactions: WalletTransaction[]; error: string | null }> {
	const ids = ownerIds(params.authUserId, params.providerId);
	if (!ids.length) return { transactions: [], error: "Missing user id" };

	const { data, error } = await getSupabase()
		.from("wallet_transaction")
		.select("*")
		.in("userId", ids)
		.eq("type", params.type ?? "provider")
		.order("createdDate", { ascending: false });

	if (error) {
		console.error("fetchWalletTransactions", error);
		return { transactions: [], error: error.message };
	}

	return {
		transactions: (data ?? []).map((row) =>
			mapWalletTxRow(row as Record<string, unknown>),
		),
		error: null,
	};
}

export async function fetchWithdrawals(params: {
	authUserId: string;
	providerId: string | null;
}): Promise<{ withdrawals: WithdrawRequest[]; error: string | null }> {
	const ids = ownerIds(params.authUserId, params.providerId);
	if (!ids.length) return { withdrawals: [], error: "Missing user id" };

	const { data, error } = await getSupabase()
		.from("withdrawal_history")
		.select("*")
		.in("providerId", ids)
		.order("createdDate", { ascending: false });

	if (error) {
		console.error("fetchWithdrawals", error);
		return { withdrawals: [], error: error.message };
	}

	return {
		withdrawals: (data ?? []).map((row) =>
			mapWithdrawRow(row as Record<string, unknown>),
		),
		error: null,
	};
}

function isPendingWithdrawalStatus(status: unknown): boolean {
	const s = String(status ?? "pending").trim().toLowerCase();
	return s === "pending" || s === "" || s === "hold";
}

export async function requestWithdrawal(params: {
	providerId: string;
	amount: number;
	note?: string;
	paymentMethodId: string;
	holderName: string;
	bankName: string;
	accountNumber: string;
	swiftCode?: string | null;
}): Promise<{ ok: boolean; error: string | null; updatedPending?: boolean }> {
	if (params.amount <= 0) {
		return { ok: false, error: "Enter a valid amount" };
	}

	const supabase = getSupabase();
	const { data: provider, error: balErr } = await supabase
		.from("provider")
		.select("walletAmount")
		.eq("id", params.providerId)
		.maybeSingle();

	if (balErr) return { ok: false, error: balErr.message };
	const balance = Number(provider?.walletAmount ?? 0) || 0;

	const { data: recentRows, error: pendingErr } = await supabase
		.from("withdrawal_history")
		.select("id, amount, note, paymentStatus")
		.eq("providerId", params.providerId)
		.order("createdDate", { ascending: false })
		.limit(20);

	if (pendingErr) return { ok: false, error: pendingErr.message };

	const pending = (recentRows ?? []).find((row) =>
		isPendingWithdrawalStatus(
			(row as Record<string, unknown>).paymentStatus,
		),
	) as { id: string; amount?: unknown; note?: unknown } | undefined;

	const pendingAmount = Number(pending?.amount ?? 0) || 0;
	const totalAmount = pending ? pendingAmount + params.amount : params.amount;

	// ponytail: request is queue-only; admin deducts wallet on approval
	if (totalAmount > balance) {
		return {
			ok: false,
			error:
				balance <= 0
					? "No wallet balance"
					: `Amount exceeds wallet balance (${balance.toFixed(2)} ETB)`,
		};
	}

	const noteTrimmed = params.note?.trim() || "";
	const existingNote = String(pending?.note ?? "").trim();
	const nextNote = noteTrimmed
		? existingNote
			? `${existingNote} · ${noteTrimmed}`
			: noteTrimmed
		: existingNote || null;

	const bankFields = {
		paymentMethodId: params.paymentMethodId,
		holderName: params.holderName,
		bankName: params.bankName,
		accountNumber: params.accountNumber,
		swiftCode: params.swiftCode ?? null,
	};

	if (pending?.id) {
		const { error } = await supabase
			.from("withdrawal_history")
			.update({
				amount: String(totalAmount),
				note: nextNote,
				paymentStatus: "pending",
				...bankFields,
			})
			.eq("id", pending.id);
		if (error) return { ok: false, error: error.message };
		return { ok: true, error: null, updatedPending: true };
	}

	const id = crypto.randomUUID();
	const { error } = await supabase.from("withdrawal_history").insert({
		id,
		providerId: params.providerId,
		amount: String(params.amount),
		note: noteTrimmed || null,
		paymentStatus: "pending",
		...bankFields,
		createdDate: new Date().toISOString(),
	});

	if (error) return { ok: false, error: error.message };
	return { ok: true, error: null, updatedPending: false };
}

/** Restore funds when admin rejected after deducting (debit row present). */
export async function restorePrematureWithdrawalDeducts(): Promise<{
	refunded: number;
	error: string | null;
}> {
	try {
		const { data } = await getSupabase().auth.getSession();
		const token = data.session?.access_token;
		if (!token) return { refunded: 0, error: null };

		const res = await fetch("/api/wallet/refund-rejected", {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
		});
		const json = (await res.json()) as {
			refunded?: number;
			error?: string;
		};
		if (!res.ok) {
			return { refunded: 0, error: json.error ?? "Restore failed" };
		}
		return { refunded: Number(json.refunded ?? 0) || 0, error: null };
	} catch (e) {
		return {
			refunded: 0,
			error: e instanceof Error ? e.message : "Restore failed",
		};
	}
}
