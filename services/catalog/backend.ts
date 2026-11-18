import { apiFetch } from "@/lib/backend/client";
import { slugifyCategoryName } from "@/lib/seo-services";
import {
	mapServiceRow,
	type ProviderService,
	type ServiceCategory,
	type ServiceSubCategory,
} from "@/services/services/types";
import type { BannerItem } from "./types";

export type PublicCategory = import("@/services/services/types").ServiceCategory & {
	slug: string;
};

export type PublicSubCategory =
	import("@/services/services/types").ServiceSubCategory & {
		slug: string;
		categorySlug: string;
		listingSource?: { subCategoryId: string; keywords: string[] };
	};

type Page<T> = { items?: T[]; meta?: unknown };

export async function fetchCatalogServices(params?: {
	categoryId?: string;
	featuredOnly?: boolean;
	limit?: number;
	search?: string;
}): Promise<{ services: ProviderService[]; error: string | null }> {
	try {
		const page = await apiFetch<Page<Record<string, unknown>>>(
			"/catalog/services",
			{
				query: {
					category_id: params?.categoryId,
					feature: params?.featuredOnly ? true : undefined,
					limit: params?.limit ?? 40,
					search: params?.search,
					approved: true,
					status: true,
				},
			},
		);
		let services = (page.items ?? []).map((row) => mapServiceRow(row));
		if (params?.search?.trim()) {
			const q = params.search.trim().toLowerCase();
			services = services.filter(
				(s) =>
					s.serviceName?.toLowerCase().includes(q) ||
					s.categoryName?.toLowerCase().includes(q) ||
					s.subCategoryName?.toLowerCase().includes(q) ||
					s.description?.toLowerCase().includes(q),
			);
		}
		return { services, error: null };
	} catch (e) {
		return {
			services: [],
			error: e instanceof Error ? e.message : "Failed to load services",
		};
	}
}

export async function fetchCatalogServiceById(
	id: string,
): Promise<{ service: ProviderService | null; error: string | null }> {
	try {
		const row = await apiFetch<Record<string, unknown>>(
			`/catalog/services/${id}`,
		);
		return { service: mapServiceRow(row), error: null };
	} catch (e) {
		return {
			service: null,
			error: e instanceof Error ? e.message : "Service not found",
		};
	}
}

export async function fetchBanners(): Promise<{
	banners: BannerItem[];
	error: string | null;
}> {
	try {
		const rows = await apiFetch<Record<string, unknown>[]>("/config/banners");
		const banners = (rows ?? [])
			.map((row) => ({
				id: String(row.id ?? ""),
				image:
					row.image != null
						? String(row.image)
						: row.bannerImage != null
							? String(row.bannerImage)
							: null,
				title: row.title != null ? String(row.title) : null,
				isActive: row.isActive !== false && row.active !== false,
			}))
			.filter((b) => b.isActive && b.image);
		return { banners, error: null };
	} catch (e) {
		return {
			banners: [],
			error: e instanceof Error ? e.message : "Failed to load banners",
		};
	}
}

export async function fetchFavoriteServices(
	userId: string,
): Promise<{ services: ProviderService[]; error: string | null }> {
	if (!userId) return { services: [], error: "Missing user id" };
	try {
		const page = await apiFetch<Page<Record<string, unknown>>>(
			"/catalog/services",
			{ query: { liked_by: userId, approved: true, status: true }, auth: true },
		);
		return {
			services: (page.items ?? []).map((row) => mapServiceRow(row)),
			error: null,
		};
	} catch (e) {
		return {
			services: [],
			error: e instanceof Error ? e.message : "Failed to load favorites",
		};
	}
}

export async function toggleServiceFavorite(params: {
	serviceId: string;
	userId: string;
	likedUser: string[];
}): Promise<{ likedUser: string[]; error: string | null }> {
	const set = new Set(params.likedUser);
	const liked = set.has(params.userId);
	try {
		if (liked) {
			await apiFetch(`/catalog/services/${params.serviceId}/like`, {
				method: "DELETE",
				auth: true,
			});
			set.delete(params.userId);
		} else {
			await apiFetch(`/catalog/services/${params.serviceId}/like`, {
				method: "POST",
				auth: true,
			});
			set.add(params.userId);
		}
		return { likedUser: [...set], error: null };
	} catch (e) {
		return {
			likedUser: params.likedUser,
			error: e instanceof Error ? e.message : "Failed to update favorite",
		};
	}
}

export async function fetchCategories(): Promise<{
	categories: ServiceCategory[];
	error: string | null;
}> {
	try {
		const rows = await apiFetch<Record<string, unknown>[]>(
			"/catalog/categories",
		);
		return {
			categories: (rows ?? []).map((r) => ({
				id: String(r.id ?? ""),
				categoryName: String(r.categoryName ?? r.category_name ?? "Category"),
				image: r.image != null ? String(r.image) : null,
				active: r.active !== false,
			})),
			error: null,
		};
	} catch (e) {
		return {
			categories: [],
			error: e instanceof Error ? e.message : "Failed to load categories",
		};
	}
}

export async function fetchSubCategories(
	categoryId?: string,
): Promise<{ subCategories: ServiceSubCategory[]; error: string | null }> {
	try {
		const rows = await apiFetch<Record<string, unknown>[]>(
			"/catalog/sub-categories",
			{ query: { category_id: categoryId } },
		);
		return {
			subCategories: (rows ?? []).map((r) => ({
				id: String(r.id ?? ""),
				categoryId: String(r.categoryId ?? r.category_id ?? ""),
				subCategoryName: String(
					r.subCategoryName ?? r.sub_category_name ?? "",
				),
			})),
			error: null,
		};
	} catch (e) {
		return {
			subCategories: [],
			error: e instanceof Error ? e.message : "Failed to load subcategories",
		};
	}
}

export async function fetchHomeFeed(): Promise<{
	categories: ServiceCategory[];
	banners: BannerItem[];
	featured: ProviderService[];
	services: ProviderService[];
	error: string | null;
}> {
	const [cats, banners, featured, services] = await Promise.all([
		fetchCategories(),
		fetchBanners(),
		fetchCatalogServices({ featuredOnly: true, limit: 12 }),
		fetchCatalogServices({ limit: 40 }),
	]);
	return {
		categories: cats.categories,
		banners: banners.banners,
		featured: featured.services,
		services: services.services,
		error:
			cats.error ||
			banners.error ||
			featured.error ||
			services.error ||
			null,
	};
}

export async function fetchPublicCategories(): Promise<PublicCategory[]> {
	const { categories } = await fetchCategories();
	return categories
		.filter((c) => c.active)
		.map((c) => ({
			...c,
			slug: slugifyCategoryName(c.categoryName),
		}));
}

export async function fetchPublicCategoryBySlug(
	slug: string,
): Promise<PublicCategory | null> {
	const categories = await fetchPublicCategories();
	return categories.find((c) => c.slug === slug) ?? null;
}

export async function fetchPublicSubCategories(
	categoryId: string,
): Promise<PublicSubCategory[]> {
	const { subCategories } = await fetchSubCategories(categoryId);
	const cat = (await fetchPublicCategories()).find((c) => c.id === categoryId);
	return subCategories.map((s) => ({
		...s,
		slug: slugifyCategoryName(s.subCategoryName),
		categorySlug: cat?.slug ?? "",
	}));
}

export async function fetchPublicServices(params?: {
	categoryId?: string;
	subCategoryId?: string;
	limit?: number;
}): Promise<ProviderService[]> {
	const { services } = await fetchCatalogServices({
		categoryId: params?.categoryId,
		limit: params?.limit ?? 60,
	});
	if (params?.subCategoryId) {
		return services.filter((s) => s.subCategoryId === params.subCategoryId);
	}
	return services;
}
