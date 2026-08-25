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

export async function requestWithdrawal(params: {
	providerId: string;
	amount: number;
	note?: string;
	paymentMethodId: string;
	holderName: string;
	bankName: string;
	accountNumber: string;
	swiftCode?: string | null;
}): Promise<{ ok: boolean; error: string | null }> {
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
	if (params.amount > balance) {
		return { ok: false, error: "Amount exceeds wallet balance" };
	}

	const id = crypto.randomUUID();
	const { error } = await supabase.from("withdrawal_history").insert({
		id,
		providerId: params.providerId,
		amount: String(params.amount),
		note: params.note?.trim() || null,
		paymentStatus: "pending",
		paymentMethodId: params.paymentMethodId,
		holderName: params.holderName,
		bankName: params.bankName,
		accountNumber: params.accountNumber,
		swiftCode: params.swiftCode ?? null,
		createdDate: new Date().toISOString(),
	});

	if (error) return { ok: false, error: error.message };

	// Deduct locally like mobile pending flow expectations — if RLS blocks, withdraw row still exists
	const newBalance = balance - params.amount;
	const { error: walletErr } = await supabase
		.from("provider")
		.update({ walletAmount: newBalance })
		.eq("id", params.providerId);

	if (walletErr) {
		console.error("requestWithdrawal wallet update", walletErr);
		// Don't fail hard — admin may process from pending request
	}

	return { ok: true, error: null };
}
