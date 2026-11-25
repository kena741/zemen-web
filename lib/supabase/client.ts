import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertDataModeConfig, isBackendMode } from "@/lib/env";
import { createSupabaseBackendStub } from "@/lib/supabase/backend-stub";

let client: SupabaseClient | null = null;
let backendStub: SupabaseClient | null = null;

/**
 * Browser/user Supabase client.
 * Backend data mode never opens a Supabase connection (stub only).
 */
export function getSupabase(): SupabaseClient {
	if (isBackendMode()) {
		backendStub ??= createSupabaseBackendStub();
		return backendStub;
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
