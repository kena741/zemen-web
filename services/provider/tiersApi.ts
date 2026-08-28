import { getSupabase } from "@/lib/supabase/client";

export interface ServiceTier {
	max_services: number;
	total_price: number;
	label?: string;
}

export async function fetchServicePostingTiers(): Promise<{
	tiers: ServiceTier[];
	currentMax: number;
	error: string | null;
}> {
	const { data, error } = await getSupabase()
		.from("app_settings")
		.select("data")
		.eq("id", "constant")
		.maybeSingle();

	if (error) return { tiers: [], currentMax: 0, error: error.message };

	const raw = (data?.data as Record<string, unknown> | undefined)
		?.service_posting_tiers;
	if (!Array.isArray(raw)) return { tiers: [], currentMax: 0, error: null };

	const tiers = raw
		.map((item) => {
			const row = item as Record<string, unknown>;
			return {
				max_services: Number(row.max_services ?? 0),
				total_price: Number(row.total_price ?? 0),
				label: row.label != null ? String(row.label) : undefined,
			};
		})
		.filter((t) => t.max_services > 0 && t.total_price > 0)
		.sort((a, b) => a.max_services - b.max_services);

	return { tiers, currentMax: 0, error: null };
}

export async function fetchProviderTierMax(
	providerId: string,
): Promise<number> {
	const { data } = await getSupabase()
		.from("provider")
		.select("service_tier_max")
		.eq("id", providerId)
		.maybeSingle();
	return Number((data as { service_tier_max?: number } | null)?.service_tier_max ?? 0);
}
