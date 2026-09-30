/** Chapa payout banks — mirrors mobile bank_detail_screen_controller defaults. */

export type ChapaBankOption = {
	id: string;
	slug: string;
	name: string;
	swift: string;
	acctLength: number;
};

/** Banks that accept any length up to acctLength (not exact). */
const MAX_LENGTH_SLUGS = new Set([
	"addis_int_bank",
	"anbesa_bank",
	"nib_bank",
]);

export const CHAPA_BANKS: ChapaBankOption[] = [
	{ id: "130", slug: "abay_bank", swift: "ABAYETAA", name: "Abay Bank", acctLength: 16 },
	{ id: "772", slug: "addis_int_bank", swift: "ABSCETAA", name: "Addis International Bank", acctLength: 15 },
	{ id: "207", slug: "ahadu_bank", swift: "AHUUETAA", name: "Ahadu Bank", acctLength: 10 },
	{ id: "656", slug: "awash_bank", swift: "AWINETAA", name: "Awash Bank", acctLength: 14 },
	{ id: "347", slug: "boa_bank", swift: "ABYSETAA", name: "Bank of Abyssinia", acctLength: 8 },
	{ id: "571", slug: "berhan_bank", swift: "BERHETAA", name: "Berhan Bank", acctLength: 13 },
	{ id: "128", slug: "cbebirr", swift: "CBETETAA", name: "CBEBirr", acctLength: 10 },
	{ id: "946", slug: "cbe_bank", swift: "CBETETAA", name: "Commercial Bank of Ethiopia (CBE)", acctLength: 13 },
	{ id: "893", slug: "ebirr", swift: "CBORETA", name: "Coopay-Ebirr", acctLength: 10 },
	{ id: "880", slug: "dashen_bank", swift: "DASHETAA", name: "Dashen Bank", acctLength: 13 },
	{ id: "301", slug: "global_bank", swift: "DEGAETAA", name: "Global Bank Ethiopia", acctLength: 13 },
	{ id: "534", slug: "hibret_bank", swift: "UNTDETAA", name: "Hibret Bank", acctLength: 16 },
	{ id: "315", slug: "anbesa_bank", swift: "LIBSETAA", name: "Lion International Bank", acctLength: 15 },
	{ id: "266", slug: "mpesa", swift: "MPESA", name: "M-Pesa", acctLength: 10 },
	{ id: "979", slug: "nib_bank", swift: "NIBIETAA", name: "Nib International Bank", acctLength: 15 },
	{ id: "423", slug: "oromia_bank", swift: "ORIRETAA", name: "Oromia International Bank", acctLength: 12 },
	{ id: "855", slug: "telebirr", swift: "TELEBIRR", name: "telebirr", acctLength: 10 },
	{ id: "472", slug: "wegagen_bank", swift: "WEGAETAA", name: "Wegagen Bank", acctLength: 13 },
	{ id: "867", slug: "yaya", swift: "YAYAETAA", name: "Yaya Wallet", acctLength: 12 },
	{ id: "687", slug: "zemen_bank", swift: "ZEMEETAA", name: "Zemen Bank", acctLength: 16 },
];

export function findChapaBank(slugOrId: string): ChapaBankOption | undefined {
	const key = slugOrId.trim().toLowerCase();
	return CHAPA_BANKS.find(
		(b) => b.slug === key || b.id === key || b.name.toLowerCase() === key,
	);
}

export function usesMaxAccountLength(bank: ChapaBankOption | undefined): boolean {
	return Boolean(bank && MAX_LENGTH_SLUGS.has(bank.slug));
}

/** Digits-only account number check against selected bank rules. */
export function validateBankAccountNumber(
	value: string,
	bank: ChapaBankOption | undefined,
): string | null {
	const digits = value.trim();
	if (!digits) return "Account number is required";
	if (!/^\d+$/.test(digits)) return "Account number can only contain digits";
	if (!bank || bank.acctLength <= 0) {
		if (digits.length > 16) return "Account number must not exceed 16 digits";
		return null;
	}
	if (usesMaxAccountLength(bank)) {
		if (digits.length > bank.acctLength) {
			return `Account number must not exceed ${bank.acctLength} digits`;
		}
		return null;
	}
	if (digits.length !== bank.acctLength) {
		return `Account number must be exactly ${bank.acctLength} digits`;
	}
	return null;
}
