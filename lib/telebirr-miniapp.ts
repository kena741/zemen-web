"use client";

export type TelebirrMiniAppPayResult = {
	ok: boolean;
	canceled?: boolean;
	message?: string;
	raw?: unknown;
};

type ConsumerAppBridge = {
	evaluate?: (payload: string) => void;
};

type MiniAppWindow = Window & {
	consumerapp?: ConsumerAppBridge | null;
	ma?: {
		native?: (
			method: string,
			params?: Record<string, unknown>,
		) => Promise<unknown>;
	};
};

function getWin(): MiniAppWindow | null {
	if (typeof window === "undefined") return null;
	return window as MiniAppWindow;
}

/**
 * True when running inside Telebirr SuperApp WebView.
 * H5 Integration Step 4 uses `window.consumerapp`. `?telebirr_mini=1` forces
 * true for local UI tests (startPay still needs a real bridge).
 */
export function isTelebirrMiniApp(): boolean {
	const w = getWin();
	if (!w) return false;

	try {
		if (new URLSearchParams(w.location.search).get("telebirr_mini") === "1") {
			return true;
		}
	} catch {
		/* ignore */
	}

	return w.consumerapp != null || typeof w.ma?.native === "function";
}

/** SuperApp WebView → InApp; normal browser → H5 Checkout. */
export function getTelebirrPayMode(): "h5" | "miniapp" {
	return isTelebirrMiniApp() ? "miniapp" : "h5";
}

function parseStartPayResult(result: unknown): TelebirrMiniAppPayResult {
	if (result == null || result === "") {
		// Docs sample callback has no args and treats completion as success.
		return { ok: true, message: "Payment callback received" };
	}

	let data: Record<string, unknown> = {};
	if (typeof result === "string") {
		try {
			data = JSON.parse(result) as Record<string, unknown>;
		} catch {
			const lower = result.toLowerCase();
			if (lower.includes("success") || lower === "1") {
				return { ok: true, raw: result };
			}
			if (lower.includes("cancel")) {
				return { ok: false, canceled: true, message: result, raw: result };
			}
			// Opaque string callback — treat as completed (verify via queryOrder).
			return { ok: true, message: result, raw: result };
		}
	} else if (typeof result === "object") {
		data = result as Record<string, unknown>;
	} else {
		return { ok: true, message: String(result), raw: result };
	}

	const code = String(
		data.resultCode ?? data.code ?? data.status ?? data.result ?? "",
	).trim();
	const message = String(
		data.message ?? data.msg ?? data.errorMsg ?? data.error ?? "",
	).trim();

	if (
		code === "1" ||
		code === "0" ||
		code === "200" ||
		code.toUpperCase() === "SUCCESS" ||
		String(data.success) === "true"
	) {
		return { ok: true, message: message || undefined, raw: result };
	}

	if (
		code === "-3" ||
		code.toUpperCase() === "CANCEL" ||
		message.toLowerCase().includes("cancel")
	) {
		return { ok: false, canceled: true, message: message || "Canceled", raw: result };
	}

	if (!code && !message) {
		return { ok: true, raw: result };
	}

	return {
		ok: false,
		message: message || (code ? `startPay failed (${code})` : "startPay failed"),
		raw: result,
	};
}

/**
 * H5 Integration with SuperApp Step 4:
 * `window.consumerapp.evaluate` + `js_fun_start_pay`.
 */
export function startTelebirrMiniAppPay(
	rawRequest: string,
): Promise<TelebirrMiniAppPayResult> {
	const w = getWin();
	if (!w) {
		return Promise.resolve({ ok: false, message: "Not in a browser" });
	}

	const trimmed = rawRequest.trim();
	if (!trimmed) {
		return Promise.resolve({ ok: false, message: "Missing rawRequest" });
	}

	if (w.consumerapp == null) {
		return Promise.resolve({
			ok: false,
			message:
				"Telebirr SuperApp bridge not available (window.consumerapp). Open this page inside Telebirr.",
		});
	}

	return new Promise((resolve) => {
		const callbackName = `__zemenTelebirrPayCb_${Date.now()}`;
		const mutableWindow = w as MiniAppWindow & Record<string, unknown>;
		let settled = false;
		const finish = (result: TelebirrMiniAppPayResult) => {
			if (settled) return;
			settled = true;
			try {
				delete mutableWindow[callbackName];
			} catch {
				/* ignore */
			}
			resolve(result);
		};

		mutableWindow[callbackName] = (result?: unknown) => {
			finish(parseStartPayResult(result));
		};

		try {
			const evaluate = w.consumerapp?.evaluate;
			if (typeof evaluate !== "function") {
				finish({
					ok: false,
					message: "window.consumerapp.evaluate is not a function",
				});
				return;
			}

			const payload = JSON.stringify({
				functionName: "js_fun_start_pay",
				params: {
					rawRequest: trimmed,
					functionCallBackName: callbackName,
				},
			});

			console.info("[telebirr] startPay via consumerapp.evaluate", {
				callbackName,
				rawLen: trimmed.length,
				rawPrefix: trimmed.slice(0, 64),
				payloadLen: payload.length,
			});
			evaluate.call(w.consumerapp, payload);
		} catch (error: unknown) {
			finish({
				ok: false,
				message:
					error instanceof Error
						? error.message
						: "Failed to start SuperApp pay",
				raw: error,
			});
		}
	});
}
