import { describe, expect, it } from "vitest";

import {
	findChapaBank,
	validateBankAccountNumber,
} from "@/services/bank/chapaBanks";

describe("chapa bank account validation", () => {
	it("requires exact length for CBE", () => {
		const cbe = findChapaBank("cbe_bank");
		expect(validateBankAccountNumber("1234567890123", cbe)).toBeNull();
		expect(validateBankAccountNumber("123", cbe)).toMatch(/exactly 13/);
	});

	it("allows up to max length for nib", () => {
		const nib = findChapaBank("nib_bank");
		expect(validateBankAccountNumber("1234567890", nib)).toBeNull();
		expect(validateBankAccountNumber("1234567890123456", nib)).toMatch(
			/not exceed 15/,
		);
	});

	it("autofill bank has swift", () => {
		expect(findChapaBank("zemen_bank")?.swift).toBe("ZEMEETAA");
	});
});
