import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChapaConfig {
	enable?: boolean;
	isActive?: boolean | number;
	secretKey?: string;
	publicKey?: string;
}

export interface ChapaVerifyTransaction {
	status?: string;
	amount?: number;
	charge?: number;
	tx_ref?: string;
	reference?: string;
}

export function parseObjectValue(value: unknown): Record<string, unknown> {
	if (!value) return {};
	if (typeof value === "string") {
		try {
			return (JSON.parse(value) as Record<string, unknown>) ?? {};
		} catch {
			return {};
		}
	}
	if (typeof value === "object") return value as Record<string, unknown>;
	return {};
}

export function resolveChapaConfig(settingsData: unknown): ChapaConfig {
	const root = parseObjectValue(settingsData);
	const maybeChapa = root.chapa;
	if (!maybeChapa || typeof maybeChapa !== "object") return {};
	return maybeChapa as ChapaConfig;
}

export async function loadChapaSecretKey(admin: SupabaseClient): Promise<string> {
	const { data: paymentRow } = await admin
		.from("app_settings")
		.select("id, data")
		.eq("id", "payment")
		.maybeSingle();

	const chapaConfig = resolveChapaConfig(
		(paymentRow as { data?: unknown } | null)?.data,
	);
	return (chapaConfig.secretKey || process.env.CHAPA_SECRET_KEY || "").trim();
}

export function normalizeChapaPhone(raw: string | null | undefined): string | null {
	const digits = (raw ?? "").replace(/\D/g, "");
	if (digits.length === 10 && (digits.startsWith("09") || digits.startsWith("07"))) {
		return digits;
	}
	if (digits.length === 9 && (digits.startsWith("9") || digits.startsWith("7"))) {
		return `0${digits}`;
	}
	if (
		digits.length === 12 &&
		digits.startsWith("251") &&
		(digits[3] === "9" || digits[3] === "7")
	) {
		return `0${digits.slice(3)}`;
	}
	return null;
}

export function isChapaSuccessStatus(status: string | undefined): boolean {
	const normalized = (status || "").toLowerCase().trim();
	return ["success", "successful", "completed", "paid"].includes(normalized);
}

const CHAPA_DOMESTIC_FEE_RATE = 0.025;
const CHAPA_LEGACY_DOMESTIC_FEE_RATE = 0.035;

function inferNetFromGrossWithFeeMarkup(gross: number, feeRate: number): number | null {
	const multiplier = 1 + feeRate;
	const net = Math.round((gross / multiplier) * 100) / 100;
	const error = Math.abs(net * multiplier - gross);
	if (error < 0.02) return net;
	return null;
}

function resolveInferredNetFromGross(gross: number): number | null {
	for (const feeRate of [CHAPA_DOMESTIC_FEE_RATE, CHAPA_LEGACY_DOMESTIC_FEE_RATE]) {
		const net = inferNetFromGrossWithFeeMarkup(gross, feeRate);
		if (net != null) return net;
	}
	return null;
}

export async function verifyChapaTransaction(
	secretKey: string,
	txRef: string,
): Promise<{ ok: true; data: ChapaVerifyTransaction } | { ok: false; error: string }> {
	const response = await fetch(
		`https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`,
		{
			method: "GET",
			headers: { Authorization: `Bearer ${secretKey}` },
			cache: "no-store",
		},
	);

	const payload = (await response.json()) as {
		status?: string;
		message?: string;
		data?: ChapaVerifyTransaction;
	};

	if (!response.ok || payload.status !== "success") {
		return { ok: false, error: payload.message || "Chapa verify failed" };
	}

	const txStatus = String(payload.data?.status ?? "").toLowerCase();
	if (!isChapaSuccessStatus(txStatus)) {
		return { ok: false, error: `Chapa status is ${txStatus || "unknown"}` };
	}

	return { ok: true, data: payload.data ?? {} };
}

export function resolveChapaWalletCreditAmount(
	data: ChapaVerifyTransaction,
	fallbackAmount: string,
): string {
	const gross = Number(data.amount ?? 0);
	const charge = Number(data.charge ?? 0);

	if (Number.isFinite(gross) && gross > 0) {
		if (Number.isFinite(charge) && charge > 0) {
			return (gross - charge).toFixed(2);
		}
		const inferredNet = resolveInferredNetFromGross(gross);
		if (inferredNet != null) return inferredNet.toFixed(2);
		return gross.toFixed(2);
	}

	const fallback = Number(fallbackAmount);
	return Number.isFinite(fallback) && fallback > 0 ? fallback.toFixed(2) : "0.00";
}
