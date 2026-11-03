import { NextResponse } from "next/server";

import {
	isTelebirrNotifySuccess,
	loadTelebirrConfig,
	queryTelebirrOrderStatus,
	sanitizeMerchOrderId,
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
			console.error("[telebirr] notify invalid JSON", {
				rawPreview: rawText.slice(0, 500),
			});
			return NextResponse.json(
				{ success: false, message: "Invalid JSON" },
				{ status: 400 },
			);
		}

		const notification = unwrapTelebirrNotify(payload);
		console.info("[telebirr] notify callback", {
			payload,
			notification,
		});

		const merchOrderId = sanitizeMerchOrderId(
			String(notification.merch_order_id ?? ""),
		);
		if (!merchOrderId) {
			console.warn("[telebirr] notify missing merch_order_id", { notification });
			return NextResponse.json(
				{ success: false, message: "merch_order_id missing" },
				{ status: 400 },
			);
		}

		const admin = getSupabaseAdmin();
		const config = await loadTelebirrConfig(admin);
		if (!config) {
			console.error("[telebirr] notify: Telebirr not configured");
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
		console.info("[telebirr] notify queryOrder", {
			merch_order_id: merchOrderId,
			notifyLooksPaid,
			query: {
				paid: status.paid,
				failed: status.failed,
				tradeStatus: status.tradeStatus,
				amount: status.amount,
				paymentOrderId: status.paymentOrderId,
				transId: status.transId,
			},
		});

		if (!status.paid && !notifyLooksPaid) {
			const body = {
				success: true,
				message: `Acknowledged non-success status ${status.tradeStatus || "unknown"}`,
			};
			console.info("[telebirr] notify response", body);
			return NextResponse.json(body);
		}

		if (!status.paid) {
			const body = {
				success: false,
				message: `Order not paid yet (${status.tradeStatus || "unknown"})`,
			};
			console.info("[telebirr] notify response", body);
			return NextResponse.json(body, { status: 202 });
		}

		const body = {
			success: true,
			message: "Payment confirmed",
			merch_order_id: merchOrderId,
		};
		console.info("[telebirr] notify response", body);
		return NextResponse.json(body);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Notify handling failed";
		console.error("[telebirr] notify failed", { error: message });
		return NextResponse.json(
			{ success: false, message },
			{ status: 500 },
		);
	}
}
