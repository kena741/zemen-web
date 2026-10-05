import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
	loadChapaSecretKey,
	resolveChapaWalletCreditAmount,
	verifyChapaTransaction,
} from "./chapa.ts";
import { addBillingInterval } from "./recurring.ts";
import { getEdgeFunctionsBaseUrl, getSupabaseAnonKey } from "./env.ts";
import type { AccountType, VerifyResult } from "./types.ts";

/** Ported from services/payments/chapaServer.ts for verify-payment. */

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
	accountType: AccountType;
	note?: string;
}): Promise<VerifyResult> {
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

	const current =
		Number((row as Record<string, unknown> | null)?.[walletCol] ?? 0) || 0;
	const add = Number(amount) || 0;
	const next = (current + add).toFixed(2);

	const { error: txErr } = await admin.from("wallet_transaction").insert({
		id: crypto.randomUUID(),
		userId,
		amount: add.toFixed(2),
		createdDate: new Date().toISOString(),
		paymentType: "chapa",
		transactionId: txRef,
		isCredit: true,
		type: accountType,
		note: params.note ?? "Wallet top up",
	});

	if (txErr) {
		console.error(txErr);
		return { ok: false, error: "Server error" };
	}

	const { error: balErr } = await admin
		.from(table)
		.update({ [walletCol]: next })
		.eq("id", userId);

	if (balErr) {
		console.error(balErr);
		return { ok: false, error: "Server error" };
	}
	return { ok: true, error: null };
}

export async function verifyAndCreditWallet(params: {
	admin: SupabaseClient;
	txRef: string;
	fallbackAmount: string;
	userId: string;
	accountType: AccountType;
}): Promise<VerifyResult> {
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

async function invokeExistingEdgeFunction(
	name: string,
	body: Record<string, unknown>,
	authHeader: string | null,
): Promise<VerifyResult> {
	const base = getEdgeFunctionsBaseUrl();
	const anonKey = getSupabaseAnonKey();
	const res = await fetch(`${base}/${name}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: authHeader || `Bearer ${anonKey}`,
		},
		body: JSON.stringify(body),
	});
	const data = (await res.json()) as {
		success?: boolean;
		error?: string;
		message?: string;
	};
	if (!res.ok) {
		return {
			ok: false,
			error: data.error || data.message || "Verification failed",
		};
	}
	if (data.success === false) {
		return { ok: false, error: data.message || data.error || "Verification failed" };
	}
	return { ok: true, error: null };
}

export async function verifyProviderActivation(params: {
	txRef: string;
	providerId: string;
	amount: string;
	authHeader: string | null;
}): Promise<VerifyResult> {
	return invokeExistingEdgeFunction(
		"verify-chapa-activation",
		{
			txRef: params.txRef,
			providerId: params.providerId,
			amount: params.amount,
		},
		params.authHeader,
	);
}

export async function verifyServiceTierPayment(params: {
	txRef: string;
	providerId: string;
	userId: string;
	fromTierMax: number;
	toTierMax: number;
	amount: string;
	authHeader: string | null;
}): Promise<VerifyResult> {
	return invokeExistingEdgeFunction(
		"verify-service-tier-payment",
		{
			txRef: params.txRef,
			providerId: params.providerId,
			userId: params.userId,
			fromTierMax: params.fromTierMax,
			toTierMax: params.toTierMax,
			amount: params.amount,
		},
		params.authHeader,
	);
}

export async function verifyFeaturedRequestPayment(params: {
	txRef: string;
	providerId: string;
	userId: string;
	amount: string;
	serviceId: string;
	authHeader: string | null;
}): Promise<VerifyResult> {
	return invokeExistingEdgeFunction(
		"verify-featured-request-payment",
		{
			txRef: params.txRef,
			providerId: params.providerId,
			userId: params.userId,
			amount: params.amount,
			serviceId: params.serviceId,
		},
		params.authHeader,
	);
}

export async function finalizeBookingChapaPayment(params: {
	admin: SupabaseClient;
	txRef: string;
	bookingId: string;
	fallbackAmount: string;
}): Promise<VerifyResult> {
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

	if (error) {
		console.error(error);
		return { ok: false, error: "Server error" };
	}
	return { ok: true, error: null };
}

export async function advanceRecurringBookingPeriod(params: {
	admin: SupabaseClient;
	bookingId: string;
	billingInterval?: string | null;
	billingIntervalCount?: number | null;
}): Promise<VerifyResult> {
	const { data, error } = await params.admin
		.from("booked_service")
		.select(
			"currentPeriodStart, currentPeriodEnd, current_period_start, current_period_end",
		)
		.eq("id", params.bookingId)
		.maybeSingle();

	if (error || !data) {
		return { ok: false, error: "Booking not found" };
	}

	const row = data as Record<string, unknown>;
	const periodEndRaw =
		row.currentPeriodEnd ?? row.current_period_end ?? row.currentPeriodStart;
	const oldEnd = periodEndRaw ? new Date(String(periodEndRaw)) : new Date();
	const nextStart = oldEnd;
	const nextEnd = addBillingInterval(
		nextStart,
		params.billingInterval,
		params.billingIntervalCount ?? 1,
	);

	const { error: updateErr } = await params.admin
		.from("booked_service")
		.update({
			currentPeriodStart: nextStart.toISOString(),
			currentPeriodEnd: nextEnd.toISOString(),
			nextCycleDue: false,
			nextCycleNotifiedAt: null,
			paymentCompleted: true,
		})
		.eq("id", params.bookingId);

	if (updateErr) {
		console.error(updateErr);
		return { ok: false, error: "Server error" };
	}
	return { ok: true, error: null };
}
