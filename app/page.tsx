import type { Metadata } from "next";

import { LandingHeroImage } from "@/components/marketing/landing-hero-image";
import { LandingPage } from "@/components/marketing/landing-page";
import {
	buildOpenGraph,
	buildTwitter,
	SEO_DESCRIPTION,
	SEO_OG_DESCRIPTION,
	SEO_TITLE_DEFAULT,
	SEO_TWITTER_DESCRIPTION,
} from "@/lib/seo";
import { fetchPublicCategories } from "@/services/catalog/publicCatalog";

export const metadata: Metadata = {
	title: {
		absolute: SEO_TITLE_DEFAULT,
	},
	description: SEO_DESCRIPTION,
	alternates: {
		canonical: "/",
	},
	openGraph: buildOpenGraph({
		title: SEO_TITLE_DEFAULT,
		description: SEO_OG_DESCRIPTION,
		path: "https://www.zemenservice.com",
	}),
	twitter: buildTwitter({
		title: SEO_TITLE_DEFAULT,
		description: SEO_TWITTER_DESCRIPTION,
	}),
};

export const revalidate = 3600;

export default async function Home() {
	const categories = await fetchPublicCategories();

	return (
		<LandingPage
			heroImage={<LandingHeroImage />}
			initialCategories={categories.map((c) => ({
				id: c.id,
				categoryName: c.categoryName,
				image: c.image,
				active: c.active,
				slug: c.slug,
			}))}
		/>
	);
}
