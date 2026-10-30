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

/** Head office, matching the Zemen Service Google Business Profile. */
export const OFFICE = {
	building: "Alemnesh Plaza",
	city: "Addis Ababa",
	postalCode: "1000",
	country: "Ethiopia",
	latitude: 8.998705,
	longitude: 38.786986,
	/** Opens the Google Business Profile, with directions on mobile. */
	mapsUrl: "https://maps.app.goo.gl/3ujnZT2s7MborZtK9",
	embedUrl:
		"https://www.google.com/maps?q=8.998705,38.786986&z=17&hl=en&output=embed",
} as const;

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
	{ label: "AC Repair", href: "/services/maintenance/ac-repair-and-service" },
	{ label: "CCTV", href: "/services/technical/cctv-installation" },
	{ label: "Movers", href: "/services/logistics/furniture-moving" },
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
			"Zemen Service is a premium home services platform in Addis Ababa, Ethiopia. You can book verified professionals for cleaning, housemaid and domestic help, cooking, babysitting, plumbing, electrical work, CCTV and security cameras, movers and furniture moving, beauty, and home nursing.",
	},
	{
		question: "How do I book a cleaning service in Addis Ababa?",
		answer:
			"Browse Cleaning on Zemen Service, compare verified cleaners for home or office, and book through the website or app. You can also call short code 8323 or WhatsApp for help.",
	},
	{
		question: "Do you offer kitchen deep cleaning services near me?",
		answer:
			"Yes. Open Deep Cleaning on Zemen Service to book kitchen and home deep cleans near you in Addis Ababa — including grease-heavy kitchens, bathrooms, and move-in or move-out jobs.",
	},
	{
		question: "Is Zemen a maid agency near me in Addis Ababa?",
		answer:
			"Zemen Service works like a modern maid agency: browse verified housemaids near you in Addis Ababa, compare listings, and book with ongoing support after placement.",
	},
	{
		question: "Where can I find nanny suppliers in Ethiopia?",
		answer:
			"Book verified nannies and babysitters on Zemen Service across Addis Ababa, Ethiopia. Open Babysitting, compare profiles, and book online or via short code 8323 / WhatsApp.",
	},
	{
		question: "How do I book a plumbing company in Addis Ababa?",
		answer:
			"Open Plumber under Maintenance on Zemen Service to book verified plumbers for leaks, fittings, and home plumbing jobs near you in Addis Ababa.",
	},
	{
		question: "Can I book CCTV or security camera installation in Addis Ababa?",
		answer:
			"Yes. Open CCTV Installation under Technical services to book verified technicians for security camera setup, NVR recording, and remote viewing across Addis Ababa.",
	},
	{
		question: "How do I book an air conditioning repair service in Addis Ababa?",
		answer:
			"Open AC Repair & Service under Maintenance on Zemen Service. Book verified technicians for AC not cooling, gas refill, cleaning, servicing, or split AC installation through the website, app, short code 8323, or WhatsApp.",
	},
	{
		question: "Can I book movers in Addis Ababa with Zemen?",
		answer:
			"Yes. Book verified furniture movers and packing-and-moving help across Addis Ababa on Zemen Service. Compare listings, then book through the website, app, short code 8323, or WhatsApp.",
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
