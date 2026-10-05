import type { RecurringCycle, RecurringPaymentSettings } from "./types.ts";

/** Ported from lib/recurring.ts — billing interval helpers for verify-payment. */

export const RECURRING_WEEK = "WEEK" as const;
export const RECURRING_MONTH = "MONTH" as const;
export const RECURRING_QUARTER = "QUARTER" as const;
export const RECURRING_YEAR = "YEAR" as const;

export const RECURRING_CYCLES: RecurringCycle[] = [
	RECURRING_WEEK,
	RECURRING_MONTH,
	RECURRING_QUARTER,
	RECURRING_YEAR,
];

export const RECURRING_PAYMENT_SETTINGS_DEFAULT: RecurringPaymentSettings = {
	enabled: true,
	availableCycles: [...RECURRING_CYCLES],
	paymentWindowDays: 3,
};

export function parseBillingCycle(
	raw: string | null | undefined,
): RecurringCycle | null {
	switch ((raw ?? "").trim().toUpperCase()) {
		case "WEEK":
		case "WEEKLY":
			return RECURRING_WEEK;
		case "MONTH":
		case "MONTHLY":
			return RECURRING_MONTH;
		case "QUARTER":
		case "QUARTERLY":
		case "EVERY_3_MONTHS":
			return RECURRING_QUARTER;
		case "YEAR":
		case "YEARLY":
		case "ANNUAL":
			return RECURRING_YEAR;
		default:
			return null;
	}
}

export function normalizeBillingInterval(
	raw: string | null | undefined,
): string {
	return parseBillingCycle(raw) ?? RECURRING_MONTH;
}

export function addBillingInterval(
	from: Date,
	interval: string | null | undefined,
	count = 1,
): Date {
	const n = count < 1 ? 1 : count;
	const base = new Date(from);
	switch (normalizeBillingInterval(interval)) {
		case RECURRING_WEEK:
			base.setDate(base.getDate() + 7 * n);
			return base;
		case RECURRING_QUARTER:
			base.setMonth(base.getMonth() + 3 * n);
			return base;
		case RECURRING_YEAR:
			base.setFullYear(base.getFullYear() + n);
			return base;
		default:
			base.setMonth(base.getMonth() + n);
			return base;
	}
}
