#!/usr/bin/env node
/**
 * CI helper: when NEXT_PUBLIC_DATA_MODE=backend, fail if Supabase public env
 * is present or API URL is missing.
 *
 * Usage: NEXT_PUBLIC_DATA_MODE=backend node scripts/check-backend-isolation.mjs
 */
const mode = (process.env.NEXT_PUBLIC_DATA_MODE || "").trim().toLowerCase();
if (mode !== "backend") {
	console.log("skip: DATA_MODE is not backend");
	process.exit(0);
}

const bad = [];
if (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
	bad.push("NEXT_PUBLIC_SUPABASE_URL must be empty in backend mode");
}
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
	bad.push("NEXT_PUBLIC_SUPABASE_ANON_KEY must be empty in backend mode");
}
if (
	process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_BASE_URL?.trim() ||
	process.env.EDGE_FUNCTIONS_BASE_URL?.trim()
) {
	bad.push("EDGE_FUNCTIONS_* must be empty in backend mode");
}
if (!process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) {
	bad.push("NEXT_PUBLIC_API_BASE_URL is required in backend mode");
}

if (bad.length) {
	console.error("Backend isolation check failed:");
	for (const line of bad) console.error(" -", line);
	process.exit(1);
}

console.log("Backend isolation env check OK");
