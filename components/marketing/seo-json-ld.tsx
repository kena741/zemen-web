import { BRAND_NAME } from "@/lib/brand";
import { getMetadataBaseUrl } from "@/lib/seo";

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
			name: BRAND_NAME,
			url: base,
		},
		areaServed: {
			"@type": "City",
			name: "Addis Ababa",
		},
		serviceType: input.name,
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
		"@type": "LocalBusiness",
		"@id": `${base}/#localbusiness`,
		name: BRAND_NAME,
		url: base,
		image: `${base}/og-image.jpg`,
		areaServed: {
			"@type": "City",
			name: "Addis Ababa",
		},
		address: {
			"@type": "PostalAddress",
			addressLocality: "Addis Ababa",
			addressCountry: "ET",
		},
	};
}
