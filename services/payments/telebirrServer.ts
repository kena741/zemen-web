import type { SupabaseClient } from "@supabase/supabase-js";

import {
	loadTelebirrConfig,
	queryTelebirrOrderStatus,
} from "@/lib/telebirr";
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

	const current =
		Number((row as Record<string, unknown> | null)?.[walletCol] ?? 0) || 0;
	const add = Number(amount) || 0;
	const next = (current + add).toFixed(2);

	const txId = crypto.randomUUID();
	const { error: txErr } = await admin.from("wallet_transaction").insert({
		id: txId,
		userId,
		amount: add.toFixed(2),
		createdDate: new Date().toISOString(),
		paymentType: "telebirr",
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

async function verifyTelebirrPaid(params: {
	admin: SupabaseClient;
	txRef: string;
	fallbackAmount: string;
}): Promise<
	| { ok: true; amount: string }
	| { ok: false; pending?: boolean; error: string }
> {
	const config = await loadTelebirrConfig(params.admin);
	if (!config) return { ok: false, error: "Telebirr is not configured" };

	try {
		const status = await queryTelebirrOrderStatus({
			config,
			merchOrderId: params.txRef,
		});

		if (status.paid) {
			const amount =
				status.amount && Number(status.amount) > 0
					? Number(status.amount).toFixed(2)
					: Number(params.fallbackAmount).toFixed(2);
			return { ok: true, amount };
		}

		if (status.failed) {
			return {
				ok: false,
				error: `Telebirr status is ${status.tradeStatus || "failed"}`,
			};
		}

		return {
			ok: false,
			pending: true,
			error: `Telebirr status is ${status.tradeStatus || "pending"}`,
		};
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Telebirr verify failed";
		const pending =
			message.toLowerCase().includes("unavailable") ||
			message.toLowerCase().includes("timeout");
		return { ok: false, pending, error: message };
	}
}

export async function verifyAndCreditWallet(params: {
	admin: SupabaseClient;
	txRef: string;
	fallbackAmount: string;
	userId: string;
	accountType: "customer" | "provider";
}): Promise<{ ok: boolean; pending?: boolean; error: string | null }> {
	const verified = await verifyTelebirrPaid(params);
	if (!verified.ok) {
		return {
			ok: false,
			pending: verified.pending,
			error: verified.error,
		};
	}

	return creditWalletTopUp({
		admin: params.admin,
		userId: params.userId,
		amount: verified.amount,
		txRef: params.txRef,
		accountType: params.accountType,
	});
}

export async function verifyProviderActivation(params: {
	admin: SupabaseClient;
	txRef: string;
	providerId: string;
	amount: string;
}): Promise<{ ok: boolean; pending?: boolean; error: string | null }> {
	const verified = await verifyTelebirrPaid({
		admin: params.admin,
		txRef: params.txRef,
		fallbackAmount: params.amount,
	});
	if (!verified.ok) {
		return {
			ok: false,
			pending: verified.pending,
			error: verified.error,
		};
	}

	const { data, error } = await invokeEdgeFunction<{
		success?: boolean;
		message?: string;
	}>("verify-chapa-activation", {
		txRef: params.txRef,
		providerId: params.providerId,
		amount: verified.amount,
		paymentProvider: "telebirr",
		skipGatewayVerify: true,
	});

	if (!error && data?.success !== false) {
		return { ok: true, error: null };
	}

	// Local fallback when edge still expects Chapa verify.
	const { error: updateErr } = await params.admin
		.from("provider")
		.update({
			activation_tx_ref: params.txRef,
			isActive: true,
			is_active: true,
		})
		.eq("id", params.providerId);

	if (updateErr) {
		return {
			ok: false,
			error: error || data?.message || updateErr.message,
		};
	}
	return { ok: true, error: null };
}

export async function verifyServiceTierPayment(params: {
	admin: SupabaseClient;
	txRef: string;
	providerId: string;
	userId: string;
	fromTierMax: number;
	toTierMax: number;
	amount: string;
}): Promise<{ ok: boolean; pending?: boolean; error: string | null }> {
	const verified = await verifyTelebirrPaid({
		admin: params.admin,
		txRef: params.txRef,
		fallbackAmount: params.amount,
	});
	if (!verified.ok) {
		return {
			ok: false,
			pending: verified.pending,
			error: verified.error,
		};
	}

	const { data, error } = await invokeEdgeFunction<{
		success?: boolean;
		message?: string;
	}>("verify-service-tier-payment", {
		txRef: params.txRef,
		providerId: params.providerId,
		userId: params.userId,
		fromTierMax: params.fromTierMax,
		toTierMax: params.toTierMax,
		amount: verified.amount,
		paymentProvider: "telebirr",
		skipGatewayVerify: true,
	});

	if (!error && data?.success !== false) {
		return { ok: true, error: null };
	}

	const { error: updateErr } = await params.admin
		.from("provider")
		.update({ service_tier_max: params.toTierMax })
		.eq("id", params.providerId);

	if (updateErr) {
		return {
			ok: false,
			error: error || data?.message || updateErr.message,
		};
	}
	return { ok: true, error: null };
}

export async function finalizeBookingTelebirrPayment(params: {
	admin: SupabaseClient;
	txRef: string;
	bookingId: string;
	fallbackAmount: string;
}): Promise<{ ok: boolean; pending?: boolean; error: string | null }> {
	const verified = await verifyTelebirrPaid({
		admin: params.admin,
		txRef: params.txRef,
		fallbackAmount: params.fallbackAmount,
	});
	if (!verified.ok) {
		return {
			ok: false,
			pending: verified.pending,
			error: verified.error,
		};
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
			paymentType: "telebirr",
		})
		.eq("id", params.bookingId);

	if (error) return { ok: false, error: error.message };
	return { ok: true, error: null };
}

export async function verifyFeaturedRequestPayment(params: {
	admin: SupabaseClient;
	txRef: string;
	providerId: string;
	userId: string;
	amount: string;
	serviceId: string;
}): Promise<{ ok: boolean; pending?: boolean; error: string | null }> {
	const verified = await verifyTelebirrPaid({
		admin: params.admin,
		txRef: params.txRef,
		fallbackAmount: params.amount,
	});
	if (!verified.ok) {
		return {
			ok: false,
			pending: verified.pending,
			error: verified.error,
		};
	}

	const { data, error } = await invokeEdgeFunction<{
		success?: boolean;
		message?: string;
	}>("verify-featured-request-payment", {
		txRef: params.txRef,
		providerId: params.providerId,
		userId: params.userId,
		amount: verified.amount,
		serviceId: params.serviceId,
		paymentProvider: "telebirr",
		skipGatewayVerify: true,
	});

	if (!error && data?.success !== false) {
		return { ok: true, error: null };
	}

	const { error: updateErr } = await params.admin
		.from("service")
		.update({
			feature_requested_at: new Date().toISOString(),
			feature_requested_status: "pending",
		})
		.eq("id", params.serviceId);

	if (updateErr) {
		return {
			ok: false,
			error: error || data?.message || updateErr.message,
		};
	}
	return { ok: true, error: null };
}
