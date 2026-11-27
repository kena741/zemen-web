export type PaymentPurpose =
	| "wallet"
	| "activation"
	| "booking"
	| "tier"
	| "featured";

export type PaymentGateway = "chapa" | "telebirr";

export interface PaymentPending {
	purpose: PaymentPurpose;
	userId: string;
	accountType: "customer" | "provider";
	amount: string;
	gateway?: PaymentGateway;
	txRef?: string;
	providerId?: string;
	bookingId?: string;
	serviceId?: string;
	fromTierMax?: number;
	toTierMax?: number;
	nextCycle?: boolean;
	remainingBalance?: boolean;
	extraPayment?: boolean;
	billingInterval?: string;
	billingIntervalCount?: number;
}

const KEY = "zemen_payment_pending";

function canUseStorage(): boolean {
	return typeof window !== "undefined";
}

export function savePaymentPending(pending: PaymentPending): void {
	if (!canUseStorage()) return;
	const raw = JSON.stringify(pending);
	// localStorage survives Telebirr H5 round-trips better than sessionStorage.
	window.localStorage.setItem(KEY, raw);
	window.sessionStorage.setItem(KEY, raw);
}

export function readPaymentPending(): PaymentPending | null {
	if (!canUseStorage()) return null;
	const raw =
		window.localStorage.getItem(KEY) || window.sessionStorage.getItem(KEY);
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
	if (!canUseStorage()) return;
	window.localStorage.removeItem(KEY);
	window.sessionStorage.removeItem(KEY);
}
