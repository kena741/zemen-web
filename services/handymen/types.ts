import { sanitizeImageUrl } from "@/lib/media";

export interface Handyman {
	id: string;
	providerId: string | null;
	userId: string | null;
	firstName: string | null;
	lastName: string | null;
	userName: string | null;
	email: string | null;
	phoneNumber: string | null;
	countryCode: string | null;
	category: string | null;
	subCategory: string | null;
	categoryId: string | null;
	subCategoryId: string | null;
	address: string | null;
	profileImage: string | null;
	password: string | null;
	active: boolean;
	isActive: boolean;
	userType: string | null;
	slug: string | null;
	createdAt: string | null;
}

export type HandymanFormValues = {
	firstName: string;
	lastName: string;
	userName: string;
	email: string;
	phoneNumber: string;
	password: string;
	categoryId: string;
	subCategoryId: string;
	category: string;
	subCategory: string;
	address: string;
};

function asString(value: unknown): string | null {
	if (value == null) return null;
	const s = String(value).trim();
	return s.length ? s : null;
}

export function mapHandymanRow(row: Record<string, unknown>): Handyman {
	return {
		id: String(row.id ?? ""),
		providerId: asString(row.provider_id ?? row.providerId),
		userId: asString(row.user_id ?? row.userId),
		firstName: asString(row.firstName),
		lastName: asString(row.lastName),
		userName: asString(row.userName),
		email: asString(row.email),
		phoneNumber: asString(row.phoneNumber),
		countryCode: asString(row.countryCode),
		category: asString(row.category),
		subCategory: asString(row.subCategory),
		categoryId: asString(row.categoryId ?? row.category_id),
		subCategoryId: asString(row.subCategoryId ?? row.sub_category_id),
		address: asString(row.address),
		profileImage: sanitizeImageUrl(row.profileImage),
		password: asString(row.password),
		active: row.active !== false,
		isActive: row.isActive !== false && row.is_active !== false,
		userType: asString(row.userType),
		slug: asString(row.slug),
		createdAt: asString(row.createdAt),
	};
}

export function handymanDisplayName(h: Handyman): string {
	const parts = [h.firstName, h.lastName].filter(Boolean);
	if (parts.length) return parts.join(" ");
	return h.userName || h.email || "Handyman";
}
