import { describe, expect, it } from "vitest";

import { friendlyLoginError } from "@/services/auth/authApi";

describe("friendlyLoginError", () => {
	it("maps common auth failures", () => {
		expect(friendlyLoginError("Invalid login credentials")).toMatch(
			/incorrect/i,
		);
		expect(friendlyLoginError("Email not confirmed")).toMatch(/verify/i);
		expect(friendlyLoginError("Failed to fetch")).toMatch(/internet/i);
		expect(friendlyLoginError("No account found for this phone")).toMatch(
			/phone/i,
		);
	});

	it("hides technical exceptions", () => {
		expect(friendlyLoginError("TypeError: exception errno")).toMatch(
			/try again/i,
		);
		expect(friendlyLoginError("")).toMatch(/try again/i);
	});

	it("passes through readable messages", () => {
		expect(friendlyLoginError("Account is locked")).toBe("Account is locked");
	});
});
