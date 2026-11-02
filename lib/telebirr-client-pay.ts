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
 * TEMP (mini-app test): always use SuperApp startPay — no H5 checkout redirect.
 * If `window.ma` is missing, fail with a clear error instead of opening paygate.
 */
export async function launchTelebirrPayment(
	data: TelebirrPayApiResponse,
	options?: { donePath?: string },
): Promise<LaunchTelebirrPaymentResult> {
	const rawRequest = (data.raw_request ?? "").trim();
	const checkoutUrl = (data.checkout_url ?? "").trim();
	const txRef = (data.tx_ref ?? "").trim();

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

	const bridgePresent = isTelebirrMiniApp();
	console.info("[telebirr] forced miniapp launch", {
		bridgePresent,
		hasMa:
			typeof window !== "undefined" &&
			typeof (window as { ma?: { native?: unknown } }).ma?.native ===
				"function",
		txRef: txRef || null,
	});

	const result = await startTelebirrMiniAppPay(raw);
	if (result.canceled) {
		return { ok: false, canceled: true, error: result.message || "Canceled" };
	}
	if (!result.ok) {
		return {
			ok: false,
			error:
				result.message ||
				(bridgePresent
					? "Mini-app payment failed"
					: "Telebirr mini-app bridge not available (window.ma.native). No H5 fallback."),
		};
	}

	const done =
		options?.donePath ||
		`/pay/done?purpose=wallet${txRef ? `&tx_ref=${encodeURIComponent(txRef)}` : ""}`;
	window.location.href = done;
	return { ok: true, mode: "miniapp" };
}
