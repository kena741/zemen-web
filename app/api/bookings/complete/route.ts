import { NextResponse } from "next/server";

import {
	getAuthUserFromRequest,
	getSupabaseAdmin,
} from "@/lib/supabase/admin";

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

export async function POST(req: Request) {
	try {
		const auth = await getAuthUserFromRequest(req);
		if (!auth.userId || auth.error) {
			return NextResponse.json(
				{ error: auth.error || "Unauthorized" },
				{ status: 401 },
			);
		}

		const body = (await req.json()) as { bookingId?: string };
		const bookingId = body.bookingId?.trim();
		if (!bookingId) {
			return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
		}

		const admin = getSupabaseAdmin();
		const { data: booking, error: bookErr } = await admin
			.from("booked_service")
			.select("*")
			.eq("id", bookingId)
			.maybeSingle();

		if (bookErr || !booking) {
			return NextResponse.json(
				{ error: bookErr?.message || "Booking not found" },
				{ status: 404 },
			);
		}

		const row = booking as Record<string, unknown>;
		const customerId = String(row.customer_id ?? row.customerId ?? "");
		if (customerId !== auth.userId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const status = String(row.status ?? "")
			.trim()
			.toLowerCase();
		if (status === "completed") {
			return NextResponse.json({ ok: true });
		}
		if (status !== "pending_approval") {
			return NextResponse.json(
				{ error: "Booking is not ready to complete" },
				{ status: 400 },
			);
		}

		const providerId = String(row.provider_id ?? row.providerId ?? "").trim();
		if (!providerId) {
			return NextResponse.json({ error: "Provider not found" }, { status: 400 });
		}

		const { error: statusErr } = await admin
			.from("booked_service")
			.update({ status: "completed" })
			.eq("id", bookingId)
			.eq("status", "pending_approval");

		if (statusErr) {
			return NextResponse.json({ error: statusErr.message }, { status: 500 });
		}

		const { data: existingTx } = await admin
			.from("wallet_transaction")
			.select("id")
			.eq("transactionId", bookingId)
			.eq("type", "provider")
			.eq("isCredit", true)
			.maybeSingle();

		if (existingTx) {
			return NextResponse.json({ ok: true });
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
			return NextResponse.json({ ok: true });
		}

		const { data: provider } = await admin
			.from("provider")
			.select("id, walletAmount, user_id")
			.eq("id", providerId)
			.maybeSingle();

		if (!provider) {
			return NextResponse.json({ ok: true, warning: "Provider wallet skipped" });
		}

		const providerRow = provider as Record<string, unknown>;
		const current = asNumber(providerRow.walletAmount);
		const next = (current + payout).toFixed(2);
		const txUserId =
			String(providerRow.user_id ?? "").trim() || providerId;

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
			return NextResponse.json({
				ok: true,
				warning: "Completed but provider payout failed",
			});
		}

		const { error: walletErr } = await admin
			.from("provider")
			.update({ walletAmount: next })
			.eq("id", providerId);

		if (walletErr) {
			console.error("complete booking provider wallet", walletErr);
			return NextResponse.json({
				ok: true,
				warning: "Completed but provider wallet update failed",
			});
		}

		return NextResponse.json({ ok: true });
	} catch (e) {
		const message = e instanceof Error ? e.message : "Complete failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
