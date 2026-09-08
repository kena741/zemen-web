import assert from "node:assert/strict";

import {
	dueNowAmount,
	effectivePrePaymentPercent,
	isRecurringPricingType,
} from "../lib/recurring";

assert.equal(isRecurringPricingType("RECURRING"), true);
assert.equal(isRecurringPricingType("ONE_TIME"), false);

assert.equal(
	effectivePrePaymentPercent({
		pricingType: "ONE_TIME",
		prePaymentPercent: 40,
	}),
	40,
);
assert.equal(
	effectivePrePaymentPercent({
		pricingType: "ONE_TIME",
		prePaymentPercent: null,
	}),
	100,
);
assert.equal(
	effectivePrePaymentPercent({
		pricingType: "RECURRING",
		prePaymentPercent: 40,
	}),
	100,
);

assert.equal(
	dueNowAmount({
		total: 200,
		pricingType: "ONE_TIME",
		prePayment: false,
		prePaymentPercent: 40,
	}),
	80,
);
assert.equal(
	dueNowAmount({
		total: 200,
		pricingType: "ONE_TIME",
		prePayment: true,
		prePaymentPercent: null,
	}),
	200,
);
assert.equal(
	dueNowAmount({
		total: 200,
		pricingType: "RECURRING",
		prePaymentPercent: 40,
	}),
	200,
);

console.log("recurring dueNow checks ok");
