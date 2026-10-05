import { verifyAuthOrAnon } from "../_shared/auth.ts";
import { handleCors, requestOrigin } from "../_shared/cors.ts";
import { getSmsApiBaseUrl } from "../_shared/env.ts";
import {
	AppError,
	errorResponse,
	errorStatus,
	safeError,
} from "../_shared/errors.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseAdmin } from "../_shared/supabase.ts";

const ALLOWED_ACTIONS = new Set(["send-otp", "verify-otp"]);

Deno.serve(async (req) => {
	const origin = requestOrigin(req);
	const preflight = handleCors(req);
	if (preflight) return preflight;

	if (req.method !== "POST") {
		return errorResponse("Method not allowed", 405, origin);
	}

	try {
		const admin = getSupabaseAdmin();
		// Pre-auth: signup / password-reset OTP have no user session yet.
		await verifyAuthOrAnon(req, admin);

		const body = (await req.json()) as Record<string, unknown>;
		const action = String(body.action ?? "").trim();
		if (!ALLOWED_ACTIONS.has(action)) {
			throw new AppError("Unknown SMS action", 404);
		}

		const { action: _omit, ...payload } = body;
		const smsBase = getSmsApiBaseUrl();

		// Direct fetch to SMS REST API (no Node SDK).
		const res = await fetch(`${smsBase}/sms/${action}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
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
			return errorResponse("SMS service unreachable", 502, origin);
		}
		return errorResponse(safeError(e), errorStatus(e), origin);
	}
});
