"use client";

export type TelebirrMiniAppPayResult = {
	ok: boolean;
	canceled?: boolean;
	message?: string;
	raw?: unknown;
};

type MaBridge = {
	native: (
		method: string,
		params?: Record<string, unknown>,
	) => Promise<unknown>;
};

type MiniAppWindow = Window & {
	ma?: MaBridge;
};

function getWin(): MiniAppWindow | null {
	if (typeof window === "undefined") return null;
	return window as MiniAppWindow;
}

/**
 * True when running inside Telebirr SuperApp / mini-app WebView.
 * Prefer `window.ma.native` (official docs). `?telebirr_mini=1` forces true
 * for local UI tests (startPay still needs a real bridge to complete payment).
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

	return typeof w.ma?.native === "function";
}

export function getTelebirrPayMode(): "h5" | "miniapp" {
	return isTelebirrMiniApp() ? "miniapp" : "h5";
}

function parseStartPayResult(result: unknown): TelebirrMiniAppPayResult {
	if (result == null) {
		return { ok: false, message: "Empty startPay result" };
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
			return { ok: false, message: result, raw: result };
		}
	} else if (typeof result === "object") {
		data = result as Record<string, unknown>;
	} else {
		return { ok: false, message: String(result), raw: result };
	}

	const code = String(
		data.resultCode ?? data.code ?? data.status ?? data.result ?? "",
	).trim();
	const message = String(
		data.message ?? data.msg ?? data.errorMsg ?? data.error ?? "",
	).trim();

	// Official Telebirr docs: resultCode === "1" means pay success.
	if (code === "1") {
		return { ok: true, message: message || undefined, raw: result };
	}

	if (
		code === "-3" ||
		code === "0" ||
		code.toUpperCase() === "CANCEL" ||
		message.toLowerCase().includes("cancel")
	) {
		return { ok: false, canceled: true, message: message || "Canceled", raw: result };
	}

	return {
		ok: false,
		message: message || (code ? `startPay failed (${code})` : "startPay failed"),
		raw: result,
	};
}

/**
 * Launch Telebirr SuperApp payment via official `window.ma.native("startPay")`.
 * `rawRequest` is the signed query string from preOrder (no paygate base).
 */
export async function startTelebirrMiniAppPay(
	rawRequest: string,
): Promise<TelebirrMiniAppPayResult> {
	const w = getWin();
	if (!w) {
		return { ok: false, message: "Not in a browser" };
	}

	if (typeof w.ma?.native !== "function") {
		return {
			ok: false,
			message: "Telebirr mini-app payment bridge not available",
		};
	}

	try {
		const startPayRes = await w.ma.native("startPay", {
			rawRequest,
			// Spelling matches Telebirr official docs.
			bussinessType: "BuyGoods",
		});
		return parseStartPayResult(startPayRes);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : String(error ?? "");
		if (message.toLowerCase().includes("cancel")) {
			return { ok: false, canceled: true, message: message || "Canceled", raw: error };
		}
		return {
			ok: false,
			message: message || "Failed to start mini-app pay",
			raw: error,
		};
	}
}
