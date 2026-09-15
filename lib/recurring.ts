export const RECURRING_WEEK = "WEEK";
export const RECURRING_MONTH = "MONTH";
export const RECURRING_QUARTER = "QUARTER";
export const RECURRING_YEAR = "YEAR";

export const RECURRING_CYCLES = [
	RECURRING_WEEK,
	RECURRING_MONTH,
	RECURRING_QUARTER,
	RECURRING_YEAR,
] as const;

export type RecurringCycle = (typeof RECURRING_CYCLES)[number];

export interface RecurringPaymentSettings {
	enabled: boolean;
	availableCycles: RecurringCycle[];
	paymentWindowDays: number;
}

export const RECURRING_PAYMENT_SETTINGS_DEFAULT: RecurringPaymentSettings = {
	enabled: true,
	availableCycles: [...RECURRING_CYCLES],
	paymentWindowDays: 3,
};

/** Provider-facing cycles only. Admin may also store MINUTE/HOUR for testing — those are ignored. */
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

export function parseRecurringPaymentSettings(
	raw: unknown,
): RecurringPaymentSettings {
	if (!raw || typeof raw !== "object") return RECURRING_PAYMENT_SETTINGS_DEFAULT;
	const map = raw as Record<string, unknown>;
	const enabled =
		map.enabled !== false && String(map.enabled).toLowerCase() !== "false";
	const cycles: RecurringCycle[] = [];
	const cyclesRaw = map.available_cycles ?? map.availableCycles;
	if (Array.isArray(cyclesRaw)) {
		for (const item of cyclesRaw) {
			const cycle = parseBillingCycle(String(item));
			if (cycle && !cycles.includes(cycle)) cycles.push(cycle);
		}
	}
	// Match mobile: empty or monthly-only seed → all provider cycles.
	if (
		cycles.length === 0 ||
		(cycles.length === 1 && cycles[0] === RECURRING_MONTH)
	) {
		return {
			enabled,
			availableCycles: [...RECURRING_CYCLES],
			paymentWindowDays: paymentWindowDaysFrom(map),
		};
	}
	return {
		enabled,
		availableCycles: cycles,
		paymentWindowDays: paymentWindowDaysFrom(map),
	};
}

function paymentWindowDaysFrom(map: Record<string, unknown>): number {
	const window =
		Number.parseInt(
			String(map.payment_window_days ?? map.paymentWindowDays ?? "3"),
			10,
		) || 3;
	return window > 0 ? window : 3;
}

export function normalizeBillingInterval(raw: string | null | undefined): string {
	return parseBillingCycle(raw) ?? RECURRING_MONTH;
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

export function periodNounKey(
	raw: string | null | undefined,
): "cyclePeriodWeek" | "cyclePeriodMonth" | "cyclePeriodQuarter" | "cyclePeriodYear" {
	switch (normalizeBillingInterval(raw)) {
		case RECURRING_WEEK:
			return "cyclePeriodWeek";
		case RECURRING_QUARTER:
			return "cyclePeriodQuarter";
		case RECURRING_YEAR:
			return "cyclePeriodYear";
		default:
			return "cyclePeriodMonth";
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

export function calendarDaysUntil(end: Date | string | null | undefined): number | null {
	if (!end) return null;
	const endDate = typeof end === "string" ? new Date(end) : end;
	if (Number.isNaN(endDate.getTime())) return null;
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const endDay = new Date(
		endDate.getFullYear(),
		endDate.getMonth(),
		endDate.getDate(),
	);
	return Math.round((endDay.getTime() - today.getTime()) / 86_400_000);
}

export function isRecurringPricingType(raw: string | null | undefined): boolean {
	return (raw ?? "").trim().toUpperCase() === "RECURRING";
}

/** Matches mobile ServiceModel.effectivePrePaymentPercent. */
export function effectivePrePaymentPercent(params: {
	pricingType?: string | null;
	prePaymentPercent?: number | null;
}): number {
	if (isRecurringPricingType(params.pricingType)) return 100;
	const pct = params.prePaymentPercent;
	if (pct == null || !Number.isFinite(pct) || pct <= 0) return 100;
	if (pct > 100) return 100;
	return pct;
}

export function dueNowAmount(params: {
	total: number;
	pricingType?: string | null;
	prePayment?: boolean;
	prePaymentPercent?: number | null;
}): number {
	const total = Math.max(0, params.total);
	if (total <= 0) return 0;
	if (isRecurringPricingType(params.pricingType)) return total;
	const pct = effectivePrePaymentPercent(params);
	return Math.round(((total * pct) / 100) * 100) / 100;
}

export function remainingAmount(total: number, dueNow: number): number {
	return Math.max(0, Math.round((total - dueNow) * 100) / 100);
}

export interface NextCycleDueInput {
	isRecurring: boolean;
	paymentCompleted: boolean;
	status?: string | null;
	nextCycleDue?: boolean;
	currentPeriodEnd?: string | null;
	paymentWindowDays?: number;
}

export function isNextCyclePaymentDue(input: NextCycleDueInput): boolean {
	if (!input.isRecurring || !input.paymentCompleted) return false;
	const status = (input.status ?? "").trim().toLowerCase();
	if (
		status === "rejected" ||
		status === "completed" ||
		status === "admin_paid" ||
		status === "cancelled" ||
		status === "canceled"
	) {
		return false;
	}
	if (input.nextCycleDue) return true;
	if (!input.currentPeriodEnd) return false;
	const end = new Date(input.currentPeriodEnd);
	if (Number.isNaN(end.getTime())) return false;
	const windowDays = Math.min(
		365,
		Math.max(0, input.paymentWindowDays ?? 3),
	);
	const reminderAt = new Date(end.getTime() - windowDays * 86_400_000);
	return Date.now() >= reminderAt.getTime();
}
