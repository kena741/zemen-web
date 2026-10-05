/**
 * CORS helpers for Supabase Edge Functions.
 * Origin is never hardcoded — read ALLOWED_ORIGIN from Deno.env.
 * Use ALLOWED_ORIGIN=* to reflect any request Origin (needed when
 * Authorization headers are sent — browsers reject Allow-Origin: *).
 */

function allowedOriginConfig(): string {
	const origin = Deno.env.get("ALLOWED_ORIGIN")?.trim();
	if (!origin) {
		throw new Error("Missing ALLOWED_ORIGIN environment variable");
	}
	return origin;
}

/** Resolve which origin to echo. */
function resolveAllowOrigin(requestOrigin: string): string {
	const allowed = allowedOriginConfig();
	const origin = requestOrigin.trim();

	// Wildcard: reflect the caller's Origin so credentialed/Authorization
	// requests work in browsers (literal * is invalid with Authorization).
	if (allowed === "*") {
		return origin || "*";
	}

	if (origin && origin === allowed) return origin;
	return allowed;
}

export function corsHeaders(origin: string): Record<string, string> {
	return {
		"Access-Control-Allow-Origin": resolveAllowOrigin(origin),
		"Access-Control-Allow-Headers":
			"authorization, x-client-info, apikey, content-type",
		"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		"Access-Control-Max-Age": "86400",
		Vary: "Origin",
	};
}

/**
 * Handle CORS preflight. Returns a 200 Response for OPTIONS, otherwise null
 * so the caller continues processing.
 */
export function handleCors(req: Request): Response | null {
	if (req.method !== "OPTIONS") return null;

	const origin = req.headers.get("Origin") ?? "";
	return new Response(null, {
		status: 200,
		headers: corsHeaders(origin),
	});
}

/** Origin from the incoming request (for attaching CORS to responses). */
export function requestOrigin(req: Request): string {
	return req.headers.get("Origin") ?? "";
}
