import type { Metadata } from "next";

import { AboutPage } from "@/components/marketing/about-page";
import { BRAND_NAME } from "@/lib/brand";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";

const ABOUT_TITLE = `About ${BRAND_NAME} | Premium Home Services in Addis Ababa`;
const ABOUT_DESCRIPTION = `Learn about ${BRAND_NAME}: premium, vetted home services in Addis Ababa, Ethiopia, our mission, and how we build trust with cleaning, cooking, babysitting, and skilled professionals.`;

export const metadata: Metadata = {
	title: { absolute: ABOUT_TITLE },
	description: ABOUT_DESCRIPTION,
	alternates: {
		canonical: "/about",
	},
	openGraph: buildOpenGraph({
		title: ABOUT_TITLE,
		description: ABOUT_DESCRIPTION,
		path: "/about",
	}),
	twitter: buildTwitter({
		title: ABOUT_TITLE,
		description: ABOUT_DESCRIPTION,
	}),
};

export default function About() {
	return <AboutPage />;
}
