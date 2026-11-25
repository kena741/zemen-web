import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEYS = [
	"NEXT_PUBLIC_DATA_MODE",
	"NEXT_PUBLIC_API_BASE_URL",
	"API_BASE_URL",
	"NEXT_PUBLIC_SUPABASE_URL",
	"NEXT_PUBLIC_SUPABASE_ANON_KEY",
	"SUPABASE_URL",
] as const;

const saved: Record<string, string | undefined> = {};

function stash() {
	for (const k of KEYS) saved[k] = process.env[k];
}

function restore() {
	for (const k of KEYS) {
		if (saved[k] === undefined) delete process.env[k];
		else process.env[k] = saved[k];
	}
}

function clear() {
	for (const k of KEYS) delete process.env[k];
}

beforeEach(() => {
	stash();
	clear();
	vi.resetModules();
});

afterEach(() => {
	restore();
});

describe("assertDataModeConfig", () => {
	it("requires API URL in backend mode", async () => {
		process.env.NEXT_PUBLIC_DATA_MODE = "backend";
		const { assertDataModeConfig } = await import("@/lib/env");
		expect(() => assertDataModeConfig()).toThrow(/API_BASE_URL/);
	});

	it("allows leftover supabase public env in backend mode (Turbopack stale inline)", async () => {
		process.env.NEXT_PUBLIC_DATA_MODE = "backend";
		process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
		const { assertDataModeConfig, isBackendMode } = await import("@/lib/env");
		expect(() => assertDataModeConfig()).not.toThrow();
		expect(isBackendMode()).toBe(true);
	});

	it("accepts backend mode with API URL only", async () => {
		process.env.NEXT_PUBLIC_DATA_MODE = "backend";
		process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
		const { assertDataModeConfig, isBackendMode } = await import("@/lib/env");
		expect(() => assertDataModeConfig()).not.toThrow();
		expect(isBackendMode()).toBe(true);
	});
});
