import type { Metadata } from "next";

import { AboutPage } from "@/components/marketing/about-page";
import { BRAND_NAME } from "@/lib/brand";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";

const ABOUT_TITLE = "About";
const ABOUT_DESCRIPTION = `Learn about ${BRAND_NAME}: vetted home services in Addis Ababa, our mission, and how we build trust with cleaning, cooking, babysitting, and skilled professionals.`;

export const metadata: Metadata = {
	title: ABOUT_TITLE,
	description: ABOUT_DESCRIPTION,
	alternates: {
		canonical: "/about",
	},
	openGraph: buildOpenGraph({
		title: `${ABOUT_TITLE} | ${BRAND_NAME}`,
		description: ABOUT_DESCRIPTION,
		path: "/about",
	}),
	twitter: buildTwitter({
		title: `${ABOUT_TITLE} | ${BRAND_NAME}`,
		description: ABOUT_DESCRIPTION,
	}),
};

export default function About() {
	return <AboutPage />;
}
