#!/usr/bin/env node
/**
 * Production frontend flip gate: prod OpenAPI must expose auth login + storage upload.
 *
 * Usage:
 *   node scripts/check-prod-backend-gate.mjs [openapi-url-or-file]
 * Default file: docs/api/openapi-prod.json
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED = [
	"/api/v1/auth/login",
	"/api/v1/auth/session/restore",
	"/api/v1/storage/upload",
];

const input = process.argv[2] || "docs/api/openapi-prod.json";

async function loadOpenApi(src) {
	if (/^https?:\/\//i.test(src)) {
		const res = await fetch(src);
		if (!res.ok) throw new Error(`Failed to fetch ${src}: ${res.status}`);
		return res.json();
	}
	const text = readFileSync(resolve(src), "utf8");
	return JSON.parse(text);
}

const spec = await loadOpenApi(input);
const paths = spec.paths || {};
const missing = REQUIRED.filter((p) => !paths[p]);

if (missing.length) {
	console.error("Prod backend gate FAILED — missing paths:");
	for (const p of missing) console.error(" -", p);
	console.error(
		"Do not flip production frontend to DATA_MODE=backend until these exist.",
	);
	process.exit(1);
}

console.log("Prod backend gate OK:", REQUIRED.join(", "));
