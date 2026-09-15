function smsBase(): string {
	// Browser → same-origin proxy (betegna-ai CORS blocks web origins)
	if (typeof window !== "undefined") return "/api/sms";
	return (
		process.env.SMS_API_BASE_URL?.trim().replace(/\/$/, "") ||
		"https://betegna-ai.vercel.app/sms"
	);
}

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

function otpRecipient(phone: string): string {
	const digits = phone.replace(/\D/g, "");
	if (digits.length === 9) return `0${digits}`;
	if (digits.length === 10 && digits.startsWith("0")) return digits;
	if (digits.length === 12 && digits.startsWith("251")) return `0${digits.slice(3)}`;
	return digits;
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	return null;
}

/** Matches mobile SmsService — acknowledge/success + nested response.verificationId */
function parseSendOtpResponse(data: unknown): SmsOtpResult {
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

function parseVerifyOtpResponse(data: unknown, httpOk: boolean): SmsVerifyResult {
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

	return {
		success: true,
		message: String(root.message ?? "").trim() || undefined,
	};
}

export async function sendPhoneOtp(phone: string): Promise<SmsOtpResult> {
	const recipient = otpRecipient(phone);
	if (!recipient) return { success: false, error: "Invalid phone number" };

	try {
		const res = await fetch(`${smsBase()}/send-otp`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			// Body shape mirrors mobile SmsService.sendOtp
			body: JSON.stringify({
				recipient,
				code_length: 6,
				code_type: 0,
				ttl: 300,
				message_prefix: "Your verification code is",
				message_postfix: "",
				callback: "",
			}),
		});
		const data: unknown = await res.json();
		if (!res.ok) {
			const root = asRecord(data);
			return {
				success: false,
				error:
					String(root?.error ?? root?.message ?? "").trim() ||
					`OTP send failed: ${res.status}`,
			};
		}
		return parseSendOtpResponse(data);
	} catch {
		return { success: false, error: "No internet connection" };
	}
}

export async function verifyPhoneOtp(
	phone: string,
	code: string,
	verificationId: string,
): Promise<SmsVerifyResult> {
	const recipient = otpRecipient(phone);
	if (!recipient || !verificationId.trim()) {
		return { success: false, error: "Invalid verification details" };
	}

	try {
		const res = await fetch(`${smsBase()}/verify-otp`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				code: code.trim(),
				recipient,
				verification_id: verificationId,
			}),
		});
		const data: unknown = await res.json();
		return parseVerifyOtpResponse(data, res.ok);
	} catch {
		return { success: false, error: "No internet connection" };
	}
}
