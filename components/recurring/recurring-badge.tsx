"use client";

import { useLocale } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";
import {
	normalizeBillingInterval,
	RECURRING_QUARTER,
	RECURRING_WEEK,
	RECURRING_YEAR,
} from "@/lib/recurring";
import { cn } from "@/lib/utils";

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
	className,
}: {
	interval?: string | null;
	count?: number | null;
	className?: string;
}) {
	const { t } = useLocale();
	const every =
		count && count > 1 ? ` · ${t("recurringEvery", { count })}` : "";
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border border-primary/25 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary backdrop-blur-[2px]",
				className,
			)}
		>
			{t("recurringLabel")} {t(intervalKey(interval)).toLowerCase()}
			{every}
		</span>
	);
}
