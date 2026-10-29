import type { Metadata } from "next";

import { LocationAddisView } from "@/components/marketing/service-seo-pages";
import { localBusinessJsonLd, JsonLd } from "@/components/marketing/seo-json-ld";
import { buildPageMetadata } from "@/lib/seo-services";
import {
	fetchPublicCategories,
	fetchPublicFeaturedServices,
} from "@/services/catalog/publicCatalog";

export const metadata: Metadata = buildPageMetadata({
	title: "Home Help Across Addis Ababa, Ethiopia",
	description:
		"Find premium, verified home service professionals across Addis Ababa, Ethiopia — Bole, CMC, Kazanchis, Sarbet, Ayat and beyond. Book cleaning, cooking, babysitting, plumbing, electrical, CCTV, movers, and more with Zemen Service.",
	path: "/locations/addis-ababa",
	keywords: [
		"home services Addis Ababa",
		"cleaning service Addis Ababa",
		"air conditioning repair service Addis Ababa",
		"AC repair Addis Ababa",
		"security camera Addis Ababa",
		"CCTV installation Addis Ababa",
		"movers Addis Ababa",
		"housemaid Addis Ababa",
		"plumber Addis Ababa",
	],
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
