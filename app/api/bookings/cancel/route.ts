import { NextResponse } from "next/server";

import {
	getAuthUserFromRequest,
	getSupabaseAdmin,
} from "@/lib/supabase/admin";
import { customerBookingRefundAmount } from "@/services/customer/bookingRefund";

export const runtime = "nodejs";

function asNumber(value: unknown): number {
	const amount = Number(value ?? 0);
	return Number.isFinite(amount) ? amount : 0;
}

export async function POST(request: Request) {
	const auth = await getAuthUserFromRequest(request);
	if (!auth.userId || auth.error) {
		return NextResponse.json(
			{ error: auth.error || "Unauthorized" },
			{ status: 401 },
		);
	}

	try {
		const body = (await request.json()) as {
			bookingId?: string;
			reason?: string;
		};
		const bookingId = body.bookingId?.trim();
		if (!bookingId) {
			return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
		}

		const admin = getSupabaseAdmin();
		const { data: booking, error: bookingError } = await admin
			.from("booked_service")
			.select("*")
			.eq("id", bookingId)
			.maybeSingle();
		if (bookingError || !booking) {
			return NextResponse.json(
				{ error: bookingError?.message || "Booking not found" },
				{ status: bookingError ? 500 : 404 },
			);
		}

		const bookingRow = booking as Record<string, unknown>;
		const bookingCustomerId = String(
			bookingRow.customer_id ?? bookingRow.customerId ?? "",
		).trim();
		let { data: customer, error: customerError } = await admin
			.from("customer")
			.select("id, user_id, wallet_amount, walletAmount")
			.eq("id", auth.userId)
			.maybeSingle();
		if (customerError) {
			return NextResponse.json({ error: customerError.message }, { status: 500 });
		}
		if (!customer) {
			({ data: customer, error: customerError } = await admin
				.from("customer")
				.select("id, user_id, wallet_amount, walletAmount")
				.eq("user_id", auth.userId)
				.maybeSingle());
			if (customerError) {
				return NextResponse.json(
					{ error: customerError.message },
					{ status: 500 },
				);
			}
		}

		const customerRow = customer as Record<string, unknown> | null;
		const customerId = String(customerRow?.id ?? "").trim();
		if (
			!bookingCustomerId ||
			(bookingCustomerId !== auth.userId && bookingCustomerId !== customerId)
		) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const status = String(bookingRow.status ?? "")
			.trim()
			.toLowerCase();
		if (status === "pending" || status === "accepted") {
			const { data: updated, error: statusError } = await admin
				.from("booked_service")
				.update({
					status: "rejected",
					reason: body.reason?.trim() || "Cancelled by customer",
				})
				.eq("id", bookingId)
				.in("status", ["pending", "accepted"])
				.select("id")
				.maybeSingle();
			if (statusError) {
				return NextResponse.json({ error: statusError.message }, { status: 500 });
			}
			if (!updated) {
				const { data: latest, error: latestError } = await admin
					.from("booked_service")
					.select("status")
					.eq("id", bookingId)
					.maybeSingle();
				if (latestError) {
					return NextResponse.json({ error: latestError.message }, { status: 500 });
				}
				const latestStatus = String(latest?.status ?? "")
					.trim()
					.toLowerCase();
				if (latestStatus !== "rejected" && latestStatus !== "cancelled" && latestStatus !== "canceled") {
					return NextResponse.json(
						{ error: "Booking can no longer be cancelled." },
						{ status: 409 },
					);
				}
			}
		} else if (
			status !== "rejected" &&
			status !== "cancelled" &&
			status !== "canceled"
		) {
			return NextResponse.json(
				{ error: "Booking can no longer be cancelled." },
				{ status: 409 },
			);
		}

		const refundTransactionId = `booking-refund:${bookingId}`;
		const { data: existingRefund, error: refundLookupError } = await admin
			.from("wallet_transaction")
			.select("id")
			.eq("transactionId", refundTransactionId)
			.eq("type", "customer")
			.eq("isCredit", true)
			.maybeSingle();
		if (refundLookupError) {
			return NextResponse.json(
				{ error: refundLookupError.message },
				{ status: 500 },
			);
		}

		if (existingRefund) {
			const balance = asNumber(
				customerRow?.wallet_amount ?? customerRow?.walletAmount,
			);
			return NextResponse.json({
				ok: true,
				refunded: 0,
				newBalance: balance,
			});
		}

		const { data: debits, error: debitError } = await admin
			.from("wallet_transaction")
			.select("amount, userId")
			.eq("transactionId", bookingId)
			.eq("type", "customer")
			.eq("isCredit", false);
		if (debitError) {
			return NextResponse.json({ error: debitError.message }, { status: 500 });
		}

		const refunded = customerBookingRefundAmount(debits ?? []);
		if (refunded <= 0) {
			return NextResponse.json({
				ok: true,
				refunded: 0,
				newBalance:
					customerRow == null
						? null
						: asNumber(customerRow.wallet_amount ?? customerRow.walletAmount),
			});
		}
		if (!customerRow || !customerId) {
			return NextResponse.json(
				{ error: "Customer wallet not found." },
				{ status: 404 },
			);
		}

		const balance = asNumber(
			customerRow.wallet_amount ?? customerRow.walletAmount,
		);
		const newBalance = Math.round((balance + refunded) * 100) / 100;
		const txUserId = String(debits?.[0]?.userId ?? customerId);
		const { error: txError } = await admin.from("wallet_transaction").insert({
			id: bookingId,
			userId: txUserId,
			amount: refunded.toFixed(2),
			createdDate: new Date().toISOString(),
			paymentType: "wallet",
			transactionId: refundTransactionId,
			isCredit: true,
			type: "customer",
			note: `Booking cancellation refund (${bookingId})`,
		});
		if (txError) {
			console.error("cancel booking refund transaction", txError);
			return NextResponse.json({ error: txError.message }, { status: 500 });
		}

		const { error: walletError } = await admin
			.from("customer")
			.update({
				wallet_amount: newBalance.toFixed(2),
				walletAmount: newBalance.toFixed(2),
			})
			.eq("id", customerId);
		if (walletError) {
			console.error("cancel booking refund wallet", walletError);
			return NextResponse.json(
				{
					error:
						"Refund recorded but wallet update failed. Contact support.",
				},
				{ status: 500 },
			);
		}

		return NextResponse.json({ ok: true, refunded, newBalance });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Cancel failed";
		console.error("cancel customer booking", error);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
