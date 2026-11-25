/** Ethiopian phone helpers — mirrors zemen_provider Constant helpers. */

const LOGIN_PHONE_PATTERN = /^[+]?[\d\s()-]+$/;

export function looksLikePhoneIdentifier(raw: string): boolean {
	const trimmed = raw.trim();
	if (!trimmed || trimmed.includes("@")) return false;
	if (/[a-zA-Z]/.test(trimmed)) return false;
	return LOGIN_PHONE_PATTERN.test(trimmed);
}

/** Normalize to 9-digit local Ethiopian mobile (no leading 0 / 251). */
export function normalizeLocalEthiopianPhone(raw: string): string {
	let digits = raw.replace(/\D/g, "");
	if (digits.length === 12 && digits.startsWith("251")) {
		digits = digits.slice(3);
	} else if (digits.length === 10 && digits.startsWith("0")) {
		digits = digits.slice(1);
	}
	return digits;
}

export function validateLoginPhoneNumber(value: string): string | null {
	const raw = value.trim();
	if (!raw) return "authErrorPhoneRequired";
	if (!LOGIN_PHONE_PATTERN.test(raw)) {
		return "authErrorPhoneDigitsOnly";
	}

	const digits = normalizeLocalEthiopianPhone(raw);
	if (digits.length !== 9) {
		return "authErrorPhoneLength";
	}
	if (!/^[97]\d{8}$/.test(digits)) {
		return "authErrorPhonePrefix";
	}
	return null;
}

export function validateEmail(value: string): string | null {
	const email = value.trim().toLowerCase();
	if (!email) return "authErrorEmailRequired";
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "authErrorEmailInvalid";
	return null;
}

export function validateEmailOrPhone(value: string): string | null {
	const raw = value.trim();
	if (!raw) return "authErrorEmailOrPhoneRequired";
	if (looksLikePhoneIdentifier(raw)) return validateLoginPhoneNumber(raw);
	const emailError = validateEmail(raw);
	if (emailError === "authErrorEmailRequired") {
		return "authErrorEmailOrPhoneRequired";
	}
	return emailError;
}
