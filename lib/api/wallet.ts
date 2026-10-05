import { invokeFunction } from "./client";

export interface RefundRejectedResult {
	refunded: number;
	balance: number;
}

export async function refundRejectedWithdrawals(): Promise<RefundRejectedResult> {
	return invokeFunction<RefundRejectedResult>("refund-rejected", {});
}
