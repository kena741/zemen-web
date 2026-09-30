import { describe, expect, it } from "vitest";

/** Mirrors requestWithdrawal: queue-only, check full wallet (no soft-hold). */
function canRequest(balance: number, amount: number): boolean {
	return amount > 0 && amount <= balance;
}

/** Rejected payout refund: only when a withdrawal:{id} debit exists. */
function rejectedRefundCredit(debitAmt: number): number {
	return debitAmt >= 0.01 ? debitAmt : 0;
}

describe("wallet withdrawal request", () => {
	it("allows request up to full balance with no hold", () => {
		expect(canRequest(1000, 200)).toBe(true);
		expect(canRequest(1000, 1000)).toBe(true);
		expect(canRequest(1000, 1000.01)).toBe(false);
		expect(canRequest(0, 10)).toBe(false);
	});
});

describe("rejected withdrawal refund", () => {
	it("credits only when a debit row exists", () => {
		expect(rejectedRefundCredit(25.36)).toBe(25.36);
		expect(rejectedRefundCredit(10)).toBe(10);
		expect(rejectedRefundCredit(0)).toBe(0);
		expect(rejectedRefundCredit(0.009)).toBe(0);
	});
});
