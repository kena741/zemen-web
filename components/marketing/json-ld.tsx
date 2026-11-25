import { BRAND_NAME } from "@/lib/brand";
import {
	APP_STORE_URL,
	OFFICE,
	OPERATOR_NAME,
	PLAY_STORE_URL,
	PROVIDER_APP_STORE_URL,
	SHORT_CODE,
	TELEGRAM_URL,
	WHATSAPP_DISPLAY,
} from "@/lib/marketing";
import {
	getMetadataBaseUrl,
	SEO_DESCRIPTION,
	SEO_GEO,
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
				slogan: "Premium home services in Addis Ababa, Ethiopia",
				sameAs: [TELEGRAM_URL, PLAY_STORE_URL, APP_STORE_URL],
				parentOrganization: { "@type": "Organization", name: OPERATOR_NAME },
				address: {
					"@type": "PostalAddress",
					streetAddress: OFFICE.building,
					addressLocality: OFFICE.city,
					addressRegion: OFFICE.city,
					postalCode: OFFICE.postalCode,
					addressCountry: "ET",
				},
				location: {
					"@type": "Place",
					name: `${BRAND_NAME} office, ${OFFICE.building}`,
					hasMap: OFFICE.mapsUrl,
					geo: {
						"@type": "GeoCoordinates",
						latitude: SEO_GEO.latitude,
						longitude: SEO_GEO.longitude,
					},
				},
				knowsAbout: [
					"Home cleaning",
					"Cleaning services in Addis Ababa",
					"Kitchen deep cleaning services",
					"Deep cleaning and office cleaning",
					"Maid agency and housemaid services",
					"Housemaid and domestic help",
					"Home cooking",
					"Nanny suppliers in Ethiopia",
					"Babysitting and nanny services",
					"Plumbing company services",
					"Plumbing",
					"Electrical repair",
					"Air conditioning repair and AC service",
					"CCTV and security camera installation",
					"Home repair and handyman services",
					"Moving services",
					"Movers and furniture moving in Addis Ababa",
					"Packers and movers",
					"Home nursing",
				],
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
					{
						"@type": "ContactPoint",
						telephone: WHATSAPP_DISPLAY,
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
				inLanguage: ["en", "am"],
			},
			{
				"@type": "MobileApplication",
				"@id": `${base}/#customer-app`,
				name: BRAND_NAME,
				description:
					"Book verified home service professionals in Addis Ababa, Ethiopia.",
				operatingSystem: "Android, iOS",
				applicationCategory: "LifestyleApplication",
				installUrl: [PLAY_STORE_URL, APP_STORE_URL],
				publisher: { "@id": `${base}/#organization` },
			},
			{
				"@type": "MobileApplication",
				"@id": `${base}/#provider-app`,
				name: "Zemen Provider",
				description:
					"For service professionals on Zemen Service: manage services, bookings and earnings.",
				operatingSystem: "iOS",
				applicationCategory: "BusinessApplication",
				installUrl: PROVIDER_APP_STORE_URL,
				publisher: { "@id": `${base}/#organization` },
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
