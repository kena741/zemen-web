import type { AppMode } from "@/lib/brand";
import { sanitizeImageUrl } from "@/lib/media";

export const USER_TYPE_PROVIDER = "Provider";

export interface ProviderProfile {
	id: string;
	userId: string | null;
	email: string | null;
	fullName: string | null;
	phoneNumber: string | null;
	userType: string | null;
	active: boolean;
	profileImage: string | null;
	walletAmount: string | null;
	providerType: string | null;
	address: string | null;
}

export interface CustomerProfile {
	id: string;
	email: string | null;
	fullName: string | null;
	phone: string | null;
	active: boolean | null;
	profileImage: string | null;
	walletAmount: string | null;
}

export interface AuthUser {
	id: string;
	email: string | null;
	name: string;
	mode: AppMode;
	provider: ProviderProfile | null;
	customer: CustomerProfile | null;
}

function joinName(
	first: unknown,
	last: unknown,
	fallback?: unknown,
): string | null {
	const parts = [first, last]
		.map((v) => (v != null ? String(v).trim() : ""))
		.filter(Boolean);
	if (parts.length) return parts.join(" ");
	if (fallback != null && String(fallback).trim()) return String(fallback).trim();
	return null;
}

export function mapProviderRow(row: Record<string, unknown>): ProviderProfile {
	return {
		id: String(row.id ?? ""),
		userId: row.user_id != null ? String(row.user_id) : null,
		email: row.email != null ? String(row.email) : null,
		fullName: joinName(row.firstName, row.lastName, row.userName),
		phoneNumber: row.phoneNumber != null ? String(row.phoneNumber) : null,
		userType: row.userType != null ? String(row.userType) : null,
		active: row.active !== false,
		profileImage: sanitizeImageUrl(row.profileImage),
		walletAmount:
			row.walletAmount != null ? String(row.walletAmount) : "0",
		providerType:
			row.provider_type != null
				? String(row.provider_type)
				: row.providerType != null
					? String(row.providerType)
					: null,
		address: row.address != null ? String(row.address) : null,
	};
}

export function mapCustomerRow(row: Record<string, unknown>): CustomerProfile {
	return {
		id: String(row.id ?? ""),
		email: row.email != null ? String(row.email) : null,
		fullName: joinName(
			row.first_name ?? row.firstName,
			row.last_name ?? row.lastName,
		),
		phone: row.phone != null ? String(row.phone) : null,
		active: row.active == null ? true : Boolean(row.active),
		profileImage: sanitizeImageUrl(
			row.profileImage ?? row.profile_pic,
		),
		walletAmount:
			row.wallet_amount != null
				? String(row.wallet_amount)
				: row.walletAmount != null
					? String(row.walletAmount)
					: "0",
	};
}
