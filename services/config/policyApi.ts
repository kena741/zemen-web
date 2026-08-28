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
	if (trimmed.startsWith("<")) return trimmed;
	return trimmed
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"');
}

export async function fetchPolicyHtml(
	slug: PolicySlug,
): Promise<{ title: string; html: string; error: string | null }> {
	const titles: Record<PolicySlug, string> = {
		privacy: "Privacy Policy",
		terms: "Terms of Service",
		about: "About Zemen",
	};

	const { data: constantRow } = await getSupabase()
		.from("settings")
		.select("value")
		.eq("id", "constant")
		.maybeSingle();

	const constantMap = parseObjectValue(
		(constantRow as { value?: unknown } | null)?.value,
	);
	let html = pickHtml(constantMap, slug);

	if (!html) {
		const { data: settingsRow } = await getSupabase()
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
