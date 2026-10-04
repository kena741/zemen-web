import type { Metadata } from "next";

import { LandingPage } from "@/components/marketing/landing-page";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export const metadata: Metadata = {
	title: `${BRAND_NAME} | Trusted local services`,
	description: `${BRAND_TAGLINE}. Book verified home services in Ethiopia.`,
};

export default function Home() {
	return <LandingPage />;
}
