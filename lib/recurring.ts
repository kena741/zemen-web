export const RECURRING_WEEK = "WEEK";
export const RECURRING_MONTH = "MONTH";
export const RECURRING_QUARTER = "QUARTER";
export const RECURRING_YEAR = "YEAR";

export function normalizeBillingInterval(raw: string | null | undefined): string {
	switch ((raw ?? "").trim().toUpperCase()) {
		case "WEEK":
		case "WEEKLY":
			return RECURRING_WEEK;
		case "QUARTER":
		case "QUARTERLY":
		case "EVERY_3_MONTHS":
			return RECURRING_QUARTER;
		case "YEAR":
		case "YEARLY":
		case "ANNUAL":
			return RECURRING_YEAR;
		default:
			return RECURRING_MONTH;
	}
}

export function billingIntervalLabel(raw: string | null | undefined): string {
	switch (normalizeBillingInterval(raw)) {
		case RECURRING_WEEK:
			return "Weekly";
		case RECURRING_QUARTER:
			return "Quarterly";
		case RECURRING_YEAR:
			return "Yearly";
		default:
			return "Monthly";
	}
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

export function isRecurringPricingType(raw: string | null | undefined): boolean {
	return (raw ?? "").trim().toUpperCase() === "RECURRING";
}
