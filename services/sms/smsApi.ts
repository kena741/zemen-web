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

export async function sendPhoneOtp(phone: string): Promise<SmsOtpResult> {
	const recipient = otpRecipient(phone);
	if (!recipient) return { success: false, error: "Invalid phone number" };

	try {
		const res = await fetch(`${smsBase()}/send-otp`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ recipient, codeLength: 6, ttlSeconds: 300 }),
		});
		const data = (await res.json()) as {
			success?: boolean;
			verificationId?: string;
			error?: string;
			message?: string;
		};
		if (!res.ok || !data.success) {
			return {
				success: false,
				error: data.error || data.message || "Failed to send OTP",
			};
		}
		return { success: true, verificationId: data.verificationId };
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
	if (!recipient) return { success: false, error: "Invalid phone number" };

	try {
		const res = await fetch(`${smsBase()}/verify-otp`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ recipient, code: code.trim(), verificationId }),
		});
		const data = (await res.json()) as {
			success?: boolean;
			error?: string;
			message?: string;
		};
		if (!res.ok || !data.success) {
			return {
				success: false,
				error: data.error || data.message || "Invalid code",
			};
		}
		return { success: true, message: data.message };
	} catch {
		return { success: false, error: "No internet connection" };
	}
}
