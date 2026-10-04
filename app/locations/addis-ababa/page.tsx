import type { Metadata } from "next";

import { LocationAddisView } from "@/components/marketing/service-seo-pages";
import { localBusinessJsonLd, JsonLd } from "@/components/marketing/seo-json-ld";
import { buildPageMetadata } from "@/lib/seo-services";
import {
	fetchPublicCategories,
	fetchPublicFeaturedServices,
} from "@/services/catalog/publicCatalog";

export const metadata: Metadata = buildPageMetadata({
	title: "Home Services in Addis Ababa",
	description:
		"Find trusted home service professionals in Addis Ababa. Book cleaning, cooking, babysitting, plumbing, electrical, and more with Zemen Service.",
	path: "/locations/addis-ababa",
});

export const revalidate = 3600;

export default async function AddisAbabaLocationPage() {
	const [categories, services] = await Promise.all([
		fetchPublicCategories(),
		fetchPublicFeaturedServices(8),
	]);

	return (
		<>
			<JsonLd data={localBusinessJsonLd()} />
			<LocationAddisView categories={categories} services={services} />
		</>
	);
}
