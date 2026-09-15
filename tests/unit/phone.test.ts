import { describe, expect, it } from "vitest";

import {
	looksLikePhoneIdentifier,
	normalizeLocalEthiopianPhone,
	validateEmail,
	validateEmailOrPhone,
	validateLoginPhoneNumber,
} from "@/lib/phone";

describe("normalizeLocalEthiopianPhone", () => {
	it("strips +251 and leading 0", () => {
		expect(normalizeLocalEthiopianPhone("+251911223344")).toBe("911223344");
		expect(normalizeLocalEthiopianPhone("0911223344")).toBe("911223344");
		expect(normalizeLocalEthiopianPhone("911223344")).toBe("911223344");
	});
});

describe("validateLoginPhoneNumber", () => {
	it("accepts valid 9/7 mobiles", () => {
		expect(validateLoginPhoneNumber("911223344")).toBeNull();
		expect(validateLoginPhoneNumber("0711223344")).toBeNull();
	});

	it("rejects empty and invalid", () => {
		expect(validateLoginPhoneNumber("")).toMatch(/Required/i);
		expect(validateLoginPhoneNumber("811223344")).toMatch(/start with/i);
		expect(validateLoginPhoneNumber("123")).toMatch(/9 or 10 digits/i);
	});
});

describe("validateEmail / validateEmailOrPhone", () => {
	it("validates email", () => {
		expect(validateEmail("a@b.com")).toBeNull();
		expect(validateEmail("nope")).toMatch(/Invalid/i);
	});

	it("routes phone vs email", () => {
		expect(looksLikePhoneIdentifier("911223344")).toBe(true);
		expect(looksLikePhoneIdentifier("a@b.com")).toBe(false);
		expect(validateEmailOrPhone("")).toMatch(/Required/i);
		expect(validateEmailOrPhone("911223344")).toBeNull();
		expect(validateEmailOrPhone("user@zemen.test")).toBeNull();
	});
});
