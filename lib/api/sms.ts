import { invokeFunction } from "./client";

export interface SmsOtpResult {
	success: boolean;
	verificationId?: string;
	error?: string;
}

export interface SmsVerifyResult {
	success: boolean;
	message?: string;
	error?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	return null;
}

function otpRecipient(phone: string): string {
	const digits = phone.replace(/\D/g, "");
	if (digits.length === 9) return `0${digits}`;
	if (digits.length === 10 && digits.startsWith("0")) return digits;
	if (digits.length === 12 && digits.startsWith("251")) return `0${digits.slice(3)}`;
	return digits;
}

/** Matches mobile SmsService — acknowledge/success + nested response.verificationId */
export function parseSendOtpResponse(data: unknown): SmsOtpResult {
	const root = asRecord(data);
	if (!root) return { success: false, error: "Invalid OTP response" };

	const nested = asRecord(root.response);
	const verificationId =
		String(nested?.verificationId ?? root.verificationId ?? "").trim() ||
		undefined;

	const acknowledged =
		root.acknowledge === "success" ||
		root.success === true ||
		Boolean(verificationId);

	if (acknowledged && verificationId) {
		return { success: true, verificationId };
	}

	return {
		success: false,
		error:
			String(root.error ?? root.message ?? nested?.message ?? "").trim() ||
			"Failed to send OTP",
	};
}

export function parseVerifyOtpResponse(
	data: unknown,
	httpOk = true,
): SmsVerifyResult {
	const root = asRecord(data);
	if (!httpOk) {
		return {
			success: false,
			error:
				String(root?.error ?? root?.message ?? "").trim() || "Invalid code",
		};
	}
	if (!root) return { success: true };

	if (root.success === false || root.acknowledge === "failed") {
		return {
			success: false,
			error: String(root.error ?? root.message ?? "Invalid code"),
		};
	}

	if (root.error && !root.success) {
		return {
			success: false,
			error: String(root.error),
		};
	}

	return {
		success: true,
		message: String(root.message ?? "").trim() || undefined,
	};
}

export async function sendOtp(phone: string): Promise<SmsOtpResult> {
	const recipient = otpRecipient(phone);
	if (!recipient) return { success: false, error: "Invalid phone number" };

	try {
		const data = await invokeFunction<unknown>("handle-sms", {
			action: "send-otp",
			recipient,
			code_length: 6,
			code_type: 0,
			ttl: 300,
			message_prefix: "Your verification code is",
			message_postfix: "",
			callback: "",
		});
		return parseSendOtpResponse(data);
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "No internet connection",
		};
	}
}

export async function verifyOtp(
	phone: string,
	code: string,
	verificationId: string,
): Promise<SmsVerifyResult> {
	const recipient = otpRecipient(phone);
	if (!recipient || !verificationId.trim()) {
		return { success: false, error: "Invalid verification details" };
	}

	try {
		const data = await invokeFunction<unknown>("handle-sms", {
			action: "verify-otp",
			code: code.trim(),
			recipient,
			verification_id: verificationId,
		});
		return parseVerifyOtpResponse(data, true);
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "No internet connection",
		};
	}
}
