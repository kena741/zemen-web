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
	if (!raw) return "Phone number is Required";
	if (!LOGIN_PHONE_PATTERN.test(raw)) {
		return "Phone number can only contain digits";
	}

	const digits = normalizeLocalEthiopianPhone(raw);
	if (digits.length !== 9) {
		return "Phone number must be 9 or 10 digits";
	}
	if (!/^[97]\d{8}$/.test(digits)) {
		return "Phone number must start with 9 or 7";
	}
	return null;
}

export function validateEmail(value: string): string | null {
	const email = value.trim().toLowerCase();
	if (!email) return "Email is Required";
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid Email";
	return null;
}

export function validateEmailOrPhone(value: string): string | null {
	const raw = value.trim();
	if (!raw) return "Email or phone is Required";
	if (looksLikePhoneIdentifier(raw)) return validateLoginPhoneNumber(raw);
	const emailError = validateEmail(raw);
	if (emailError === "Email is Required") return "Email or phone is Required";
	return emailError;
}
