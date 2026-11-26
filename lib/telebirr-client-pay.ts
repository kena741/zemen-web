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

/** Telebirr H5 paygate rejects `location.href` in some WebViews; `<a>` click works. */
function openCheckoutUrl(url: string): void {
	const a = document.createElement("a");
	a.href = url;
	a.rel = "noopener noreferrer";
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
	a.remove();
}

/**
 * After `/api/pay/telebirr` succeeds:
 * - SuperApp (`window.consumerapp`) → `js_fun_start_pay`
 * - Browser / fallback → H5 paygate via `<a>` click
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
		// Never fall back to checkout URL query — it URL-encodes `sign` and adds
		// trade_type/version, which SuperApp rejects as "parameter incorrectly filled".
		if (!rawRequest) {
			if (checkoutUrl) {
				console.warn(
					"[telebirr] miniapp missing raw_request; falling back to H5 paygate",
				);
				openCheckoutUrl(checkoutUrl);
				return { ok: true, mode: "h5" };
			}
			return { ok: false, error: "Missing Telebirr rawRequest for mini app" };
		}

		console.info("[telebirr] miniapp launch", {
			txRef: txRef || null,
			rawLen: rawRequest.length,
			rawPrefix: rawRequest.slice(0, 48),
			hasBridge: isTelebirrMiniApp(),
		});

		const result = await startTelebirrMiniAppPay(rawRequest);
		if (result.canceled) {
			return { ok: false, canceled: true, error: result.message || "Canceled" };
		}
		if (!result.ok) {
			// SuperApp often returns this when startPay payload is rejected; H5
			// paygate URL for the same prepay is a workable escape hatch.
			if (checkoutUrl) {
				console.warn("[telebirr] startPay failed; falling back to H5", {
					message: result.message,
				});
				openCheckoutUrl(checkoutUrl);
				return { ok: true, mode: "h5" };
			}
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
	openCheckoutUrl(checkoutUrl);
	return { ok: true, mode: "h5" };
}
