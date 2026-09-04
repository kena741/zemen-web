import { addBillingInterval } from "@/lib/recurring";
import { getSupabase } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

async function advanceWithClient(
	client: SupabaseClient,
	params: {
		bookingId: string;
		billingInterval?: string | null;
		billingIntervalCount?: number | null;
	},
): Promise<{ ok: boolean; error: string | null }> {
	const { data, error } = await client
		.from("booked_service")
		.select(
			"currentPeriodStart, currentPeriodEnd, current_period_start, current_period_end",
		)
		.eq("id", params.bookingId)
		.maybeSingle();

	if (error || !data) {
		return { ok: false, error: error?.message ?? "Booking not found" };
	}

	const row = data as Record<string, unknown>;
	const periodEndRaw =
		row.currentPeriodEnd ?? row.current_period_end ?? row.currentPeriodStart;
	const oldEnd = periodEndRaw ? new Date(String(periodEndRaw)) : new Date();
	const nextStart = oldEnd;
	const nextEnd = addBillingInterval(
		nextStart,
		params.billingInterval,
		params.billingIntervalCount ?? 1,
	);

	const { error: updateErr } = await client
		.from("booked_service")
		.update({
			currentPeriodStart: nextStart.toISOString(),
			currentPeriodEnd: nextEnd.toISOString(),
			nextCycleDue: false,
			nextCycleNotifiedAt: null,
			paymentCompleted: true,
		})
		.eq("id", params.bookingId);

	if (updateErr) return { ok: false, error: updateErr.message };
	return { ok: true, error: null };
}

export async function advanceRecurringBookingPeriod(params: {
	admin: SupabaseClient;
	bookingId: string;
	billingInterval?: string | null;
	billingIntervalCount?: number | null;
}): Promise<{ ok: boolean; error: string | null }> {
	return advanceWithClient(params.admin, params);
}

export async function advanceRecurringBookingPeriodClient(params: {
	bookingId: string;
	billingInterval?: string | null;
	billingIntervalCount?: number | null;
}): Promise<{ ok: boolean; error: string | null }> {
	return advanceWithClient(getSupabase(), params);
}
