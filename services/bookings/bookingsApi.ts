import { isUpcomingBooking } from "@/lib/booking-status";
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
		.select("id, serviceName, price, duration, serviceImage, categoryModel, subCategoryModel")
		.in("id", unique);

	if (error) {
		console.error("fetchServicesByIds", error);
		return map;
	}

	for (const row of data ?? []) {
		const r = row as Record<string, unknown>;
		const id = String(r.id ?? "");
		if (!id) continue;
		const categoryModel =
			r.categoryModel && typeof r.categoryModel === "object"
				? (r.categoryModel as Record<string, unknown>)
				: null;
		const subCategoryModel =
			r.subCategoryModel && typeof r.subCategoryModel === "object"
				? (r.subCategoryModel as Record<string, unknown>)
				: null;
		map.set(id, {
			id,
			serviceName: r.serviceName != null ? String(r.serviceName) : null,
			price: r.price != null ? String(r.price) : null,
			duration: r.duration != null ? String(r.duration) : null,
			serviceImage: Array.isArray(r.serviceImage)
				? r.serviceImage.map(String)
				: [],
			categoryName:
				categoryModel?.categoryName != null
					? String(categoryModel.categoryName)
					: null,
			subCategoryName:
				subCategoryModel?.subCategoryName != null
					? String(subCategoryModel.subCategoryName)
					: null,
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

export async function assignBookingWorker(params: {
	bookingId: string;
	providerMySelf: boolean;
	handymanId?: string | null;
}): Promise<{ ok: boolean; error: string | null }> {
	const payload: Record<string, unknown> = {
		status: "accepted",
		providerMySelf: params.providerMySelf,
		// DB column is snake_case (mobile writes handyman_id)
		handyman_id: params.providerMySelf ? null : (params.handymanId ?? null),
	};

	const { data, error } = await getSupabase()
		.from("booked_service")
		.update(payload)
		.eq("id", params.bookingId)
		.select("id")
		.maybeSingle();

	if (error) {
		console.error("assignBookingWorker", error);
		return { ok: false, error: error.message };
	}
	if (!data) {
		return { ok: false, error: "Assign failed. Check permissions." };
	}
	return { ok: true, error: null };
}

export async function updateBookingFields(params: {
	bookingId: string;
	fields: Record<string, unknown>;
}): Promise<{ ok: boolean; error: string | null }> {
	const { data, error } = await getSupabase()
		.from("booked_service")
		.update(params.fields)
		.eq("id", params.bookingId)
		.select("id")
		.maybeSingle();

	if (error) {
		console.error("updateBookingFields", error);
		return { ok: false, error: error.message };
	}
	if (!data) {
		return { ok: false, error: "Update failed. Check permissions." };
	}
	return { ok: true, error: null };
}

export async function saveBookingExtraCharge(params: {
	bookingId: string;
	detail: string;
	amount: string;
	existingId?: string | null;
}): Promise<{ ok: boolean; error: string | null }> {
	const amountNum = Number(params.amount);
	if (!params.detail.trim()) {
		return { ok: false, error: "Enter a charge detail." };
	}
	if (Number.isNaN(amountNum) || amountNum < 1) {
		return { ok: false, error: "Amount must be at least 1 ETB." };
	}
	const model = {
		id: params.existingId || crypto.randomUUID(),
		chargeDetail: params.detail.trim(),
		extraCharge: String(amountNum),
	};
	return updateBookingFields({
		bookingId: params.bookingId,
		fields: {
			extraChargeModel: model,
			extraChargeAmount: String(amountNum),
		},
	});
}

export async function saveBookingServiceProof(params: {
	bookingId: string;
	title: string;
	description: string;
	imageUrls: string[];
	existingId?: string | null;
}): Promise<{ ok: boolean; error: string | null }> {
	const title = params.title.trim();
	const description = params.description.trim();
	if (title.length < 3) {
		return { ok: false, error: "Proof title must be at least 3 characters." };
	}
	if (description.length < 10) {
		return {
			ok: false,
			error: "Proof description must be at least 10 characters.",
		};
	}
	const proof = {
		id: params.existingId || crypto.randomUUID(),
		bookingId: params.bookingId,
		title,
		description,
		image: params.imageUrls.slice(0, 5),
	};
	return updateBookingFields({
		bookingId: params.bookingId,
		fields: { service_proof: proof },
	});
}

export async function uploadProofImages(params: {
	authUserId: string;
	files: File[];
}): Promise<{ urls: string[]; error: string | null }> {
	const urls: string[] = [];
	const supabase = getSupabase();
	const bucket = "betegnabucket";

	for (const file of params.files) {
		const safeName = file.name.replace(/[^\w.\-]+/g, "_");
		const path = `serviceProof/${params.authUserId}/${Date.now()}_${safeName}`;
		const { error } = await supabase.storage
			.from(bucket)
			.upload(path, file, { upsert: true, contentType: file.type });
		if (error) {
			console.error("uploadProofImages", error);
			return { urls, error: error.message };
		}
		const { data } = supabase.storage.from(bucket).getPublicUrl(path);
		urls.push(data.publicUrl);
	}
	return { urls, error: null };
}

export async function fetchDashboardSnapshot(providerId: string): Promise<{
	pending: number;
	upcoming: Booking[];
	totalBookings: number;
	activeServices: number;
	completedThisMonth: number;
	revenueThisMonth: number;
	error: string | null;
}> {
	const empty = {
		pending: 0,
		upcoming: [] as Booking[],
		totalBookings: 0,
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

	const [bookingsRes, countRes, servicesRes, completedRes] = await Promise.all([
		getSupabase()
			.from("booked_service")
			.select("*")
			.eq("provider_id", providerId)
			.order("bookingDate", { ascending: true })
			.limit(200),
		getSupabase()
			.from("booked_service")
			.select("id", { count: "exact", head: true })
			.eq("provider_id", providerId),
		getSupabase()
			.from("service")
			.select("id, status, archived")
			.eq("provider_id", providerId),
		getSupabase()
			.from("booked_service")
			.select("totalAmount, createdAt, status")
			.eq("provider_id", providerId)
			.eq("status", "completed")
			.gte("createdAt", monthStart)
			.lt("createdAt", nextMonth),
	]);

	let servicesRows: Array<{
		id?: string;
		status?: boolean;
		archived?: boolean;
	}> = (servicesRes.data ?? []) as Array<{
		id?: string;
		status?: boolean;
		archived?: boolean;
	}>;
	let servicesError = servicesRes.error?.message ?? null;
	if (servicesRes.error) {
		const fallback = await getSupabase()
			.from("service")
			.select("id, status")
			.eq("provider_id", providerId);
		servicesRows = (fallback.data ?? []) as Array<{
			id?: string;
			status?: boolean;
			archived?: boolean;
		}>;
		servicesError = fallback.error?.message ?? null;
	}

	if (bookingsRes.error) {
		console.error("dashboard bookings", bookingsRes.error);
		return { ...empty, error: bookingsRes.error.message };
	}

	const bookings = (bookingsRes.data ?? []).map((row) =>
		mapBookingRow(row as Record<string, unknown>),
	);
	const pending = bookings.filter((b) => b.status === "pending").length;
	const nowMs = Date.now();
	// Upcoming: pending bookings scheduled for today or later
	const upcoming = bookings
		.filter((b) =>
			isUpcomingBooking({
				status: b.status,
				bookingDate: b.bookingDate,
				startTime: b.startTime,
				nowMs,
			}),
		)
		.slice(0, 8);

	const missingIds = upcoming
		.filter((b) => b.serviceId && !b.service?.serviceName)
		.map((b) => b.serviceId!);
	const servicesMap = await fetchServicesByIds(missingIds);
	const upcomingHydrated = attachServices(upcoming, servicesMap);

	const totalBookings = countRes.count ?? bookings.length;

	const activeServices = servicesRows.filter((s) => {
		const row = s as {
			status?: boolean;
			archived?: boolean;
			archive?: boolean;
		};
		const archived = row.archived === true || row.archive === true;
		return row.status !== false && !archived;
	}).length;

	const completedRows = completedRes.data ?? [];
	let revenueThisMonth = 0;
	for (const row of completedRows) {
		const amt = Number((row as { totalAmount?: unknown }).totalAmount ?? 0);
		if (!Number.isNaN(amt)) revenueThisMonth += amt;
	}

	return {
		pending,
		upcoming: upcomingHydrated,
		totalBookings,
		activeServices,
		completedThisMonth: completedRows.length,
		revenueThisMonth,
		error: servicesError ?? completedRes.error?.message ?? countRes.error?.message ?? null,
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

export async function fetchProviderCompletedPayments(
	providerId: string,
	authUserId?: string,
): Promise<{ bookings: Booking[]; todayTotal: number; error: string | null }> {
	if (!providerId) {
		return { bookings: [], todayTotal: 0, error: "Missing provider id" };
	}

	const hidden = new Set(["pending", "rejected", "cancelled", "canceled"]);

	const { data, error } = await getSupabase()
		.from("booked_service")
		.select("*")
		.eq("provider_id", providerId)
		.order("createdAt", { ascending: false });

	if (error) {
		console.error("fetchProviderCompletedPayments", error);
		return { bookings: [], todayTotal: 0, error: error.message };
	}

	let bookings = (data ?? [])
		.map((row) => mapBookingRow(row as Record<string, unknown>))
		.filter((b) => !hidden.has((b.status ?? "").trim().toLowerCase()));
	const missingIds = bookings
		.filter((b) => b.serviceId && !b.service?.serviceName)
		.map((b) => b.serviceId!);
	const services = await fetchServicesByIds(missingIds);
	bookings = attachServices(bookings, services);

	// Mobile: today's earning = provider wallet credits created today
	const ids = [...new Set([providerId, authUserId].filter(Boolean))] as string[];
	let todayTotal = 0;
	if (ids.length) {
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		const { data: txs } = await getSupabase()
			.from("wallet_transaction")
			.select("amount, isCredit, createdDate, type, userId")
			.in("userId", ids)
			.eq("type", "provider")
			.eq("isCredit", true)
			.gte("createdDate", start.toISOString());
		for (const row of txs ?? []) {
			const r = row as Record<string, unknown>;
			todayTotal += Number(r.amount ?? 0) || 0;
		}
	}

	return {
		bookings,
		todayTotal: Math.round(todayTotal * 100) / 100,
		error: null,
	};
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

