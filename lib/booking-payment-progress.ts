/**
 * Mobile-aligned booking payment progress.
 * paymentCompleted = money started; % / remaining come from totalAmount vs obligation.
 */

export type BookingPaymentAmounts = {
	paymentCompleted?: boolean | null;
	payment_status?: string | null;
	totalAmount?: string | number | null;
	subTotal?: string | number | null;
	/** Stored ETB discount snapshot (legacy web rows). */
	discount?: string | number | null;
	price?: string | number | null;
	quantity?: string | number | null;
	status?: string | null;
	nextCycleDue?: boolean | null;
	currentPeriodStart?: string | null;
	currentPeriodEnd?: string | null;
	/** Nested catalog price when row.price is missing. */
	servicePrice?: string | number | null;
	/** Sum of customer debit ledger rows when known. */
	ledgerPaid?: string | number | null;
};

export type BookingPaymentSettlement = "unpaid" | "partial" | "paid";

const TERMINAL_JOB = new Set([
	"completed",
	"rejected",
	"cancelled",
	"canceled",
	"admin_paid",
]);

export function asBookingMoney(value: string | number | null | undefined): number {
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	const n = Number.parseFloat(String(value ?? "").trim());
	return Number.isFinite(n) ? n : 0;
}

export function isRecurringBooking(input: BookingPaymentAmounts): boolean {
	return (
		input.nextCycleDue === true ||
		Boolean(input.currentPeriodStart) ||
		Boolean(input.currentPeriodEnd)
	);
}

function lineGrossAmount(input: BookingPaymentAmounts): number {
	const unit =
		asBookingMoney(input.price) || asBookingMoney(input.servicePrice);
	const qty = Number.parseInt(String(input.quantity ?? "1"), 10);
	const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
	return unit > 0 ? unit * safeQty : 0;
}

/**
 * Full customer service obligation (not extras).
 * Mobile: subTotal is already after discount. Legacy web rows stored gross
 * subTotal + ETB `discount` — net those when they clearly match price×qty.
 */
export function customerObligationAmount(input: BookingPaymentAmounts): number {
	const sub = asBookingMoney(input.subTotal);
	const discount = asBookingMoney(input.discount);
	const gross = lineGrossAmount(input);
	if (sub > 0 && discount > 0 && gross > 0 && Math.abs(sub - gross) < 0.01) {
		return Math.max(0, Math.round((sub - discount) * 100) / 100);
	}
	if (sub > 0) return sub;
	if (gross > 0) {
		return discount > 0
			? Math.max(0, Math.round((gross - discount) * 100) / 100)
			: gross;
	}
	return asBookingMoney(input.totalAmount);
}

/** Amount customer has paid toward the service (ledger wins when present). */
export function customerPaidAmount(input: BookingPaymentAmounts): number {
	const ledger = asBookingMoney(input.ledgerPaid);
	if (ledger > 0) return ledger;
	return asBookingMoney(input.totalAmount);
}

export function remainingServiceBalance(input: BookingPaymentAmounts): number {
	if (isRecurringBooking(input)) return 0;
	if (input.paymentCompleted !== true) return 0;
	const status = String(input.status ?? "")
		.trim()
		.toLowerCase();
	if (TERMINAL_JOB.has(status)) return 0;
	const full = customerObligationAmount(input);
	const paid = customerPaidAmount(input);
	if (full <= 0) return 0;
	const remaining = full - paid;
	return remaining < 0.01 ? 0 : remaining;
}

export function isAwaitingInitialPayment(input: BookingPaymentAmounts): boolean {
	if (input.paymentCompleted === true) return false;
	const status = String(input.status ?? "")
		.trim()
		.toLowerCase();
	if (TERMINAL_JOB.has(status)) return false;
	return true;
}

/** 0 when unpaid flag; else totalAmount ÷ obligation. */
export function paidPercentage(input: BookingPaymentAmounts): number {
	if (input.paymentCompleted !== true) return 0;
	const full = customerObligationAmount(input);
	if (full <= 0) return 100;
	if (!isRecurringBooking(input) && remainingServiceBalance(input) <= 0) return 100;
	const paid = Math.min(Math.max(customerPaidAmount(input), 0), full);
	return Math.min(100, Math.max(0, Math.round((paid / full) * 100)));
}

export function resolveBookingPaymentSettlement(
	input: BookingPaymentAmounts,
): BookingPaymentSettlement {
	const status = String(input.payment_status ?? "")
		.trim()
		.toLowerCase();
	const flagged =
		input.paymentCompleted === true || status === "payment_completed";
	if (!flagged) return "unpaid";
	if (remainingServiceBalance(input) > 0) return "partial";
	return "paid";
}

export function bookingAmountsFromRow(
	booking: {
		paymentCompleted?: boolean | null;
		totalAmount?: string | number | null;
		subTotal?: string | number | null;
		discount?: string | number | null;
		quantity?: string | number | null;
		status?: string | null;
		nextCycleDue?: boolean | null;
		currentPeriodStart?: string | null;
		currentPeriodEnd?: string | null;
		service?: { price?: string | number | null } | null;
		ledgerPaid?: string | number | null;
	},
): BookingPaymentAmounts {
	return {
		paymentCompleted: booking.paymentCompleted,
		totalAmount: booking.totalAmount,
		subTotal: booking.subTotal,
		discount: booking.discount,
		quantity: booking.quantity,
		status: booking.status,
		nextCycleDue: booking.nextCycleDue,
		currentPeriodStart: booking.currentPeriodStart,
		currentPeriodEnd: booking.currentPeriodEnd,
		servicePrice: booking.service?.price ?? null,
		ledgerPaid: booking.ledgerPaid ?? null,
	};
}
