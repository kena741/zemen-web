export interface WalletTransaction {
	id: string;
	userId: string | null;
	amount: string | null;
	transactionId: string | null;
	paymentType: string | null;
	note: string | null;
	type: string | null;
	isCredit: boolean;
	createdDate: string | null;
}

export interface WithdrawRequest {
	id: string;
	providerId: string | null;
	amount: string | null;
	note: string | null;
	adminNote: string | null;
	rejectionReason: string | null;
	paymentStatus: string | null;
	paymentMethodId: string | null;
	holderName: string | null;
	bankName: string | null;
	accountNumber: string | null;
	swiftCode: string | null;
	createdDate: string | null;
	paymentDate: string | null;
}

function asString(value: unknown): string | null {
	if (value == null) return null;
	const s = String(value).trim();
	return s.length ? s : null;
}

export function mapWalletTxRow(row: Record<string, unknown>): WalletTransaction {
	return {
		id: String(row.id ?? ""),
		userId: asString(row.userId),
		amount: asString(row.amount),
		transactionId: asString(row.transactionId),
		paymentType: asString(row.paymentType),
		note: asString(row.note),
		type: asString(row.type),
		isCredit: Boolean(row.isCredit),
		createdDate: asString(row.createdDate),
	};
}

export function mapWithdrawRow(row: Record<string, unknown>): WithdrawRequest {
	return {
		id: String(row.id ?? ""),
		providerId: asString(row.providerId),
		amount: asString(row.amount),
		note: asString(row.note),
		adminNote: asString(row.adminNote),
		rejectionReason: asString(row.rejectionReason),
		paymentStatus: asString(row.paymentStatus),
		paymentMethodId: asString(row.paymentMethodId),
		holderName: asString(row.holderName),
		bankName: asString(row.bankName),
		accountNumber: asString(row.accountNumber),
		swiftCode: asString(row.swiftCode),
		createdDate: asString(row.createdDate),
		paymentDate: asString(row.paymentDate),
	};
}
