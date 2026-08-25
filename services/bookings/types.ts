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
	bookingAddress: BookingAddress | null;
	service: BookingServiceSummary | null;
	createdAt: string | null;
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

	return {
		id: asString(map.id) ?? fallbackId ?? "",
		serviceName: asString(map.serviceName),
		price: asString(map.price),
		duration: asString(map.duration),
		serviceImage: images,
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
		bookingAddress: parseAddress(row.bookingAddress),
		service: parseService(row.serviceDetails, serviceId),
		createdAt: asString(row.createdAt),
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
