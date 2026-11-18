import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertDataModeConfig, isBackendMode } from "@/lib/env";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
	if (isBackendMode()) {
		throw new Error(
			"getSupabase() is unavailable when NEXT_PUBLIC_DATA_MODE=backend",
		);
	}
	assertDataModeConfig();

	if (client) return client;

	const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

	if (!url || !anonKey) {
		throw new Error(
			"Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
		);
	}

	client = createClient(url, anonKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true,
			storage:
				typeof window !== "undefined" ? window.localStorage : undefined,
		},
	});

	return client;
}
