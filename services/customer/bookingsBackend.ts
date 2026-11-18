import { apiFetch } from "@/lib/backend/client";
import { getAccessToken } from "@/lib/auth/tokenStore";
import { mapBookingRow, type Booking } from "@/services/bookings/types";
import type { CreateBookingInput } from "./bookingsApi";

type Page<T> = { items?: T[] };

export async function fetchCustomerBookings(
	_customerId: string,
): Promise<{ bookings: Booking[]; error: string | null }> {
	try {
		const page = await apiFetch<
			Page<Record<string, unknown>> | Record<string, unknown>[]
		>("/bookings", { auth: true });
		const rows = Array.isArray(page) ? page : (page.items ?? []);
		return {
			bookings: rows.map((row) => mapBookingRow(row)),
			error: null,
		};
	} catch (e) {
		return {
			bookings: [],
			error: e instanceof Error ? e.message : "Failed to load bookings",
		};
	}
}

export async function fetchCustomerBookingById(
	id: string,
): Promise<{ booking: Booking | null; error: string | null }> {
	try {
		const row = await apiFetch<Record<string, unknown>>(`/bookings/${id}`, {
			auth: true,
		});
		return { booking: mapBookingRow(row), error: null };
	} catch (e) {
		return {
			booking: null,
			error: e instanceof Error ? e.message : "Booking not found",
		};
	}
}

export async function createCustomerBooking(
	input: CreateBookingInput,
): Promise<{ bookingId: string | null; error: string | null }> {
	try {
		const row = await apiFetch<Record<string, unknown>>("/bookings", {
			method: "POST",
			auth: true,
			body: {
				provider_id: input.providerId,
				service_id: input.serviceId,
				first_name: input.firstName,
				last_name: input.lastName,
				phone_number: input.phoneNumber,
				booking_date: input.bookingDate,
				start_time: input.startTime,
				quantity: input.quantity ?? 1,
				description: input.description ?? "",
				booking_address: input.address
					? { address: input.address, location: input.location ?? null }
					: null,
				payment_type: input.paymentType ?? null,
				price: input.price,
				payment_completed: input.paymentCompleted ?? false,
			},
		});
		return {
			bookingId: row.id != null ? String(row.id) : null,
			error: null,
		};
	} catch (e) {
		return {
			bookingId: null,
			error: e instanceof Error ? e.message : "Failed to create booking",
		};
	}
}

export async function cancelCustomerBooking(
	bookingId: string,
	reason?: string,
): Promise<{
	ok: boolean;
	newBalance: number | null;
	refunded: number;
	error: string | null;
}> {
	try {
		const row = await apiFetch<Record<string, unknown>>(
			`/bookings/${bookingId}/cancel`,
			{
				method: "POST",
				auth: true,
				body: { reason: reason ?? null },
			},
		);
		return {
			ok: true,
			newBalance:
				typeof row.newBalance === "number"
					? row.newBalance
					: typeof row.new_balance === "number"
						? row.new_balance
						: null,
			refunded: Number(row.refunded ?? 0) || 0,
			error: null,
		};
	} catch (e) {
		return {
			ok: false,
			newBalance: null,
			refunded: 0,
			error: e instanceof Error ? e.message : "Cancel failed",
		};
	}
}

export async function completeCustomerBooking(
	bookingId: string,
): Promise<{ ok: boolean; error: string | null }> {
	try {
		await apiFetch(`/bookings/${bookingId}/complete`, {
			method: "POST",
			auth: true,
			body: {},
		});
		return { ok: true, error: null };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Complete failed",
		};
	}
}

export async function fetchCustomerJobRequests(
	_customerId: string,
): Promise<{ jobs: Record<string, unknown>[]; error: string | null }> {
	try {
		const page = await apiFetch<
			Page<Record<string, unknown>> | Record<string, unknown>[]
		>("/jobs", { auth: true, query: { as: "customer" } });
		const rows = Array.isArray(page) ? page : (page.items ?? []);
		return { jobs: rows, error: null };
	} catch (e) {
		return {
			jobs: [],
			error: e instanceof Error ? e.message : "Failed to load jobs",
		};
	}
}

export async function createJobRequest(params: {
	customerId: string;
	title?: string;
	description?: string;
	categoryId?: string;
	[key: string]: unknown;
}): Promise<{ ok: boolean; error: string | null }> {
	try {
		await apiFetch("/jobs", {
			method: "POST",
			auth: true,
			body: params,
		});
		return { ok: true, error: null };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Failed to create job",
		};
	}
}

export async function deleteJobRequest(
	id: string,
): Promise<{ ok: boolean; error: string | null }> {
	try {
		await apiFetch(`/jobs/${id}`, { method: "DELETE", auth: true });
		return { ok: true, error: null };
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : "Delete failed",
		};
	}
}

/** Bearer for Next routes that still exist in hybrid mode. */
export function backendAccessToken(): string | null {
	return getAccessToken();
}
