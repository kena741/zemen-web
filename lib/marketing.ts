export const SHORT_CODE = "8323";
export const TELEGRAM_URL = "https://t.me/zemenservicediscussion";
/** E.164 without + for wa.me links */
export const WHATSAPP_PHONE = "251951175959";
export const WHATSAPP_DISPLAY = "+251 951 175 959";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;
export const PLAY_STORE_URL =
	"https://play.google.com/store/apps/details?id=com.zemenservice";
export const APP_STORE_URL = "https://apps.apple.com/app/zemen-service";

/** Public trust metrics for marketing / SEO surfaces. */
export const TRUST_STATS = [
	{ value: "1.5+", label: "Years of experience" },
	{ value: "5k+", label: "Providers" },
	{ value: "10k+", label: "Services delivered" },
] as const;

/**
 * Priority specialty links for footer / home SEO.
 * Nested paths follow Option A: /services/{category}/{subcategory}.
 */
export const PRIORITY_SERVICE_LINKS = [
	{ label: "Cleaning", href: "/services/domestic-help/cleaning" },
	{ label: "Housemaid", href: "/services/domestic-help/housemaid" },
	{ label: "Cooking", href: "/services/domestic-help/cooking" },
	{ label: "Babysitting", href: "/services/domestic-help/babysitting" },
	{ label: "Plumbing", href: "/services/maintenance/plumbing" },
	{ label: "Electrical", href: "/services/maintenance/electrical" },
	{ label: "Painting", href: "/services/art-and-design/painting" },
	{ label: "Moving", href: "/services/logistics/moving" },
] as const;

export const SPONSORS = [
	{ src: "/marketing/partners/chapa.png", alt: "Chapa" },
	{ src: "/marketing/partners/telebirr.png", alt: "Telebirr" },
	{ src: "/marketing/partners/cbe.png", alt: "CBE" },
	{ src: "/marketing/partners/et.png", alt: "Ethio Telecom" },
	{ src: "/marketing/partners/ibex.png", alt: "Ibex" },
	{ src: "/marketing/partners/zulu.png", alt: "Zulu" },
] as const;
