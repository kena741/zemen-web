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
	location?: { lat: number; lng: number } | null;
	description?: string;
	quantity: number;
	price: number;
	paymentType?: string;
	paymentCompleted?: boolean;
	/** Persist coupon snapshot when applied */
	coupon?: Record<string, unknown> | null;
	discount?: number | null;
	totalAmount?: number | null;
	postJob?: boolean;
};

export async function createCustomerBooking(
	input: CreateBookingInput,
): Promise<{ bookingId: string | null; error: string | null }> {
	const id = crypto.randomUUID();
	const otp = String(Math.floor(100000 + Math.random() * 900000));
	const subTotal = input.price * input.quantity;
	const discount = Number(input.discount ?? 0) || 0;
	const total =
		input.totalAmount != null
			? Number(input.totalAmount)
			: Math.max(0, subTotal - discount);
	const now = new Date().toISOString();

	const payload: Record<string, unknown> = {
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
		totalAmount: total,
		paymentType: input.paymentType || "cash",
		paymentCompleted: Boolean(input.paymentCompleted),
		description: input.description?.trim() || "",
		otp,
		bookingAddress: {
			address: input.address,
			...(input.location
				? { latitude: input.location.lat, longitude: input.location.lng }
				: {}),
		},
		createdAt: now,
		providerMySelf: false,
		postJob: Boolean(input.postJob),
	};
	if (input.coupon) payload.coupon = input.coupon;
	if (discount > 0) payload.discount = String(discount);

	const { error } = await getSupabase().from("booked_service").insert(payload);
	if (error) {
		console.error("createCustomerBooking", error);
		return { bookingId: null, error: error.message };
	}
	return { bookingId: id, error: null };
}

export async function payBookingWithWallet(params: {
	bookingId: string;
	customerId: string;
	amount: number;
	nextCycle?: boolean;
	billingInterval?: string | null;
	billingIntervalCount?: number | null;
}): Promise<{ ok: boolean; newBalance: number | null; error: string | null }> {
	const amount = Number(params.amount);
	if (Number.isNaN(amount) || amount < 0) {
		return { ok: false, newBalance: null, error: "Invalid amount." };
	}

	const supabase = getSupabase();
	const { data: customer, error: custErr } = await supabase
		.from("customer")
		.select("id, wallet_amount, walletAmount")
		.eq("id", params.customerId)
		.maybeSingle();

	if (custErr || !customer) {
		return {
			ok: false,
			newBalance: null,
			error: custErr?.message ?? "Customer not found.",
		};
	}

	const row = customer as Record<string, unknown>;
	const balance =
		Number(row.wallet_amount ?? row.walletAmount ?? 0) || 0;
	if (amount > 0 && balance < amount) {
		return {
			ok: false,
			newBalance: balance,
			error: "Wallet amount insufficient.",
		};
	}

	const newBalance = Math.round((balance - amount) * 100) / 100;
	const txId = crypto.randomUUID();
	const { error: txErr } = await supabase.from("wallet_transaction").insert({
		id: txId,
		amount: String(amount),
		createdDate: new Date().toISOString(),
		paymentType: "wallet",
		transactionId: params.bookingId,
		note: "Service fee debited",
		type: "customer",
		userId: params.customerId,
		isCredit: false,
	});

	if (txErr) {
		console.error("payBookingWithWallet tx", txErr);
		return { ok: false, newBalance: null, error: txErr.message };
	}

	const { error: walletErr } = await supabase
		.from("customer")
		.update({
			wallet_amount: String(newBalance),
			walletAmount: String(newBalance),
		})
		.eq("id", params.customerId);

	if (walletErr) {
		console.error("payBookingWithWallet wallet", walletErr);
		return {
			ok: false,
			newBalance: null,
			error: "Payment recorded but wallet update failed. Contact support.",
		};
	}

	if (params.nextCycle) {
		const { advanceRecurringBookingPeriodClient } = await import(
			"@/services/customer/recurringBookingsApi"
		);
		const advanced = await advanceRecurringBookingPeriodClient({
			bookingId: params.bookingId,
			billingInterval: params.billingInterval,
			billingIntervalCount: params.billingIntervalCount,
		});
		if (!advanced.ok) {
			return { ok: false, newBalance, error: advanced.error };
		}
		await supabase
			.from("booked_service")
			.update({ paymentType: "wallet" })
			.eq("id", params.bookingId);
	} else {
		const { error: bookErr } = await supabase
			.from("booked_service")
			.update({
				paymentCompleted: true,
				paymentType: "wallet",
			})
			.eq("id", params.bookingId);

		if (bookErr) {
			return { ok: false, newBalance: newBalance, error: bookErr.message };
		}
	}

	return { ok: true, newBalance, error: null };
}

export async function acceptJobBid(params: {
	jobId: string;
	providerId: string;
	bidPrice: string;
}): Promise<{ ok: boolean; error: string | null }> {
	const { error } = await getSupabase()
		.from("job_request")
		.update({
			accepted: true,
			providerId: params.providerId,
			bidPrice: params.bidPrice,
		})
		.eq("id", params.jobId);

	if (error) {
		console.error("acceptJobBid", error);
		return { ok: false, error: error.message };
	}
	return { ok: true, error: null };
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

export async function completeCustomerBooking(
	bookingId: string,
): Promise<{ ok: boolean; error: string | null }> {
	const { data } = await getSupabase().auth.getSession();
	const token = data.session?.access_token;
	if (!token) return { ok: false, error: "You must be signed in." };

	const res = await fetch("/api/bookings/complete", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ bookingId }),
	});
	const json = (await res.json()) as { ok?: boolean; error?: string };
	if (!res.ok || !json.ok) {
		return { ok: false, error: json.error || "Failed to complete booking." };
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
