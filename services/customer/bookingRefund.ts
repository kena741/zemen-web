export function customerBookingRefundAmount(
	transactions: Array<{ amount?: unknown }>,
): number {
	const total = transactions.reduce((sum, transaction) => {
		const amount = Number(transaction.amount ?? 0);
		return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
	}, 0);
	return Math.round(total * 100) / 100;
}
