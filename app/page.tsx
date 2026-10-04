import type { Metadata } from "next";

import { LandingPage } from "@/components/marketing/landing-page";
import {
	buildOpenGraph,
	buildTwitter,
	SEO_DESCRIPTION,
	SEO_OG_DESCRIPTION,
	SEO_TITLE_DEFAULT,
	SEO_TWITTER_DESCRIPTION,
} from "@/lib/seo";

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

export default function Home() {
	return <LandingPage />;
}
