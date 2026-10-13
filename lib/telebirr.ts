import {
	constants as cryptoConstants,
	createPrivateKey,
	randomInt,
	sign as cryptoSign,
} from "node:crypto";
import * as https from "node:https";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSiteUrl } from "@/lib/env";
import { parseObjectValue } from "@/lib/chapa";

const BASE_URL_TEST =
	"https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway";
const BASE_URL_PRODUCTION =
	"https://superapp.ethiomobilemoney.et:38443/apiaccess/payment/gateway";
const WEB_BASE_URL_TEST =
	"https://developerportal.ethiotelebirr.et:38443/payment/web/paygate?";
const WEB_BASE_URL_PRODUCTION =
	"https://superapp.ethiomobilemoney.et:38443/payment/web/paygate?";

const EXCLUDED_SIGN_FIELDS = new Set([
	"sign",
	"sign_type",
	"header",
	"refund_info",
	"openType",
	"raw_request",
	"biz_content",
]);

const SUCCESS_STATUSES = new Set([
	"PAY_SUCCESS",
	"SUCCESS",
	"PAID",
	"COMPLETED",
]);

const NONCE_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export interface TelebirrConfig {
	enable?: boolean;
	name?: string;
	fabricAppId?: string;
	appSecret?: string;
	merchantAppId?: string;
	merchantCode?: string;
	privateKey?: string;
	environment?: string;
	baseUrl?: string;
	webBaseUrl?: string;
}

export interface ResolvedTelebirrConfig {
	fabricAppId: string;
	appSecret: string;
	merchantAppId: string;
	merchantCode: string;
	privateKey: string;
	baseUrl: string;
	webBaseUrl: string;
	notifyUrl: string;
	verifySsl: boolean;
}

export interface TelebirrCheckoutResult {
	checkoutUrl: string;
	merchOrderId: string;
	prepayId: string;
}

export interface TelebirrOrderStatus {
	paid: boolean;
	failed: boolean;
	tradeStatus: string;
	amount: string;
	paymentOrderId: string | null;
	merchOrderId: string;
	transId: string;
}

type SignableRequest = Record<string, unknown> & {
	biz_content?: Record<string, unknown>;
};

function env(name: string): string {
	return (process.env[name] ?? "").trim();
}

function resolveEnvironmentUrls(environment: string): {
	baseUrl: string;
	webBaseUrl: string;
} {
	const envName = environment.toLowerCase();
	if (["production", "prod", "live"].includes(envName)) {
		return { baseUrl: BASE_URL_PRODUCTION, webBaseUrl: WEB_BASE_URL_PRODUCTION };
	}
	return { baseUrl: BASE_URL_TEST, webBaseUrl: WEB_BASE_URL_TEST };
}

/** Ethio Telecom often issues bare base64 DER — normalize to PEM. */
export function normalizePrivateKey(key: string): string {
	const trimmed = key.trim();
	if (!trimmed) return trimmed;
	if (trimmed.includes("-----BEGIN")) {
		return trimmed.replace(/\\n/g, "\n");
	}
	const body = trimmed.replace(/\\n/g, "").replace(/\s+/g, "");
	const wrapped = body.match(/.{1,64}/g)?.join("\n") ?? body;
	const candidates = ["PRIVATE KEY", "RSA PRIVATE KEY"].map(
		(label) =>
			`-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----\n`,
	);
	for (const pem of candidates) {
		try {
			createPrivateKey(pem);
			return pem;
		} catch {
			/* try next */
		}
	}
	return candidates[0]!;
}

export function resolveTelebirrSettings(settingsData: unknown): TelebirrConfig {
	const root = parseObjectValue(settingsData);
	const maybe = root.telebirr;
	if (!maybe || typeof maybe !== "object") return {};
	return maybe as TelebirrConfig;
}

export async function loadTelebirrConfig(
	admin?: SupabaseClient,
): Promise<ResolvedTelebirrConfig | null> {
	let fromDb: TelebirrConfig = {};
	if (admin) {
		const { data } = await admin
			.from("app_settings")
			.select("data")
			.eq("id", "payment")
			.maybeSingle();
		fromDb = resolveTelebirrSettings(
			(data as { data?: unknown } | null)?.data,
		);
	}

	const environment =
		env("TELEBIRR_ENVIRONMENT") || fromDb.environment || "production";
	const urls = resolveEnvironmentUrls(environment);
	const baseUrl =
		env("TELEBIRR_BASE_URL") || fromDb.baseUrl || urls.baseUrl;
	const webBaseUrl =
		env("TELEBIRR_WEB_BASE_URL") || fromDb.webBaseUrl || urls.webBaseUrl;

	const fabricAppId =
		env("TELEBIRR_FABRIC_APP_ID") || String(fromDb.fabricAppId ?? "").trim();
	const appSecret =
		env("TELEBIRR_APP_SECRET") || String(fromDb.appSecret ?? "").trim();
	const merchantAppId =
		env("TELEBIRR_MERCHANT_APP_ID") ||
		String(fromDb.merchantAppId ?? "").trim();
	const merchantCode =
		env("TELEBIRR_MERCHANT_CODE") ||
		env("TELEBIRR_SHORT_CODE") ||
		String(fromDb.merchantCode ?? "").trim();
	const privateKeyRaw =
		env("TELEBIRR_PRIVATE_KEY") || String(fromDb.privateKey ?? "").trim();

	const siteUrl = getSiteUrl().replace(/\/$/, "");
	const notifyUrl =
		env("TELEBIRR_NOTIFY_URL") || `${siteUrl}/api/pay/telebirr/notify`;

	if (
		!fabricAppId ||
		!appSecret ||
		!merchantAppId ||
		!merchantCode ||
		!privateKeyRaw
	) {
		return null;
	}

	const verifySslEnv = env("TELEBIRR_VERIFY_SSL").toLowerCase();
	const verifySsl =
		verifySslEnv === "false" || verifySslEnv === "0"
			? false
			: verifySslEnv === "true" || verifySslEnv === "1"
				? true
				: environment !== "test" && environment !== "development";

	return {
		fabricAppId,
		appSecret,
		merchantAppId,
		merchantCode,
		privateKey: normalizePrivateKey(privateKeyRaw),
		baseUrl: baseUrl.replace(/\/$/, ""),
		webBaseUrl,
		notifyUrl,
		verifySsl,
	};
}

function createTimeStamp(): string {
	return Math.floor(Date.now() / 1000).toString();
}

function createNonceStr(): string {
	let str = "";
	for (let i = 0; i < 32; i++) {
		str += NONCE_CHARS[randomInt(0, NONCE_CHARS.length)];
	}
	return str;
}

function buildCanonicalString(fields: Record<string, unknown>): string {
	const fieldMap = new Map<string, unknown>();
	for (const [key, value] of Object.entries(fields)) {
		if (EXCLUDED_SIGN_FIELDS.has(key)) continue;
		fieldMap.set(key, value);
	}
	const biz = fields.biz_content;
	if (biz && typeof biz === "object" && !Array.isArray(biz)) {
		for (const [key, value] of Object.entries(biz as Record<string, unknown>)) {
			if (EXCLUDED_SIGN_FIELDS.has(key)) continue;
			fieldMap.set(key, value);
		}
	}
	const sortedKeys = [...fieldMap.keys()].sort((a, b) =>
		a < b ? -1 : a > b ? 1 : 0,
	);
	return sortedKeys.map((key) => `${key}=${String(fieldMap.get(key))}`).join("&");
}

function signRequestObject(
	privateKey: string,
	requestObject: SignableRequest,
): string {
	const canonical = buildCanonicalString(requestObject);
	const signature = cryptoSign("sha256", Buffer.from(canonical, "utf8"), {
		key: privateKey,
		padding: cryptoConstants.RSA_PKCS1_PSS_PADDING,
		saltLength: 32,
	});
	return signature.toString("base64");
}

/** Telebirr merch_order_id must be alphanumeric only. */
export function generateMerchOrderId(prefix = "web"): string {
	const rand = Math.random().toString(36).slice(2, 10);
	return `${prefix}${Date.now()}${rand}`.replace(/[^A-Za-z0-9]/g, "").slice(0, 64);
}

function sanitizeTitle(title: string): string {
	return title
		.replace(/[^\w\s\-.,&()]/g, "")
		.trim()
		.slice(0, 128) || "Zemen payment";
}

function formatAmount(amount: string | number): string {
	const n = typeof amount === "number" ? amount : Number.parseFloat(amount);
	if (!Number.isFinite(n) || n <= 0) {
		throw new Error("Invalid payment amount");
	}
	return n.toFixed(2);
}

function isSuccessStatus(status: string): boolean {
	return SUCCESS_STATUSES.has(status.trim().toUpperCase());
}

async function postJson(
	url: string,
	headers: Record<string, string>,
	body: unknown,
	verifySsl: boolean,
): Promise<{ status: number; json: Record<string, unknown> }> {
	const payload = JSON.stringify(body);

	if (verifySsl) {
		const response = await fetch(url, {
			method: "POST",
			headers,
			body: payload,
			cache: "no-store",
		});
		const json = (await response.json().catch(() => ({}))) as Record<
			string,
			unknown
		>;
		return { status: response.status, json };
	}

	return new Promise((resolve, reject) => {
		const parsed = new URL(url);
		const req = https.request(
			{
				hostname: parsed.hostname,
				port: parsed.port || 443,
				path: `${parsed.pathname}${parsed.search}`,
				method: "POST",
				headers: {
					...headers,
					"Content-Length": Buffer.byteLength(payload),
				},
				rejectUnauthorized: false,
			},
			(res) => {
				const chunks: Buffer[] = [];
				res.on("data", (chunk) => chunks.push(chunk));
				res.on("end", () => {
					const text = Buffer.concat(chunks).toString("utf8");
					let json: Record<string, unknown> = {};
					try {
						json = JSON.parse(text) as Record<string, unknown>;
					} catch {
						json = { raw: text };
					}
					resolve({ status: res.statusCode ?? 0, json });
				});
			},
		);
		req.on("error", reject);
		req.write(payload);
		req.end();
	});
}

async function applyFabricToken(
	config: ResolvedTelebirrConfig,
): Promise<string> {
	const { status, json } = await postJson(
		`${config.baseUrl}/payment/v1/token`,
		{
			"Content-Type": "application/json",
			"X-APP-Key": config.fabricAppId,
		},
		{ appSecret: config.appSecret },
		config.verifySsl,
	);

	const token = String(json.token ?? "").trim();
	if (status < 200 || status >= 300 || !token) {
		const detail =
			json.errorMsg ??
			json.message ??
			json.error ??
			json.errorCode ??
			status;
		throw new Error(`Telebirr token failed: ${String(detail)}`);
	}
	return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

async function sendSignedRequest(
	config: ResolvedTelebirrConfig,
	path: string,
	reqObject: SignableRequest,
	fabricToken: string,
): Promise<Record<string, unknown>> {
	const { status, json } = await postJson(
		`${config.baseUrl}${path}`,
		{
			"Content-Type": "application/json",
			"X-APP-Key": config.fabricAppId,
			Authorization: fabricToken,
		},
		reqObject,
		config.verifySsl,
	);

	if (status < 200 || status >= 300) {
		throw new Error(
			`Telebirr request failed (${status}): ${JSON.stringify(json)}`,
		);
	}

	const code = json.code != null ? String(json.code) : "";
	if (code && code !== "00000" && code !== "0") {
		throw new Error(
			`Telebirr API error ${code}: ${String(json.msg ?? json.message ?? JSON.stringify(json))}`,
		);
	}

	return json;
}

function buildCheckoutUrl(
	config: ResolvedTelebirrConfig,
	prepayId: string,
): string {
	const map: Record<string, string> = {
		appid: config.merchantAppId,
		merch_code: config.merchantCode,
		nonce_str: createNonceStr(),
		prepay_id: prepayId,
		timestamp: createTimeStamp(),
	};
	const sign = signRequestObject(config.privateKey, map);
	const parts = [
		`appid=${map.appid}`,
		`merch_code=${map.merch_code}`,
		`nonce_str=${map.nonce_str}`,
		`prepay_id=${map.prepay_id}`,
		`timestamp=${map.timestamp}`,
		`sign=${encodeURIComponent(sign)}`,
		"sign_type=SHA256WithRSA",
	];
	return `${config.webBaseUrl}${parts.join("&")}&version=1.0&trade_type=Checkout`;
}

export async function createTelebirrCheckout(params: {
	config: ResolvedTelebirrConfig;
	title: string;
	amount: string | number;
	merchOrderId?: string;
	redirectUrl: string;
}): Promise<TelebirrCheckoutResult> {
	const merchOrderId =
		params.merchOrderId?.replace(/[^A-Za-z0-9]/g, "") ||
		generateMerchOrderId();
	const amount = formatAmount(params.amount);
	const title = sanitizeTitle(params.title);
	const fabricToken = await applyFabricToken(params.config);

	const req: SignableRequest = {
		timestamp: createTimeStamp(),
		nonce_str: createNonceStr(),
		method: "payment.preorder",
		version: "1.0",
		biz_content: {
			notify_url: params.config.notifyUrl,
			appid: params.config.merchantAppId,
			merch_code: params.config.merchantCode,
			merch_order_id: merchOrderId,
			trade_type: "Checkout",
			title,
			total_amount: amount,
			trans_currency: "ETB",
			timeout_express: "120m",
			redirect_url: params.redirectUrl,
			business_type: "BuyGoods",
			payee_identifier: params.config.merchantCode,
			payee_identifier_type: "04",
			payee_type: "5000",
		},
	};
	req.sign = signRequestObject(params.config.privateKey, req);
	req.sign_type = "SHA256WithRSA";

	const result = await sendSignedRequest(
		params.config,
		"/payment/v1/merchant/preOrder",
		req,
		fabricToken,
	);

	const biz = (result.biz_content ?? {}) as Record<string, unknown>;
	const prepayId = String(biz.prepay_id ?? "").trim();
	if (!prepayId) {
		throw new Error(
			`Telebirr preOrder missing prepay_id: ${JSON.stringify(result)}`,
		);
	}

	return {
		checkoutUrl: buildCheckoutUrl(params.config, prepayId),
		merchOrderId,
		prepayId,
	};
}

export async function queryTelebirrOrderStatus(params: {
	config: ResolvedTelebirrConfig;
	merchOrderId: string;
}): Promise<TelebirrOrderStatus> {
	const fabricToken = await applyFabricToken(params.config);
	const req: SignableRequest = {
		timestamp: createTimeStamp(),
		nonce_str: createNonceStr(),
		method: "payment.queryorder",
		version: "1.0",
		biz_content: {
			appid: params.config.merchantAppId,
			merch_code: params.config.merchantCode,
			merch_order_id: params.merchOrderId,
		},
	};
	req.sign = signRequestObject(params.config.privateKey, req);
	req.sign_type = "SHA256WithRSA";

	const result = await sendSignedRequest(
		params.config,
		"/payment/v1/merchant/queryOrder",
		req,
		fabricToken,
	);

	const biz = (result.biz_content ?? {}) as Record<string, unknown>;
	const pick = (...keys: string[]): string => {
		for (const key of keys) {
			const value = biz[key];
			if (value !== undefined && value !== null && String(value) !== "") {
				return String(value);
			}
		}
		return "";
	};

	const tradeStatus = pick(
		"trade_status",
		"tradeStatus",
		"order_status",
		"orderStatus",
	);
	const paymentOrderId = pick("payment_order_id", "paymentOrderId");

	return {
		paid: tradeStatus !== "" && isSuccessStatus(tradeStatus),
		failed:
			tradeStatus !== "" &&
			["PAY_FAILED", "FAILED", "PAY_CANCEL", "CANCEL", "CANCELLED"].includes(
				tradeStatus.toUpperCase(),
			),
		tradeStatus,
		amount: pick("total_amount", "totalAmount"),
		paymentOrderId: paymentOrderId || null,
		merchOrderId:
			pick("merch_order_id", "merchOrderId") || params.merchOrderId,
		transId: pick("trans_id", "transId"),
	};
}

export function unwrapTelebirrNotify(
	payload: Record<string, unknown>,
): Record<string, unknown> {
	const inner = payload.data;
	if (
		inner &&
		typeof inner === "object" &&
		!Array.isArray(inner) &&
		"merch_order_id" in (inner as Record<string, unknown>)
	) {
		return inner as Record<string, unknown>;
	}
	return payload;
}

export function isTelebirrNotifySuccess(
	notification: Record<string, unknown>,
): boolean {
	const tradeStatus = String(
		notification.trade_status ?? notification.status ?? "",
	);
	return tradeStatus !== "" && isSuccessStatus(tradeStatus);
}
