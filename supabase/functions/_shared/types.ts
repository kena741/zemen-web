/** Payment purposes handled by chapa-payment / verify-payment. */
export type PaymentPurpose =
	| "wallet"
	| "activation"
	| "booking"
	| "tier"
	| "featured";

export type AccountType = "customer" | "provider";

/** Body for POST verify-payment (ported from app/api/pay/verify). */
export interface VerifyPaymentBody {
	tx_ref?: string;
	purpose?: string;
	amount?: string;
	accountType?: AccountType;
	providerId?: string;
	bookingId?: string;
	serviceId?: string;
	fromTierMax?: number;
	toTierMax?: number;
	/** Informational only — never used for authorization. */
	userId?: string;
	nextCycle?: boolean;
	billingInterval?: string;
	billingIntervalCount?: number;
}

/** Body for POST chapa-payment (ported from app/api/pay/chapa). */
export interface ChapaPaymentBody {
	amount?: number | string;
	email?: string;
	first_name?: string;
	last_name?: string;
	phone_number?: string;
	purpose?: string;
	return_path?: string;
	provider_id?: string;
	booking_id?: string;
	service_id?: string;
}

/** Body for POST complete-booking. */
export interface CompleteBookingBody {
	bookingId?: string;
}

/** SMS actions proxied by handle-sms. */
export type SmsAction = "send-otp" | "verify-otp";

export interface HandleSmsBody {
	action?: SmsAction | string;
	/** Remaining fields are forwarded to the SMS provider. */
	[key: string]: unknown;
}

/** Handyman create/update input (ported from services/handymen/validation). */
export interface HandymanWriteInput {
	firstName: string;
	lastName: string;
	userName: string;
	email: string;
	phoneNumber: string;
	password?: string;
	categoryId?: string;
	subCategoryId?: string;
	category?: string;
	subCategory?: string;
	address?: string;
}

/** Body for manage-handymen (create / optional list). */
export interface ManageHandymenBody extends Partial<HandymanWriteInput> {
	/** Optional action discriminator if GET-like list is invoked via POST. */
	action?: "list" | "create";
}

/** Body for manage-handyman (update / delete) — id must be in body, not URL. */
export interface ManageHandymanBody extends Partial<HandymanWriteInput> {
	id?: string;
	action?: "update" | "delete";
}

/** Body for dynamic-edge — name replaces former /api/edge/[name] segment. */
export interface DynamicEdgeBody {
	name?: string;
	[key: string]: unknown;
}

export interface ChapaConfig {
	enable?: boolean;
	isActive?: boolean | number;
	secretKey?: string;
	publicKey?: string;
}

export interface ChapaVerifyTransaction {
	status?: string;
	amount?: number;
	charge?: number;
	tx_ref?: string;
	reference?: string;
}

export interface VerifyResult {
	ok: boolean;
	pending?: boolean;
	error: string | null;
}

export type RecurringCycle = "WEEK" | "MONTH" | "QUARTER" | "YEAR";

export interface RecurringPaymentSettings {
	enabled: boolean;
	availableCycles: RecurringCycle[];
	paymentWindowDays: number;
}
