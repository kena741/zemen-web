import type { Metadata } from "next";

import { ServicesHubView } from "@/components/marketing/service-seo-pages";
import { buildPageMetadata } from "@/lib/seo-services";
import { fetchPublicCategories } from "@/services/catalog/publicCatalog";

export const metadata: Metadata = buildPageMetadata({
	title: "Home Services in Addis Ababa",
	description:
		"Browse trusted home service categories in Addis Ababa. Book cleaning, cooking, babysitting, plumbing, electrical, repairs, and more with Zemen Service.",
	path: "/services",
});

export const revalidate = 3600;

export default async function ServicesPage() {
	const categories = await fetchPublicCategories();
	return <ServicesHubView categories={categories} />;
}
