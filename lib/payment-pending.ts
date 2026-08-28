export type PaymentPurpose =
	| "wallet"
	| "activation"
	| "booking"
	| "tier"
	| "featured";

export interface PaymentPending {
	purpose: PaymentPurpose;
	userId: string;
	accountType: "customer" | "provider";
	amount: string;
	txRef?: string;
	providerId?: string;
	bookingId?: string;
	serviceId?: string;
	fromTierMax?: number;
	toTierMax?: number;
	nextCycle?: boolean;
	billingInterval?: string;
	billingIntervalCount?: number;
}

const KEY = "zemen_payment_pending";

export function savePaymentPending(pending: PaymentPending): void {
	if (typeof window === "undefined") return;
	sessionStorage.setItem(KEY, JSON.stringify(pending));
}

export function readPaymentPending(): PaymentPending | null {
	if (typeof window === "undefined") return null;
	const raw = sessionStorage.getItem(KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as PaymentPending;
	} catch {
		return null;
	}
}

export function patchPaymentPending(patch: Partial<PaymentPending>): void {
	const current = readPaymentPending();
	if (!current) return;
	savePaymentPending({ ...current, ...patch });
}

export function clearPaymentPending(): void {
	if (typeof window === "undefined") return;
	sessionStorage.removeItem(KEY);
}
