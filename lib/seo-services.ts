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
};

/** Enrichment keyed by slug tokens. Used only when matching category exists in DB. */
const CATEGORY_COPY: Record<string, CategorySeoCopy> = {
	cleaning: {
		title: "Cleaning Services in Addis Ababa",
		h1: "Trusted Cleaning Services in Addis Ababa",
		description:
			"Find and book trusted cleaning professionals in Addis Ababa for homes, offices, and other spaces with Zemen Service.",
		intro:
			"Book verified cleaning professionals in Addis Ababa for regular home cleaning, deep cleans, and other spaces. Providers on Zemen Service are reviewed before they can take jobs.",
		offered: [
			"Home and apartment cleaning",
			"Deep cleaning support",
			"Office and shared-space cleaning",
			"Flexible booking through app, web, or call center",
		],
		faqs: [
			{
				question: "How do I book a cleaner in Addis Ababa?",
				answer:
					"Browse cleaning listings on Zemen Service, choose a provider, and book through the website or app. You can also call our short code for help.",
			},
			{
				question: "Are cleaning providers verified?",
				answer:
					"Yes. Providers go through identity checks, document review, and ongoing supervision after placement.",
			},
		],
	},
	cooking: {
		title: "Cooking Services in Addis Ababa",
		h1: "Trusted Cooking Services in Addis Ababa",
		description:
			"Book trusted cooking professionals in Addis Ababa for home meals and catering support through Zemen Service.",
		intro:
			"Find verified cooking professionals for home meals and related kitchen help in Addis Ababa. Book with clear pricing and support through Zemen Service.",
		offered: [
			"Home cooking support",
			"Meal preparation help",
			"Vetted local professionals",
			"Booking via app, website, or call center",
		],
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
			"Find trusted babysitting professionals in Addis Ababa. Book verified childcare support through Zemen Service.",
		intro:
			"Book babysitting support from vetted providers in Addis Ababa. Childcare-related providers may require additional checks such as documented experience and medical clearance where applicable.",
		offered: [
			"Babysitting and childcare support",
			"Verified provider profiles",
			"Training and experience checks where available",
			"Ongoing supervision after placement",
		],
		faqs: [
			{
				question: "How does Zemen Service vet babysitters?",
				answer:
					"We verify identity and documents, review training or work history where available, and continue monitoring after placement.",
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
