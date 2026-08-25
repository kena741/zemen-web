import { getSupabase } from "@/lib/supabase/client";
import {
	mapBookingRow,
	type Booking,
} from "@/services/bookings/types";

async function attachServiceNames(bookings: Booking[]): Promise<Booking[]> {
	const ids = [
		...new Set(
			bookings
				.filter((b) => b.serviceId && !b.service?.serviceName)
				.map((b) => b.serviceId!),
		),
	];
	if (!ids.length) return bookings;

	const { data } = await getSupabase()
		.from("service")
		.select("id, serviceName, price, duration, serviceImage")
		.in("id", ids);

	const map = new Map<string, Booking["service"]>();
	for (const row of data ?? []) {
		const r = row as Record<string, unknown>;
		const id = String(r.id ?? "");
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

	return bookings.map((b) => {
		if (b.service?.serviceName || !b.serviceId || !map.has(b.serviceId)) {
			return b;
		}
		return { ...b, service: map.get(b.serviceId)! };
	});
}

export async function fetchCustomerBookings(
	customerId: string,
): Promise<{ bookings: Booking[]; error: string | null }> {
	if (!customerId) return { bookings: [], error: "Missing customer id" };

	const { data, error } = await getSupabase()
		.from("booked_service")
		.select("*")
		.eq("customer_id", customerId)
		.order("createdAt", { ascending: false });

	if (error) {
		console.error("fetchCustomerBookings", error);
		return { bookings: [], error: error.message };
	}

	const bookings = await attachServiceNames(
		(data ?? []).map((row) => mapBookingRow(row as Record<string, unknown>)),
	);
	return { bookings, error: null };
}

export async function fetchCustomerBookingById(
	id: string,
): Promise<{ booking: Booking | null; error: string | null }> {
	const { data, error } = await getSupabase()
		.from("booked_service")
		.select("*")
		.eq("id", id)
		.maybeSingle();

	if (error) {
		console.error("fetchCustomerBookingById", error);
		return { booking: null, error: error.message };
	}
	if (!data) return { booking: null, error: "Booking not found" };

	const [booking] = await attachServiceNames([
		mapBookingRow(data as Record<string, unknown>),
	]);
	return { booking, error: null };
}

export type CreateBookingInput = {
	customerId: string;
	providerId: string;
	serviceId: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	bookingDate: string;
	startTime: string;
	address: string;
	description?: string;
	quantity: number;
	price: number;
	paymentType?: string;
};

export async function createCustomerBooking(
	input: CreateBookingInput,
): Promise<{ bookingId: string | null; error: string | null }> {
	const id = crypto.randomUUID();
	const otp = String(Math.floor(1000 + Math.random() * 9000));
	const subTotal = input.price * input.quantity;
	const now = new Date().toISOString();

	const payload = {
		id,
		customer_id: input.customerId,
		provider_id: input.providerId,
		service_id: input.serviceId,
		firstName: input.firstName,
		lastName: input.lastName,
		phoneNumber: input.phoneNumber,
		bookingDate: input.bookingDate,
		startTime: input.startTime,
		status: "pending",
		quantity: input.quantity,
		subTotal,
		totalAmount: subTotal,
		paymentType: input.paymentType || "cash",
		paymentCompleted: false,
		description: input.description?.trim() || "",
		otp,
		bookingAddress: { address: input.address },
		createdAt: now,
		providerMySelf: false,
		postJob: false,
	};

	const { error } = await getSupabase().from("booked_service").insert(payload);
	if (error) {
		console.error("createCustomerBooking", error);
		return { bookingId: null, error: error.message };
	}
	return { bookingId: id, error: null };
}

export async function cancelCustomerBooking(
	bookingId: string,
): Promise<{ ok: boolean; error: string | null }> {
	const { error } = await getSupabase()
		.from("booked_service")
		.update({ status: "rejected", reason: "Cancelled by customer" })
		.eq("id", bookingId)
		.eq("status", "pending");

	if (error) {
		console.error("cancelCustomerBooking", error);
		return { ok: false, error: error.message };
	}
	return { ok: true, error: null };
}

export async function fetchCustomerJobRequests(
	customerId: string,
): Promise<{ jobs: Record<string, unknown>[]; error: string | null }> {
	const supabase = getSupabase();

	const primary = await supabase
		.from("job_request")
		.select("*")
		.eq("customerId", customerId)
		.order("createdAt", { ascending: false });

	if (!primary.error) {
		return { jobs: (primary.data ?? []) as Record<string, unknown>[], error: null };
	}

	const retry = await supabase
		.from("job_request")
		.select("*")
		.eq("customer_id", customerId)
		.order("createdAt", { ascending: false });

	if (retry.error) {
		console.error("fetchCustomerJobRequests", primary.error);
		return { jobs: [], error: primary.error.message };
	}
	return { jobs: (retry.data ?? []) as Record<string, unknown>[], error: null };
}

export async function createJobRequest(params: {
	customerId: string;
	title: string;
	description: string;
	price?: string;
}): Promise<{ id: string | null; error: string | null }> {
	const id = crypto.randomUUID();
	const payload = {
		id,
		customerId: params.customerId,
		title: params.title.trim(),
		description: params.description.trim(),
		price: params.price?.trim() || null,
		accepted: false,
		is_paid: false,
		createdAt: new Date().toISOString(),
		bidList: [],
	};

	const { error } = await getSupabase().from("job_request").insert(payload);
	if (error) {
		console.error("createJobRequest", error);
		return { id: null, error: error.message };
	}
	return { id, error: null };
}

export async function deleteJobRequest(
	id: string,
): Promise<{ ok: boolean; error: string | null }> {
	const { error } = await getSupabase().from("job_request").delete().eq("id", id);
	if (error) {
		console.error("deleteJobRequest", error);
		return { ok: false, error: error.message };
	}
	return { ok: true, error: null };
}
