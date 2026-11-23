"use client";

import Script from "next/script";
import { useEffect } from "react";

import { GA_MEASUREMENT_ID, trackEvent } from "@/lib/analytics";

/** Contact links that count as leads, tagged with where on the site they were clicked. */
function contactEvent(href: string): { name: string; method: string } | null {
	if (href.startsWith("tel:")) return { name: "contact_click", method: "phone" };
	if (href.includes("wa.me/")) return { name: "contact_click", method: "whatsapp" };
	if (href.includes("t.me/")) return { name: "contact_click", method: "telegram" };
	if (href.includes("play.google.com/store") || href.includes("apps.apple.com")) {
		return { name: "app_store_click", method: href.includes("apple") ? "ios" : "android" };
	}
	return null;
}

/**
 * Loads GA4 when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. GA reads utm_* tags on
 * the landing URL, so visits from the Google Business Profile link show up as
 * their own source; contact and app-store clicks are sent as events.
 */
export function GoogleAnalytics() {
	useEffect(() => {
		if (!GA_MEASUREMENT_ID) return;
		function onClick(event: MouseEvent) {
			const link = (event.target as Element | null)?.closest?.("a[href]");
			if (!link) return;
			const match = contactEvent(link.getAttribute("href") ?? "");
			if (match) {
				trackEvent(match.name, { method: match.method, page_path: window.location.pathname });
			}
		}
		document.addEventListener("click", onClick, { capture: true });
		return () => document.removeEventListener("click", onClick, { capture: true });
	}, []);

	if (!GA_MEASUREMENT_ID) return null;

	return (
		<>
			<Script
				src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
				strategy="afterInteractive"
			/>
			<Script id="ga4-init" strategy="afterInteractive">
				{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
			</Script>
		</>
	);
}
