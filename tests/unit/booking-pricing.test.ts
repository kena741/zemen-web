import { describe, expect, it } from "vitest";

import {
	computeBookingPrice,
	serviceDiscountAmount,
} from "@/lib/booking-pricing";

describe("serviceDiscountAmount", () => {
	it("treats values ≤100 as percent of line subtotal", () => {
		expect(serviceDiscountAmount("10", 1000, 2)).toBe(200);
	});

	it("treats values >100 as fixed ETB per unit", () => {
		expect(serviceDiscountAmount("150", 1000, 2)).toBe(300);
	});
});

describe("computeBookingPrice", () => {
	it("applies discount before prepayment percent", () => {
		const price = computeBookingPrice({
			unitPrice: 1000,
			quantity: 1,
			discountRaw: "10",
			prePaymentPercent: 50,
			pricingType: "ONE_TIME",
		});
		expect(price.serviceDiscount).toBe(100);
		expect(price.total).toBe(900);
		expect(price.dueNow).toBe(450);
		expect(price.remaining).toBe(450);
		expect(price.hasPartialPrePayment).toBe(true);
	});

	it("skips service discount for custom price", () => {
		const price = computeBookingPrice({
			unitPrice: 800,
			quantity: 1,
			discountRaw: "10",
			skipDiscount: true,
			prePaymentPercent: 40,
			pricingType: "ONE_TIME",
			deferPayment: true,
		});
		expect(price.serviceDiscount).toBe(0);
		expect(price.total).toBe(800);
		expect(price.dueNow).toBe(0);
		expect(price.remaining).toBe(800);
	});
});
