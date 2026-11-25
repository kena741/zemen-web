import { describe, expect, it } from "vitest";

import { toAuthErrorKey } from "@/lib/auth/errors";
import { friendlyLoginError } from "@/services/auth/authApi";

describe("friendlyLoginError / toAuthErrorKey", () => {
	it("maps common auth failures to i18n keys", () => {
		expect(friendlyLoginError("Invalid login credentials")).toBe(
			"authErrorCredentials",
		);
		expect(friendlyLoginError("Email not confirmed")).toBe(
			"authErrorEmailNotConfirmed",
		);
		expect(friendlyLoginError("Failed to fetch")).toBe("authErrorNetwork");
		expect(friendlyLoginError("No account found for this phone")).toBe(
			"authErrorNoPhoneAccount",
		);
	});

	it("hides technical exceptions", () => {
		expect(friendlyLoginError("TypeError: exception errno")).toBe(
			"authErrorGeneric",
		);
		expect(friendlyLoginError("")).toBe("authErrorGeneric");
	});

	it("passes through known keys", () => {
		expect(toAuthErrorKey("authErrorNotProvider")).toBe("authErrorNotProvider");
		expect(toAuthErrorKey("passwordMinLength")).toBe("passwordMinLength");
	});

	it("maps unknown readable messages to generic", () => {
		expect(friendlyLoginError("Account is locked")).toBe("authErrorGeneric");
	});

	it("maps staging role mismatch messages", () => {
		expect(
			friendlyLoginError(
				"Account does not possess the required 'provider' role.",
			),
		).toBe("authErrorNotProvider");
		expect(
			friendlyLoginError(
				"Account does not possess the required 'customer' role.",
			),
		).toBe("authErrorNotCustomer");
	});
});
