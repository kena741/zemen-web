import { afterEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = [
	"NEXT_PUBLIC_DATA_MODE",
	"NEXT_PUBLIC_API_BASE_URL",
	"NEXT_PUBLIC_SUPABASE_URL",
	"NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

describe("supabase clients in backend mode", () => {
	const prev: Record<string, string | undefined> = {};

	afterEach(() => {
		for (const key of ENV_KEYS) {
			if (prev[key] === undefined) delete process.env[key];
			else process.env[key] = prev[key];
			delete prev[key];
		}
		vi.resetModules();
	});

	it("never constructs a real Supabase client", async () => {
		for (const key of ENV_KEYS) prev[key] = process.env[key];
		process.env.NEXT_PUBLIC_DATA_MODE = "backend";
		process.env.NEXT_PUBLIC_API_BASE_URL =
			"https://zemen-service-backend-staging.example";
		delete process.env.NEXT_PUBLIC_SUPABASE_URL;
		delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		const createClient = vi.fn(() => {
			throw new Error("createClient must not run in backend mode");
		});
		vi.doMock("@supabase/supabase-js", () => ({ createClient }));

		const { getSupabase } = await import("@/lib/supabase/client");
		const { getPublicSupabase } = await import("@/lib/supabase/public");

		const client = getSupabase();
		const pub = getPublicSupabase();
		const row = await client.from("provider").select("*").maybeSingle();
		const pubRow = await pub.from("blog").select("*").maybeSingle();

		expect(createClient).not.toHaveBeenCalled();
		expect(row.error).toBeNull();
		expect(pubRow.error).toBeNull();
	});
});
