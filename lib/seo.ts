import type { Metadata } from "next";

import { BRAND_NAME } from "@/lib/brand";

/** Canonical production origin for metadata, sitemap, and robots. */
export function getMetadataBaseUrl(): URL {
	const raw =
		process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
		"https://www.zemenservice.com";
	return new URL(raw.replace(/\/$/, ""));
}

export const SEO_TITLE_DEFAULT =
	"Zemen Service | Trusted Home Services in Addis Ababa";

export const SEO_DESCRIPTION =
	"Find trusted and verified service professionals in Addis Ababa. Book cleaning, cooking, babysitting, plumbing, electrical, repairs, moving, beauty, nursing, and more.";

export const SEO_OG_DESCRIPTION =
	"Find trusted and verified service professionals in Addis Ababa. Book the service you need with Zemen Service.";

export const SEO_TWITTER_DESCRIPTION =
	"Find trusted and verified service professionals in Addis Ababa.";

export const SEO_KEYWORDS = [
	"home services Addis Ababa",
	"home services Ethiopia",
	"cleaning services Addis Ababa",
	"maid services Addis Ababa",
	"cooking services Addis Ababa",
	"babysitting Addis Ababa",
	"plumber Addis Ababa",
	"electrician Addis Ababa",
	"handyman Addis Ababa",
	"home repair Addis Ababa",
	"Zemen Service",
] as const;

export const OG_IMAGE_PATH = "/og-image.jpg";

export const NO_INDEX_ROBOTS: Metadata["robots"] = {
	index: false,
	follow: false,
	googleBot: { index: false, follow: false },
};

export function buildOpenGraph({
	title = SEO_TITLE_DEFAULT,
	description = SEO_OG_DESCRIPTION,
	path = "/",
}: {
	title?: string;
	description?: string;
	path?: string;
} = {}): NonNullable<Metadata["openGraph"]> {
	return {
		title,
		description,
		url: path,
		siteName: BRAND_NAME,
		type: "website",
		locale: "en_US",
		images: [
			{
				url: OG_IMAGE_PATH,
				width: 1200,
				height: 630,
				alt: "Zemen Service - Trusted Home Services",
			},
		],
	};
}

export function buildTwitter({
	title = SEO_TITLE_DEFAULT,
	description = SEO_TWITTER_DESCRIPTION,
}: {
	title?: string;
	description?: string;
} = {}): NonNullable<Metadata["twitter"]> {
	return {
		card: "summary_large_image",
		title,
		description,
		images: [OG_IMAGE_PATH],
	};
}
