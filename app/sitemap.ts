import type { MetadataRoute } from "next";

import { getMetadataBaseUrl } from "@/lib/seo";
import { fetchPublicCategories } from "@/services/catalog/publicCatalog";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const base = getMetadataBaseUrl().origin;
	const now = new Date();

	const staticRoutes: MetadataRoute.Sitemap = [
		{
			url: base,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${base}/about`,
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${base}/services`,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${base}/locations/addis-ababa`,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${base}/legal/privacy`,
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${base}/legal/terms`,
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.3,
		},
	];

	let categoryRoutes: MetadataRoute.Sitemap = [];
	try {
		const categories = await fetchPublicCategories();
		categoryRoutes = categories.map((category) => ({
			url: `${base}/services/${category.slug}`,
			lastModified: now,
			changeFrequency: "weekly" as const,
			priority: 0.7,
		}));
	} catch (error) {
		console.error("sitemap categories", error);
	}

	return [...staticRoutes, ...categoryRoutes];
}
