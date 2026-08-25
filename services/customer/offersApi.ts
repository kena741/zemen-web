import { getSupabase } from "@/lib/supabase/client";
import {
	formatOfferPrice,
	mapOffer,
	type ServiceOffer,
} from "@/services/offers/offersApi";

export type { ServiceOffer };
export { formatOfferPrice };

async function hydrateOfferServices(
	offers: ServiceOffer[],
): Promise<ServiceOffer[]> {
	const serviceIds = [
		...new Set(offers.map((o) => o.serviceId).filter(Boolean)),
	] as string[];
	if (!serviceIds.length) return offers;

	const { data: services } = await getSupabase()
		.from("service")
		.select("id, serviceName, serviceImage")
		.in("id", serviceIds);
	const byId = new Map<string, Record<string, unknown>>();
	for (const s of services ?? []) {
		byId.set(String((s as { id: string }).id), s as Record<string, unknown>);
	}
	for (const o of offers) {
		if (!o.serviceId || !byId.has(o.serviceId)) continue;
		const s = byId.get(o.serviceId)!;
		if (!o.serviceName && s.serviceName != null) {
			o.serviceName = String(s.serviceName);
		}
		if (!o.serviceImage && Array.isArray(s.serviceImage) && s.serviceImage[0]) {
			o.serviceImage = String(s.serviceImage[0]);
		}
	}
	return offers;
}

export async function fetchCustomerOffers(
	customerId: string,
): Promise<{ offers: ServiceOffer[]; error: string | null }> {
	if (!customerId) return { offers: [], error: "Missing customer id" };

	const { data, error } = await getSupabase()
		.from("service_offer")
		.select("*")
		.eq("customer_id", customerId)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("fetchCustomerOffers", error);
		return { offers: [], error: error.message };
	}

	const offers = await hydrateOfferServices(
		(data ?? []).map((r) => mapOffer(r as Record<string, unknown>)),
	);
	return { offers, error: null };
}

export async function createCustomerServiceOffer(params: {
	customerId: string;
	serviceId: string;
	providerId: string;
	offeredPrice: number;
	bookingDate: string;
	address: string;
	description: string;
	message?: string;
}): Promise<{ offer: ServiceOffer | null; error: string | null }> {
	if (params.offeredPrice <= 0) {
		return { offer: null, error: "Custom price must be greater than zero." };
	}
	if (!params.description.trim()) {
		return { offer: null, error: "Description is required for a custom price." };
	}
	if (!params.address.trim()) {
		return { offer: null, error: "Address is required." };
	}

	const supabase = getSupabase();
	const { data: existing } = await supabase
		.from("service_offer")
		.select("id")
		.eq("customer_id", params.customerId)
		.eq("service_id", params.serviceId)
		.eq("provider_id", params.providerId)
		.eq("status", "pending")
		.maybeSingle();

	if (existing?.id) {
		return {
			offer: null,
			error: "You already have a pending custom price for this service.",
		};
	}

	const id = crypto.randomUUID();
	const now = new Date().toISOString();
	const payload = {
		id,
		service_id: params.serviceId,
		customer_id: params.customerId,
		provider_id: params.providerId,
		offered_price: params.offeredPrice,
		message: params.message?.trim() || null,
		booking_date: params.bookingDate,
		booking_address: { address: params.address.trim() },
		service_description: params.description.trim(),
		status: "pending",
		created_at: now,
		updated_at: now,
	};

	const { data, error } = await supabase
		.from("service_offer")
		.insert(payload)
		.select()
		.maybeSingle();

	if (error) {
		console.error("createCustomerServiceOffer", error);
		return { offer: null, error: error.message };
	}
	if (!data) return { offer: null, error: "Failed to create offer." };
	return {
		offer: mapOffer(data as Record<string, unknown>),
		error: null,
	};
}

export async function attachOfferToBooking(params: {
	offerId: string;
	bookingId: string;
}): Promise<{ ok: boolean; error: string | null }> {
	const supabase = getSupabase();
	const rpc = await supabase.rpc("attach_service_offer_booking", {
		p_offer_id: params.offerId,
		p_booking_id: params.bookingId,
	});
	if (!rpc.error) return { ok: true, error: null };

	const { error } = await supabase
		.from("service_offer")
		.update({
			booking_id: params.bookingId,
			updated_at: new Date().toISOString(),
		})
		.eq("id", params.offerId);

	if (error) {
		console.error("attachOfferToBooking", error, rpc.error);
		return { ok: false, error: error.message };
	}
	return { ok: true, error: null };
}

export async function cancelCustomerOffer(
	offerId: string,
): Promise<{ ok: boolean; error: string | null }> {
	const { error } = await getSupabase()
		.from("service_offer")
		.update({
			status: "cancelled",
			updated_at: new Date().toISOString(),
		})
		.eq("id", offerId)
		.eq("status", "pending");

	if (error) {
		console.error("cancelCustomerOffer", error);
		return { ok: false, error: error.message };
	}
	return { ok: true, error: null };
}

export async function fetchOfferByBookingId(
	bookingId: string,
): Promise<{ offer: ServiceOffer | null; error: string | null }> {
	const { data, error } = await getSupabase()
		.from("service_offer")
		.select("*")
		.eq("booking_id", bookingId)
		.maybeSingle();

	if (error) {
		console.error("fetchOfferByBookingId", error);
		return { offer: null, error: error.message };
	}
	if (!data) return { offer: null, error: null };
	return { offer: mapOffer(data as Record<string, unknown>), error: null };
}
