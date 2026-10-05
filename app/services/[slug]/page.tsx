import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceCategoryView } from "@/components/marketing/service-seo-pages";
import {
	buildPageMetadata,
	getCategorySeoCopy,
} from "@/lib/seo-services";
import {
	fetchPublicCategories,
	fetchPublicCategoryBySlug,
	fetchPublicServicesByCategory,
} from "@/services/catalog/publicCatalog";

export async function generateStaticParams() {
	try {
		const categories = await fetchPublicCategories();
		return categories.map((category) => ({ slug: category.slug }));
	} catch {
		return [];
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const category = await fetchPublicCategoryBySlug(slug);
	if (!category) {
		return {
			title: "Service not found",
			robots: { index: false, follow: false },
		};
	}
	const copy = getCategorySeoCopy(category.categoryName, category.slug);
	return buildPageMetadata({
		title: copy.title,
		description: copy.description,
		path: `/services/${category.slug}`,
	});
}

export default async function ServiceCategoryPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const category = await fetchPublicCategoryBySlug(slug);
	if (!category) notFound();

	const [services, allCategories] = await Promise.all([
		fetchPublicServicesByCategory(category.id, 12),
		fetchPublicCategories(),
	]);
	const copy = getCategorySeoCopy(category.categoryName, category.slug);
	const related = allCategories
		.filter((item) => item.id !== category.id)
		.slice(0, 8);

	return (
		<ServiceCategoryView
			category={category}
			copy={copy}
			services={services}
			related={related}
		/>
	);
}
