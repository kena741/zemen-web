import { normalizeLocalEthiopianPhone, validateLoginPhoneNumber } from "@/lib/phone";

export type HandymanWriteInput = {
	firstName: string;
	lastName: string;
	userName: string;
	email: string;
	phoneNumber: string;
	password?: string;
	categoryId?: string;
	subCategoryId?: string;
	category?: string;
	subCategory?: string;
	address?: string;
};

export function validateHandymanInput(
	input: HandymanWriteInput,
	opts: { requirePassword: boolean },
): string | null {
	const firstName = input.firstName.trim();
	const lastName = input.lastName.trim();
	const userName = input.userName.trim();
	const email = input.email.trim().toLowerCase();

	if (!firstName || firstName.length < 2 || firstName.length > 20) {
		return "First name must be 2–20 characters.";
	}
	if (!/^[\p{L}\s'-]+$/u.test(firstName)) {
		return "First name can only contain letters.";
	}
	if (!lastName || lastName.length < 2 || lastName.length > 20) {
		return "Last name must be 2–20 characters.";
	}
	if (!/^[\p{L}\s'-]+$/u.test(lastName)) {
		return "Last name can only contain letters.";
	}
	if (!userName || userName.length < 3 || userName.length > 15) {
		return "Username must be 3–15 characters.";
	}
	if (!/^[\p{L}\p{N} ]+$/u.test(userName)) {
		return "Username can only contain letters, numbers, and spaces.";
	}
	if (!email || !/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
		return "Enter a valid email address.";
	}

	const phoneErr = validateLoginPhoneNumber(input.phoneNumber);
	if (phoneErr) return phoneErr;

	if (opts.requirePassword) {
		if (!input.password || input.password.length < 6) {
			return "Password must be at least 6 characters.";
		}
	} else if (input.password && input.password.length < 6) {
		return "Password must be at least 6 characters.";
	}

	return null;
}

export function handymanSlug(
	firstName: string,
	lastName: string,
	userName: string,
): string {
	return `${firstName} ${lastName} ${userName}`
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "");
}

export function normalizeHandymanPhone(raw: string): string {
	return normalizeLocalEthiopianPhone(raw);
}
