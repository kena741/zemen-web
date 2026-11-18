import { describe, expect, it } from "vitest";
import {
	isAwaitingInitialPayment,
	paidPercentage,
	remainingServiceBalance,
	resolveBookingPaymentSettlement,
} from "@/lib/booking-payment-progress";

describe("booking payment progress", () => {
	it("shows 0% until paymentCompleted is set", () => {
		expect(
			paidPercentage({
				paymentCompleted: false,
				totalAmount: "500",
				subTotal: "1000",
				status: "accepted",
			}),
		).toBe(0);
		expect(
			isAwaitingInitialPayment({
				paymentCompleted: false,
				status: "accepted",
			}),
		).toBe(true);
	});

	it("derives partial % and remaining from amounts", () => {
		const row = {
			paymentCompleted: true,
			totalAmount: "250",
			subTotal: "1000",
			status: "accepted",
		};
		expect(paidPercentage(row)).toBe(25);
		expect(remainingServiceBalance(row)).toBe(750);
		expect(resolveBookingPaymentSettlement(row)).toBe("partial");
	});

	it("is fully paid when totalAmount covers obligation", () => {
		const row = {
			paymentCompleted: true,
			totalAmount: "1000",
			subTotal: "1000",
			status: "in_progress",
		};
		expect(paidPercentage(row)).toBe(100);
		expect(remainingServiceBalance(row)).toBe(0);
		expect(resolveBookingPaymentSettlement(row)).toBe("paid");
	});

	it("uses discounted subTotal as obligation for prepaid remaining", () => {
		const row = {
			paymentCompleted: true,
			totalAmount: "360",
			subTotal: "900",
			status: "pending_approval",
		};
		expect(paidPercentage(row)).toBe(40);
		expect(remainingServiceBalance(row)).toBe(540);
		expect(resolveBookingPaymentSettlement(row)).toBe("partial");
	});

	it("nets legacy gross subTotal + ETB discount", () => {
		const row = {
			paymentCompleted: true,
			totalAmount: "2",
			subTotal: "200",
			discount: "180",
			servicePrice: "200",
			quantity: "1",
			status: "pending",
		};
		expect(paidPercentage(row)).toBe(10);
		expect(remainingServiceBalance(row)).toBe(18);
	});
});
