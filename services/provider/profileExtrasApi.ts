import { getSupabase } from "@/lib/supabase/client";
import { parseObjectValue } from "@/lib/chapa";
import { formatAmount } from "@/services/bookings/types";
import type { ServiceTier } from "@/services/provider/tiersApi";

export interface AdminCommission {
	active: boolean;
	isFix: boolean;
	value: number;
}

function asBool(value: unknown, fallback = false): boolean {
	if (value == null) return fallback;
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value !== 0;
	const s = String(value).trim().toLowerCase();
	if (s === "true" || s === "1" || s === "yes") return true;
	if (s === "false" || s === "0" || s === "no" || s === "") return false;
	return fallback;
}

function parseCommission(raw: unknown): AdminCommission | null {
	const map = parseObjectValue(raw);
	if (!Object.keys(map).length && raw && typeof raw === "object") {
		Object.assign(map, raw as Record<string, unknown>);
	}
	const valueRaw = map.value ?? map.Value;
	if (
		valueRaw == null &&
		map.active == null &&
		map.Active == null &&
		map.isFix == null
	) {
		return null;
	}
	const value = Number(
		String(valueRaw ?? "")
			.replace(/[%\s,]/g, "")
			.trim(),
	);
	return {
		active: asBool(map.active ?? map.Active, true),
		isFix: asBool(map.isFix ?? map.is_fix ?? map.IsFix),
		value: Number.isFinite(value) ? value : 0,
	};
}

export async function fetchAdminCommission(): Promise<AdminCommission | null> {
	const supabase = getSupabase();

	const { data: appRow } = await supabase
		.from("app_settings")
		.select("data")
		.eq("id", "admin_commission")
		.maybeSingle();
	const fromApp = parseCommission(
		(appRow as { data?: unknown } | null)?.data ?? appRow,
	);
	if (fromApp) return fromApp;

	const { data: settingsRow } = await supabase
		.from("settings")
		.select("*")
		.eq("id", "admin_commission")
		.maybeSingle();
	if (!settingsRow) return null;
	const row = settingsRow as Record<string, unknown>;
	return parseCommission(row.data ?? row);
}

/** Matches mobile profile badge — shows value whenever commission exists. */
export function formatAdminCommissionLabel(
	commission: AdminCommission | null,
	format: (amount: string | number) => string = formatAmount,
): string {
	if (!commission) return "--";
	if (commission.isFix) return format(commission.value);
	return `${commission.value}%`;
}

export function planTitleForTier(
	tier: ServiceTier | null,
	labels: {
		unlimited: string;
		starter: string;
		growth: string;
		business: string;
		services: (count: number) => string;
	},
): string {
	if (!tier) return labels.starter;
	if (tier.max_services < 0) return labels.unlimited;
	if (tier.max_services === 1) return labels.starter;
	if (tier.max_services === 4) return labels.growth;
	if (tier.max_services === 10) return labels.business;
	return labels.services(tier.max_services);
}

export function planSubtitleForTier(
	tier: ServiceTier | null,
	labels: {
		unlimited: string;
		one: string;
		upTo: (count: number) => string;
	},
): string {
	if (!tier) return "";
	if (tier.max_services < 0) return labels.unlimited;
	if (tier.max_services === 1) return labels.one;
	return labels.upTo(tier.max_services);
}
