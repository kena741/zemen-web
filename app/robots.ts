import type { MetadataRoute } from "next";

import { getMetadataBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
	const base = getMetadataBaseUrl().origin;

	return {
		rules: [
			{
				userAgent: "*",
				allow: [
					"/",
					"/about",
					"/services",
					"/services/",
					"/locations/",
					"/legal/",
				],
				disallow: [
					"/login",
					"/signup",
					"/register",
					"/forgot-password",
					"/reset-password",
					"/verify-email",
					"/verify-phone",
					"/dashboard",
					"/account",
					"/wallet",
					"/bookings",
					"/checkout",
					"/provider",
					"/provider/",
					"/service",
					"/service/",
					"/pay",
					"/pay/",
					"/admin",
					"/admin/",
					"/api",
					"/api/",
					"/maintenance",
					"/force-update",
				],
			},
		],
		sitemap: `${base}/sitemap.xml`,
		host: base,
	};
}
