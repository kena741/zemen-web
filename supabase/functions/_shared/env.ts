/**
 * Site / upstream URL helpers for Edge Functions.
 * Never hardcode production origins — read from Deno.env.
 */

/** Public site URL used for Chapa return_url construction. */
export function getSiteUrl(): string {
	const url =
		Deno.env.get("SITE_URL")?.trim() ||
		Deno.env.get("NEXT_PUBLIC_SITE_URL")?.trim() ||
		Deno.env.get("ALLOWED_ORIGIN")?.trim();
	if (!url) {
		throw new Error(
			"Missing SITE_URL (or NEXT_PUBLIC_SITE_URL / ALLOWED_ORIGIN)",
		);
	}
	return url.replace(/\/$/, "");
}

/** Upstream SMS API base (without trailing slash). */
export function getSmsApiBaseUrl(): string {
	const raw =
		Deno.env.get("SMS_API_BASE_URL")?.trim() || "https://betegna-ai.vercel.app";
	return raw.replace(/\/$/, "");
}

/**
 * Base URL for existing Supabase Edge Functions (used by dynamic-edge
 * and nested verify calls). Prefer EDGE_FUNCTIONS_BASE_URL.
 */
export function getEdgeFunctionsBaseUrl(): string {
	const raw =
		Deno.env.get("EDGE_FUNCTIONS_BASE_URL")?.trim() ||
		Deno.env.get("NEXT_PUBLIC_EDGE_FUNCTIONS_BASE_URL")?.trim();
	if (!raw) {
		const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
		if (supabaseUrl) {
			return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
		}
		throw new Error("Missing EDGE_FUNCTIONS_BASE_URL / SUPABASE_URL");
	}
	return raw.replace(/\/$/, "");
}

export function getSupabaseAnonKey(): string {
	const key =
		Deno.env.get("SUPABASE_ANON_KEY")?.trim() ||
		Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")?.trim();
	if (!key) {
		throw new Error("Missing SUPABASE_ANON_KEY");
	}
	return key;
}
