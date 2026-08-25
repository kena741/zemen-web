export interface BankMethod {
	id: string;
	providerID: string | null;
	methodType: string | null;
	methodCode: string | null;
	methodName: string | null;
	holderName: string | null;
	accountNumber: string | null;
	swiftCode: string | null;
	bankName: string | null;
	branchCity: string | null;
	branchCountry: string | null;
	isActive: boolean;
	isDefault: boolean;
}

function asString(value: unknown): string | null {
	if (value == null) return null;
	const s = String(value).trim();
	return s.length ? s : null;
}

export function mapBankRow(row: Record<string, unknown>): BankMethod {
	return {
		id: String(row.id ?? ""),
		providerID: asString(row.providerID),
		methodType: asString(row.method_type),
		methodCode: asString(row.method_code),
		methodName: asString(row.method_name),
		holderName: asString(row.holderName),
		accountNumber: asString(row.accountNumber),
		swiftCode: asString(row.swiftCode),
		bankName: asString(row.bankName),
		branchCity: asString(row.branchCity),
		branchCountry: asString(row.branchCountry),
		isActive: row.is_active !== false,
		isDefault: Boolean(row.is_default),
	};
}
