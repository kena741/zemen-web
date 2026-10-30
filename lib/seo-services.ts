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

export type ServiceIconName =
	| "spray"
	| "home"
	| "building"
	| "wrench"
	| "truck"
	| "paintbrush"
	| "plug";

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
	keywords?: string[];
	/**
	 * Package cards priced from live listings: a listing belongs to a package
	 * when its name contains one of `match` (case-insensitive). Packages with
	 * no matching listing are hidden, so no price is ever made up.
	 */
	packages?: { name: string; description: string; match: string[] }[];
	/** Amharic summary rendered with lang="am" for Amharic searches. */
	amharic?: { heading: string; body: string };
	/** Vertical (9:16) video shown in the page hero; files live in public/. */
	video?: {
		src: string;
		poster: string;
		title: string;
		caption: string;
		/** ISO 8601 date, for structured data and the video sitemap. */
		uploadDate: string;
		durationSeconds: number;
	};
	/**
	 * Designed hero (needs `video`): big slogan, keyword H1, service chips,
	 * CTAs and trust points. Replaces only the standard hero section.
	 */
	hero?: {
		location: string;
		slogan: [string, string];
		/** Rendered as the page H1, so keep the search keywords here. */
		heading: string;
		intro: string;
		primaryCta: string;
		chips: { label: string; icon: ServiceIconName; href: string }[];
		trust: string[];
	};
};

export type PricedPackage = {
	name: string;
	description: string;
	fromPrice: number;
	listingCount: number;
};

function listingPrice(value: string | null): number | null {
	const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
	return Number.isFinite(n) && n > 0 ? n : null;
}

/** Lowest live listing price per package; packages without listings are dropped. */
export function pricePackages(
	packages: NonNullable<CategorySeoCopy["packages"]>,
	listings: { serviceName: string | null; price: string | null }[],
): PricedPackage[] {
	return packages.flatMap((pkg) => {
		const terms = pkg.match.map((term) => term.toLowerCase());
		const prices = listings
			.filter((listing) => {
				const name = (listing.serviceName ?? "").toLowerCase();
				return terms.some((term) => name.includes(term));
			})
			.map((listing) => listingPrice(listing.price))
			.filter((price): price is number => price != null);
		if (prices.length === 0) return [];
		return [
			{
				name: pkg.name,
				description: pkg.description,
				fromPrice: Math.min(...prices),
				listingCount: prices.length,
			},
		];
	});
}

/** Enrichment keyed by slug tokens. Used only when matching category exists in DB. */
const CATEGORY_COPY: Record<string, CategorySeoCopy> = {
	cleaning: {
		title: "Cleaning Service in Addis Ababa | Home & Office Cleaners",
		h1: "Cleaning Services in Addis Ababa",
		description:
			"Book a trusted cleaning service in Addis Ababa, Ethiopia for homes, apartments, and offices. Compare verified cleaners on Zemen Service and book online, in the app, or by phone.",
		hero: {
			location: "Addis Ababa, Ethiopia",
			slogan: ["A cleaner space.", "A lighter day."],
			heading: "Home & office cleaning in Addis Ababa",
			intro:
				"Book verified professionals for deep cleaning, regular upkeep, and a fresh start. See prices before you book.",
			primaryCta: "Find a cleaner",
			chips: [
				{ label: "Deep cleaning", icon: "spray", href: "/services/domestic-help/deep-cleaning" },
				{ label: "Home cleaning", icon: "home", href: "#listings" },
				{ label: "Office cleaning", icon: "building", href: "#listings" },
			],
			trust: ["Verified professionals", "Clear pricing", "One-time or regular"],
		},
		video: {
			src: "/marketing/video/cleaning.mp4",
			poster: "/marketing/video/cleaning-poster.jpg",
			title: "Zemen Service providers cleaning homes and offices in Addis Ababa",
			caption: "See our cleaners in action",
			uploadDate: "2026-10-30",
			durationSeconds: 47,
		},
		intro:
			"Need a cleaning service in Addis Ababa? Zemen Service connects you with verified home and office cleaners for regular cleans, deep cleans, and one-time help across neighborhoods like Bole, CMC, Kazanchis, Sarbet, and Ayat. See listing prices before you book.",
		offered: [
			"Home and apartment cleaning in Addis Ababa",
			"Kitchen, bathroom, and living-area cleans",
			"Office and shared-space cleaning",
			"Verified cleaners with flexible booking",
		],
		includes: [
			"Sweeping, mopping, and dusting",
			"Kitchen and bathroom cleaning",
			"Tidying living areas as listed by the provider",
		],
		excludes: [
			"Specialist carpet or sofa shampoo unless listed",
			"Cleaning supplies not included unless the listing says so",
		],
		pricingNote:
			"Cleaning prices in Addis Ababa vary by home size, hours, and package. Browse “from” rates on each listing, then confirm the scope when you book.",
		keywords: [
			"cleaning service Addis Ababa",
			"cleaning services Addis Ababa",
			"home cleaning Addis Ababa",
			"house cleaning Addis Ababa",
			"office cleaning Addis Ababa",
			"maid cleaning Addis Ababa",
			"apartment cleaning Ethiopia",
			"Zemen cleaning",
		],
		faqs: [
			{
				question: "How do I book a cleaning service in Addis Ababa?",
				answer:
					"Browse cleaning listings on Zemen Service, choose a verified cleaner, and book through the website or app. You can also call short code 8323 or WhatsApp for help.",
			},
			{
				question: "Which areas of Addis Ababa do cleaners cover?",
				answer:
					"Providers serve homes and offices across Addis Ababa. Share your location when you book so we can match you with available cleaners nearby.",
			},
			{
				question: "Are cleaning providers verified?",
				answer:
					"Yes. Providers go through identity checks, document review, and ongoing supervision after placement.",
			},
			{
				question: "Can I book regular or one-time home cleaning?",
				answer:
					"Yes. Many listings offer one-time visits; some also offer recurring schedules. Check the provider listing for the options that fit your home.",
			},
		],
	},
	cooking: {
		title: "Premium Cooking & Home Cook Services in Addis Ababa",
		h1: "Trusted Cooking Services in Addis Ababa",
		description:
			"Book trusted cooking and home cook professionals in Addis Ababa, Ethiopia for everyday meals and catering support through Zemen Service.",
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
		title: "Nanny & Babysitting Services in Ethiopia | Addis Ababa",
		h1: "Nanny Suppliers and Babysitting in Addis Ababa, Ethiopia",
		description:
			"Find nanny suppliers in Ethiopia and trusted babysitting near you in Addis Ababa. Book verified childcare professionals through Zemen Service.",
		intro:
			"Looking for nanny suppliers in Ethiopia? Zemen Service connects families in Addis Ababa with verified nannies and babysitters near you — with identity checks, experience review, and medical clearance where applicable for childcare roles.",
		offered: [
			"Nanny and babysitting support in Ethiopia",
			"Verified childcare provider profiles",
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
		keywords: [
			"nanny suppliers in Ethiopia",
			"nanny suppliers Ethiopia",
			"nanny Addis Ababa",
			"babysitting Addis Ababa",
			"nanny agency Ethiopia",
			"childcare Addis Ababa",
			"babysitter near me Addis Ababa",
			"Zemen nanny",
		],
		faqs: [
			{
				question: "Where can I find nanny suppliers in Ethiopia?",
				answer:
					"Book verified nannies and babysitters on Zemen Service across Addis Ababa, Ethiopia. Browse Babysitting listings, compare profiles, and book through the website, app, short code 8323, or WhatsApp.",
			},
			{
				question: "How does Zemen Service vet babysitters and nannies?",
				answer:
					"We verify identity and documents, review training or work history where available, require medical checkup for childcare where applicable, and continue monitoring after placement.",
			},
		],
	},
	nanny: {
		title: "Nanny Suppliers in Ethiopia | Trusted Nannies Addis Ababa",
		h1: "Nanny Suppliers in Ethiopia",
		description:
			"Find nanny suppliers in Ethiopia and book trusted nannies in Addis Ababa through verified Zemen Service professionals.",
		intro:
			"Zemen Service is a trusted place to find nanny suppliers in Ethiopia. Browse verified nannies near you in Addis Ababa with clear booking and follow-up support.",
		offered: [
			"Nanny suppliers and childcare support",
			"Document and identity checks",
			"Experience verification where available",
			"Customer support after booking",
		],
		keywords: [
			"nanny suppliers in Ethiopia",
			"nanny suppliers Ethiopia",
			"nanny Addis Ababa",
			"nanny agency Ethiopia",
		],
		faqs: [
			{
				question: "How do I hire a nanny in Ethiopia through Zemen?",
				answer:
					"Open Babysitting or nanny-related listings on Zemen Service, choose a verified provider, and book online or via the app. Call 8323 or WhatsApp if you want help matching a nanny near you in Addis Ababa.",
			},
		],
	},
	plumbing: {
		title: "Plumbing Company in Addis Ababa | Verified Plumbers",
		h1: "Plumbing Company Services in Addis Ababa",
		description:
			"Need a plumbing company in Addis Ababa, Ethiopia? Book verified plumbers for leaks, pipe repairs, fittings, and home plumbing work through Zemen Service.",
		intro:
			"Looking for a plumbing company near you in Addis Ababa? Zemen Service connects you with verified plumbers for emergency leaks, blocked drains, fittings, toilet and sink repairs, and other home plumbing jobs — with clear listing prices before you book.",
		offered: [
			"Plumbing company-style home repairs",
			"Leak detection and pipe fixes",
			"Fittings, taps, and maintenance help",
			"Verified local plumbers",
		],
		includes: [
			"Diagnosis and repair as listed by the provider",
			"Common residential plumbing tasks",
		],
		excludes: [
			"Major civil works or new building plumbing unless listed",
			"Parts cost unless included in the listing price",
		],
		pricingNote:
			"Plumbing prices vary by job type and parts. Compare listing rates, then confirm the scope when you book.",
		keywords: [
			"plumbing company",
			"plumbing company Addis Ababa",
			"plumbing company near me",
			"plumber Addis Ababa",
			"plumbing services Addis Ababa",
			"emergency plumber Addis Ababa",
			"pipe repair Ethiopia",
			"Zemen plumbing",
		],
		faqs: [
			{
				question: "How do I book a plumbing company in Addis Ababa?",
				answer:
					"Browse Plumber listings on Zemen Service, compare verified providers, and book through the website or app. You can also call short code 8323 or WhatsApp for help finding a plumber near you.",
			},
			{
				question: "How quickly can I book a plumber?",
				answer:
					"Many plumbing listings can be booked for the same week. Share your location and the issue (leak, blockage, fitting) so we can match available plumbers nearby.",
			},
		],
	},
	electrical: {
		title: "Premium Electricians in Addis Ababa",
		h1: "Trusted Electrical Services in Addis Ababa",
		description:
			"Find trusted electricians in Addis Ababa, Ethiopia for home electrical repairs and installations with Zemen Service.",
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
		title: "Premium Electricians in Addis Ababa",
		h1: "Trusted Electricians in Addis Ababa",
		description:
			"Book trusted electricians in Addis Ababa, Ethiopia for home electrical work through Zemen Service.",
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
		title: "Movers in Addis Ababa | Furniture Moving Services",
		h1: "Trusted Movers in Addis Ababa",
		description:
			"Book verified movers in Addis Ababa, Ethiopia for furniture moving, house moves, and local relocation. Compare listings and book with Zemen Service.",
		intro:
			"Looking for movers in Addis Ababa? Zemen Service connects you with verified furniture movers and relocation help for apartments, houses, and local moves across the city — including Bole, CMC, Kazanchis, Sarbet, and Ayat.",
		offered: [
			"Furniture movers in Addis Ababa",
			"House and apartment moving",
			"Local relocation and loading help",
			"Verified providers with clear booking",
		],
		includes: [
			"Loading and unloading furniture",
			"Local transport support for home moves",
			"Careful handling of household items",
		],
		excludes: [
			"Long-distance intercity moves unless listed by the provider",
			"Specialty crane or heavy industrial lifting unless stated",
		],
		pricingNote:
			"Moving prices vary by volume, floors, and distance within Addis Ababa. Compare listing rates, then confirm details when you book.",
		keywords: [
			"movers Addis Ababa",
			"furniture movers Addis Ababa",
			"house movers Addis Ababa",
			"moving company Addis Ababa",
			"relocation Addis Ababa",
			"furniture moving Ethiopia",
			"Zemen movers",
		],
		faqs: [
			{
				question: "How do I book movers in Addis Ababa?",
				answer:
					"Browse furniture moving listings on Zemen Service, choose a verified mover, and book through the website or app. You can also call short code 8323 or WhatsApp for help.",
			},
			{
				question: "Do Zemen movers cover all of Addis Ababa?",
				answer:
					"Yes. Providers serve neighborhoods across Addis Ababa. Share your pickup and drop-off locations when you book so we can match you with available movers nearby.",
			},
			{
				question: "Are movers on Zemen Service verified?",
				answer:
					"Yes. Providers go through identity and document checks before they can take jobs, and we support you after the booking.",
			},
		],
	},
	logistics: {
		title: "Logistics & Movers in Addis Ababa",
		h1: "Logistics and Moving Services in Addis Ababa",
		description:
			"Book movers, furniture moving, and packing help in Addis Ababa, Ethiopia through verified Zemen Service providers.",
		intro:
			"From furniture movers to packing support, find verified logistics professionals in Addis Ababa on Zemen Service for smoother local moves.",
		offered: [
			"Furniture movers",
			"Packing and moving help",
			"Local relocation support",
			"Verified providers",
		],
		keywords: [
			"movers Addis Ababa",
			"logistics Addis Ababa",
			"furniture moving Addis Ababa",
			"packing and moving Ethiopia",
		],
		faqs: [
			{
				question: "What logistics services can I book on Zemen?",
				answer:
					"You can book furniture moving and home equipment packing and moving through verified providers in Addis Ababa.",
			},
		],
	},
	beauty: {
		title: "Premium Beauty Services in Addis Ababa",
		h1: "Trusted Beauty Services in Addis Ababa",
		description:
			"Book trusted beauty professionals in Addis Ababa, Ethiopia through Zemen Service.",
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
		title: "Home Security Services in Addis Ababa",
		h1: "Trusted Home Security Services in Addis Ababa",
		description:
			"Find verified security professionals in Addis Ababa, Ethiopia for CCTV, cameras, and related home protection through Zemen Service.",
		intro:
			"Browse verified security-related providers on Zemen Service in Addis Ababa — including CCTV and camera installation where listed.",
		offered: [
			"CCTV and security camera support",
			"Verified provider profiles",
			"Booking through Zemen Service",
		],
		keywords: [
			"security camera Addis Ababa",
			"CCTV Addis Ababa",
			"home security Addis Ababa",
		],
		faqs: [
			{
				question: "Can I book CCTV or security camera installation on Zemen?",
				answer:
					"Yes. Open Technical services and choose CCTV Installation to browse verified installers in Addis Ababa.",
			},
		],
	},
	"cctv-installation": {
		title: "Security Camera & CCTV Installation in Addis Ababa",
		h1: "CCTV and Security Camera Installation in Addis Ababa",
		description:
			"Book verified CCTV and security camera installation in Addis Ababa, Ethiopia. Get help with camera placement, recording setup, and remote viewing through Zemen Service.",
		intro:
			"Protect your home or business with CCTV and security camera installation in Addis Ababa. Zemen Service connects you with verified technicians for IP camera systems, NVR setup, cabling, and remote phone viewing — from a clear site plan through handover.",
		offered: [
			"Security camera and CCTV installation",
			"Camera placement and coverage planning",
			"NVR recording and remote viewing setup",
			"Verified local technicians",
		],
		includes: [
			"Site assessment and camera positioning guidance",
			"Mounting and cabling as listed by the provider",
			"Recorder setup and basic user handover",
		],
		excludes: [
			"Camera hardware brand unless stated in the listing",
			"Ongoing monitoring center fees unless offered",
			"Electric fence or access control unless separately booked",
		],
		pricingNote:
			"CCTV prices in Addis Ababa usually depend on camera count, cable runs, and recorder storage. Compare listing rates, then confirm a site survey when you book.",
		keywords: [
			"security camera Addis Ababa",
			"CCTV installation Addis Ababa",
			"CCTV camera Addis Ababa",
			"security camera installation Ethiopia",
			"IP camera installation Addis Ababa",
			"home CCTV Addis Ababa",
			"surveillance camera Addis Ababa",
			"Zemen CCTV",
		],
		faqs: [
			{
				question: "How do I book CCTV or security camera installation in Addis Ababa?",
				answer:
					"Open CCTV Installation on Zemen Service, compare verified technicians, and book through the website or app. You can also call 8323 or WhatsApp for help.",
			},
			{
				question: "Do installers set up remote viewing on my phone?",
				answer:
					"Many CCTV listings include NVR setup and remote viewing configuration. Confirm what is included in the provider listing before you book.",
			},
			{
				question: "Is CCTV installation available for homes and businesses?",
				answer:
					"Yes. Providers serve residential compounds and commercial spaces across Addis Ababa. Share your property type and camera needs when you request a booking.",
			},
		],
	},
	"ev-charger": {
		title: "EV Charger Installation in Addis Ababa",
		h1: "EV Charger Installation and Service in Addis Ababa",
		description:
			"Book verified technicians in Addis Ababa, Ethiopia for home EV charger installation, charger maintenance, electric vehicle inspection, and EV buying advice through Zemen Service.",
		intro:
			"Most electric vehicle owners in Addis Ababa charge at home, and a charger has to be installed properly. A charger that is wired wrongly can burn out, damage parts of your car, and create a fire risk. Book verified EV technicians to install a charger matched to your car and electricity meter, maintain an existing charger, inspect an EV before you buy, or get advice on which electric car suits you.",
		offered: [
			"Home EV charger installation matched to your car and meter",
			"EV charger maintenance and safety checks",
			"Electric vehicle inspection with diagnostic equipment",
			"Advice on Full EV, Hybrid, Plug-in Hybrid, and Range Extender cars",
		],
		packages: [
			{
				name: "Charger installation",
				description:
					"A charger compatible with your car, wired correctly to your meter, installed with a warranty from the provider.",
				match: ["installation", "ግጠማ"],
			},
			{
				name: "Charger maintenance",
				description:
					"Checks of the electrical connections and charging performance so your charger keeps working safely.",
				match: ["maintenance", "ጥገና"],
			},
			{
				name: "EV inspection",
				description:
					"A diagnostic check of a new or used electric vehicle before you buy it, or of the car you already drive.",
				match: ["inspection", "ፍተሻ"],
			},
			{
				name: "EV consulting",
				description:
					"Help choosing between Full EV, Hybrid, Plug-in Hybrid, and Range Extender cars, plus usage and care advice.",
				match: ["consult", "ማማከር"],
			},
		],
		includes: [
			"Charger installation matched to your car and electricity meter",
			"Professional wiring with a provider warranty, as stated in the listing",
			"Charger and connection checks on maintenance visits",
		],
		excludes: [
			"The charger unit itself, unless the listing says it is supplied",
			"Electricity meter upgrades from the utility",
			"Mechanical car repairs outside the electric system",
		],
		pricingNote:
			"Prices above are the lowest current listing price for each service. Your final price depends on the charger type, cable distance from your meter, and your building.",
		amharic: {
			heading: "የኤሌክትሪክ መኪና (EV) ቻርጀር ግጠማ በአዲስ አበባ",
			body: "ለኤሌክትሪክ መኪናዎ ከቆጣሪዎ ጋር የሚጣጣም ቻርጀር ግጠማ፣ የቻርጀር ጥገና፣ የመኪና ፍተሻ እና የማማከር አገልግሎት ከተረጋገጡ ባለሙያዎች ያግኙ። በድረ-ገጹ ወይም በመተግበሪያው ይዘዙ፣ ወይም በ8323 ይደውሉ።",
		},
		keywords: [
			"EV charger installation Addis Ababa",
			"electric car charger installation Ethiopia",
			"home EV charger Addis Ababa",
			"EV charger Addis Ababa",
			"electric vehicle inspection Addis Ababa",
			"EV service Addis Ababa",
			"የኤሌክትሪክ መኪና ቻርጀር ግጠማ",
		],
		faqs: [
			{
				question: "Can I install an EV charger at home in Addis Ababa?",
				answer:
					"Yes. Book Charger installation on Zemen Service and a verified technician installs a charger that matches your car and your electricity meter. Share your car model and where you park when you book.",
			},
			{
				question: "Can I install a charger in an apartment or shared compound?",
				answer:
					"It depends on whether you have your own meter and a parking spot the cable can reach. Describe your building when you book, and the technician will confirm whether a charger line is possible before starting.",
			},
			{
				question: "Why should a professional install my EV charger?",
				answer:
					"A charger installed the wrong way can burn out, damage parts of your car, and create a fire risk. Verified technicians install it to match your car and meter, with a warranty stated in the listing.",
			},
			{
				question: "Can you inspect an electric car before I buy it?",
				answer:
					"Yes. Book EV inspection to have a new or used electric vehicle checked with proper diagnostic equipment before you buy, or to check the car you already drive.",
			},
		],
	},
	"sofa-carpet-cleaning": {
		title: "Sofa & Carpet Cleaning in Addis Ababa",
		h1: "Sofa and Carpet Cleaning in Addis Ababa",
		description:
			"Book verified sofa, carpet, and majlis cleaning in Addis Ababa, Ethiopia. Remove dust, stains, and dirt at home with Zemen Service. Book online or call 8323.",
		intro:
			"Sofas and carpets hold dust, stains, and dirt that regular cleaning leaves behind. Book verified cleaners in Addis Ababa to clean your sofa, carpets, or a full majlis seating area at home, so your furniture is clean, fresh, and ready to use again.",
		offered: [
			"Sofa cleaning at your home",
			"Carpet and rug cleaning",
			"Majlis cleaning: sofas, carpets, and the seating area",
			"Booking via app, website, or call center",
		],
		packages: [
			{
				name: "Sofa cleaning",
				description:
					"Dust, stain, and dirt removal for your sofa so it is clean and comfortable again.",
				match: ["sofa", "ሶፋ"],
			},
			{
				name: "Carpet cleaning",
				description:
					"Dust, stain, and dirt removal for carpets and rugs. Check the listing for how the price is measured.",
				match: ["carpet", "ምንጣፍ"],
			},
			{
				name: "Majlis cleaning",
				description:
					"Cleaning for a full majlis area: the sofas, the carpets, and the room around them.",
				match: ["majlis", "መጅሊስ"],
			},
		],
		includes: [
			"Removing dust, stains, and dirt from the booked items",
			"Cleaning at your home in Addis Ababa",
		],
		excludes: [
			"Sofa or furniture repair (book a carpenter instead)",
			"Guaranteed removal of every old or set-in stain, unless the listing says so",
			"Curtain cleaning, unless listed separately",
		],
		pricingNote:
			"Prices above are the lowest current listing price for each service. Carpet prices can depend on size, so confirm whether a listing is priced per carpet or per area before you book.",
		amharic: {
			heading: "የሶፋ እና የምንጣፍ ጽዳት በአዲስ አበባ",
			body: "የሶፋ፣ የምንጣፍ እና የመጅሊስ ጽዳት አገልግሎት ከተረጋገጡ ባለሙያዎች ያግኙ። አቧራ፣ እድፍ እና ቆሻሻን በማስወገድ ሶፋዎን እና ምንጣፍዎን ንፁህ እና ምቹ እናደርጋለን። በድረ-ገጹ ወይም በመተግበሪያው ይዘዙ፣ ወይም በ8323 ይደውሉ።",
		},
		keywords: [
			"sofa cleaning Addis Ababa",
			"carpet cleaning Addis Ababa",
			"sofa and carpet cleaning Addis Ababa",
			"upholstery cleaning Addis Ababa",
			"rug cleaning Addis Ababa",
			"majlis cleaning Addis Ababa",
			"የሶፋ ጽዳት",
			"የምንጣፍ ጽዳት",
		],
		faqs: [
			{
				question: "How do I book sofa or carpet cleaning in Addis Ababa?",
				answer:
					"Choose a sofa, carpet, or majlis cleaning listing on Zemen Service and book through the website or app. You can also call 8323 or message us on WhatsApp.",
			},
			{
				question: "Do cleaners come to my home?",
				answer:
					"Yes. Sofa and carpet cleaning is done at your home in Addis Ababa. Tell the provider how many seats or carpets you have when you book.",
			},
			{
				question: "How long until my sofa or carpet is dry?",
				answer:
					"It depends on the fabric and the cleaning method. Ask the provider when you book so you can plan when to use the room again.",
			},
		],
	},
	technical: {
		title: "Technical Services in Addis Ababa | CCTV, WiFi & IT",
		h1: "Technical Services in Addis Ababa",
		description:
			"Book verified technical professionals in Addis Ababa, Ethiopia for CCTV installation, WiFi and network setup, intercom, IT support, and more with Zemen Service.",
		intro:
			"From security camera installation to WiFi and IT support, find verified technical professionals in Addis Ababa on Zemen Service.",
		offered: [
			"CCTV and security camera installation",
			"WiFi and network setup",
			"Intercom and IT support",
			"Verified local technicians",
		],
		keywords: [
			"CCTV installation Addis Ababa",
			"security camera Addis Ababa",
			"WiFi setup Addis Ababa",
			"IT support Addis Ababa",
		],
		faqs: [
			{
				question: "What technical services can I book on Zemen?",
				answer:
					"Browse Technical listings for CCTV installation, WiFi and network setup, intercom, IT support, and other skilled trades available in Addis Ababa.",
			},
		],
	},
	nursing: {
		title: "Premium Home Nursing Services in Addis Ababa",
		h1: "Trusted Home Nursing Services in Addis Ababa",
		description:
			"Book trusted home nursing and care support in Addis Ababa, Ethiopia through verified Zemen Service professionals.",
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
		title: "Premium Home Repair Services in Addis Ababa",
		h1: "Trusted Home Repair Services in Addis Ababa",
		description:
			"Book trusted home repair professionals in Addis Ababa, Ethiopia through Zemen Service.",
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
		title: "Premium Handyman Services in Addis Ababa",
		h1: "Trusted Handyman Services in Addis Ababa",
		description:
			"Book trusted handyman professionals in Addis Ababa, Ethiopia through Zemen Service.",
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
		title: "Maid Agency Near Me | Housemaid Services Addis Ababa",
		h1: "Maid Agency and Housemaid Services in Addis Ababa",
		description:
			"Looking for a maid agency near you in Addis Ababa, Ethiopia? Book verified housemaids and domestic help through Zemen Service — identity-checked providers with clear listing prices.",
		intro:
			"Searching “maid agency near me”? Zemen Service is a trusted maid and housemaid platform in Addis Ababa, Ethiopia. Compare verified domestic help for everyday cleaning, home care, and reliable in-home support — then book online, in the app, or by phone.",
		offered: [
			"Maid agency-style matching in Addis Ababa",
			"Housemaid and domestic help",
			"Verified local providers",
			"Booking via app, website, or call center",
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
		keywords: [
			"maid agency near me",
			"maid agency Addis Ababa",
			"maid agency Ethiopia",
			"housemaid Addis Ababa",
			"maid services Addis Ababa",
			"domestic help near me",
			"የቤት ሰራተኛ አዲስ አበባ",
			"Zemen maid agency",
		],
		faqs: [
			{
				question: "Is Zemen Service a maid agency near me in Addis Ababa?",
				answer:
					"Zemen Service is a home services platform that works like a modern maid agency: you browse verified housemaids near you in Addis Ababa, compare listings, and book with clear support after placement.",
			},
			{
				question: "How do I book a housemaid in Addis Ababa?",
				answer:
					"Browse Housemaid listings on Zemen Service, choose a verified provider, and book through the website or app. You can also call short code 8323 or WhatsApp for help.",
			},
		],
	},
	"office-cleaning": {
		title: "Office Cleaning Service in Addis Ababa",
		h1: "Office Cleaning Services in Addis Ababa",
		description:
			"Book office cleaning services in Addis Ababa, Ethiopia for workplaces, shared desks, and commercial spaces through verified Zemen Service cleaners.",
		intro:
			"Keep your workplace presentable with office cleaning services in Addis Ababa. Book verified cleaners for one-time or recurring office cleans through Zemen Service.",
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
		keywords: [
			"office cleaning Addis Ababa",
			"cleaning service Addis Ababa",
			"commercial cleaning Ethiopia",
		],
		faqs: [
			{
				question: "Can I book recurring office cleaning in Addis Ababa?",
				answer:
					"Yes. Browse office cleaning listings on Zemen Service and choose a schedule that fits your workplace when the provider offers recurring options.",
			},
		],
	},
	maid: {
		title: "Maid Agency Near Me | Maid Services Addis Ababa, Ethiopia",
		h1: "Maid Services and Maid Agency in Addis Ababa",
		description:
			"Find a maid agency near you in Addis Ababa, Ethiopia. Book trusted maid services and domestic help with verified Zemen Service providers.",
		intro:
			"Need a maid agency near you? Book verified maid and domestic help professionals in Addis Ababa through Zemen Service, with clear pricing on each listing.",
		offered: [
			"Maid agency matching in Addis Ababa",
			"Maid and domestic help",
			"Home cleaning support",
			"Verified local providers",
		],
		pricingNote:
			"Listing prices vary by hours and duties. Confirm details when you book.",
		keywords: [
			"maid agency near me",
			"maid agency Addis Ababa",
			"maid services Addis Ababa",
			"housemaid Ethiopia",
		],
		faqs: [
			{
				question: "How do I find a maid agency near me in Ethiopia?",
				answer:
					"Open Housemaid on Zemen Service to browse verified maids near you in Addis Ababa. Book online or call 8323 / WhatsApp for placement help.",
			},
		],
	},
	painting: {
		title: "Premium House Painting in Addis Ababa",
		h1: "Trusted House Painters in Addis Ababa",
		description:
			"Book trusted house painting professionals in Addis Ababa, Ethiopia through Zemen Service.",
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
		title: "Premium Mural Artists in Addis Ababa",
		h1: "Trusted Mural Artists in Addis Ababa",
		description:
			"Book trusted mural artists in Addis Ababa, Ethiopia for walls, daycare spaces, and custom art through Zemen Service.",
		intro:
			"Find verified mural and wall-painting professionals in Addis Ababa for homes, daycare rooms, and custom projects.",
		offered: [
			"Mural and wall art",
			"Daycare and room wall painting",
			"Verified local artists",
		],
		faqs: [],
	},
	"deep-cleaning": {
		title: "Kitchen Deep Cleaning Services Near Me | Addis Ababa",
		h1: "Kitchen Deep Cleaning Services Near You in Addis Ababa",
		description:
			"Book kitchen deep cleaning services near you in Addis Ababa, Ethiopia. Verified cleaners for kitchens, bathrooms, move-in, move-out, and post-construction deep cleans with Zemen Service.",
		intro:
			"Searching for kitchen deep cleaning services near you? Zemen Service matches you with verified deep cleaners in Addis Ababa for grease-heavy kitchens, bathrooms, cabinets, appliance exteriors, move-in and move-out jobs, and post-construction cleanup.",
		offered: [
			"Kitchen deep cleaning near you in Addis Ababa",
			"Bathroom deep cleans and detailed surfaces",
			"Move-in and move-out cleaning",
			"Post-construction and renovation cleanup",
		],
		includes: [
			"Kitchen counters, sinks, cabinets, and appliance exteriors as listed",
			"Detailed bathroom scrubbing",
			"Floors and high-touch surfaces",
		],
		excludes: [
			"Exterior window cleaning at height unless listed",
			"Hazardous construction waste removal unless stated",
		],
		pricingNote:
			"Deep cleans are priced by home size, kitchen condition, and scope. Compare listing prices, then confirm kitchen and bathroom details when you book.",
		keywords: [
			"kitchen deep cleaning services near me",
			"kitchen deep cleaning Addis Ababa",
			"deep cleaning near me",
			"deep cleaning Addis Ababa",
			"kitchen cleaning Addis Ababa",
			"move out cleaning Addis Ababa",
			"post construction cleaning Addis Ababa",
			"Zemen deep cleaning",
		],
		faqs: [
			{
				question: "Can I book kitchen deep cleaning services near me in Addis Ababa?",
				answer:
					"Yes. Open Deep Cleaning on Zemen Service, share your location, and book a verified cleaner for a detailed kitchen clean near you in Addis Ababa.",
			},
			{
				question: "How is deep cleaning different from regular cleaning?",
				answer:
					"Regular cleaning keeps a home tidy week to week. Deep cleaning is a longer, one-time job that covers areas regular visits skip — including kitchen grease, inside cabinets, appliance exteriors, and bathroom grout.",
			},
			{
				question: "Do you offer post-construction cleaning in Addis Ababa?",
				answer:
					"Yes. Choose a deep cleaning listing and describe renovation dust or debris when you book so the provider can confirm the right scope.",
			},
		],
	},
	"packing-moving": {
		title: "Packers and Movers in Addis Ababa | Home Equipment Moving",
		h1: "Packers and Movers in Addis Ababa",
		description:
			"Book packers and movers in Addis Ababa, Ethiopia to wrap, load, move, and unpack home equipment safely with verified Zemen Service providers.",
		intro:
			"Need packers and movers in Addis Ababa? Get verified help packing household equipment, loading trucks, and unpacking at your new place — so your move stays organized from start to finish.",
		offered: [
			"Packing and wrapping household items",
			"Loading, transport, and unloading",
			"Unpacking and setup support",
			"Verified local movers and packers",
		],
		includes: [
			"Packing materials handling as listed by the provider",
			"Careful wrapping of fragile items",
			"Move-day loading and unloading support",
		],
		excludes: [
			"Purchase of all packing materials unless included in the listing",
			"Storage warehouse fees unless offered by the provider",
		],
		pricingNote:
			"Packing and moving rates depend on item volume and distance within Addis Ababa. Check each listing before you book.",
		keywords: [
			"packers and movers Addis Ababa",
			"movers Addis Ababa",
			"home packing Addis Ababa",
			"equipment moving Ethiopia",
		],
		faqs: [
			{
				question: "Can movers pack my belongings in Addis Ababa?",
				answer:
					"Yes. Choose a packing and moving listing on Zemen Service for wrapping, loading, and unpacking support from verified providers.",
			},
			{
				question: "How far in advance should I book movers?",
				answer:
					"Book as early as you can for busy weekends. Same-week moves are often available — share your date and locations when you request a booking.",
			},
		],
	},
	"ac-repair": {
		title: "AC Repair Service in Addis Ababa | Air Conditioner Fix & Service",
		h1: "Air Conditioning Repair Services in Addis Ababa",
		description:
			"Book air conditioning repair services in Addis Ababa, Ethiopia. Verified technicians for AC not cooling, gas refill, cleaning, servicing, and split AC installation through Zemen Service.",
		intro:
			"Need an air conditioning repair service in Addis Ababa? Zemen Service connects you with verified AC technicians for units that are not cooling, unusual noise, leaks, gas refill, filter and coil cleaning, and split AC installation — at home or at the office across neighborhoods like Bole, CMC, Kazanchis, Sarbet, and Ayat.",
		offered: [
			"Air conditioning repair and troubleshooting",
			"Gas refill and refrigerant checks",
			"AC cleaning and preventive servicing",
			"Split AC installation support",
		],
		includes: [
			"Diagnosis of cooling, airflow, and electrical issues as listed",
			"Filter cleaning and basic maintenance where offered",
			"Installation or relocation help when the listing includes it",
		],
		excludes: [
			"Spare parts and refrigerant cost unless stated in the listing",
			"Large commercial chillers or VRF projects unless the provider offers them",
			"Warranty work covered by the manufacturer unless arranged separately",
		],
		pricingNote:
			"AC repair prices in Addis Ababa usually depend on the fault, spare parts, and whether gas refill or a full service is needed. Compare listing rates, then confirm the diagnosis when you book.",
		keywords: [
			"air conditioning repair service Addis Ababa",
			"AC repair Addis Ababa",
			"air conditioner repair Addis Ababa",
			"AC service Addis Ababa",
			"AC gas refill Addis Ababa",
			"split AC installation Addis Ababa",
			"AC cleaning Addis Ababa",
			"HVAC repair Ethiopia",
			"Zemen AC repair",
		],
		faqs: [
			{
				question: "How do I book an air conditioning repair service in Addis Ababa?",
				answer:
					"Open AC Repair & Service on Zemen Service, compare verified technicians, and book through the website or app. You can also call short code 8323 or WhatsApp for help.",
			},
			{
				question: "My AC is not cooling — can a technician come to my home?",
				answer:
					"Yes. Share your location and symptoms when you book. Providers serve homes and offices across Addis Ababa and can diagnose issues like weak cooling, noise, or leaks.",
			},
			{
				question: "Do you offer AC gas refill, cleaning, and installation?",
				answer:
					"Many listings cover repair, gas refill, cleaning/servicing, and split AC installation. Check what each provider includes before you confirm the booking.",
			},
			{
				question: "How often should I service my air conditioner?",
				answer:
					"A preventive service once or twice a year helps cooling and power use. Book AC Repair & Service on Zemen when you need a routine clean or an urgent fix.",
			},
		],
	},
	"appliance-repair": {
		title: "Premium Appliance Repair in Addis Ababa",
		h1: "Home Appliance Repair in Addis Ababa",
		description:
			"Book verified technicians in Addis Ababa, Ethiopia to repair fridges, washing machines, stoves, and other home appliances through Zemen Service.",
		intro:
			"Find verified technicians in Addis Ababa for refrigerator, washing machine, stove, and other household appliance repairs.",
		offered: [
			"Refrigerator and freezer repair",
			"Washing machine repair",
			"Stove and oven repair",
			"Verified local technicians",
		],
		faqs: [],
	},
	domestic: {
		title: "Premium Domestic Help in Addis Ababa",
		h1: "Trusted Domestic Help in Addis Ababa",
		description:
			"Book trusted domestic help and housemaid services in Addis Ababa, Ethiopia through Zemen Service.",
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

/**
 * Live catalog slugs that reuse a copy entry under a different key.
 * Keys are `category` or `category/subcategory` slugs, matched exactly so
 * sibling pages (e.g. cleaning vs. deep cleaning) never share titles.
 */
const COPY_ALIASES: Record<string, string> = {
	"domestic-help": "domestic",
	"domestic-help/cleaning-service": "cleaning",
	"domestic-help/cooking-service": "cooking",
	"domestic-help/housemaid": "housemaid",
	"domestic-help/babysitting": "babysitting",
	"domestic-help/nanny": "nanny",
	"domestic-help/deep-cleaning": "deep-cleaning",
	"maintenance/plumber": "plumbing",
	"maintenance/electrician": "electrician",
	"maintenance/general-handyman": "handyman",
	"maintenance/ac-repair-and-service": "ac-repair",
	"maintenance/appliance-repair": "appliance-repair",
	logistics: "logistics",
	"logistics/furniture-moving": "moving",
	"logistics/home-equipment-packing-and-moving": "packing-moving",
	"art-and-design/painting": "painting",
	technical: "technical",
	"technical/cctv-installation": "cctv-installation",
	"technical/ev-service": "ev-charger",
	"domestic-help/sofa-and-carpet-cleaning": "sofa-carpet-cleaning",
};

function matchCategoryCopy(path: string): CategorySeoCopy | null {
	const key = path.toLowerCase();
	const copyKey = COPY_ALIASES[key] ?? key;
	return CATEGORY_COPY[copyKey] ?? null;
}

/** Hand-written copy for a `category` or `category/subcategory` path, if any. */
export function getSeoCopyForPath(path: string): CategorySeoCopy | null {
	return matchCategoryCopy(path);
}

/** "Laundry Service" → "Laundry Service", "Calligraphy" → "Calligraphy Services". */
function withServicesSuffix(label: string): string {
	const trimmed = label.trim();
	const name = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
	return /\bservices?$/i.test(name) ? name : `${name} Services`;
}

export function getCategorySeoCopy(
	categoryName: string,
	slug: string,
): CategorySeoCopy {
	const matched = matchCategoryCopy(slug);
	if (matched) return matched;

	return {
		title: `Premium ${withServicesSuffix(categoryName)} in Addis Ababa`,
		h1: `Trusted ${withServicesSuffix(categoryName)} in Addis Ababa`,
		description: `Find and book premium, verified ${categoryName.toLowerCase()} professionals in Addis Ababa, Ethiopia through ${BRAND_NAME}.`,
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
	parentSlug: string,
): CategorySeoCopy {
	const matched = matchCategoryCopy(`${parentSlug}/${subSlug}`);
	if (matched) return matched;

	const label = subCategoryName.trim() || parentCategoryName;
	const parent = parentCategoryName.trim() || "home services";

	return {
		title: `Premium ${withServicesSuffix(label)} in Addis Ababa`,
		h1: `Trusted ${withServicesSuffix(label)} in Addis Ababa`,
		description: `Find and book premium, verified ${label.toLowerCase()} professionals in Addis Ababa, Ethiopia under ${parent} through ${BRAND_NAME}.`,
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
	keywords?: string[];
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
		...(input.keywords?.length ? { keywords: input.keywords } : {}),
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
