import type { MessageKey } from "@/lib/i18n/messages/en";

const AUTH_KEYS = new Set<string>([
	"authErrorGeneric",
	"authErrorNetwork",
	"authErrorCredentials",
	"authErrorNoPhoneAccount",
	"authErrorNoEmailAccount",
	"authErrorEmailOrPhoneRequired",
	"authErrorEmailNotConfirmed",
	"authErrorLoginFailed",
	"authErrorSignupFailed",
	"authErrorAccountDisabled",
	"authErrorNoProviderAccount",
	"authErrorNoCustomerAccount",
	"authErrorNotProvider",
	"authErrorNotCustomer",
	"authErrorEmailRequired",
	"authErrorEmailInvalid",
	"authErrorPhoneRequired",
	"authErrorPhoneDigitsOnly",
	"authErrorPhoneLength",
	"authErrorPhonePrefix",
	"authErrorEmailResetUnavailable",
	"authErrorResetRedirect",
	"authErrorSocialResetUnavailable",
	"authErrorUsePhoneReset",
	"authErrorResetFailed",
	"commonError",
	"noInternet",
	"invalidCode",
	"invalidPhone",
	"passwordMismatch",
	"passwordMinLength",
	"signupAcceptTerms",
	"signupPhoneAlreadyRegistered",
]);

export function isAuthMessageKey(value: string): value is MessageKey {
	return AUTH_KEYS.has(value);
}

/**
 * Map known API / validation strings to i18n keys.
 * Unknown backend details are returned as-is (do not hide as "Something went wrong").
 */
export function toAuthErrorKey(rawError: string | null | undefined): string {
	const raw = rawError?.trim() ?? "";
	if (!raw) return "authErrorGeneric";
	if (AUTH_KEYS.has(raw)) return raw;

	const lower = raw.toLowerCase();
	if (
		lower.includes("failed to fetch") ||
		lower.includes("network") ||
		lower.includes("offline") ||
		lower.includes("no internet")
	) {
		return "authErrorNetwork";
	}
	if (
		lower.includes("invalid login credentials") ||
		lower.includes("invalid email or password") ||
		lower.includes("invalid credentials") ||
		lower.includes("email, phone, or password is incorrect")
	) {
		return "authErrorCredentials";
	}
	if (
		lower.includes("no account found for this phone") ||
		(lower.includes("not found") && lower.includes("phone")) ||
		(lower.includes("was not found") && lower.includes("user"))
	) {
		return "authErrorNoPhoneAccount";
	}
	if (lower.includes("no account found for this email")) {
		return "authErrorNoEmailAccount";
	}
	if (
		lower.includes("email or phone is required") ||
		lower === "email or phone is required"
	) {
		return "authErrorEmailOrPhoneRequired";
	}
	if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
		return "authErrorEmailNotConfirmed";
	}
	if (lower.includes("no provider account")) {
		return "authErrorNoProviderAccount";
	}
	if (lower.includes("no customer account")) {
		return "authErrorNoCustomerAccount";
	}
	// Staging: "Account does not possess the required 'provider'|'customer' role."
	if (
		lower.includes("not a provider") ||
		lower.includes("switch to customer") ||
		(lower.includes("possess") &&
			lower.includes("provider") &&
			lower.includes("role")) ||
		(lower.includes("required") &&
			lower.includes("'provider'") &&
			lower.includes("role"))
	) {
		return "authErrorNotProvider";
	}
	if (
		lower.includes("not a customer") ||
		lower.includes("switch to provider") ||
		(lower.includes("possess") &&
			lower.includes("customer") &&
			lower.includes("role")) ||
		(lower.includes("required") &&
			lower.includes("'customer'") &&
			lower.includes("role"))
	) {
		return "authErrorNotCustomer";
	}
	if (lower.includes("account is disabled") || lower.includes("disabled")) {
		return "authErrorAccountDisabled";
	}
	if (lower.includes("email is required") || lower === "email is required") {
		return "authErrorEmailRequired";
	}
	if (lower.includes("invalid email")) {
		return "authErrorEmailInvalid";
	}
	if (
		lower.includes("phone number is required") ||
		lower === "phone number is required"
	) {
		return "authErrorPhoneRequired";
	}
	if (lower.includes("only contain digits")) {
		return "authErrorPhoneDigitsOnly";
	}
	if (lower.includes("9 or 10 digits")) {
		return "authErrorPhoneLength";
	}
	if (lower.includes("start with 9 or 7")) {
		return "authErrorPhonePrefix";
	}
	if (
		lower.includes("email password reset is not available") ||
		lower.includes("use phone reset")
	) {
		return "authErrorEmailResetUnavailable";
	}
	if (lower.includes("redirect") && lower.includes("reset")) {
		return "authErrorResetRedirect";
	}
	if (lower.includes("social login")) {
		return "authErrorSocialResetUnavailable";
	}
	if (lower.includes("use phone password reset")) {
		return "authErrorUsePhoneReset";
	}
	if (lower.includes("signup failed")) {
		return "authErrorSignupFailed";
	}
	if (lower.includes("login failed")) {
		return "authErrorLoginFailed";
	}
	if (lower.includes("reset failed")) {
		return "authErrorResetFailed";
	}
	// ponytail: show BE detail verbatim when we have no mapped copy
	return raw;
}

export function isAuthEmailConfirmError(keyOrMessage: string): boolean {
	const key = toAuthErrorKey(keyOrMessage);
	return key === "authErrorEmailNotConfirmed";
}

export function isAuthSwitchCustomerError(keyOrMessage: string): boolean {
	return toAuthErrorKey(keyOrMessage) === "authErrorNotProvider";
}

export function isAuthSwitchProviderError(keyOrMessage: string): boolean {
	return toAuthErrorKey(keyOrMessage) === "authErrorNotCustomer";
}
