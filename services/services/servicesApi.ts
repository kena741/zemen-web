import { getSupabase } from "@/lib/supabase/client";
import {
	SERVICE_CONSTRAINTS,
	generateServiceSlug,
	mapServiceRow,
	type ProviderService,
	type ServiceCategory,
	type ServiceFormInput,
	type ServiceSubCategory,
} from "./types";

export async function fetchProviderServices(
	providerId: string,
): Promise<{ services: ProviderService[]; error: string | null }> {
	if (!providerId) {
		return { services: [], error: "Missing provider id" };
	}

	let { data, error } = await getSupabase()
		.from("service")
		.select("*")
		.eq("provider_id", providerId)
		.order("createdAt", { ascending: false });

	if (error) {
		console.error("fetchProviderServices provider_id", error);
		({ data, error } = await getSupabase()
			.from("service")
			.select("*")
			.eq("providerId", providerId)
			.order("createdAt", { ascending: false }));
	}

	if (error) {
		console.error("fetchProviderServices", error);
		return { services: [], error: error.message };
	}

	return {
		services: (data ?? []).map((row) =>
			mapServiceRow(row as Record<string, unknown>),
		),
		error: null,
	};
}

export async function fetchServiceById(
	id: string,
): Promise<{ service: ProviderService | null; error: string | null }> {
	if (!id) return { service: null, error: "Missing service id" };

	const { data, error } = await getSupabase()
		.from("service")
		.select("*")
		.eq("id", id)
		.maybeSingle();

	if (error) {
		console.error("fetchServiceById", error);
		return { service: null, error: error.message };
	}
	if (!data) return { service: null, error: "Service not found" };
	return {
		service: mapServiceRow(data as Record<string, unknown>),
		error: null,
	};
}

export async function setServiceActive(params: {
	serviceId: string;
	active: boolean;
}): Promise<{ ok: boolean; error: string | null }> {
	const payload = params.active
		? { status: true, archived: false }
		: { status: false, archived: false };

	let { data, error } = await getSupabase()
		.from("service")
		.update(payload)
		.eq("id", params.serviceId)
		.select("id")
		.maybeSingle();

	if (error) {
		const fallback = await getSupabase()
			.from("service")
			.update({ status: params.active })
			.eq("id", params.serviceId)
			.select("id")
			.maybeSingle();
		data = fallback.data;
		error = fallback.error;
	}

	if (error) {
		console.error("setServiceActive", error);
		return { ok: false, error: error.message };
	}
	if (!data) {
		return {
			ok: false,
			error: "Update failed. You may not have permission to change this service.",
		};
	}
	return { ok: true, error: null };
}

export async function fetchCategories(): Promise<{
	categories: ServiceCategory[];
	error: string | null;
}> {
	const { data, error } = await getSupabase()
		.from("category")
		.select("*")
		.eq("active", true)
		.order("categoryName", { ascending: true });

	if (error) {
		console.error("fetchCategories", error);
		return { categories: [], error: error.message };
	}

	return {
		categories: (data ?? []).map((row) => {
			const r = row as Record<string, unknown>;
			return {
				id: String(r.id ?? ""),
				categoryName: String(r.categoryName ?? "Category"),
				image: r.image != null ? String(r.image) : null,
				active: r.active !== false,
			};
		}),
		error: null,
	};
}

export async function fetchSubCategories(
	categoryId: string,
): Promise<{ subCategories: ServiceSubCategory[]; error: string | null }> {
	if (!categoryId) return { subCategories: [], error: null };

	const { data, error } = await getSupabase()
		.from("sub_category")
		.select("*")
		.eq("categoryId", categoryId)
		.order("subCategoryName", { ascending: true });

	if (error) {
		console.error("fetchSubCategories", error);
		return { subCategories: [], error: error.message };
	}

	return {
		subCategories: (data ?? []).map((row) => {
			const r = row as Record<string, unknown>;
			return {
				id: String(r.id ?? ""),
				categoryId: String(r.categoryId ?? categoryId),
				subCategoryName: String(r.subCategoryName ?? "Subcategory"),
			};
		}),
		error: null,
	};
}

export async function uploadServiceImages(params: {
	authUserId: string;
	files: File[];
}): Promise<{ urls: string[]; error: string | null }> {
	const urls: string[] = [];
	const supabase = getSupabase();

	for (const file of params.files) {
		const safeName = file.name.replace(/[^\w.\-]+/g, "_");
		const path = `serviceImages/${params.authUserId}/${Date.now()}_${safeName}`;
		const { error } = await supabase.storage
			.from(SERVICE_CONSTRAINTS.storageBucket)
			.upload(path, file, { upsert: true, contentType: file.type });

		if (error) {
			console.error("uploadServiceImages", error);
			return { urls, error: error.message };
		}

		const { data } = supabase.storage
			.from(SERVICE_CONSTRAINTS.storageBucket)
			.getPublicUrl(path);
		urls.push(data.publicUrl);
	}

	return { urls, error: null };
}

function validateServiceForm(input: ServiceFormInput): string | null {
	const name = input.serviceName.trim();
	if (!name) return "Service name is required.";
	if (!input.categoryId) return "Select a category.";
	if (!input.subCategoryId) return "Select a subcategory.";
	if (!input.address.trim()) return "Address is required.";

	const price = Number(input.price);
	if (!input.price.trim() || Number.isNaN(price)) {
		return "Enter a valid price.";
	}
	if (price < SERVICE_CONSTRAINTS.minPrice) {
		return `Price must be at least ${SERVICE_CONSTRAINTS.minPrice} ETB.`;
	}

	const discount = input.discount.trim();
	if (discount) {
		const d = Number(discount);
		if (
			Number.isNaN(d) ||
			d < SERVICE_CONSTRAINTS.minDiscount ||
			d > SERVICE_CONSTRAINTS.maxDiscount
		) {
			return `Discount must be between ${SERVICE_CONSTRAINTS.minDiscount} and ${SERVICE_CONSTRAINTS.maxDiscount}.`;
		}
	}

	if (input.prePayment && input.prePaymentPercent != null) {
		const pct = Number(input.prePaymentPercent);
		if (
			!(SERVICE_CONSTRAINTS.prePaymentPercents as readonly number[]).includes(
				pct,
			)
		) {
			return `Pre-payment must be ${SERVICE_CONSTRAINTS.prePaymentPercents.join(" or ")}%.`;
		}
	}

	const desc = input.description.trim();
	if (desc.length < SERVICE_CONSTRAINTS.minDescription) {
		return `Description must be at least ${SERVICE_CONSTRAINTS.minDescription} characters.`;
	}
	if (input.description.length > SERVICE_CONSTRAINTS.maxDescription) {
		return `Description must be at most ${SERVICE_CONSTRAINTS.maxDescription} characters.`;
	}

	const imageCount = input.existingImages.length + input.newFiles.length;
	if (imageCount < 1) return "Add at least one service image.";
	if (imageCount > SERVICE_CONSTRAINTS.maxImages) {
		return `Maximum ${SERVICE_CONSTRAINTS.maxImages} images allowed.`;
	}

	return null;
}

export async function upsertService(params: {
	authUserId: string;
	input: ServiceFormInput;
	isEdit: boolean;
}): Promise<{ serviceId: string | null; error: string | null }> {
	const validation = validateServiceForm(params.input);
	if (validation) return { serviceId: null, error: validation };

	const upload = await uploadServiceImages({
		authUserId: params.authUserId,
		files: params.input.newFiles,
	});
	if (upload.error) return { serviceId: null, error: upload.error };

	const serviceImages = [...params.input.existingImages, ...upload.urls];
	const id = params.input.id?.trim() || crypto.randomUUID();
	const lat = params.input.latitude ?? 0;
	const lng = params.input.longitude ?? 0;
	const slug =
		params.input.slug ||
		generateServiceSlug(
			params.input.serviceName,
			params.input.categoryId,
			params.input.subCategoryId,
		);

	const payload: Record<string, unknown> = {
		id,
		slug,
		provider_id: params.input.providerId,
		serviceName: params.input.serviceName.trim(),
		categoryId: params.input.categoryId,
		subCategoryId: params.input.subCategoryId,
		type: "Fixed",
		serviceLocationMode: "onsite",
		status: params.input.status,
		price: Number(params.input.price),
		address: params.input.address.trim(),
		discount: params.input.discount.trim() || "0",
		description: params.input.description.trim(),
		duration: "00:00",
		feature: params.input.feature ?? false,
		prePayment: params.input.prePayment ?? true,
		prePaymentPercent:
			params.input.prePaymentPercent != null
				? Number(params.input.prePaymentPercent)
				: 100,
		allows_custom_offer: Boolean(params.input.allowsCustomOffer),
		createdAt: params.input.createdAt || new Date().toISOString(),
		serviceImage: serviceImages,
		likedUser: params.input.likedUser ?? [],
		reviewSum: Number(params.input.reviewSum ?? 0) || 0,
		reviewCount: Number(params.input.reviewCount ?? 0) || 0,
		location: { latitude: lat, longitude: lng },
		position: {
			geohash: "",
			geopoint: { latitude: lat, longitude: lng },
		},
		categoryModel: {
			id: params.input.categoryId,
			categoryName: params.input.categoryName,
			image: "",
			active: true,
		},
		subCategoryModel: {
			id: params.input.subCategoryId,
			categoryId: params.input.categoryId,
			subCategoryName: params.input.subCategoryName,
		},
		pricing_type: params.input.pricingType ?? "ONE_TIME",
		billing_interval: params.input.billingInterval ?? "MONTH",
		billing_interval_count: params.input.billingIntervalCount ?? 1,
	};

	if (params.isEdit) {
		payload.approved = false;
	}

	const { error } = await getSupabase().from("service").upsert(payload);
	if (error) {
		console.error("upsertService", error);
		return { serviceId: null, error: error.message };
	}

	return { serviceId: id, error: null };
}

export async function deleteService(
	serviceId: string,
): Promise<{ ok: boolean; error: string | null }> {
	const { data, error } = await getSupabase()
		.from("service")
		.update({ status: false, archived: true })
		.eq("id", serviceId)
		.select("id")
		.maybeSingle();

	if (error) {
		const fallback = await getSupabase()
			.from("service")
			.update({ status: false })
			.eq("id", serviceId)
			.select("id")
			.maybeSingle();
		if (fallback.error || !fallback.data) {
			console.error("deleteService", error);
			return {
				ok: false,
				error: fallback.error?.message ?? error.message,
			};
		}
		// ponytail: no archived column yet — match mobile soft-delete via status=false
		return { ok: true, error: null };
	}
	if (!data) {
		return {
			ok: false,
			error: "Archive failed. You may not have permission to change this service.",
		};
	}
	return { ok: true, error: null };
}

export async function getFeaturedRequestFee(): Promise<{
	fee: number;
	error: string | null;
}> {
	const { data, error } = await getSupabase()
		.from("app_settings")
		.select("data")
		.eq("id", "constant")
		.maybeSingle();

	if (error) {
		console.error("getFeaturedRequestFee", error);
		return { fee: 0, error: error.message };
	}

	const rawData = data?.data;
	if (!rawData || typeof rawData !== "object") return { fee: 0, error: null };
	const map = rawData as Record<string, unknown>;
	const primary = String(
		map.provider_service_featured_request_fee_amount ?? "",
	).trim();
	const fallback = String(map.featured_price ?? "").trim();
	const raw = primary || fallback;
	const parsed = Number(raw);
	return {
		fee: !Number.isNaN(parsed) && parsed > 0 ? parsed : 0,
		error: null,
	};
}

export async function requestServiceFeatured(
	serviceId: string,
): Promise<{
	ok: boolean;
	error: string | null;
	fee: number;
	requiresPayment?: boolean;
}> {
	const feeRes = await getFeaturedRequestFee();
	if (feeRes.fee > 0) {
		return {
			ok: true,
			fee: feeRes.fee,
			requiresPayment: true,
			error: null,
		};
	}

	const { data, error } = await getSupabase()
		.from("service")
		.update({
			feature_requested_at: new Date().toISOString(),
			feature_requested_status: "pending",
		})
		.eq("id", serviceId)
		.select("id")
		.maybeSingle();

	if (error) {
		console.error("requestServiceFeatured", error);
		return { ok: false, error: error.message, fee: 0 };
	}
	if (!data) {
		return {
			ok: false,
			fee: 0,
			error: "Could not submit featured request.",
		};
	}
	return { ok: true, error: null, fee: 0 };
}
