import { getSupabase } from "@/lib/supabase/client";
import { parseObjectValue } from "@/lib/chapa";

export interface ServiceTier {
	max_services: number;
	total_price: number;
	label?: string;
}

export function isUnlimitedTier(maxServices: number): boolean {
	return Number(maxServices) < 0;
}

export function sortServiceTiers(tiers: ServiceTier[]): ServiceTier[] {
	return [...tiers].sort((a, b) => {
		if (isUnlimitedTier(a.max_services)) return 1;
		if (isUnlimitedTier(b.max_services)) return -1;
		return a.max_services - b.max_services;
	});
}

function parseTierMax(raw: unknown): number {
	if (typeof raw === "number" && Number.isFinite(raw)) return Math.trunc(raw);
	const n = Number(String(raw ?? "").trim());
	return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function parseTierPrice(raw: unknown): number {
	const n = Number(raw);
	return Number.isFinite(n) ? n : 0;
}

/** Tiers above the current plan. Unlimited (`max_services < 0`) is always last. */
export function purchasableServiceTiers(
	tiers: ServiceTier[],
	currentTierMax: number,
): ServiceTier[] {
	const sorted = sortServiceTiers(tiers);
	const current = Number(currentTierMax) || 0;
	if (isUnlimitedTier(current)) return [];
	if (current === 0) return sorted;

	const currentIdx = sorted.findIndex((t) => t.max_services === current);
	if (currentIdx >= 0) {
		return sorted.slice(currentIdx + 1);
	}

	// Current plan not in catalog: keep anything higher, plus unlimited.
	return sorted.filter(
		(t) => isUnlimitedTier(t.max_services) || t.max_services > current,
	);
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

	const root = parseObjectValue(
		(data as { data?: unknown } | null)?.data ?? data,
	);
	const raw = root.service_posting_tiers ?? root.servicePostingTiers;
	if (!Array.isArray(raw)) return { tiers: [], currentMax: 0, error: null };

	// Match mobile: keep every tier with price > 0 (includes max_services: -1 unlimited).
	const tiers = sortServiceTiers(
		raw
			.map((item) => {
				const row = (item ?? {}) as Record<string, unknown>;
				return {
					max_services: parseTierMax(row.max_services ?? row.maxServices),
					total_price: parseTierPrice(row.total_price ?? row.totalPrice),
					label: row.label != null ? String(row.label) : undefined,
				};
			})
			.filter((t) => t.total_price > 0),
	);

	return { tiers, currentMax: 0, error: null };
}

export async function fetchProviderTierMax(
	providerId: string,
): Promise<number> {
	if (!providerId) return 0;
	const { data } = await getSupabase()
		.from("provider")
		.select("service_tier_max")
		.eq("id", providerId)
		.maybeSingle();
	return parseTierMax(
		(data as { service_tier_max?: unknown } | null)?.service_tier_max,
	);
}

/** Mobile ServiceTierUtils.upgradeAmount — charge delta, not full tier price. */
export function tierUpgradeAmount(
	tiers: ServiceTier[],
	fromTierMax: number,
	toTierMax: number,
): number {
	const toTier = tiers.find((t) => t.max_services === toTierMax);
	if (!toTier) return 0;
	if (!fromTierMax) return toTier.total_price;
	const fromTier = tiers.find((t) => t.max_services === fromTierMax);
	if (!fromTier) return toTier.total_price;
	const diff = toTier.total_price - fromTier.total_price;
	return diff > 0 ? Math.round(diff * 100) / 100 : 0;
}
