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

	// Soft-hold pending like mobile — admin deducts only on complete.
	const { data: pendingRows } = await supabase
		.from("withdrawal_history")
		.select("amount, paymentStatus")
		.eq("providerId", params.providerId);

	let pendingTotal = 0;
	for (const row of pendingRows ?? []) {
		const status = String(
			(row as { paymentStatus?: string }).paymentStatus ?? "pending",
		)
			.trim()
			.toLowerCase();
		if (status === "pending" || status === "" || status === "hold") {
			pendingTotal += Number((row as { amount?: string }).amount ?? 0) || 0;
		}
	}
	const available = Math.round((balance - pendingTotal) * 100) / 100;
	if (params.amount > available) {
		return {
			ok: false,
			error:
				available <= 0
					? "No available balance (pending withdrawals hold funds)"
					: `Amount exceeds available balance (${available.toFixed(2)} ETB)`,
		};
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
	return { ok: true, error: null };
}

/** Restore funds for premature web deducts (rejected or still pending). */
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
