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

/**
 * Paid-plan create cap when unpaid had a legacy 1-slot allotment.
 * Free categories (see fetchFreeServiceCategories) never consume this.
 */
export const FREE_SERVICE_LIMIT = 1;

/** Effective create/list cap for *paid-plan* (non-free-category) listings. */
export function serviceCreateLimit(tierMax: number): number {
	const max = Number(tierMax) || 0;
	if (isUnlimitedTier(max)) return Number.POSITIVE_INFINITY;
	if (max >= 1) return max;
	// Unpaid: no non-free slot — free categories only until upgrade.
	return 0;
}

export function canCreateService(
	tierMax: number,
	planUsageCount: number,
): boolean {
	return planUsageCount < serviceCreateLimit(tierMax);
}

export function isOnFreeServicePlan(tierMax: number): boolean {
	const max = Number(tierMax) || 0;
	return max === 0;
}

export type FreeServiceCategories = {
	ids: string[];
	/** Lowercase category name fragments / exact names from settings or defaults. */
	names: string[];
};

/** Fallback when app_settings has no free_service_categories list. */
const DEFAULT_FREE_CATEGORY_NAMES = ["cleaning", "chef", "cook"];

/**
 * Free listing categories from `app_settings.constant`:
 * `free_service_categories` | `free_services` (ids and/or names).
 */
export async function fetchFreeServiceCategories(): Promise<FreeServiceCategories> {
	const { data, error } = await getSupabase()
		.from("app_settings")
		.select("data")
		.eq("id", "constant")
		.maybeSingle();

	if (error || !data) {
		return { ids: [], names: [...DEFAULT_FREE_CATEGORY_NAMES] };
	}

	const root = parseObjectValue(
		(data as { data?: unknown } | null)?.data ?? data,
	);
	const raw =
		root.free_service_categories ??
		root.freeServiceCategories ??
		root.free_services ??
		root.freeServices;

	const ids: string[] = [];
	const names: string[] = [];

	if (Array.isArray(raw)) {
		for (const item of raw) {
			if (typeof item === "string") {
				const s = item.trim();
				if (!s) continue;
				if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
					ids.push(s);
				} else {
					names.push(s.toLowerCase());
				}
				continue;
			}
			if (item && typeof item === "object") {
				const row = item as Record<string, unknown>;
				if (row.id != null) ids.push(String(row.id).trim());
				const label = row.categoryName ?? row.category_name ?? row.name;
				if (label != null) names.push(String(label).trim().toLowerCase());
			}
		}
	}

	if (ids.length === 0 && names.length === 0) {
		return { ids: [], names: [...DEFAULT_FREE_CATEGORY_NAMES] };
	}
	return { ids, names: names.filter(Boolean) };
}

export function isFreeServiceCategory(
	categoryId: string | null | undefined,
	categoryName: string | null | undefined,
	free: FreeServiceCategories,
): boolean {
	const id = (categoryId ?? "").trim();
	if (id && free.ids.includes(id)) return true;
	const name = (categoryName ?? "").trim().toLowerCase();
	if (!name) return false;
	return free.names.some((n) => n && (name === n || name.includes(n)));
}

export function countPlanUsageServices(
	services: Array<{
		archived?: boolean;
		categoryId?: string | null;
		categoryName?: string | null;
	}>,
	free: FreeServiceCategories,
): number {
	return services.filter((s) => {
		if (s.archived) return false;
		return !isFreeServiceCategory(s.categoryId, s.categoryName, free);
	}).length;
}

/** Free categories always allowed; non-free require paid tier capacity. */
export function canCreateServiceListing(params: {
	tierMax: number;
	planUsageCount: number;
	categoryIsFree: boolean;
}): boolean {
	if (params.categoryIsFree) return true;
	return canCreateService(params.tierMax, params.planUsageCount);
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
