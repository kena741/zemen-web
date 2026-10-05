export function getSiteUrl(): string {
	if (typeof window !== "undefined") return window.location.origin;
	return (
		process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
		process.env.NEXT_PUBLIC_APP_URL?.trim() ||
		"https://zemen-web-ivory.vercel.app"
	);
}

/**
 * Public Edge Functions base URL (no longer proxies through /api/edge).
 * Prefer `invokeFunction` / `supabase.functions.invoke` in app code.
 */
export function getEdgeFunctionsBaseUrl(): string {
	const raw =
		process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_BASE_URL?.trim() ||
		process.env.EDGE_FUNCTIONS_BASE_URL?.trim();
	if (raw) return raw.replace(/\/$/, "");

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
	if (supabaseUrl) {
		return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
	}
	return "";
}

export const WEB_APP_VERSION = "0.1.0";
export const WEB_APP_CONFIG_KEY = "zemen_web";
