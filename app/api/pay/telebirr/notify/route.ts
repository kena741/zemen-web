import { NextResponse } from "next/server";

import {
	isTelebirrNotifySuccess,
	loadTelebirrConfig,
	queryTelebirrOrderStatus,
	unwrapTelebirrNotify,
} from "@/lib/telebirr";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Telebirr server-to-server notification.
 * Always confirm with queryOrder before trusting the payload.
 * Fulfillment for authenticated flows still happens on /pay/done → /api/pay/verify.
 */
export async function POST(request: Request) {
	try {
		const rawText = await request.text();
		let payload: Record<string, unknown> = {};
		try {
			payload = JSON.parse(rawText) as Record<string, unknown>;
		} catch {
			return NextResponse.json(
				{ success: false, message: "Invalid JSON" },
				{ status: 400 },
			);
		}

		const notification = unwrapTelebirrNotify(payload);
		const merchOrderId = String(notification.merch_order_id ?? "").trim();
		if (!merchOrderId) {
			return NextResponse.json(
				{ success: false, message: "merch_order_id missing" },
				{ status: 400 },
			);
		}

		const admin = getSupabaseAdmin();
		const config = await loadTelebirrConfig(admin);
		if (!config) {
			return NextResponse.json(
				{ success: false, message: "Telebirr not configured" },
				{ status: 500 },
			);
		}

		const status = await queryTelebirrOrderStatus({
			config,
			merchOrderId,
		});

		const notifyLooksPaid = isTelebirrNotifySuccess(notification);
		if (!status.paid && !notifyLooksPaid) {
			return NextResponse.json({
				success: true,
				message: `Acknowledged non-success status ${status.tradeStatus || "unknown"}`,
			});
		}

		if (!status.paid) {
			return NextResponse.json(
				{
					success: false,
					message: `Order not paid yet (${status.tradeStatus || "unknown"})`,
				},
				{ status: 202 },
			);
		}

		return NextResponse.json({
			success: true,
			message: "Payment confirmed",
			merch_order_id: merchOrderId,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Notify handling failed";
		return NextResponse.json(
			{ success: false, message },
			{ status: 500 },
		);
	}
}
