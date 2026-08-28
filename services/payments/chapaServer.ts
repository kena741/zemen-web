import type { SupabaseClient } from "@supabase/supabase-js";

import {
	loadChapaSecretKey,
	resolveChapaWalletCreditAmount,
	verifyChapaTransaction,
} from "@/lib/chapa";
import { invokeEdgeFunction } from "@/lib/edge-functions";

export async function hasWalletTxForRef(
	admin: SupabaseClient,
	txRef: string,
): Promise<boolean> {
	const { data } = await admin
		.from("wallet_transaction")
		.select("id")
		.eq("transactionId", txRef)
		.maybeSingle();
	return Boolean(data);
}

export async function creditWalletTopUp(params: {
	admin: SupabaseClient;
	userId: string;
	amount: string;
	txRef: string;
	accountType: "customer" | "provider";
	note?: string;
}): Promise<{ ok: boolean; error: string | null }> {
	const { admin, userId, amount, txRef, accountType } = params;
	if (await hasWalletTxForRef(admin, txRef)) {
		return { ok: true, error: null };
	}

	const table = accountType === "customer" ? "customer" : "provider";
	const walletCol = accountType === "customer" ? "wallet_amount" : "walletAmount";

	const { data: row } = await admin
		.from(table)
		.select(walletCol)
		.eq("id", userId)
		.maybeSingle();

	const current = Number(
		(row as Record<string, unknown> | null)?.[walletCol] ?? 0,
	) || 0;
	const add = Number(amount) || 0;
	const next = (current + add).toFixed(2);

	const txId = crypto.randomUUID();
	const { error: txErr } = await admin.from("wallet_transaction").insert({
		id: txId,
		userId,
		amount: add.toFixed(2),
		createdDate: new Date().toISOString(),
		paymentType: "chapa",
		transactionId: txRef,
		isCredit: true,
		type: accountType,
		note: params.note ?? "Wallet top up",
	});

	if (txErr) return { ok: false, error: txErr.message };

	const { error: balErr } = await admin
		.from(table)
		.update({ [walletCol]: next })
		.eq("id", userId);

	if (balErr) return { ok: false, error: balErr.message };
	return { ok: true, error: null };
}

export async function verifyAndCreditWallet(params: {
	admin: SupabaseClient;
	txRef: string;
	fallbackAmount: string;
	userId: string;
	accountType: "customer" | "provider";
}): Promise<{ ok: boolean; pending?: boolean; error: string | null }> {
	const secret = await loadChapaSecretKey(params.admin);
	if (!secret) return { ok: false, error: "Chapa is not configured" };

	const verified = await verifyChapaTransaction(secret, params.txRef);
	if (!verified.ok) {
		const pending = verified.error.toLowerCase().includes("unknown");
		return { ok: false, pending, error: verified.error };
	}

	const creditAmount = resolveChapaWalletCreditAmount(
		verified.data,
		params.fallbackAmount,
	);
	return creditWalletTopUp({
		admin: params.admin,
		userId: params.userId,
		amount: creditAmount,
		txRef: params.txRef,
		accountType: params.accountType,
	});
}

export async function verifyProviderActivation(params: {
	txRef: string;
	providerId: string;
	amount: string;
}): Promise<{ ok: boolean; error: string | null }> {
	const { data, error } = await invokeEdgeFunction<{
		success?: boolean;
		message?: string;
	}>("verify-chapa-activation", {
		txRef: params.txRef,
		providerId: params.providerId,
		amount: params.amount,
	});

	if (error) return { ok: false, error };
	if (data?.success === false) {
		return { ok: false, error: data.message || "Activation verify failed" };
	}
	return { ok: true, error: null };
}

export async function verifyServiceTierPayment(params: {
	txRef: string;
	providerId: string;
	userId: string;
	fromTierMax: number;
	toTierMax: number;
	amount: string;
}): Promise<{ ok: boolean; error: string | null }> {
	const { data, error } = await invokeEdgeFunction<{
		success?: boolean;
		message?: string;
	}>("verify-service-tier-payment", {
		txRef: params.txRef,
		providerId: params.providerId,
		userId: params.userId,
		fromTierMax: params.fromTierMax,
		toTierMax: params.toTierMax,
		amount: params.amount,
	});

	if (error) return { ok: false, error };
	if (data?.success === false) {
		return { ok: false, error: data.message || "Tier payment verify failed" };
	}
	return { ok: true, error: null };
}

export async function finalizeBookingChapaPayment(params: {
	admin: SupabaseClient;
	txRef: string;
	bookingId: string;
	fallbackAmount: string;
}): Promise<{ ok: boolean; pending?: boolean; error: string | null }> {
	const secret = await loadChapaSecretKey(params.admin);
	if (!secret) return { ok: false, error: "Chapa is not configured" };

	const verified = await verifyChapaTransaction(secret, params.txRef);
	if (!verified.ok) {
		const pending = verified.error.toLowerCase().includes("unknown");
		return { ok: false, pending, error: verified.error };
	}

	const { data: booking } = await params.admin
		.from("booked_service")
		.select("id, paymentCompleted, totalAmount")
		.eq("id", params.bookingId)
		.maybeSingle();

	if (!booking) return { ok: false, error: "Booking not found" };

	const row = booking as Record<string, unknown>;
	if (row.paymentCompleted === true) {
		return { ok: true, error: null };
	}

	const { error } = await params.admin
		.from("booked_service")
		.update({
			paymentCompleted: true,
			paymentType: "chapa",
		})
		.eq("id", params.bookingId);

	if (error) return { ok: false, error: error.message };
	return { ok: true, error: null };
}

export async function verifyFeaturedRequestPayment(params: {
	txRef: string;
	providerId: string;
	userId: string;
	amount: string;
	serviceId: string;
}): Promise<{ ok: boolean; error: string | null }> {
	const { data, error } = await invokeEdgeFunction<{
		success?: boolean;
		message?: string;
	}>("verify-featured-request-payment", {
		txRef: params.txRef,
		providerId: params.providerId,
		userId: params.userId,
		amount: params.amount,
		serviceId: params.serviceId,
	});

	if (error) return { ok: false, error };
	if (data?.success === false) {
		return { ok: false, error: data.message || "Featured payment verify failed" };
	}
	return { ok: true, error: null };
}
