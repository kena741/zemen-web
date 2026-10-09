import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceSubCategoryView } from "@/components/marketing/service-seo-pages";
import {
	buildPageMetadata,
	getSubCategorySeoCopy,
} from "@/lib/seo-services";
import {
	fetchAllPublicSubCategoryParams,
	fetchPublicServicesBySubCategory,
	fetchPublicSubCategories,
	fetchPublicSubCategoryBySlugs,
} from "@/services/catalog/publicCatalog";

export const revalidate = 3600;

export async function generateStaticParams() {
	try {
		return await fetchAllPublicSubCategoryParams();
	} catch {
		return [];
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string; subSlug: string }>;
}): Promise<Metadata> {
	const { slug, subSlug } = await params;
	const match = await fetchPublicSubCategoryBySlugs(slug, subSlug);
	if (!match) {
		return {
			title: "Service not found",
			robots: { index: false, follow: false },
		};
	}
	const { category, subcategory } = match;
	const copy = getSubCategorySeoCopy(
		subcategory.subCategoryName,
		subcategory.slug,
		category.categoryName,
	);
	return buildPageMetadata({
		title: copy.title,
		description: copy.description,
		path: `/services/${category.slug}/${subcategory.slug}`,
	});
}

export default async function ServiceSubCategoryPage({
	params,
}: {
	params: Promise<{ slug: string; subSlug: string }>;
}) {
	const { slug, subSlug } = await params;
	const match = await fetchPublicSubCategoryBySlugs(slug, subSlug);
	if (!match) notFound();

	const { category, subcategory } = match;
	const [services, siblings] = await Promise.all([
		fetchPublicServicesBySubCategory(subcategory.id, 12),
		fetchPublicSubCategories(category.id, category.slug),
	]);
	const copy = getSubCategorySeoCopy(
		subcategory.subCategoryName,
		subcategory.slug,
		category.categoryName,
	);
	const relatedSubs = siblings
		.filter((item) => item.id !== subcategory.id)
		.slice(0, 8);

	return (
		<ServiceSubCategoryView
			category={category}
			subcategory={subcategory}
			copy={copy}
			services={services}
			relatedSubs={relatedSubs}
		/>
	);
}
