export interface BookingAddress {
	locality?: string | null;
	address?: string | null;
	landmark?: string | null;
	latitude?: number | null;
	longitude?: number | null;
}

export interface BookingServiceSummary {
	id: string;
	serviceName: string | null;
	price: string | null;
	duration: string | null;
	serviceImage: string[];
	pricingType?: string | null;
	billingInterval?: string | null;
	billingIntervalCount?: number | null;
	categoryName?: string | null;
	reviewCount?: number | null;
	reviewSum?: number | null;
}

export interface ExtraCharge {
	id: string | null;
	chargeDetail: string | null;
	extraCharge: string | null;
}

export interface ServiceProof {
	id: string | null;
	bookingId: string | null;
	title: string | null;
	description: string | null;
	image: string[];
}

export interface Booking {
	id: string;
	customerId: string | null;
	providerId: string | null;
	serviceId: string | null;
	handymanId: string | null;
	firstName: string | null;
	lastName: string | null;
	phoneNumber: string | null;
	bookingDate: string | null;
	startTime: string | null;
	endTime: string | null;
	otp: string | null;
	description: string | null;
	totalAmount: string | null;
	subTotal: string | null;
	quantity: string | null;
	reason: string | null;
	status: string | null;
	paymentType: string | null;
	paymentCompleted: boolean;
	providerMySelf: boolean;
	extraChargeAmount: string | null;
	extraCharge: ExtraCharge | null;
	serviceProof: ServiceProof | null;
	bookingAddress: BookingAddress | null;
	service: BookingServiceSummary | null;
	createdAt: string | null;
	currentPeriodStart: string | null;
	currentPeriodEnd: string | null;
	nextCycleDue: boolean;
}

function asString(value: unknown): string | null {
	if (value == null) return null;
	const s = String(value).trim();
	return s.length ? s : null;
}

function asBool(value: unknown, fallback = false): boolean {
	if (value == null) return fallback;
	return Boolean(value);
}

function parseAddress(raw: unknown): BookingAddress | null {
	if (raw == null) return null;
	let map: Record<string, unknown> | null = null;
	if (typeof raw === "object" && !Array.isArray(raw)) {
		map = raw as Record<string, unknown>;
	} else if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
		map = raw[0] as Record<string, unknown>;
	} else if (typeof raw === "string" && raw.trim()) {
		try {
			const parsed = JSON.parse(raw) as unknown;
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				map = parsed as Record<string, unknown>;
			}
		} catch {
			return { address: raw };
		}
	}
	if (!map) return null;
	return {
		locality: asString(map.locality ?? map.Locality),
		address: asString(map.address ?? map.Address),
		landmark: asString(map.landmark ?? map.Landmark),
		latitude:
			map.latitude != null
				? Number(map.latitude)
				: map.lat != null
					? Number(map.lat)
					: null,
		longitude:
			map.longitude != null
				? Number(map.longitude)
				: map.lng != null
					? Number(map.lng)
					: null,
	};
}

function parseService(
	raw: unknown,
	fallbackId: string | null,
): BookingServiceSummary | null {
	if (raw == null) {
		return fallbackId
			? {
					id: fallbackId,
					serviceName: null,
					price: null,
					duration: null,
					serviceImage: [],
				}
			: null;
	}

	let map: Record<string, unknown> | null = null;
	if (typeof raw === "object" && !Array.isArray(raw)) {
		map = raw as Record<string, unknown>;
	} else if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
		map = raw[0] as Record<string, unknown>;
	} else if (typeof raw === "string" && raw.trim()) {
		try {
			const parsed = JSON.parse(raw) as unknown;
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				map = parsed as Record<string, unknown>;
			}
		} catch {
			return null;
		}
	}
	if (!map) return null;

	const images = Array.isArray(map.serviceImage)
		? map.serviceImage.map(String).filter(Boolean)
		: [];

	const categoryRaw = map.categoryModel ?? map.category_model ?? map.category;
	const categoryMap =
		categoryRaw && typeof categoryRaw === "object" && !Array.isArray(categoryRaw)
			? (categoryRaw as Record<string, unknown>)
			: null;

	const reviewCount = Number(map.reviewCount ?? map.review_count);
	const reviewSum = Number(map.reviewSum ?? map.review_sum);

	return {
		id: asString(map.id) ?? fallbackId ?? "",
		serviceName: asString(map.serviceName),
		price: asString(map.price),
		duration: asString(map.duration),
		serviceImage: images,
		pricingType: asString(map.pricing_type ?? map.pricingType),
		billingInterval: asString(map.billing_interval ?? map.billingInterval),
		billingIntervalCount:
			Number(map.billing_interval_count ?? map.billingIntervalCount ?? 1) || 1,
		categoryName:
			asString(categoryMap?.categoryName ?? categoryMap?.category_name) ??
			asString(map.categoryName ?? map.category_name),
		reviewCount: Number.isFinite(reviewCount) ? reviewCount : null,
		reviewSum: Number.isFinite(reviewSum) ? reviewSum : null,
	};
}

function asObject(raw: unknown): Record<string, unknown> | null {
	if (raw == null) return null;
	if (typeof raw === "object" && !Array.isArray(raw)) {
		return raw as Record<string, unknown>;
	}
	if (typeof raw === "string" && raw.trim()) {
		try {
			const parsed = JSON.parse(raw) as unknown;
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				return parsed as Record<string, unknown>;
			}
		} catch {
			return null;
		}
	}
	return null;
}

function parseExtraCharge(raw: unknown): ExtraCharge | null {
	const map = asObject(raw);
	if (!map) return null;
	return {
		id: asString(map.id),
		chargeDetail: asString(map.chargeDetail),
		extraCharge: asString(map.extraCharge),
	};
}

function parseServiceProof(raw: unknown): ServiceProof | null {
	const map = asObject(raw);
	if (!map) return null;
	const images = Array.isArray(map.image)
		? map.image.map(String).filter(Boolean)
		: map.image != null
			? [String(map.image)].filter(Boolean)
			: [];
	return {
		id: asString(map.id),
		bookingId: asString(map.bookingId ?? map.booking_id),
		title: asString(map.title),
		description: asString(map.description),
		image: images,
	};
}

export function mapBookingRow(row: Record<string, unknown>): Booking {
	const serviceId = asString(row.serviceId ?? row.service_id);
	return {
		id: String(row.id ?? ""),
		customerId: asString(row.customerId ?? row.customer_id),
		providerId: asString(row.providerId ?? row.provider_id),
		serviceId,
		handymanId: asString(row.handymanId ?? row.handyman_id),
		firstName: asString(row.firstName),
		lastName: asString(row.lastName),
		phoneNumber: asString(row.phoneNumber),
		bookingDate: asString(row.bookingDate),
		startTime: asString(row.startTime),
		endTime: asString(row.endTime),
		otp: asString(row.otp),
		description: asString(row.description),
		totalAmount: asString(row.totalAmount),
		subTotal: asString(row.subTotal),
		quantity: asString(row.quantity),
		reason: asString(row.reason),
		status: asString(row.status),
		paymentType: asString(row.paymentType),
		paymentCompleted: asBool(row.paymentCompleted),
		providerMySelf: asBool(row.providerMySelf),
		extraChargeAmount: asString(row.extraChargeAmount),
		extraCharge: parseExtraCharge(row.extraChargeModel),
		serviceProof: parseServiceProof(
			row.service_proof ?? row.serviceProofModel,
		),
		bookingAddress: parseAddress(row.bookingAddress),
		service: parseService(row.serviceDetails, serviceId),
		createdAt: asString(row.createdAt),
		currentPeriodStart: asString(
			row.currentPeriodStart ?? row.current_period_start,
		),
		currentPeriodEnd: asString(row.currentPeriodEnd ?? row.current_period_end),
		nextCycleDue: asBool(row.nextCycleDue ?? row.next_cycle_due),
	};
}

export function customerDisplayName(booking: Booking): string {
	const parts = [booking.firstName, booking.lastName]
		.map((p) => p?.trim())
		.filter(Boolean);
	if (parts.length) return parts.join(" ");
	return "Customer";
}

export function formatAmount(
	amount: string | number | null | undefined,
): string {
	if (amount == null || amount === "") return "—";
	const n = Number(amount);
	if (Number.isNaN(n)) return String(amount);
	return `ETB ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatDateTime(iso: string | null | undefined): string {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}
