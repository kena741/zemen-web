export const SHORT_CODE = "8323";
export const TELEGRAM_URL = "https://t.me/zemenservicediscussion";
/** E.164 without + for wa.me links */
export const WHATSAPP_PHONE = "251951175959";
export const WHATSAPP_DISPLAY = "+251 951 175 959";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;
export const PLAY_STORE_URL =
	"https://play.google.com/store/apps/details?id=com.zemen.service";
export const APP_STORE_URL =
	"https://apps.apple.com/us/app/zemen-service/id6763512421";

/** Public trust metrics for marketing / SEO surfaces. */
export const TRUST_STATS = [
	{ value: "1.5+", label: "Years of experience" },
	{ value: "5k+", label: "Providers" },
	{ value: "10k+", label: "Services delivered" },
] as const;

/**
 * Priority specialty links for footer / home SEO.
 * Nested paths follow Option A: /services/{category}/{subcategory}.
 * Slugs must match live subcategories; old guesses are 301'd in next.config.ts.
 */
export const PRIORITY_SERVICE_LINKS = [
	{ label: "Cleaning", href: "/services/domestic-help/cleaning-service" },
	{ label: "Housemaid", href: "/services/domestic-help/housemaid" },
	{ label: "Cooking", href: "/services/domestic-help/cooking-service" },
	{ label: "Babysitting", href: "/services/domestic-help/babysitting" },
	{ label: "Plumbing", href: "/services/maintenance/plumber" },
	{ label: "Electrical", href: "/services/maintenance/electrician" },
	{ label: "Painting", href: "/services/art-and-design/painting" },
	{ label: "Moving", href: "/services/logistics/furniture-moving" },
] as const;

export const SPONSORS = [
	{ src: "/marketing/partners/chapa.png", alt: "Chapa" },
	{ src: "/marketing/partners/telebirr.png", alt: "Telebirr" },
	{ src: "/marketing/partners/cbe.png", alt: "CBE" },
	{ src: "/marketing/partners/et.png", alt: "Ethio Telecom" },
	{ src: "/marketing/partners/ibex.png", alt: "Ibex" },
	{ src: "/marketing/partners/zulu.png", alt: "Zulu" },
] as const;

/** Home page FAQ — rendered on the page and emitted as FAQPage JSON-LD. */
export const HOME_FAQS = [
	{
		question: "What is Zemen Service?",
		answer:
			"Zemen Service is a premium home services platform in Addis Ababa, Ethiopia. You can book verified professionals for cleaning, housemaid and domestic help, cooking, babysitting, plumbing, electrical work, painting, moving, beauty, and home nursing.",
	},
	{
		question: "Which areas of Addis Ababa do you serve?",
		answer:
			"Zemen Service providers work across Addis Ababa. When you book, share your location and we match you with an available verified provider nearby.",
	},
	{
		question: "How are Zemen Service providers vetted?",
		answer:
			"Every provider goes through identity and document checks, a skills review for their service category, and verification of training or work history. Childcare providers also complete a medical checkup, and we keep supervising performance after placement.",
	},
	{
		question: "How do I book a home service?",
		answer: `Browse services on the website or the Zemen Service app, choose a listing, and book. You can also call our short code ${SHORT_CODE} or message us on WhatsApp and our team will book for you.`,
	},
	{
		question: "How do I pay?",
		answer:
			"You can pay securely in the app or on the website using local payment options such as Telebirr, CBE, and Chapa. Listing prices are shown before you book.",
	},
	{
		question: "What if I am not satisfied with a service?",
		answer: `Contact our support team by calling ${SHORT_CODE} or on WhatsApp. We follow up on every booking and work with you and the provider to make it right.`,
	},
] as const;
