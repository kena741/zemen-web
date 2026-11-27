export type DataMode = "supabase" | "backend";

function rawDataMode(): string {
	return (process.env.NEXT_PUBLIC_DATA_MODE ?? "").trim().toLowerCase();
}

/**
 * Resolve data mode. Unset defaults to supabase when a Supabase URL exists
 * (local/main DX); staging/prod must set NEXT_PUBLIC_DATA_MODE=backend explicitly.
 */
export function getDataMode(): DataMode {
	const raw = rawDataMode();
	if (raw === "backend" || raw === "supabase") return raw;
	if (raw) {
		throw new Error(
			`Invalid NEXT_PUBLIC_DATA_MODE="${raw}". Use "supabase" or "backend".`,
		);
	}
	if (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) return "supabase";
	if (getApiBaseUrl()) return "backend";
	return "supabase";
}

export function isBackendMode(): boolean {
	return getDataMode() === "backend";
}

export function isSupabaseMode(): boolean {
	return getDataMode() === "supabase";
}

/** FastAPI Cloud Run base (no trailing slash). */
export function getApiBaseUrl(): string {
	const raw =
		process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
		process.env.API_BASE_URL?.trim();
	return raw ? raw.replace(/\/$/, "") : "";
}

/** Throws if env combo is illegal for the active mode. Call from apiFetch / getSupabase. */
export function assertDataModeConfig(): void {
	const mode = getDataMode();
	if (mode === "backend") {
		if (!getApiBaseUrl()) {
			throw new Error(
				"NEXT_PUBLIC_DATA_MODE=backend requires NEXT_PUBLIC_API_BASE_URL",
			);
		}
		// ponytail: ignore leftover NEXT_PUBLIC_SUPABASE_* — Turbopack can keep
		// stale inlined values after .env.local swaps; backend already stubs Supabase.
	} else {
		if (
			!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
			!process.env.SUPABASE_URL?.trim()
		) {
			throw new Error(
				"NEXT_PUBLIC_DATA_MODE=supabase requires NEXT_PUBLIC_SUPABASE_URL",
			);
		}
	}
}

export function getSiteUrl(): string {
	if (typeof window !== "undefined") return window.location.origin;
	return (
		process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
		process.env.NEXT_PUBLIC_APP_URL?.trim() ||
		"https://zemenservice.com"
	);
}

/** Prefer the host the browser actually hit (staging Cloud Run ≠ production domain). */
export function getSiteUrlFromRequest(request: Request): string {
	const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
	const host = forwardedHost || request.headers.get("host")?.trim();
	const proto =
		request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
	if (host) return `${proto}://${host}`.replace(/\/$/, "");
	return getSiteUrl().replace(/\/$/, "");
}

export function getEdgeFunctionsBaseUrl(): string {
	// ponytail: empty in backend — callers already treat "" as "not configured"
	if (isBackendMode()) return "";
	// Browser → same-origin proxy (Supabase edge CORS blocks web origins)
	if (typeof window !== "undefined") return "/api/edge";
	const raw =
		process.env.EDGE_FUNCTIONS_BASE_URL?.trim() ||
		process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_BASE_URL?.trim();
	return raw ? raw.replace(/\/$/, "") : "";
}

export const WEB_APP_VERSION = "0.1.0";
export const WEB_APP_CONFIG_KEY = "zemen_web";
