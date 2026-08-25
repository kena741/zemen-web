import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function supabaseUrl(): string {
	const url =
		process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
		process.env.SUPABASE_URL?.trim();
	if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL");
	return url;
}

function anonKey(): string {
	const key =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
		process.env.SUPABASE_ANON_KEY?.trim();
	if (!key) {
		throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY");
	}
	return key;
}

function serviceRoleKey(): string {
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
	if (!key) {
		throw new Error(
			"Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local for handyman create/delete.",
		);
	}
	return key;
}

/** Privileged server client — never import into client components. */
export function getSupabaseAdmin(): SupabaseClient {
	return createClient(supabaseUrl(), serviceRoleKey(), {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}

/** User-scoped client from a bearer access token. */
export function getSupabaseForToken(accessToken: string): SupabaseClient {
	return createClient(supabaseUrl(), anonKey(), {
		global: {
			headers: { Authorization: `Bearer ${accessToken}` },
		},
		auth: { persistSession: false, autoRefreshToken: false },
	});
}

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

export async function getAuthUserFromRequest(req: Request): Promise<{
	userId: string | null;
	accessToken: string | null;
	error: string | null;
}> {
	const header = req.headers.get("authorization") || "";
	const match = header.match(/^Bearer\s+(.+)$/i);
	const accessToken = match?.[1]?.trim() || null;
	if (!accessToken) {
		return { userId: null, accessToken: null, error: "Unauthorized" };
	}

	const client = getSupabaseForToken(accessToken);
	const { data, error } = await client.auth.getUser();
	if (error || !data.user) {
		return {
			userId: null,
			accessToken,
			error: error?.message ?? "Unauthorized",
		};
	}
	return { userId: data.user.id, accessToken, error: null };
}
