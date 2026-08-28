import { getSupabase } from "@/lib/supabase/client";

export interface CustomerServiceDetail {
	id: string;
	customerServiceId: string;
	serviceName: string;
	description: string;
	price: number;
	categoryId: string | null;
	subCategoryId: string | null;
	serviceImages: string[];
}

async function ensureCustomerServiceParent(
	customerId: string,
): Promise<{ parentId: string | null; error: string | null }> {
	const { data: existing } = await getSupabase()
		.from("customers_service")
		.select("id")
		.eq("customer_id", customerId)
		.limit(1)
		.maybeSingle();

	if (existing?.id) return { parentId: String(existing.id), error: null };

	const { data: inserted, error } = await getSupabase()
		.from("customers_service")
		.insert({ customer_id: customerId })
		.select("id")
		.single();

	if (error || !inserted) {
		return { parentId: null, error: error?.message ?? "Could not create service list" };
	}
	return { parentId: String(inserted.id), error: null };
}

export async function fetchCustomerServiceDetails(
	customerId: string,
): Promise<{ services: CustomerServiceDetail[]; error: string | null }> {
	const parent = await ensureCustomerServiceParent(customerId);
	if (!parent.parentId) return { services: [], error: parent.error };

	const { data, error } = await getSupabase()
		.from("customer_service_details")
		.select("*")
		.eq("customer_service_id", parent.parentId)
		.order("create_at", { ascending: false });

	if (error) return { services: [], error: error.message };

	const services = (data ?? []).map((row) => {
		const r = row as Record<string, unknown>;
		const images = Array.isArray(r.service_images)
			? r.service_images.map(String)
			: [];
		return {
			id: String(r.id ?? ""),
			customerServiceId: String(r.customer_service_id ?? parent.parentId),
			serviceName: String(r.service_name ?? ""),
			description: String(r.description ?? ""),
			price: Number(r.price ?? 0) || 0,
			categoryId: r.category_id != null ? String(r.category_id) : null,
			subCategoryId: r.sub_category_id != null ? String(r.sub_category_id) : null,
			serviceImages: images,
		};
	});

	return { services, error: null };
}

export async function upsertCustomerServiceDetail(params: {
	customerId: string;
	id?: string;
	serviceName: string;
	description: string;
	price: number;
	categoryId?: string;
	subCategoryId?: string;
	serviceImages?: string[];
}): Promise<{ id: string | null; error: string | null }> {
	const parent = await ensureCustomerServiceParent(params.customerId);
	if (!parent.parentId) return { id: null, error: parent.error };

	const id = params.id?.trim() || crypto.randomUUID();
	const row: Record<string, unknown> = {
		id,
		customer_service_id: parent.parentId,
		service_name: params.serviceName.trim(),
		description: params.description.trim(),
		price: params.price,
		service_images: params.serviceImages ?? [],
		create_at: new Date().toISOString(),
	};
	if (params.categoryId) row.category_id = params.categoryId;
	if (params.subCategoryId) row.sub_category_id = params.subCategoryId;

	const { error } = await getSupabase()
		.from("customer_service_details")
		.upsert(row);

	if (error) return { id: null, error: error.message };
	return { id, error: null };
}

export async function deleteCustomerServiceDetail(
	id: string,
): Promise<{ ok: boolean; error: string | null }> {
	const { error } = await getSupabase()
		.from("customer_service_details")
		.delete()
		.eq("id", id);
	if (error) return { ok: false, error: error.message };
	return { ok: true, error: null };
}

export async function uploadCustomerServiceImage(params: {
	customerId: string;
	file: File;
}): Promise<{ url: string | null; error: string | null }> {
	const ext = params.file.name.split(".").pop() || "jpg";
	const path = `customer-services/${params.customerId}/${Date.now()}.${ext}`;
	const { error } = await getSupabase()
		.storage.from("betegnabucket")
		.upload(path, params.file, { upsert: true });
	if (error) return { url: null, error: error.message };

	const { data } = getSupabase().storage.from("betegnabucket").getPublicUrl(path);
	return { url: data.publicUrl, error: null };
}
