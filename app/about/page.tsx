import type { Metadata } from "next";

import { AboutPage } from "@/components/marketing/about-page";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
	title: `About | ${BRAND_NAME}`,
	description: `Learn about ${BRAND_NAME}: vetted home services, our mission, and how we build trust in Addis Ababa.`,
};

export default function About() {
	return <AboutPage />;
}
