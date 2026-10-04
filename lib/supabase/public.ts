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

/** Server-side anon client for public SEO/catalog reads (no session). */
export function getPublicSupabase(): SupabaseClient {
	return createClient(supabaseUrl(), anonKey(), {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}
