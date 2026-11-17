import { describe, expect, it } from "vitest";
import {
	customerBookingRefundAmount,
	resolveCustomerCancelRefundAmount,
} from "@/services/customer/bookingRefund";

/** Mirrors requestWithdrawal: queue-only, check full wallet (no soft-hold). */
function canRequest(balance: number, amount: number): boolean {
	return amount > 0 && amount <= balance;
}

/** Pending + new request must still fit within wallet balance. */
function canRequestWithPending(
	balance: number,
	pendingAmount: number,
	newAmount: number,
): boolean {
	return newAmount > 0 && pendingAmount + newAmount <= balance;
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

	it("sums into pending and rejects when total exceeds balance", () => {
		expect(canRequestWithPending(1000, 400, 200)).toBe(true);
		expect(canRequestWithPending(1000, 400, 600)).toBe(true);
		expect(canRequestWithPending(1000, 400, 601)).toBe(false);
		expect(canRequestWithPending(1000, 0, 1000)).toBe(true);
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

describe("customer booking refund", () => {
	it("refunds the sum of valid booking debits rounded to cents", () => {
		expect(
			customerBookingRefundAmount([
				{ amount: "25.36" },
				{ amount: 14.5 },
				{ amount: "invalid" },
				{ amount: -3 },
			]),
		).toBe(39.86);
	});

	it("does not refund when there are no valid debits", () => {
		expect(customerBookingRefundAmount([{ amount: 0 }, { amount: null }])).toBe(0);
	});
});

describe("resolveCustomerCancelRefundAmount", () => {
	it("refunds nothing when payment is not completed", () => {
		expect(
			resolveCustomerCancelRefundAmount({
				paymentCompleted: false,
				totalAmount: 500,
				debitTotal: 500,
			}),
		).toBe(0);
	});

	it("prefers wallet/chapa debit total when present", () => {
		expect(
			resolveCustomerCancelRefundAmount({
				paymentCompleted: true,
				paymentType: "wallet",
				totalAmount: 900,
				debitTotal: 450,
			}),
		).toBe(450);
	});

	it("uses Chapa escrow then subTotal when no debit ledger", () => {
		expect(
			resolveCustomerCancelRefundAmount({
				paymentCompleted: true,
				paymentType: "chapa",
				escrowAmount: 320,
				subTotal: 400,
				totalAmount: 400,
			}),
		).toBe(320);
		expect(
			resolveCustomerCancelRefundAmount({
				paymentCompleted: true,
				paymentType: "Chapa",
				subTotal: 400,
				totalAmount: 500,
			}),
		).toBe(400);
	});

	it("falls back to totalAmount for telebirr/wallet without debit rows", () => {
		expect(
			resolveCustomerCancelRefundAmount({
				paymentCompleted: true,
				paymentType: "telebirr",
				totalAmount: "275.50",
			}),
		).toBe(275.5);
	});
});
