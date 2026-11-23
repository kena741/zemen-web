import type { Metadata } from "next";

import { BecomeProviderView } from "@/components/marketing/become-provider";
import { buildPageMetadata } from "@/lib/seo-services";

export const metadata: Metadata = buildPageMetadata({
	title: "Become a Service Provider in Addis Ababa",
	description:
		"Join Zemen Service as a home service professional in Addis Ababa, Ethiopia. Sign up, verify your Fayda ID and documents, list your services and receive bookings.",
	path: "/become-a-provider",
	keywords: [
		"become a service provider Addis Ababa",
		"join Zemen Service",
		"cleaning jobs Addis Ababa",
		"handyman jobs Addis Ababa",
		"home service business Ethiopia",
	],
});

export default function BecomeProviderPage() {
	return <BecomeProviderView />;
}
