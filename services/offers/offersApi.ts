import { getSupabase } from "@/lib/supabase/client";
import { formatAmount } from "@/services/bookings/types";

export type ServiceOffer = {
	id: string;
	serviceId: string | null;
	customerId: string | null;
	providerId: string | null;
	offeredPrice: number | null;
	message: string | null;
	status: string;
	bookingId: string | null;
	serviceName: string | null;
	serviceImage: string | null;
	customerName: string | null;
	createdAt: string | null;
};

export function mapOffer(row: Record<string, unknown>): ServiceOffer {
	return {
		id: String(row.id ?? ""),
		serviceId:
			row.service_id != null
				? String(row.service_id)
				: row.serviceId != null
					? String(row.serviceId)
					: null,
		customerId:
			row.customer_id != null
				? String(row.customer_id)
				: row.customerId != null
					? String(row.customerId)
					: null,
		providerId:
			row.provider_id != null
				? String(row.provider_id)
				: row.providerId != null
					? String(row.providerId)
					: null,
		offeredPrice:
			row.offered_price != null
				? Number(row.offered_price)
				: row.offeredPrice != null
					? Number(row.offeredPrice)
					: null,
		message: row.message != null ? String(row.message) : null,
		status: String(row.status ?? "pending"),
		bookingId:
			row.booking_id != null
				? String(row.booking_id)
				: row.bookingId != null
					? String(row.bookingId)
					: null,
		serviceName:
			row.serviceName != null
				? String(row.serviceName)
				: row.service_name != null
					? String(row.service_name)
					: null,
		serviceImage:
			row.serviceImage != null
				? String(row.serviceImage)
				: row.service_image != null
					? String(row.service_image)
					: null,
		customerName:
			row.customerName != null
				? String(row.customerName)
				: row.customer_name != null
					? String(row.customer_name)
					: null,
		createdAt:
			row.created_at != null
				? String(row.created_at)
				: row.createdAt != null
					? String(row.createdAt)
					: null,
	};
}

export async function fetchProviderOffers(
	providerId: string,
	authUserId?: string,
): Promise<{ offers: ServiceOffer[]; error: string | null }> {
	if (!providerId && !authUserId) {
		return { offers: [], error: "Missing provider id" };
	}

	const ids = [...new Set([providerId, authUserId].filter(Boolean))] as string[];

	const { data, error } = await getSupabase()
		.from("service_offer")
		.select("*")
		.in("provider_id", ids)
		.order("created_at", { ascending: false });

	if (error) {
		// try camelCase column
		const retry = await getSupabase()
			.from("service_offer")
			.select("*")
			.in("providerId", ids)
			.order("createdAt", { ascending: false });
		if (retry.error) {
			console.error("fetchProviderOffers", error);
			return { offers: [], error: error.message };
		}
		return {
			offers: (retry.data ?? []).map((r) =>
				mapOffer(r as Record<string, unknown>),
			),
			error: null,
		};
	}

	const offers = (data ?? []).map((r) =>
		mapOffer(r as Record<string, unknown>),
	);

	// Hydrate service names / images
	const serviceIds = [
		...new Set(offers.map((o) => o.serviceId).filter(Boolean)),
	] as string[];
	if (serviceIds.length) {
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
	}

	return { offers, error: null };
}

export async function fetchOfferById(
	offerId: string,
): Promise<{ offer: ServiceOffer | null; error: string | null }> {
	if (!offerId) return { offer: null, error: "Missing offer id" };

	const { data, error } = await getSupabase()
		.from("service_offer")
		.select("*")
		.eq("id", offerId)
		.maybeSingle();

	if (error) {
		console.error("fetchOfferById", error);
		return { offer: null, error: error.message };
	}
	if (!data) return { offer: null, error: null };

	const offer = mapOffer(data as Record<string, unknown>);
	if (offer.serviceId) {
		const { data: service } = await getSupabase()
			.from("service")
			.select("id, serviceName, serviceImage")
			.eq("id", offer.serviceId)
			.maybeSingle();
		if (service) {
			const s = service as Record<string, unknown>;
			if (!offer.serviceName && s.serviceName != null) {
				offer.serviceName = String(s.serviceName);
			}
			if (
				!offer.serviceImage &&
				Array.isArray(s.serviceImage) &&
				s.serviceImage[0]
			) {
				offer.serviceImage = String(s.serviceImage[0]);
			}
		}
	}
	return { offer, error: null };
}

export async function respondToOffer(params: {
	offerId: string;
	accept: boolean;
}): Promise<{ ok: boolean; error: string | null }> {
	const { error } = await getSupabase()
		.from("service_offer")
		.update({
			status: params.accept ? "accepted" : "rejected",
			updated_at: new Date().toISOString(),
		})
		.eq("id", params.offerId)
		.eq("status", "pending");

	if (error) {
		console.error("respondToOffer", error);
		return { ok: false, error: error.message };
	}
	return { ok: true, error: null };
}

export function formatOfferPrice(price: number | null): string {
	if (price == null || Number.isNaN(price)) return "—";
	return formatAmount(String(price));
}
