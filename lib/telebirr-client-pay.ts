"use client";

import {
	getTelebirrPayMode,
	isTelebirrMiniApp,
	startTelebirrMiniAppPay,
} from "@/lib/telebirr-miniapp";

export type TelebirrPayApiResponse = {
	checkout_url?: string;
	raw_request?: string;
	tx_ref?: string;
	prepay_id?: string;
	mode?: "h5" | "miniapp";
	error?: string;
};

export type LaunchTelebirrPaymentResult =
	| { ok: true; mode: "h5" | "miniapp" }
	| { ok: false; canceled?: boolean; error: string };

export { getTelebirrPayMode, isTelebirrMiniApp };

/**
 * After `/api/pay/telebirr` succeeds: use SuperApp startPay inside mini app,
 * otherwise redirect to the H5 paygate checkout URL.
 */
export async function launchTelebirrPayment(
	data: TelebirrPayApiResponse,
	options?: { donePath?: string },
): Promise<LaunchTelebirrPaymentResult> {
	const rawRequest = (data.raw_request ?? "").trim();
	const checkoutUrl = (data.checkout_url ?? "").trim();
	const txRef = (data.tx_ref ?? "").trim();
	const useMiniApp =
		data.mode === "miniapp" || (data.mode == null && isTelebirrMiniApp());

	if (useMiniApp) {
		if (!rawRequest && !checkoutUrl) {
			return { ok: false, error: "Missing Telebirr payment payload" };
		}
		const raw =
			rawRequest ||
			(() => {
				try {
					const u = new URL(checkoutUrl);
					return u.search.startsWith("?") ? u.search.slice(1) : u.search;
				} catch {
					return "";
				}
			})();

		if (!raw) {
			return { ok: false, error: "Missing Telebirr rawRequest for mini app" };
		}

		const result = await startTelebirrMiniAppPay(raw);
		if (result.canceled) {
			return { ok: false, canceled: true, error: result.message || "Canceled" };
		}
		if (!result.ok) {
			return {
				ok: false,
				error: result.message || "Mini-app payment failed",
			};
		}

		const done =
			options?.donePath ||
			`/pay/done?purpose=wallet${txRef ? `&tx_ref=${encodeURIComponent(txRef)}` : ""}`;
		window.location.href = done;
		return { ok: true, mode: "miniapp" };
	}

	if (!checkoutUrl) {
		return { ok: false, error: "Missing Telebirr checkout URL" };
	}
	window.location.href = checkoutUrl;
	return { ok: true, mode: "h5" };
}
