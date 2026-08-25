import { getSupabase } from "@/lib/supabase/client";
import { mapServiceRow, type ProviderService, type ServiceCategory } from "@/services/services/types";
import { fetchCategories, fetchSubCategories } from "@/services/services/servicesApi";

export type { ServiceCategory };
export { fetchCategories, fetchSubCategories };

export interface BannerItem {
	id: string;
	image: string | null;
	title: string | null;
	isActive: boolean;
}

function mapBanner(row: Record<string, unknown>): BannerItem {
	return {
		id: String(row.id ?? ""),
		image:
			row.image != null
				? String(row.image)
				: row.bannerImage != null
					? String(row.bannerImage)
					: null,
		title: row.title != null ? String(row.title) : null,
		isActive: row.isActive !== false && row.active !== false,
	};
}

async function hydrateProviders(
	services: ProviderService[],
): Promise<ProviderService[]> {
	const ids = [
		...new Set(services.map((s) => s.providerId).filter(Boolean)),
	] as string[];
	if (!ids.length) return services;

	const { data } = await getSupabase()
		.from("provider")
		.select("id, firstName, lastName, userName, profileImage")
		.in("id", ids);

	const byId = new Map<string, Record<string, unknown>>();
	for (const row of data ?? []) {
		byId.set(String((row as { id: string }).id), row as Record<string, unknown>);
	}

	return services.map((s) => {
		if (!s.providerId || !byId.has(s.providerId)) return s;
		const p = byId.get(s.providerId)!;
		const name =
			[p.firstName, p.lastName].filter(Boolean).join(" ").trim() ||
			(p.userName != null ? String(p.userName) : null);
		return {
			...s,
			providerName: name,
			providerImage:
				p.profileImage != null ? String(p.profileImage) : null,
		};
	});
}

export async function fetchCatalogServices(params?: {
	categoryId?: string;
	featuredOnly?: boolean;
	limit?: number;
	search?: string;
}): Promise<{ services: ProviderService[]; error: string | null }> {
	let query = getSupabase()
		.from("service")
		.select("*")
		.eq("status", true)
		.eq("approved", true)
		.order("createdAt", { ascending: false });

	if (params?.categoryId) {
		query = query.eq("categoryId", params.categoryId);
	}
	if (params?.featuredOnly) {
		query = query.eq("feature", true);
	}
	if (params?.limit) {
		query = query.limit(params.limit);
	}

	const { data, error } = await query;
	if (error) {
		console.error("fetchCatalogServices", error);
		return { services: [], error: error.message };
	}

	let services = (data ?? []).map((row) =>
		mapServiceRow(row as Record<string, unknown>),
	);

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

	services = await hydrateProviders(services);
	return { services, error: null };
}

export async function fetchCatalogServiceById(
	id: string,
): Promise<{ service: ProviderService | null; error: string | null }> {
	const { data, error } = await getSupabase()
		.from("service")
		.select("*")
		.eq("id", id)
		.maybeSingle();

	if (error) {
		console.error("fetchCatalogServiceById", error);
		return { service: null, error: error.message };
	}
	if (!data) return { service: null, error: "Service not found" };

	let service = mapServiceRow(data as Record<string, unknown>);
	[service] = await hydrateProviders([service]);
	return { service, error: null };
}

export async function fetchBanners(): Promise<{
	banners: BannerItem[];
	error: string | null;
}> {
	const { data, error } = await getSupabase()
		.from("banner")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) {
		console.error("fetchBanners", error);
		return { banners: [], error: error.message };
	}

	return {
		banners: (data ?? [])
			.map((row) => mapBanner(row as Record<string, unknown>))
			.filter((b) => b.isActive && b.image),
		error: null,
	};
}

export async function fetchFavoriteServices(
	userId: string,
): Promise<{ services: ProviderService[]; error: string | null }> {
	if (!userId) return { services: [], error: "Missing user id" };

	const { data, error } = await getSupabase()
		.from("service")
		.select("*")
		.eq("status", true)
		.eq("approved", true)
		.contains("likedUser", [userId]);

	if (error) {
		console.error("fetchFavoriteServices", error);
		return { services: [], error: error.message };
	}

	let services = (data ?? []).map((row) =>
		mapServiceRow(row as Record<string, unknown>),
	);
	services = await hydrateProviders(services);
	return { services, error: null };
}

export async function toggleServiceFavorite(params: {
	serviceId: string;
	userId: string;
	likedUser: string[];
}): Promise<{ likedUser: string[]; error: string | null }> {
	const set = new Set(params.likedUser);
	if (set.has(params.userId)) set.delete(params.userId);
	else set.add(params.userId);
	const next = [...set];

	const { error } = await getSupabase()
		.from("service")
		.update({ likedUser: next })
		.eq("id", params.serviceId);

	if (error) {
		console.error("toggleServiceFavorite", error);
		return { likedUser: params.likedUser, error: error.message };
	}
	return { likedUser: next, error: null };
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
