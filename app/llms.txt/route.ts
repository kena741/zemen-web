import { BRAND_NAME } from "@/lib/brand";
import {
	APP_STORE_URL,
	OFFICE,
	OPERATOR_NAME,
	PLAY_STORE_URL,
	SHORT_CODE,
	WHATSAPP_DISPLAY,
} from "@/lib/marketing";
import { getMetadataBaseUrl } from "@/lib/seo";
import {
	fetchAllPublicSubCategoryParams,
	fetchPublicCategories,
} from "@/services/catalog/publicCatalog";

export const revalidate = 3600;

/** Plain-text summary of the site for AI assistants (llmstxt.org format). */
export async function GET() {
	const base = getMetadataBaseUrl().origin;
	const [categories, pairs] = await Promise.all([
		fetchPublicCategories().catch(() => []),
		fetchAllPublicSubCategoryParams().catch(() => []),
	]);

	const services = categories
		.map((category) => {
			const subs = pairs
				.filter((pair) => pair.slug === category.slug)
				.map((pair) => `  - ${base}/services/${pair.slug}/${pair.subSlug}`);
			return [`- [${category.categoryName}](${base}/services/${category.slug})`, ...subs].join("\n");
		})
		.join("\n");

	const body = `# ${BRAND_NAME}

> ${BRAND_NAME} is a home services marketplace in Addis Ababa, Ethiopia. Customers book verified professionals for cleaning, housemaids, cooking, childcare, plumbing, electrical work, AC and appliance repair, CCTV, IT support, moving and more, on the website, the ${BRAND_NAME} app or by phone. It is operated by ${OPERATOR_NAME}.

## Key facts
- Area served: Addis Ababa, Ethiopia
- Office: ${OFFICE.building}, ${OFFICE.city}, ${OFFICE.country} (${OFFICE.mapsUrl})
- Phone short code: ${SHORT_CODE}; WhatsApp: ${WHATSAPP_DISPLAY}
- Languages: English and Amharic
- Customer apps: ${PLAY_STORE_URL} and ${APP_STORE_URL}
- How booking works: choose a service, compare listings with prices shown upfront, then book online, in the app, or by calling ${SHORT_CODE}.
- Verification: providers submit a Fayda National ID and the documents for each service they offer, which the ${BRAND_NAME} team reviews before they can take jobs. Childcare providers also complete a medical checkup. Listings are reviewed before they are published.

## Main pages
- [Home](${base}/)
- [About ${BRAND_NAME}](${base}/about)
- [All services](${base}/services)
- [Home services in Addis Ababa](${base}/locations/addis-ababa)
- [Become a provider](${base}/become-a-provider)
- [Blog](${base}/blog)

## Services
${services}

## Policies
- [Privacy policy](${base}/legal/privacy)
- [Terms of service](${base}/legal/terms)
`;

	return new Response(body, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
