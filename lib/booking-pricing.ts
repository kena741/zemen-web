import {
	dueNowAmount,
	effectivePrePaymentPercent,
	isRecurringPricingType,
	remainingAmount,
} from "@/lib/recurring";

/** Matches mobile ServiceModel.discountAmount (≤100 = %, else fixed per unit). */
export function serviceDiscountAmount(
	discountRaw: string | null | undefined,
	unitPrice: number,
	quantity: number,
): number {
	const discountValue = Number(String(discountRaw ?? "").trim()) || 0;
	if (discountValue <= 0) return 0;
	const lineSubtotal = quantity * unitPrice;
	if (lineSubtotal <= 0) return 0;
	if (discountValue <= 100) {
		return Math.round(((lineSubtotal * discountValue) / 100) * 100) / 100;
	}
	const fixedTotal = quantity * discountValue;
	return Math.min(fixedTotal, lineSubtotal);
}

export function serviceDiscountIsPercent(
	discountRaw: string | null | undefined,
): boolean {
	const discountValue = Number(String(discountRaw ?? "").trim()) || 0;
	return discountValue > 0 && discountValue <= 100;
}

/**
 * Unit price → optional service discount → coupon → due now (prepay) + remaining.
 * Pass skipDiscount for custom/edited prices (matches mobile isPriceEdited).
 */
export function computeBookingPrice(params: {
	unitPrice: number;
	quantity: number;
	discountRaw?: string | null;
	/** When true (custom price), catalog service discount is not applied. */
	skipDiscount?: boolean;
	couponAmount?: number;
	pricingType?: string | null;
	prePayment?: boolean;
	prePaymentPercent?: number | null;
	/** Custom offer / bid: no charge now. */
	deferPayment?: boolean;
}) {
	const quantity = Math.max(1, Math.trunc(params.quantity) || 1);
	const unitPrice = Math.max(0, params.unitPrice);
	const subtotal = unitPrice * quantity;
	const serviceDiscount = params.skipDiscount
		? 0
		: serviceDiscountAmount(params.discountRaw, unitPrice, quantity);
	const afterServiceDiscount = Math.max(0, subtotal - serviceDiscount);
	const couponAmount = Math.max(0, params.couponAmount ?? 0);
	const total = Math.max(0, afterServiceDiscount - couponAmount);
	const isRecurring = isRecurringPricingType(params.pricingType);
	const prePayPercent = effectivePrePaymentPercent({
		pricingType: params.pricingType,
		prePaymentPercent: params.prePaymentPercent,
	});
	const chargedNow = params.deferPayment
		? 0
		: dueNowAmount({
				total,
				pricingType: params.pricingType,
				prePayment: params.prePayment,
				prePaymentPercent: params.prePaymentPercent,
			});
	const remaining = remainingAmount(total, chargedNow);
	const hasPartialPrePayment =
		!params.deferPayment && !isRecurring && prePayPercent < 100;

	return {
		subtotal,
		serviceDiscount,
		afterServiceDiscount,
		couponAmount,
		total,
		dueNow: chargedNow,
		remaining,
		prePayPercent,
		hasPartialPrePayment,
		isRecurring,
	};
}
