export function getSiteUrl(): string {
	if (typeof window !== "undefined") return window.location.origin;
	return (
		process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
		process.env.NEXT_PUBLIC_APP_URL?.trim() ||
		"https://zemen-web-ivory.vercel.app"
	);
}

export function getEdgeFunctionsBaseUrl(): string {
	// Browser → same-origin proxy (Supabase edge CORS blocks web origins)
	if (typeof window !== "undefined") return "/api/edge";
	const raw =
		process.env.EDGE_FUNCTIONS_BASE_URL?.trim() ||
		process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_BASE_URL?.trim();
	return raw ? raw.replace(/\/$/, "") : "";
}

export const WEB_APP_VERSION = "0.1.0";
export const WEB_APP_CONFIG_KEY = "zemen_web";
