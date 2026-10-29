import type { Metadata } from "next";

import { BRAND_NAME } from "@/lib/brand";

/** Public marketing domain used in sitemap, robots, canonicals, and OG. */
export const SEO_SITE_ORIGIN = "https://zemenservice.com";

/** Canonical production origin for metadata, sitemap, and robots. */
export function getMetadataBaseUrl(): URL {
	const raw =
		process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
		SEO_SITE_ORIGIN;
	const normalized = raw.replace(/\/$/, "");

	// Never publish Vercel preview hosts in SEO artifacts.
	if (
		normalized.includes("vercel.app") ||
		normalized.includes("localhost") ||
		normalized.includes("127.0.0.1")
	) {
		return new URL(SEO_SITE_ORIGIN);
	}

	// www redirects to the apex (next.config.ts), so it must never be canonical.
	const url = new URL(normalized);
	if (url.hostname === `www.${new URL(SEO_SITE_ORIGIN).hostname}`) {
		return new URL(SEO_SITE_ORIGIN);
	}
	return url;
}

export const SEO_TITLE_DEFAULT =
	"Zemen Service | Premium Home Services in Addis Ababa, Ethiopia";

export const SEO_DESCRIPTION =
	"Premium, verified home service professionals in Addis Ababa, Ethiopia. Book cleaning, housemaids, cooks, babysitters, nannies, plumbers, electricians, AC repair, CCTV and security cameras, repairs, movers, beauty, and home nursing.";

export const SEO_OG_DESCRIPTION =
	"Premium, verified home service professionals in Addis Ababa, Ethiopia. Book the service you need with Zemen Service.";

export const SEO_TWITTER_DESCRIPTION =
	"Premium, verified home services in Addis Ababa, Ethiopia.";

export const SEO_KEYWORDS = [
	"premium home services Addis Ababa",
	"premium home services Ethiopia",
	"home services Addis Ababa",
	"home services Ethiopia",
	"Ethiopian home services app",
	"cleaning service Addis Ababa",
	"cleaning services Addis Ababa",
	"home cleaning Addis Ababa",
	"house cleaning Addis Ababa",
	"office cleaning Addis Ababa",
	"deep cleaning Addis Ababa",
	"kitchen deep cleaning services near me",
	"kitchen deep cleaning Addis Ababa",
	"deep cleaning near me",
	"premium cleaning services Ethiopia",
	"maid agency near me",
	"maid agency Addis Ababa",
	"maid agency Ethiopia",
	"maid services Addis Ababa",
	"housemaid Addis Ababa",
	"domestic help Ethiopia",
	"cooking services Addis Ababa",
	"home cook Addis Ababa",
	"babysitting Addis Ababa",
	"nanny Addis Ababa",
	"nanny suppliers in Ethiopia",
	"nanny suppliers Ethiopia",
	"nanny agency Ethiopia",
	"plumber Addis Ababa",
	"plumbing company",
	"plumbing company Addis Ababa",
	"plumbing company near me",
	"plumbing services Addis Ababa",
	"electrician Addis Ababa",
	"handyman Addis Ababa",
	"home repair Addis Ababa",
	"air conditioning repair service Addis Ababa",
	"AC repair Addis Ababa",
	"air conditioner repair Addis Ababa",
	"AC service Addis Ababa",
	"AC gas refill Addis Ababa",
	"split AC installation Addis Ababa",
	"security camera Addis Ababa",
	"CCTV installation Addis Ababa",
	"CCTV camera Addis Ababa",
	"security camera installation Ethiopia",
	"moving services Addis Ababa",
	"movers Addis Ababa",
	"furniture movers Addis Ababa",
	"house movers Addis Ababa",
	"packers and movers Addis Ababa",
	"moving company Addis Ababa",
	"relocation Addis Ababa",
	"home nursing Addis Ababa",
	"verified service providers Ethiopia",
	"Bole Addis Ababa home services",
	"የቤት ሰራተኛ አዲስ አበባ",
	"የጽዳት አገልግሎት አዲስ አበባ",
	"ሞግዚት አዲስ አበባ",
	"የቧንቧ ሰራተኛ አዲስ አበባ",
	"ኤሌክትሪሻን አዲስ አበባ",
	"Zemen Service",
	"Zemen movers Addis Ababa",
	"Zemen cleaning Addis Ababa",
	"Zemen CCTV Addis Ababa",
	"Zemen AC repair Addis Ababa",
] as const;

/** Approximate city-centre coordinates for Addis Ababa (geo meta + JSON-LD). */
export const SEO_GEO = {
	region: "ET-AA",
	placename: "Addis Ababa, Ethiopia",
	latitude: 9.03,
	longitude: 38.74,
} as const;

/** Local-SEO meta tags (geo.*, ICBM) read by some search engines and directories. */
export const SEO_GEO_META: Record<string, string> = {
	"geo.region": SEO_GEO.region,
	"geo.placename": SEO_GEO.placename,
	"geo.position": `${SEO_GEO.latitude};${SEO_GEO.longitude}`,
	ICBM: `${SEO_GEO.latitude}, ${SEO_GEO.longitude}`,
};

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
		locale: "en_ET",
		alternateLocale: ["am_ET"],
		images: [
			{
				url: OG_IMAGE_PATH,
				width: 1200,
				height: 630,
				alt: "Zemen Service - Premium Home Services in Addis Ababa, Ethiopia",
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
