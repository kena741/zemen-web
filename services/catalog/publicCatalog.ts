import { getPublicSupabase } from "@/lib/supabase/public";
import { slugifyCategoryName } from "@/lib/seo-services";
import {
	mapServiceRow,
	type ProviderService,
	type ServiceCategory,
} from "@/services/services/types";

export type PublicCategory = ServiceCategory & { slug: string };

export async function fetchPublicCategories(): Promise<PublicCategory[]> {
	const { data, error } = await getPublicSupabase()
		.from("category")
		.select("*")
		.eq("active", true)
		.order("categoryName", { ascending: true });

	if (error) {
		console.error("fetchPublicCategories", error);
		return [];
	}

	return (data ?? []).map((row) => {
		const r = row as Record<string, unknown>;
		const categoryName = String(r.categoryName ?? "Category");
		return {
			id: String(r.id ?? ""),
			categoryName,
			image: r.image != null ? String(r.image) : null,
			active: r.active !== false,
			slug: slugifyCategoryName(categoryName),
		};
	});
}

export async function fetchPublicCategoryBySlug(
	slug: string,
): Promise<PublicCategory | null> {
	const categories = await fetchPublicCategories();
	return categories.find((c) => c.slug === slug) ?? null;
}

export async function fetchPublicServicesByCategory(
	categoryId: string,
	limit = 12,
): Promise<ProviderService[]> {
	const { data, error } = await getPublicSupabase()
		.from("service")
		.select("*")
		.eq("status", true)
		.eq("approved", true)
		.eq("categoryId", categoryId)
		.order("createdAt", { ascending: false })
		.limit(limit);

	if (error) {
		console.error("fetchPublicServicesByCategory", error);
		return [];
	}

	return (data ?? []).map((row) =>
		mapServiceRow(row as Record<string, unknown>),
	);
}

export async function fetchPublicFeaturedServices(
	limit = 8,
): Promise<ProviderService[]> {
	const { data, error } = await getPublicSupabase()
		.from("service")
		.select("*")
		.eq("status", true)
		.eq("approved", true)
		.order("createdAt", { ascending: false })
		.limit(limit);

	if (error) {
		console.error("fetchPublicFeaturedServices", error);
		return [];
	}

	return (data ?? []).map((row) =>
		mapServiceRow(row as Record<string, unknown>),
	);
}
