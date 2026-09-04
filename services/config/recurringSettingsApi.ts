import { getSupabase } from "@/lib/supabase/client";
import {
	type RecurringPaymentSettings,
	parseRecurringPaymentSettings,
	RECURRING_PAYMENT_SETTINGS_DEFAULT,
} from "@/lib/recurring";

let cached: RecurringPaymentSettings | null = null;
let inflight: Promise<RecurringPaymentSettings> | null = null;

export async function fetchRecurringPaymentSettings(): Promise<RecurringPaymentSettings> {
	if (cached) return cached;
	if (inflight) return inflight;

	inflight = (async () => {
		try {
			const { data, error } = await getSupabase()
				.from("app_settings")
				.select("data, value")
				.eq("id", "constant")
				.maybeSingle();
			if (error || !data) {
				cached = RECURRING_PAYMENT_SETTINGS_DEFAULT;
				return cached;
			}
			const row = data as Record<string, unknown>;
			const map =
				(row.data as Record<string, unknown> | null) ??
				(typeof row.value === "object" && row.value
					? (row.value as Record<string, unknown>)
					: null);
			const raw = map?.recurring_payments ?? map?.recurringPayments;
			cached = parseRecurringPaymentSettings(raw);
			return cached;
		} catch {
			cached = RECURRING_PAYMENT_SETTINGS_DEFAULT;
			return cached;
		} finally {
			inflight = null;
		}
	})();

	return inflight;
}
