"use client";

import { useLocale } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { normalizeBillingInterval, RECURRING_QUARTER, RECURRING_WEEK, RECURRING_YEAR } from "@/lib/recurring";

function intervalKey(interval?: string | null): MessageKey {
	switch (normalizeBillingInterval(interval)) {
		case RECURRING_WEEK:
			return "recurringWeekly";
		case RECURRING_QUARTER:
			return "recurringQuarterly";
		case RECURRING_YEAR:
			return "recurringYearly";
		default:
			return "recurringMonthly";
	}
}

export function RecurringBadge({
	interval,
	count,
}: {
	interval?: string | null;
	count?: number | null;
}) {
	const { t } = useLocale();
	const every =
		count && count > 1 ? ` · ${t("recurringEvery", { count })}` : "";
	return (
		<span className="inline-flex items-center rounded-full bg-accent-info-bg px-2 py-0.5 text-[11px] font-semibold text-accent-info">
			{t("recurringLabel")} {t(intervalKey(interval)).toLowerCase()}
			{every}
		</span>
	);
}
