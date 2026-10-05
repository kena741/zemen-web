import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Verify the Bearer JWT on the request and return only the user id.
 * Never trust userId from the request body for authorization.
 */
export async function verifyAuth(
	req: Request,
	admin: SupabaseClient,
): Promise<string> {
	const header = req.headers.get("Authorization") || "";
	const match = header.match(/^Bearer\s+(.+)$/i);
	const token = match?.[1]?.trim();
	if (!token) {
		throw new Error("Unauthorized");
	}

	const { data, error } = await admin.auth.getUser(token);
	if (error || !data.user?.id) {
		throw new Error("Unauthorized");
	}

	return data.user.id;
}

/**
 * Pre-auth flows (signup OTP, password reset, login) have no user session.
 * Supabase gateway already validates the project anon/service apikey.
 * Returns user id when a real user JWT is present; otherwise null when a
 * Bearer token is present (anon invoke). Throws if Authorization is missing.
 */
export async function verifyAuthOrAnon(
	req: Request,
	admin: SupabaseClient,
): Promise<string | null> {
	const header = req.headers.get("Authorization") || "";
	const match = header.match(/^Bearer\s+(.+)$/i);
	const token = match?.[1]?.trim();
	if (!token) {
		throw new Error("Unauthorized");
	}

	const { data, error } = await admin.auth.getUser(token);
	if (!error && data.user?.id) {
		return data.user.id;
	}
	return null;
}
