import type { MetadataRoute } from "next";

import { getMetadataBaseUrl } from "@/lib/seo";
import { fetchPublishedBlogSlugs } from "@/services/blog/publicBlog";
import {
	fetchAllPublicSubCategoryParams,
	fetchPublicCategories,
} from "@/services/catalog/publicCatalog";

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
			url: `${base}/blog`,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.75,
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
	let subcategoryRoutes: MetadataRoute.Sitemap = [];
	try {
		const categories = await fetchPublicCategories();
		categoryRoutes = categories.map((category) => ({
			url: `${base}/services/${category.slug}`,
			lastModified: now,
			changeFrequency: "weekly" as const,
			priority: 0.7,
		}));
		const pairs = await fetchAllPublicSubCategoryParams();
		subcategoryRoutes = pairs.map(({ slug, subSlug }) => ({
			url: `${base}/services/${slug}/${subSlug}`,
			lastModified: now,
			changeFrequency: "weekly" as const,
			priority: 0.65,
		}));
	} catch (error) {
		console.error("sitemap categories", error);
	}

	let blogRoutes: MetadataRoute.Sitemap = [];
	try {
		const posts = await fetchPublishedBlogSlugs();
		blogRoutes = posts.map((post) => ({
			url: `${base}/blog/${post.slug}`,
			lastModified: new Date(post.updatedAt),
			changeFrequency: "monthly" as const,
			priority: 0.6,
		}));
	} catch (error) {
		console.error("sitemap blog", error);
	}

	return [
		...staticRoutes,
		...categoryRoutes,
		...subcategoryRoutes,
		...blogRoutes,
	];
}
