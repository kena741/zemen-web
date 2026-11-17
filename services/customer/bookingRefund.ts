/** Sum wallet debit rows for a booking (wallet / chapa ledger). */
export function customerBookingRefundAmount(
	transactions: Array<{ amount?: unknown }>,
): number {
	const total = transactions.reduce((sum, transaction) => {
		const amount = Number(transaction.amount ?? 0);
		return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
	}, 0);
	return Math.round(total * 100) / 100;
}

function asMoney(value: unknown): number {
	const amount = Number(value ?? 0);
	return Number.isFinite(amount) && amount > 0
		? Math.round(amount * 100) / 100
		: 0;
}

/**
 * Matches mobile `resolveCustomerCancelRefundAmountStr` + debit ledger.
 * Only paid bookings refund. Prefer wallet/chapa debit sum, then payments
 * escrow (Chapa), then booking totalAmount / subTotal.
 */
export function resolveCustomerCancelRefundAmount(params: {
	paymentCompleted?: unknown;
	paymentType?: string | null;
	totalAmount?: unknown;
	subTotal?: unknown;
	/** Sum of customer wallet_transaction debits for this booking. */
	debitTotal?: number;
	/** payments.amount escrow for Chapa (excludes gateway fee). */
	escrowAmount?: number | null;
}): number {
	const paid =
		params.paymentCompleted === true ||
		params.paymentCompleted === "true" ||
		params.paymentCompleted === 1 ||
		params.paymentCompleted === "1";
	if (!paid) return 0;

	const fromDebits = asMoney(params.debitTotal);
	if (fromDebits > 0) return fromDebits;

	const paymentType = String(params.paymentType ?? "")
		.trim()
		.toLowerCase();
	const isChapa = paymentType.includes("chapa");
	if (isChapa) {
		const escrow = asMoney(params.escrowAmount);
		if (escrow > 0) return escrow;
		const sub = asMoney(params.subTotal);
		if (sub > 0) return sub;
	}

	const total = asMoney(params.totalAmount);
	if (total > 0) return total;

	return asMoney(params.subTotal);
}
