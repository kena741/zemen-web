import { verifyAuthOrAnon } from "../_shared/auth.ts";
import { handleCors, requestOrigin, corsHeaders } from "../_shared/cors.ts";
import { getEdgeFunctionsBaseUrl, getSupabaseAnonKey } from "../_shared/env.ts";
import {
	AppError,
	errorResponse,
	errorStatus,
	safeError,
} from "../_shared/errors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";

/** Whitelist of existing edge function names that may be dispatched. */
const ALLOWED_NAMES = new Set([
	"login-customer",
	"signup-customer",
	"signup-provider",
	"reset-password-by-phone",
	"reset-password-by-phone-provider",
	"verify-chapa-activation",
	"verify-service-tier-payment",
	"verify-featured-request-payment",
	"notify-recurring-cycle-due",
]);

const NAME_PATTERN = /^[a-z0-9-]+$/i;

Deno.serve(async (req) => {
	const origin = requestOrigin(req);
	const preflight = handleCors(req);
	if (preflight) return preflight;

	if (req.method !== "POST") {
		return errorResponse("Method not allowed", 405, origin);
	}

	try {
		const admin = getSupabaseAdmin();
		// Pre-auth: login / signup invoke with anon key only.
		await verifyAuthOrAnon(req, admin);

		const body = (await req.json()) as Record<string, unknown>;
		const name = String(body.name ?? "").trim();
		if (!name || !NAME_PATTERN.test(name) || !ALLOWED_NAMES.has(name)) {
			throw new AppError("Invalid function name", 400);
		}

		const { name: _omit, ...payload } = body;
		const base = getEdgeFunctionsBaseUrl();
		const anonKey = getSupabaseAnonKey();
		const authHeader = req.headers.get("Authorization");

		const res = await fetch(`${base}/${name}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: authHeader || `Bearer ${anonKey}`,
			},
			body: JSON.stringify(payload),
		});
		const text = await res.text();
		return new Response(text, {
			status: res.status,
			headers: {
				...corsHeaders(origin),
				"Content-Type": "application/json",
			},
		});
	} catch (e) {
		if (e instanceof TypeError) {
			console.error(e);
			return errorResponse("Edge function unreachable", 502, origin);
		}
		return errorResponse(safeError(e), errorStatus(e), origin);
	}
});
