import { getSupabase } from "@/lib/supabase/client";
import {
	mapBookingRow,
	type Booking,
	type BookingServiceSummary,
} from "./types";

async function fetchServicesByIds(
	ids: string[],
): Promise<Map<string, BookingServiceSummary>> {
	const unique = [...new Set(ids.filter(Boolean))];
	const map = new Map<string, BookingServiceSummary>();
	if (!unique.length) return map;

	const { data, error } = await getSupabase()
		.from("service")
		.select("id, serviceName, price, duration, serviceImage")
		.in("id", unique);

	if (error) {
		console.error("fetchServicesByIds", error);
		return map;
	}

	for (const row of data ?? []) {
		const r = row as Record<string, unknown>;
		const id = String(r.id ?? "");
		if (!id) continue;
		map.set(id, {
			id,
			serviceName: r.serviceName != null ? String(r.serviceName) : null,
			price: r.price != null ? String(r.price) : null,
			duration: r.duration != null ? String(r.duration) : null,
			serviceImage: Array.isArray(r.serviceImage)
				? r.serviceImage.map(String)
				: [],
		});
	}
	return map;
}

function attachServices(
	bookings: Booking[],
	services: Map<string, BookingServiceSummary>,
): Booking[] {
	return bookings.map((b) => {
		if (b.service?.serviceName) return b;
		const sid = b.serviceId;
		if (!sid || !services.has(sid)) return b;
		return { ...b, service: services.get(sid)! };
	});
}

export async function fetchProviderBookings(
	providerId: string,
): Promise<{ bookings: Booking[]; error: string | null }> {
	if (!providerId) {
		return { bookings: [], error: "Missing provider id" };
	}

	const { data, error } = await getSupabase()
		.from("booked_service")
		.select("*")
		.eq("provider_id", providerId)
		.order("createdAt", { ascending: false });

	if (error) {
		console.error("fetchProviderBookings", error);
		return { bookings: [], error: error.message };
	}

	const bookings = (data ?? []).map((row) =>
		mapBookingRow(row as Record<string, unknown>),
	);
	const missingIds = bookings
		.filter((b) => b.serviceId && !b.service?.serviceName)
		.map((b) => b.serviceId!);
	const services = await fetchServicesByIds(missingIds);

	return { bookings: attachServices(bookings, services), error: null };
}

export async function fetchBookingById(
	id: string,
): Promise<{ booking: Booking | null; error: string | null }> {
	if (!id) return { booking: null, error: "Missing booking id" };

	const { data, error } = await getSupabase()
		.from("booked_service")
		.select("*")
		.eq("id", id)
		.maybeSingle();

	if (error) {
		console.error("fetchBookingById", error);
		return { booking: null, error: error.message };
	}
	if (!data) return { booking: null, error: "Booking not found" };

	let booking = mapBookingRow(data as Record<string, unknown>);
	if (booking.serviceId && !booking.service?.serviceName) {
		const services = await fetchServicesByIds([booking.serviceId]);
		booking = attachServices([booking], services)[0];
	}
	return { booking, error: null };
}

export async function updateBookingStatus(params: {
	bookingId: string;
	status: string;
	reason?: string | null;
}): Promise<{ ok: boolean; error: string | null }> {
	const payload: Record<string, unknown> = { status: params.status };
	if (params.reason != null) payload.reason = params.reason;

	const { data, error } = await getSupabase()
		.from("booked_service")
		.update(payload)
		.eq("id", params.bookingId)
		.select("id")
		.maybeSingle();

	if (error) {
		console.error("updateBookingStatus", error);
		return { ok: false, error: error.message };
	}
	if (!data) {
		return {
			ok: false,
			error: "Update failed. You may not have permission to change this booking.",
		};
	}
	return { ok: true, error: null };
}

export async function fetchDashboardSnapshot(providerId: string): Promise<{
	pending: number;
	upcoming: Booking[];
	activeServices: number;
	completedThisMonth: number;
	revenueThisMonth: number;
	error: string | null;
}> {
	const empty = {
		pending: 0,
		upcoming: [] as Booking[],
		activeServices: 0,
		completedThisMonth: 0,
		revenueThisMonth: 0,
		error: null as string | null,
	};

	if (!providerId) return { ...empty, error: "Missing provider id" };

	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
	const nextMonth = new Date(
		now.getFullYear(),
		now.getMonth() + 1,
		1,
	).toISOString();

	const [bookingsRes, servicesRes, completedRes] = await Promise.all([
		getSupabase()
			.from("booked_service")
			.select("*")
			.eq("provider_id", providerId)
			.order("bookingDate", { ascending: true })
			.limit(200),
		getSupabase()
			.from("service")
			.select("id, status")
			.eq("provider_id", providerId),
		getSupabase()
			.from("booked_service")
			.select("totalAmount, createdAt, status")
			.eq("provider_id", providerId)
			.eq("status", "completed")
			.gte("createdAt", monthStart)
			.lt("createdAt", nextMonth),
	]);

	if (bookingsRes.error) {
		console.error("dashboard bookings", bookingsRes.error);
		return { ...empty, error: bookingsRes.error.message };
	}

	const bookings = (bookingsRes.data ?? []).map((row) =>
		mapBookingRow(row as Record<string, unknown>),
	);
	const pending = bookings.filter((b) => b.status === "pending").length;
	const activeStatuses = new Set([
		"pending",
		"accepted",
		"on_the_way",
		"in_progress",
		"hold",
	]);
	const upcoming = bookings
		.filter((b) => b.status != null && activeStatuses.has(b.status))
		.slice(0, 8);

	const missingIds = upcoming
		.filter((b) => b.serviceId && !b.service?.serviceName)
		.map((b) => b.serviceId!);
	const servicesMap = await fetchServicesByIds(missingIds);
	const upcomingHydrated = attachServices(upcoming, servicesMap);

	const activeServices = (servicesRes.data ?? []).filter(
		(s) => (s as { status?: boolean }).status !== false,
	).length;

	const completedRows = completedRes.data ?? [];
	let revenueThisMonth = 0;
	for (const row of completedRows) {
		const amt = Number((row as { totalAmount?: unknown }).totalAmount ?? 0);
		if (!Number.isNaN(amt)) revenueThisMonth += amt;
	}

	return {
		pending,
		upcoming: upcomingHydrated,
		activeServices,
		completedThisMonth: completedRows.length,
		revenueThisMonth,
		error: servicesRes.error?.message ?? completedRes.error?.message ?? null,
	};
}

export const MONTH_LABELS = [
	"JAN",
	"FEB",
	"MAR",
	"APR",
	"MAY",
	"JUN",
	"JUL",
	"AUG",
	"SEP",
	"OCT",
	"NOV",
	"DEC",
] as const;

export type RevenueChartPoint = {
	month: string;
	monthIndex: number;
	revenue: number;
};

function bookingEarningDate(booking: Booking): Date | null {
	const raw = booking.endTime ?? booking.createdAt ?? booking.bookingDate;
	if (!raw) return null;
	const d = new Date(raw);
	return Number.isNaN(d.getTime()) ? null : d;
}

function bookingEarningAmount(booking: Booking): number {
	const sub = Number(booking.subTotal ?? "");
	if (!Number.isNaN(sub) && booking.subTotal) return sub;
	const total = Number(booking.totalAmount ?? "");
	return Number.isNaN(total) ? 0 : total;
}

/** Completed bookings aggregated by calendar month for the current year (Flutter home chart). */
export async function fetchYearlyRevenueChart(
	providerId: string,
	year = new Date().getFullYear(),
): Promise<{
	points: RevenueChartPoint[];
	yearTotal: number;
	currentMonthRevenue: number;
	error: string | null;
}> {
	const emptyPoints: RevenueChartPoint[] = MONTH_LABELS.map((month, i) => ({
		month,
		monthIndex: i,
		revenue: 0,
	}));

	if (!providerId) {
		return {
			points: emptyPoints,
			yearTotal: 0,
			currentMonthRevenue: 0,
			error: "Missing provider id",
		};
	}

	const { data, error } = await getSupabase()
		.from("booked_service")
		.select("status, subTotal, totalAmount, endTime, createdAt, bookingDate")
		.eq("provider_id", providerId)
		.eq("status", "completed");

	if (error) {
		console.error("fetchYearlyRevenueChart", error);
		return {
			points: emptyPoints,
			yearTotal: 0,
			currentMonthRevenue: 0,
			error: error.message,
		};
	}

	const monthlyTotals = Array.from({ length: 12 }, () => 0);
	for (const row of data ?? []) {
		const booking = mapBookingRow(row as Record<string, unknown>);
		if (booking.status !== "completed") continue;
		const date = bookingEarningDate(booking);
		if (!date || date.getFullYear() !== year) continue;
		monthlyTotals[date.getMonth()] += bookingEarningAmount(booking);
	}

	const points = MONTH_LABELS.map((month, i) => ({
		month,
		monthIndex: i,
		revenue: Math.round(monthlyTotals[i]! * 100) / 100,
	}));
	const yearTotal = points.reduce((sum, p) => sum + p.revenue, 0);
	const currentMonthRevenue = points[new Date().getMonth()]?.revenue ?? 0;

	return { points, yearTotal, currentMonthRevenue, error: null };
}

