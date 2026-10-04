import { BRAND_NAME } from "@/lib/brand";
import { SHORT_CODE } from "@/lib/marketing";
import {
	getMetadataBaseUrl,
	SEO_DESCRIPTION,
	SEO_TITLE_DEFAULT,
} from "@/lib/seo";

export function OrganizationJsonLd() {
	const base = getMetadataBaseUrl().origin;
	const data = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Organization",
				"@id": `${base}/#organization`,
				name: BRAND_NAME,
				url: base,
				logo: `${base}/app-icon.png`,
				description: SEO_DESCRIPTION,
				sameAs: ["https://t.me/zemenservicediscussion"],
				areaServed: [
					{
						"@type": "City",
						name: "Addis Ababa",
					},
					{
						"@type": "Country",
						name: "Ethiopia",
					},
				],
				contactPoint: [
					{
						"@type": "ContactPoint",
						telephone: SHORT_CODE,
						contactType: "customer service",
						areaServed: "ET",
						availableLanguage: ["en", "am"],
					},
				],
			},
			{
				"@type": "WebSite",
				"@id": `${base}/#website`,
				url: base,
				name: BRAND_NAME,
				description: SEO_DESCRIPTION,
				publisher: { "@id": `${base}/#organization` },
				inLanguage: "en",
			},
			{
				"@type": "WebPage",
				"@id": `${base}/#webpage`,
				url: base,
				name: SEO_TITLE_DEFAULT,
				isPartOf: { "@id": `${base}/#website` },
				about: { "@id": `${base}/#organization` },
				description: SEO_DESCRIPTION,
				inLanguage: "en",
			},
		],
	};

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	);
}
