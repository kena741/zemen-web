import type { PaymentPurpose } from "@/lib/payment-pending";
import { invokeFunction } from "./client";

export interface ChapaInitInput {
	amount: number | string;
	email?: string | null;
	first_name?: string | null;
	last_name?: string | null;
	phone_number?: string | null;
	purpose: PaymentPurpose | string;
	return_path?: string;
	provider_id?: string;
	booking_id?: string;
	service_id?: string;
}

export interface ChapaInitResult {
	status: string;
	checkout_url: string;
	tx_ref: string;
	amount: string;
}

export interface VerifyPaymentInput {
	tx_ref: string;
	purpose?: string;
	amount?: string;
	accountType?: "customer" | "provider";
	providerId?: string;
	bookingId?: string;
	serviceId?: string;
	fromTierMax?: number;
	toTierMax?: number;
	userId?: string;
	nextCycle?: boolean;
	billingInterval?: string;
	billingIntervalCount?: number;
}

export interface VerifyPaymentResult {
	status: "success" | "pending";
	purpose?: string;
	tx_ref?: string;
	error?: string;
}

export async function initializeChapaPayment(
	input: ChapaInitInput,
): Promise<ChapaInitResult> {
	const data = await invokeFunction<ChapaInitResult & { error?: string }>(
		"chapa-payment",
		{
			amount: input.amount,
			email: input.email ?? undefined,
			first_name: input.first_name ?? undefined,
			last_name: input.last_name ?? undefined,
			phone_number: input.phone_number ?? undefined,
			purpose: input.purpose,
			return_path: input.return_path,
			provider_id: input.provider_id,
			booking_id: input.booking_id,
			service_id: input.service_id,
		},
	);
	if (!data?.checkout_url) {
		throw new Error(
			(data as { error?: string })?.error || "Failed to initialize payment",
		);
	}
	return data;
}

export async function verifyPayment(
	input: VerifyPaymentInput,
): Promise<VerifyPaymentResult> {
	return invokeFunction<VerifyPaymentResult>("verify-payment", {
		...input,
	});
}
