import { getSupabase } from "@/lib/supabase/client";

export type ServiceReview = {
	id: string;
	rating: number;
	comment: string | null;
	customerId: string | null;
	customerName: string | null;
	bookingId: string | null;
	serviceId: string | null;
	date: string | null;
};

function mapReview(row: Record<string, unknown>): ServiceReview {
	return {
		id: String(row.id ?? ""),
		rating: Number(row.rating ?? 0) || 0,
		comment: row.comment != null ? String(row.comment) : null,
		customerId:
			row.customerId != null
				? String(row.customerId)
				: row.customer_id != null
					? String(row.customer_id)
					: null,
		customerName:
			row.customerName != null
				? String(row.customerName)
				: row.customer_name != null
					? String(row.customer_name)
					: null,
		bookingId:
			row.bookingId != null
				? String(row.bookingId)
				: row.booking_id != null
					? String(row.booking_id)
					: null,
		serviceId:
			row.serviceId != null
				? String(row.serviceId)
				: row.service_id != null
					? String(row.service_id)
					: null,
		date: row.date != null ? String(row.date) : null,
	};
}

export async function fetchServiceReviews(
	serviceId: string,
): Promise<{ reviews: ServiceReview[]; error: string | null }> {
	const { data, error } = await getSupabase()
		.from("review_customer")
		.select("*")
		.eq("serviceId", serviceId)
		.order("date", { ascending: false })
		.limit(50);

	let rows: Record<string, unknown>[] = [];
	if (error) {
		const retry = await getSupabase()
			.from("review_customer")
			.select("*")
			.eq("service_id", serviceId)
			.order("date", { ascending: false })
			.limit(50);
		if (retry.error) {
			console.error("fetchServiceReviews", error);
			return { reviews: [], error: error.message };
		}
		rows = (retry.data ?? []) as Record<string, unknown>[];
	} else {
		rows = (data ?? []) as Record<string, unknown>[];
	}

	const reviews = rows.map(mapReview);
	const ids = [
		...new Set(
			reviews
				.map((r) => r.customerId?.trim())
				.filter((id): id is string => Boolean(id)),
		),
	];
	const bookingIds = [
		...new Set(
			reviews
				.map((r) => r.bookingId?.trim())
				.filter((id): id is string => Boolean(id)),
		),
	];

	const nameById = new Map<string, string>();
	const nameByBookingId = new Map<string, string>();

	function personName(row: Record<string, unknown>): string {
		const first = String(row.first_name ?? row.firstName ?? "").trim();
		const last = String(row.last_name ?? row.lastName ?? "").trim();
		const full = String(row.fullName ?? row.full_name ?? "").trim();
		const userName = String(
			row.user_name ?? row.userName ?? "",
		).trim();
		return (
			full ||
			[first, last].filter(Boolean).join(" ").trim() ||
			userName
		);
	}

	function rememberCustomer(row: Record<string, unknown>) {
		const name = personName(row);
		if (!name) return;
		const id = String(row.id ?? "").trim();
		const userId = String(row.user_id ?? row.userId ?? "").trim();
		if (id) nameById.set(id, name);
		if (userId) nameById.set(userId, name);
	}

	if (ids.length > 0) {
		const byId = await getSupabase()
			.from("customer")
			.select("*")
			.in("id", ids);
		for (const row of byId.data ?? []) {
			rememberCustomer(row as Record<string, unknown>);
		}

		const missing = ids.filter((id) => !nameById.has(id));
		if (missing.length > 0) {
			const byUser = await getSupabase()
				.from("customer")
				.select("*")
				.in("user_id", missing);
			for (const row of byUser.data ?? []) {
				rememberCustomer(row as Record<string, unknown>);
			}
		}
	}

	// Booking rows are usually readable; use them when customer RLS hides names.
	const stillNeedBooking = reviews.some(
		(r) =>
			!(r.customerName?.trim() ||
				(r.customerId && nameById.get(r.customerId))),
	);
	if (stillNeedBooking && bookingIds.length > 0) {
		const { data: bookings } = await getSupabase()
			.from("booked_service")
			.select("id, firstName, lastName")
			.in("id", bookingIds);
		for (const row of bookings ?? []) {
			const b = row as Record<string, unknown>;
			const id = String(b.id ?? "").trim();
			const name = personName(b);
			if (id && name) nameByBookingId.set(id, name);
		}
	}

	return {
		reviews: reviews.map((r) => {
			const fromCustomer =
				r.customerName?.trim() ||
				(r.customerId ? nameById.get(r.customerId) : null) ||
				null;
			const fromBooking = r.bookingId
				? nameByBookingId.get(r.bookingId) ?? null
				: null;
			return {
				...r,
				customerName: fromCustomer || fromBooking,
			};
		}),
		error: null,
	};
}

export async function fetchReviewForBooking(
	bookingId: string,
): Promise<{ review: ServiceReview | null; error: string | null }> {
	const { data, error } = await getSupabase()
		.from("review_customer")
		.select("*")
		.eq("bookingId", bookingId)
		.maybeSingle();

	if (error) {
		const retry = await getSupabase()
			.from("review_customer")
			.select("*")
			.eq("booking_id", bookingId)
			.maybeSingle();
		if (retry.error) {
			return { review: null, error: error.message };
		}
		return {
			review: retry.data
				? mapReview(retry.data as Record<string, unknown>)
				: null,
			error: null,
		};
	}
	return {
		review: data ? mapReview(data as Record<string, unknown>) : null,
		error: null,
	};
}

export async function submitServiceReview(params: {
	customerId: string;
	bookingId: string;
	serviceId: string;
	rating: number;
	comment: string;
	customerName?: string | null;
}): Promise<{ ok: boolean; error: string | null }> {
	const rating = Math.min(5, Math.max(1, Math.round(params.rating)));
	const id = crypto.randomUUID();
	const payload: Record<string, unknown> = {
		id,
		rating: String(rating),
		comment: params.comment.trim(),
		customerId: params.customerId,
		bookingId: params.bookingId,
		serviceId: params.serviceId,
		date: new Date().toISOString(),
	};
	if (params.customerName?.trim()) {
		payload.customerName = params.customerName.trim();
	}

	const existing = await fetchReviewForBooking(params.bookingId);
	const supabase = getSupabase();

	if (existing.review) {
		const { error } = await supabase
			.from("review_customer")
			.update({
				rating: String(rating),
				comment: params.comment.trim(),
				date: new Date().toISOString(),
			})
			.eq("id", existing.review.id);
		if (error) return { ok: false, error: error.message };

		const delta = rating - existing.review.rating;
		await bumpServiceRating({
			serviceId: params.serviceId,
			sumDelta: delta,
			countDelta: 0,
		});
		return { ok: true, error: null };
	}

	const { error } = await supabase.from("review_customer").insert(payload);
	if (error) {
		console.error("submitServiceReview", error);
		return { ok: false, error: error.message };
	}

	await bumpServiceRating({
		serviceId: params.serviceId,
		sumDelta: rating,
		countDelta: 1,
	});
	return { ok: true, error: null };
}

async function bumpServiceRating(params: {
	serviceId: string;
	sumDelta: number;
	countDelta: number;
}) {
	const { data } = await getSupabase()
		.from("service")
		.select("reviewSum, reviewCount")
		.eq("id", params.serviceId)
		.maybeSingle();
	if (!data) return;
	const sum = Number((data as { reviewSum?: unknown }).reviewSum ?? 0) || 0;
	const count =
		Number((data as { reviewCount?: unknown }).reviewCount ?? 0) || 0;
	await getSupabase()
		.from("service")
		.update({
			reviewSum: String(sum + params.sumDelta),
			reviewCount: String(count + params.countDelta),
		})
		.eq("id", params.serviceId);
}
