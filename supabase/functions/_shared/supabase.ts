import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Privileged admin client for Edge Functions.
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from Deno.env.
 * Never log or expose the service role key.
 */
export function getSupabaseAdmin(): SupabaseClient {
	const url = Deno.env.get("SUPABASE_URL")?.trim();
	const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

	if (!url) {
		throw new Error("Missing SUPABASE_URL environment variable");
	}
	if (!serviceRoleKey) {
		throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
	}

	return createClient(url, serviceRoleKey, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}

/**
 * Resolve the provider row id for an authenticated auth user.
 * Matches Next.js lib/supabase/admin.resolveProviderIdForAuthUser.
 */
export async function resolveProviderIdForAuthUser(
	admin: SupabaseClient,
	authUserId: string,
): Promise<string | null> {
	let { data } = await admin
		.from("provider")
		.select("id, userType, active")
		.eq("id", authUserId)
		.maybeSingle();

	if (!data) {
		({ data } = await admin
			.from("provider")
			.select("id, userType, active")
			.eq("user_id", authUserId)
			.maybeSingle());
	}

	if (!data) return null;
	if (data.active === false) return null;
	if (data.userType && data.userType !== "Provider") return null;
	return String(data.id);
}
