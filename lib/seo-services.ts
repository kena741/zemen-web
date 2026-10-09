import type { Metadata } from "next";

import { BRAND_NAME } from "@/lib/brand";
import {
	buildOpenGraph,
	buildTwitter,
	getMetadataBaseUrl,
} from "@/lib/seo";

export function slugifyCategoryName(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export type CategorySeoCopy = {
	title: string;
	h1: string;
	description: string;
	intro: string;
	offered: string[];
	faqs: { question: string; answer: string }[];
	/** Optional scope / pricing for SEO depth (Gooday-style clarity). */
	includes?: string[];
	excludes?: string[];
	pricingNote?: string;
};

/** Enrichment keyed by slug tokens. Used only when matching category exists in DB. */
const CATEGORY_COPY: Record<string, CategorySeoCopy> = {
	cleaning: {
		title: "Home Cleaning & Maid Services in Addis Ababa",
		h1: "Trusted Home Cleaning Services in Addis Ababa",
		description:
			"Book trusted home cleaning and maid services in Addis Ababa for apartments, houses, and offices with Zemen Service.",
		intro:
			"Book verified cleaning and maid professionals in Addis Ababa for regular home cleaning, deep cleans, and office spaces. Providers on Zemen Service are reviewed before they can take jobs.",
		offered: [
			"Home and apartment cleaning",
			"Deep cleaning support",
			"Office and shared-space cleaning",
			"Flexible booking through app, web, or call center",
		],
		includes: [
			"Sweeping, mopping, and surface cleaning",
			"Kitchen and bathroom cleaning",
			"Tidying living areas",
		],
		excludes: [
			"Specialist carpet or curtain deep cleans unless listed",
			"Materials not included in the provider price unless stated",
		],
		pricingNote:
			"Prices vary by home size and package. Browse listings for “from” rates, then confirm details when you book.",
		faqs: [
			{
				question: "How do I book a cleaner or maid in Addis Ababa?",
				answer:
					"Browse cleaning listings on Zemen Service, choose a provider, and book through the website or app. You can also call our short code or WhatsApp for help.",
			},
			{
				question: "Are cleaning providers verified?",
				answer:
					"Yes. Providers go through identity checks, document review, and ongoing supervision after placement.",
			},
		],
	},
	cooking: {
		title: "Cooking & Home Cook Services in Addis Ababa",
		h1: "Trusted Cooking Services in Addis Ababa",
		description:
			"Book trusted cooking and home cook professionals in Addis Ababa for everyday meals and catering support through Zemen Service.",
		intro:
			"Find verified cooking professionals for home meals and kitchen help in Addis Ababa. See listing prices before you book, with support through Zemen Service.",
		offered: [
			"Home cooking support",
			"Meal preparation help",
			"Vetted local professionals",
			"Booking via app, website, or call center",
		],
		includes: [
			"Cooking in your home on the booked day",
			"Meal prep based on the provider listing",
		],
		excludes: [
			"Grocery cost unless the listing says otherwise",
			"Catering for large events unless offered by the provider",
		],
		pricingNote:
			"Listing prices show what providers charge for the service. Confirm menu, portions, and grocery arrangements before booking.",
		faqs: [
			{
				question: "Can I book a cook for my home in Addis Ababa?",
				answer:
					"Yes. Browse cooking services on Zemen Service and book a verified provider that matches your needs.",
			},
		],
	},
	babysitting: {
		title: "Babysitting Services in Addis Ababa",
		h1: "Trusted Babysitting Services in Addis Ababa",
		description:
			"Find trusted babysitting and childcare professionals in Addis Ababa. Book verified support through Zemen Service.",
		intro:
			"Book babysitting support from vetted providers in Addis Ababa. Childcare-related providers may require additional checks such as documented experience and medical clearance where applicable.",
		offered: [
			"Babysitting and childcare support",
			"Verified provider profiles",
			"Training and experience checks where available",
			"Ongoing supervision after placement",
		],
		includes: [
			"Childcare during the booked hours",
			"Providers reviewed for identity and documents",
		],
		excludes: [
			"Medical care beyond normal childcare",
			"Overnight care unless the listing offers it",
		],
		pricingNote:
			"Rates depend on hours and number of children. Check each listing’s price and confirm details when you book.",
		faqs: [
			{
				question: "How does Zemen Service vet babysitters?",
				answer:
					"We verify identity and documents, review training or work history where available, require medical checkup for childcare where applicable, and continue monitoring after placement.",
			},
		],
	},
	nanny: {
		title: "Nanny Services in Addis Ababa",
		h1: "Trusted Nanny Services in Addis Ababa",
		description:
			"Book trusted nanny and childcare support in Addis Ababa through verified Zemen Service professionals.",
		intro:
			"Find nanny and childcare support from vetted professionals in Addis Ababa, with clear booking and follow-up through Zemen Service.",
		offered: [
			"Nanny and childcare support",
			"Document and identity checks",
			"Experience verification where available",
			"Customer support after booking",
		],
		faqs: [],
	},
	plumbing: {
		title: "Plumbing Services in Addis Ababa",
		h1: "Trusted Plumbing Services in Addis Ababa",
		description:
			"Book trusted plumbers in Addis Ababa for repairs, installations, and home plumbing work through Zemen Service.",
		intro:
			"Find verified plumbing professionals in Addis Ababa for leaks, fittings, and other home plumbing needs. Book online or through the Zemen Service call center.",
		offered: [
			"Home plumbing repairs",
			"Fittings and maintenance help",
			"Verified local plumbers",
			"Clear booking and follow-up",
		],
		faqs: [
			{
				question: "How quickly can I book a plumber?",
				answer:
					"Browse available plumbing listings on Zemen Service and book a time that works for you through the app or website.",
			},
		],
	},
	electrical: {
		title: "Electricians in Addis Ababa",
		h1: "Trusted Electrical Services in Addis Ababa",
		description:
			"Find trusted electricians in Addis Ababa for home electrical repairs and installations with Zemen Service.",
		intro:
			"Book verified electrical professionals in Addis Ababa for home repairs and related work, with vetted providers and clear booking support.",
		offered: [
			"Home electrical repairs",
			"Installations and maintenance support",
			"Verified electricians",
			"App, web, and call-center booking",
		],
		faqs: [],
	},
	electrician: {
		title: "Electricians in Addis Ababa",
		h1: "Trusted Electricians in Addis Ababa",
		description:
			"Book trusted electricians in Addis Ababa for home electrical work through Zemen Service.",
		intro:
			"Find verified electricians for home electrical needs in Addis Ababa and book through Zemen Service.",
		offered: [
			"Electrical repairs and support",
			"Verified local professionals",
			"Transparent booking flow",
		],
		faqs: [],
	},
	moving: {
		title: "Moving Services in Addis Ababa",
		h1: "Trusted Moving Services in Addis Ababa",
		description:
			"Book trusted moving help in Addis Ababa for home and local moves through Zemen Service.",
		intro:
			"Find verified moving professionals in Addis Ababa for packing and relocation support through Zemen Service.",
		offered: [
			"Local moving help",
			"Packing and relocation support",
			"Verified providers",
		],
		faqs: [],
	},
	beauty: {
		title: "Beauty Services in Addis Ababa",
		h1: "Trusted Beauty Services in Addis Ababa",
		description:
			"Book trusted beauty professionals in Addis Ababa through Zemen Service.",
		intro:
			"Find verified beauty service professionals in Addis Ababa and book with clear support through Zemen Service.",
		offered: [
			"Beauty and personal care services",
			"Verified local professionals",
			"Flexible booking options",
		],
		faqs: [],
	},
	security: {
		title: "Security Services in Addis Ababa",
		h1: "Trusted Security Services in Addis Ababa",
		description:
			"Find trusted security-related service professionals in Addis Ababa through Zemen Service.",
		intro:
			"Browse verified security-related providers available on Zemen Service in Addis Ababa.",
		offered: [
			"Security-related home services",
			"Verified provider profiles",
			"Booking through Zemen Service",
		],
		faqs: [],
	},
	nursing: {
		title: "Home Nursing Services in Addis Ababa",
		h1: "Trusted Home Nursing Services in Addis Ababa",
		description:
			"Book trusted home nursing and care support in Addis Ababa through verified Zemen Service professionals.",
		intro:
			"Find vetted home nursing and care-related professionals in Addis Ababa where available on Zemen Service.",
		offered: [
			"Home nursing and care support",
			"Documented checks where applicable",
			"Customer support after booking",
		],
		faqs: [],
	},
	repair: {
		title: "Home Repair Services in Addis Ababa",
		h1: "Trusted Home Repair Services in Addis Ababa",
		description:
			"Book trusted home repair professionals in Addis Ababa through Zemen Service.",
		intro:
			"Find verified repair and handyman support for common home needs in Addis Ababa.",
		offered: [
			"Home repairs and maintenance",
			"Verified local professionals",
			"Clear booking and follow-up",
		],
		faqs: [],
	},
	handyman: {
		title: "Handyman Services in Addis Ababa",
		h1: "Trusted Handyman Services in Addis Ababa",
		description:
			"Book trusted handyman professionals in Addis Ababa through Zemen Service.",
		intro:
			"Find verified handyman support for everyday home fixes in Addis Ababa.",
		offered: [
			"General handyman support",
			"Verified providers",
			"Flexible booking",
		],
		faqs: [],
	},
	housemaid: {
		title: "Housemaid & Maid Services in Addis Ababa",
		h1: "Trusted Housemaid & Domestic Help in Addis Ababa",
		description:
			"Book trusted housemaid, maid, and domestic help professionals in Addis Ababa through Zemen Service.",
		intro:
			"Find verified housemaid and domestic help support for your home in Addis Ababa—everyday cleaning, home care, and reliable in-home help. Providers are reviewed before they can take jobs.",
		offered: [
			"Housemaid and domestic help",
			"Home support from verified providers",
			"Clear booking through app, web, or call center",
		],
		includes: [
			"In-home domestic help for the booked hours",
			"Tasks agreed in the provider listing",
		],
		excludes: [
			"Specialist trades (plumbing, electrical) unless listed separately",
			"Live-in arrangements unless the listing offers them",
		],
		pricingNote:
			"Compare listing prices for daily or hourly housemaid support, then confirm scope when you book.",
		faqs: [
			{
				question: "How do I book a housemaid in Addis Ababa?",
				answer:
					"Browse domestic help listings on Zemen Service, choose a housemaid or home-support provider, and book through the website or app. You can also call or WhatsApp us for help.",
			},
		],
	},
	"office-cleaning": {
		title: "Office Cleaning in Addis Ababa",
		h1: "Trusted Office Cleaning Services in Addis Ababa",
		description:
			"Book trusted office cleaning and recurring workplace cleaning in Addis Ababa through Zemen Service.",
		intro:
			"Find verified office cleaning professionals in Addis Ababa for one-time or recurring workplace cleans. Book through Zemen Service with clear support.",
		offered: [
			"Office and workplace cleaning",
			"Recurring cleaning options where available",
			"Verified local cleaners",
		],
		includes: [
			"Desk areas, floors, and shared spaces as listed",
			"Recurring schedules when the provider offers them",
		],
		excludes: [
			"Industrial or specialized sanitation unless listed",
			"Supplies unless included in the listing price",
		],
		pricingNote:
			"Workplace size and frequency drive price. Check each listing’s rate before you book.",
		faqs: [
			{
				question: "Can I book recurring office cleaning?",
				answer:
					"Yes. Browse office cleaning listings on Zemen Service and choose a schedule that fits your workplace when the provider offers recurring options.",
			},
		],
	},
	maid: {
		title: "Maid Services in Addis Ababa",
		h1: "Trusted Maid Services in Addis Ababa",
		description:
			"Book trusted maid services and domestic help in Addis Ababa through Zemen Service.",
		intro:
			"Find verified maid and domestic help professionals for your home in Addis Ababa. Book with clear pricing on each listing.",
		offered: [
			"Maid and domestic help",
			"Home cleaning support",
			"Verified local providers",
		],
		pricingNote:
			"Listing prices vary by hours and duties. Confirm details when you book.",
		faqs: [],
	},
	painting: {
		title: "House Painting in Addis Ababa",
		h1: "Trusted House Painters in Addis Ababa",
		description:
			"Book trusted house painting professionals in Addis Ababa through Zemen Service.",
		intro:
			"Find verified painters for home interiors and exteriors in Addis Ababa. Book through Zemen Service with vetted local professionals.",
		offered: [
			"Interior and exterior house painting",
			"Verified local painters",
			"Clear booking and follow-up",
		],
		faqs: [],
	},
	"mural-art": {
		title: "Mural Artists in Addis Ababa",
		h1: "Trusted Mural Artists in Addis Ababa",
		description:
			"Book trusted mural artists in Addis Ababa for walls, daycare spaces, and custom art through Zemen Service.",
		intro:
			"Find verified mural and wall-painting professionals in Addis Ababa for homes, daycare rooms, and custom projects.",
		offered: [
			"Mural and wall art",
			"Daycare and room wall painting",
			"Verified local artists",
		],
		faqs: [],
	},
	domestic: {
		title: "Domestic Help in Addis Ababa",
		h1: "Trusted Domestic Help in Addis Ababa",
		description:
			"Book trusted domestic help and housemaid services in Addis Ababa through Zemen Service.",
		intro:
			"Find verified domestic help professionals for your home in Addis Ababa through Zemen Service.",
		offered: [
			"Domestic help and home support",
			"Verified local providers",
			"Flexible booking options",
		],
		faqs: [],
	},
};

function matchCategoryCopy(slug: string, categoryName: string): CategorySeoCopy | null {
	const key = slug.toLowerCase();
	const name = categoryName.toLowerCase();
	for (const [token, copy] of Object.entries(CATEGORY_COPY)) {
		if (key === token || key.includes(token) || name.includes(token)) {
			return copy;
		}
	}
	return null;
}

export function getCategorySeoCopy(
	categoryName: string,
	slug: string,
): CategorySeoCopy {
	const matched = matchCategoryCopy(slug, categoryName);
	if (matched) return matched;

	return {
		title: `${categoryName} Services in Addis Ababa`,
		h1: `Trusted ${categoryName} Services in Addis Ababa`,
		description: `Find and book trusted ${categoryName.toLowerCase()} professionals in Addis Ababa through ${BRAND_NAME}.`,
		intro: `Browse verified ${categoryName.toLowerCase()} professionals available on ${BRAND_NAME} in Addis Ababa. Book through the website, app, or call center.`,
		offered: [
			`${categoryName} professionals in Addis Ababa`,
			"Verified provider profiles",
			"Booking via app, website, or call center",
			"Support after booking",
		],
		faqs: [
			{
				question: `How do I book ${categoryName.toLowerCase()} services?`,
				answer: `Open ${BRAND_NAME}, choose a ${categoryName.toLowerCase()} listing, and book through the website or app. You can also call our short code for assistance.`,
			},
		],
	};
}

/** SEO copy for subcategory pages nested under a category. */
export function getSubCategorySeoCopy(
	subCategoryName: string,
	subSlug: string,
	parentCategoryName: string,
): CategorySeoCopy {
	const matched = matchCategoryCopy(subSlug, subCategoryName);
	if (matched) return matched;

	const label = subCategoryName.trim() || parentCategoryName;
	const parent = parentCategoryName.trim() || "home services";

	return {
		title: `${label} Services in Addis Ababa`,
		h1: `Trusted ${label} Services in Addis Ababa`,
		description: `Find and book trusted ${label.toLowerCase()} professionals in Addis Ababa under ${parent} through ${BRAND_NAME}.`,
		intro: `Browse verified ${label.toLowerCase()} professionals in Addis Ababa on ${BRAND_NAME}. This is part of our ${parent.toLowerCase()} offering. Book through the website, app, or call center.`,
		offered: [
			`${label} professionals in Addis Ababa`,
			`Part of ${parent} on ${BRAND_NAME}`,
			"Verified provider profiles",
			"Booking via app, website, or call center",
		],
		faqs: [
			{
				question: `How do I book ${label.toLowerCase()} in Addis Ababa?`,
				answer: `Open ${BRAND_NAME}, choose a ${label.toLowerCase()} listing under ${parent.toLowerCase()}, and book through the website or app. You can also call our short code for assistance.`,
			},
			{
				question: `Is ${label.toLowerCase()} different from other ${parent.toLowerCase()} services?`,
				answer: `Yes. ${label} is a focused subcategory within ${parent}, so you can narrow listings to the exact service you need.`,
			},
		],
	};
}

export function buildPageMetadata(input: {
	title: string;
	description: string;
	path: string;
}): Metadata {
	const absoluteTitle = input.title.includes(BRAND_NAME)
		? input.title
		: `${input.title} | ${BRAND_NAME}`;
	const canonicalPath = input.path.startsWith("/") ? input.path : `/${input.path}`;
	const absoluteUrl = new URL(canonicalPath, getMetadataBaseUrl()).toString();

	return {
		title: {
			absolute: absoluteTitle,
		},
		description: input.description,
		alternates: {
			canonical: canonicalPath,
		},
		openGraph: buildOpenGraph({
			title: absoluteTitle,
			description: input.description,
			path: absoluteUrl,
		}),
		twitter: buildTwitter({
			title: absoluteTitle,
			description: input.description,
		}),
		robots: {
			index: true,
			follow: true,
		},
	};
}
