import { apiFetch } from "@/lib/backend/client";
import { isBackendMode } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";

export type Coupon = {
	id: string;
	title: string | null;
	code: string | null;
	amount: number;
	minAmount: number;
	isFix: boolean;
	active: boolean;
	isPrivate: boolean;
	expireAt: string | null;
};

function parseExpire(raw: unknown): string | null {
	if (raw == null) return null;
	const s = String(raw);
	return s || null;
}

export function mapCouponRow(row: Record<string, unknown>): Coupon {
	return {
		id: String(row.id ?? ""),
		title: row.title != null ? String(row.title) : null,
		code: row.code != null ? String(row.code) : null,
		amount: Number(row.amount ?? 0) || 0,
		minAmount: Number(row.minAmount ?? row.min_amount ?? 0) || 0,
		isFix: row.isFix === true || row.is_fix === true,
		active: row.active === true,
		isPrivate: row.isPrivate === true || row.is_private === true,
		expireAt: parseExpire(
			row.expiredAt ?? row.expireAt ?? row.expire_at,
		),
	};
}

export function isCouponAvailable(coupon: Coupon): boolean {
	if (!coupon.active || coupon.isPrivate) return false;
	if (!coupon.expireAt) return true;
	const exp = new Date(coupon.expireAt);
	if (Number.isNaN(exp.getTime())) return true;
	return exp.getTime() > Date.now();
}

export function couponDiscount(coupon: Coupon, subtotal: number): number {
	if (subtotal < coupon.minAmount) return 0;
	if (coupon.isFix) return Math.min(coupon.amount, subtotal);
	const pct = (subtotal * coupon.amount) / 100;
	return Math.min(pct, subtotal);
}

export async function fetchPublicCoupons(): Promise<{
	coupons: Coupon[];
	error: string | null;
}> {
	if (isBackendMode()) {
		try {
			const rows = await apiFetch<Record<string, unknown>[]>(
				"/catalog/coupons",
			);
			const coupons = (rows ?? [])
				.map((r) => mapCouponRow(r))
				.filter(isCouponAvailable);
			return { coupons, error: null };
		} catch (e) {
			return {
				coupons: [],
				error: e instanceof Error ? e.message : "Failed to load coupons",
			};
		}
	}

	const { data, error } = await getSupabase().from("coupon").select("*");
	if (error) {
		console.error("fetchPublicCoupons", error);
		return { coupons: [], error: error.message };
	}
	const coupons = (data ?? [])
		.map((r) => mapCouponRow(r as Record<string, unknown>))
		.filter(isCouponAvailable);
	return { coupons, error: null };
}

export async function fetchCouponByCode(
	code: string,
): Promise<{ coupon: Coupon | null; error: string | null }> {
	const trimmed = code.trim();
	if (!trimmed) return { coupon: null, error: "Enter a coupon code." };

	if (isBackendMode()) {
		try {
			const row = await apiFetch<Record<string, unknown>>(
				`/catalog/coupons/by-code/${encodeURIComponent(trimmed)}`,
			);
			const coupon = mapCouponRow(row);
			if (!isCouponAvailable(coupon)) {
				return { coupon: null, error: "Coupon not found or expired." };
			}
			return { coupon, error: null };
		} catch {
			return { coupon: null, error: "Coupon not found or expired." };
		}
	}

	const { data, error } = await getSupabase()
		.from("coupon")
		.select("*")
		.ilike("code", trimmed);

	if (error) {
		console.error("fetchCouponByCode", error);
		return { coupon: null, error: error.message };
	}

	for (const row of data ?? []) {
		const coupon = mapCouponRow(row as Record<string, unknown>);
		if (
			(coupon.code ?? "").toLowerCase() === trimmed.toLowerCase() &&
			isCouponAvailable(coupon)
		) {
			return { coupon, error: null };
		}
	}
	return { coupon: null, error: "Coupon not found or expired." };
}
