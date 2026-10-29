import { BRAND_NAME } from "@/lib/brand";
import { SHORT_CODE } from "@/lib/marketing";
import { getMetadataBaseUrl, SEO_DESCRIPTION, SEO_GEO } from "@/lib/seo";

const AREA_SERVED = [
	{ "@type": "City", name: "Addis Ababa" },
	{ "@type": "Country", name: "Ethiopia" },
];

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	);
}

export function breadcrumbJsonLd(
	items: { name: string; path: string }[],
): Record<string, unknown> {
	const base = getMetadataBaseUrl().origin;
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: `${base}${item.path}`,
		})),
	};
}

export function serviceJsonLd(input: {
	name: string;
	description: string;
	path: string;
}): Record<string, unknown> {
	const base = getMetadataBaseUrl().origin;
	return {
		"@context": "https://schema.org",
		"@type": "Service",
		name: input.name,
		description: input.description,
		url: `${base}${input.path}`,
		provider: {
			"@type": "Organization",
			"@id": `${base}/#organization`,
			name: BRAND_NAME,
			url: base,
		},
		areaServed: AREA_SERVED,
		serviceType: input.name,
		category: "Premium home services",
	};
}

export function faqJsonLd(
	faqs: { question: string; answer: string }[],
): Record<string, unknown> | null {
	if (!faqs.length) return null;
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqs.map((faq) => ({
			"@type": "Question",
			name: faq.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: faq.answer,
			},
		})),
	};
}

export function localBusinessJsonLd(): Record<string, unknown> {
	const base = getMetadataBaseUrl().origin;
	return {
		"@context": "https://schema.org",
		"@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
		"@id": `${base}/#localbusiness`,
		name: BRAND_NAME,
		description: SEO_DESCRIPTION,
		url: base,
		image: `${base}/og-image.jpg`,
		logo: `${base}/app-icon.png`,
		telephone: SHORT_CODE,
		parentOrganization: { "@id": `${base}/#organization` },
		areaServed: AREA_SERVED,
		address: {
			"@type": "PostalAddress",
			addressLocality: "Addis Ababa",
			addressRegion: "Addis Ababa",
			addressCountry: "ET",
		},
		geo: {
			"@type": "GeoCoordinates",
			latitude: SEO_GEO.latitude,
			longitude: SEO_GEO.longitude,
		},
	};
}

export function blogPostingJsonLd(post: {
	title: string;
	slug: string;
	excerpt: string | null;
	coverImage: string | null;
	authorName: string | null;
	publishedAt: string | null;
	updatedAt: string;
}): Record<string, unknown> {
	const base = getMetadataBaseUrl().origin;
	const url = `${base}/blog/${post.slug}`;
	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		description: post.excerpt ?? undefined,
		image: post.coverImage ?? `${base}/og-image.jpg`,
		url,
		mainEntityOfPage: url,
		datePublished: post.publishedAt ?? undefined,
		dateModified: post.updatedAt,
		inLanguage: "en",
		author: post.authorName
			? { "@type": "Person", name: post.authorName }
			: { "@id": `${base}/#organization` },
		publisher: { "@id": `${base}/#organization` },
		about: { "@type": "City", name: "Addis Ababa" },
	};
}
