export interface ProviderService {
	id: string;
	providerId: string | null;
	serviceName: string | null;
	categoryId: string | null;
	subCategoryId: string | null;
	categoryName: string | null;
	subCategoryName: string | null;
	type: string | null;
	serviceLocationMode: string | null;
	status: boolean;
	archived: boolean;
	approved: boolean | null;
	price: string | null;
	discount: string | null;
	description: string | null;
	duration: string | null;
	feature: boolean;
	featureRequestedStatus: string | null;
	featureRequestedAt: string | null;
	prePayment: boolean;
	prePaymentPercent: number | null;
	address: string | null;
	latitude: number | null;
	longitude: number | null;
	serviceImage: string[];
	likedUser: string[];
	reviewSum: string | null;
	reviewCount: string | null;
	allowsCustomOffer: boolean;
	createdAt: string | null;
	slug: string | null;
	providerName: string | null;
	providerImage: string | null;
	pricingType: string | null;
	billingInterval: string | null;
	billingIntervalCount: number;
}

export interface ServiceCategory {
	id: string;
	categoryName: string;
	image: string | null;
	active: boolean;
}

export interface ServiceSubCategory {
	id: string;
	categoryId: string;
	subCategoryName: string;
}

export interface ServiceFormInput {
	id?: string;
	providerId: string;
	serviceName: string;
	categoryId: string;
	subCategoryId: string;
	categoryName: string;
	subCategoryName: string;
	price: string;
	discount: string;
	description: string;
	address: string;
	latitude?: number | null;
	longitude?: number | null;
	status: boolean;
	existingImages: string[];
	/** New files to upload */
	newFiles: File[];
	createdAt?: string | null;
	slug?: string | null;
	reviewSum?: string | null;
	reviewCount?: string | null;
	feature?: boolean;
	likedUser?: unknown[];
	pricingType?: string;
	billingInterval?: string;
	billingIntervalCount?: number;
}

function asString(value: unknown): string | null {
	if (value == null) return null;
	const s = String(value).trim();
	return s.length ? s : null;
}

function asBool(value: unknown, fallback = false): boolean {
	if (value == null) return fallback;
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value !== 0;
	const s = String(value).trim().toLowerCase();
	if (s === "true" || s === "1" || s === "yes") return true;
	if (s === "false" || s === "0" || s === "no" || s === "") return false;
	return fallback;
}

function parsePricingType(row: Record<string, unknown>): string | null {
	const raw = asString(row.pricing_type ?? row.pricingType);
	const upper = (raw ?? "").toUpperCase();
	if (upper === "RECURRING" || upper === "ONE_TIME") return upper;
	if (asBool(row.is_recurring ?? row.isRecurring)) return "RECURRING";
	return upper || "ONE_TIME";
}

function parseLocation(raw: unknown): {
	latitude: number | null;
	longitude: number | null;
} {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		return { latitude: null, longitude: null };
	}
	const map = raw as Record<string, unknown>;
	const lat = map.latitude ?? map.lat;
	const lng = map.longitude ?? map.lng;
	return {
		latitude: lat != null && !Number.isNaN(Number(lat)) ? Number(lat) : null,
		longitude: lng != null && !Number.isNaN(Number(lng)) ? Number(lng) : null,
	};
}

export function mapServiceRow(row: Record<string, unknown>): ProviderService {
	const images = Array.isArray(row.serviceImage)
		? row.serviceImage.map(String).filter(Boolean)
		: [];
	const loc = parseLocation(row.location);
	const categoryModel =
		row.categoryModel && typeof row.categoryModel === "object"
			? (row.categoryModel as Record<string, unknown>)
			: null;
	const subCategoryModel =
		row.subCategoryModel && typeof row.subCategoryModel === "object"
			? (row.subCategoryModel as Record<string, unknown>)
			: null;

	return {
		id: String(row.id ?? ""),
		providerId: asString(row.providerId ?? row.provider_id),
		serviceName: asString(row.serviceName),
		categoryId: asString(row.categoryId),
		subCategoryId: asString(row.subCategoryId),
		categoryName: asString(categoryModel?.categoryName),
		subCategoryName: asString(subCategoryModel?.subCategoryName),
		type: asString(row.type),
		serviceLocationMode: asString(row.serviceLocationMode),
		status: asBool(row.status, true),
		archived: asBool(row.archived ?? row.archive, false),
		approved: row.approved == null ? null : Boolean(row.approved),
		price: asString(row.price),
		discount: asString(row.discount),
		description: asString(row.description),
		duration: asString(row.duration),
		feature: asBool(row.feature),
		featureRequestedStatus: asString(
			row.feature_requested_status ?? row.featureRequestedStatus,
		),
		featureRequestedAt: asString(
			row.feature_requested_at ?? row.featureRequestedAt,
		),
		prePayment: asBool(row.prePayment ?? row.pre_payment),
		prePaymentPercent: (() => {
			const n = Number(row.prePaymentPercent ?? row.pre_payment_percent);
			return Number.isFinite(n) ? n : null;
		})(),
		address: asString(row.address),
		latitude: loc.latitude,
		longitude: loc.longitude,
		serviceImage: images,
		likedUser: Array.isArray(row.likedUser)
			? row.likedUser.map(String).filter(Boolean)
			: [],
		reviewSum: asString(row.reviewSum ?? row.review_sum) ?? "0",
		reviewCount: asString(row.reviewCount ?? row.review_count) ?? "0",
		allowsCustomOffer: asBool(
			row.allows_custom_offer ?? row.allowsCustomOffer,
		),
		createdAt: asString(row.createdAt),
		slug: asString(row.slug),
		providerName: asString(
			(row.providerModel as Record<string, unknown> | undefined)?.userName ??
				(row.providerModel as Record<string, unknown> | undefined)?.firstName,
		),
		providerImage: asString(
			(row.providerModel as Record<string, unknown> | undefined)?.profileImage,
		),
		pricingType: parsePricingType(row),
		billingInterval: asString(row.billing_interval ?? row.billingInterval),
		billingIntervalCount:
			Number(row.billing_interval_count ?? row.billingIntervalCount ?? 1) || 1,
	};
}

export function generateServiceSlug(
	serviceName: string,
	categoryId: string,
	subCategoryId: string,
): string {
	const raw = `${serviceName} ${categoryId} ${subCategoryId}`
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-");
	return raw || "no-name";
}

export const SERVICE_CONSTRAINTS = {
	maxImages: 5,
	minPrice: 200,
	minDescription: 50,
	maxDescription: 2000,
	storageBucket: "betegnabucket",
} as const;
