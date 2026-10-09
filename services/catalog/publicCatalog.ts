import { getPublicSupabase } from "@/lib/supabase/public";
import { slugifyCategoryName } from "@/lib/seo-services";
import {
	mapServiceRow,
	type ProviderService,
	type ServiceCategory,
	type ServiceSubCategory,
} from "@/services/services/types";

export type PublicCategory = ServiceCategory & { slug: string };

export type PublicSubCategory = ServiceSubCategory & {
	slug: string;
	categorySlug: string;
};

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

export async function fetchPublicSubCategories(
	categoryId: string,
	categorySlug: string,
): Promise<PublicSubCategory[]> {
	if (!categoryId) return [];

	const { data, error } = await getPublicSupabase()
		.from("sub_category")
		.select("*")
		.eq("categoryId", categoryId)
		.order("subCategoryName", { ascending: true });

	if (error) {
		console.error("fetchPublicSubCategories", error);
		return [];
	}

	return (data ?? []).map((row) => {
		const r = row as Record<string, unknown>;
		const subCategoryName = String(r.subCategoryName ?? "Subcategory");
		return {
			id: String(r.id ?? ""),
			categoryId: String(r.categoryId ?? categoryId),
			subCategoryName,
			slug: slugifyCategoryName(subCategoryName),
			categorySlug,
		};
	});
}

export async function fetchPublicSubCategoryBySlugs(
	categorySlug: string,
	subSlug: string,
): Promise<{ category: PublicCategory; subcategory: PublicSubCategory } | null> {
	const category = await fetchPublicCategoryBySlug(categorySlug);
	if (!category) return null;

	const subcategories = await fetchPublicSubCategories(
		category.id,
		category.slug,
	);
	const subcategory = subcategories.find((item) => item.slug === subSlug);
	if (!subcategory) return null;

	return { category, subcategory };
}

export async function fetchAllPublicSubCategoryParams(): Promise<
	{ slug: string; subSlug: string }[]
> {
	const categories = await fetchPublicCategories();
	const pairs: { slug: string; subSlug: string }[] = [];

	await Promise.all(
		categories.map(async (category) => {
			const subs = await fetchPublicSubCategories(category.id, category.slug);
			for (const sub of subs) {
				pairs.push({ slug: category.slug, subSlug: sub.slug });
			}
		}),
	);

	return pairs;
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

export async function fetchPublicServicesBySubCategory(
	subCategoryId: string,
	limit = 12,
): Promise<ProviderService[]> {
	if (!subCategoryId) return [];

	const { data, error } = await getPublicSupabase()
		.from("service")
		.select("*")
		.eq("status", true)
		.eq("approved", true)
		.eq("subCategoryId", subCategoryId)
		.order("createdAt", { ascending: false })
		.limit(limit);

	if (error) {
		console.error("fetchPublicServicesBySubCategory", error);
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
