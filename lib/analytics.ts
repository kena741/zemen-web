/** GA4 measurement ID; tracking stays off until it is set. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
	interface Window {
		gtag?: (command: "event" | "config" | "js", target: string | Date, params?: GtagParams) => void;
	}
}

/** Sends a GA4 event; a no-op on the server or when GA isn't configured. */
export function trackEvent(name: string, params: GtagParams = {}) {
	if (typeof window === "undefined" || !window.gtag) return;
	window.gtag("event", name, params);
}
