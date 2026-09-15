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
				.select("data")
				.eq("id", "constant")
				.maybeSingle();
			if (error || !data) {
				cached = RECURRING_PAYMENT_SETTINGS_DEFAULT;
				return cached;
			}
			const map = (data as { data?: unknown }).data;
			const root =
				map && typeof map === "object"
					? (map as Record<string, unknown>)
					: null;
			const raw = root?.recurring_payments ?? root?.recurringPayments;
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
