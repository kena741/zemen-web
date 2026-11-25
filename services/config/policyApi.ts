import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabase } from "@/lib/supabase/client";
import { parseObjectValue } from "@/lib/chapa";

export type PolicySlug = "privacy" | "terms" | "about";

const SLUG_KEYS: Record<PolicySlug, string[]> = {
	privacy: ["privacyPolicy", "privacy_policy"],
	terms: ["termsAndConditions", "terms_and_conditions"],
	about: ["aboutApp", "about_app"],
};

function pickHtml(map: Record<string, unknown>, slug: PolicySlug): string {
	for (const key of SLUG_KEYS[slug]) {
		const value = map[key];
		if (typeof value === "string" && value.trim()) return value.trim();
	}
	return "";
}

function normalizePolicyHtml(raw: string): string {
	const trimmed = raw.trim();
	if (!trimmed) return "";
	const html = trimmed.startsWith("<")
		? trimmed
		: trimmed
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"');
	// Stored policies are full documents; keep only the body for embedding.
	const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
	return (body ? body[1] : html).trim();
}

export async function fetchPolicyHtml(
	slug: PolicySlug,
	supabase: SupabaseClient = getSupabase(),
): Promise<{ title: string; html: string; error: string | null }> {
	const titles: Record<PolicySlug, string> = {
		privacy: "Privacy Policy",
		terms: "Terms of Service",
		about: "About Zemen",
	};

	const { data: constantRow } = await supabase
		.from("settings")
		.select("value")
		.eq("id", "constant")
		.maybeSingle();

	const constantMap = parseObjectValue(
		(constantRow as { value?: unknown } | null)?.value,
	);
	let html = pickHtml(constantMap, slug);

	if (!html) {
		const { data: settingsRow } = await supabase
			.from("app_settings")
			.select("data")
			.in("id", ["settings", "policy"])
			.limit(2);

		for (const row of settingsRow ?? []) {
			const map = parseObjectValue((row as { data?: unknown }).data);
			html = pickHtml(map, slug);
			if (html) break;
		}
	}

	return {
		title: titles[slug],
		html: normalizePolicyHtml(html),
		error: html ? null : "Content not available yet.",
	};
}
