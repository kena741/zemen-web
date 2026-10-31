import { NextResponse } from "next/server";

import {
	finalizeBookingChapaPayment,
	verifyAndCreditWallet as verifyAndCreditWalletChapa,
	verifyFeaturedRequestPayment as verifyFeaturedRequestPaymentChapa,
	verifyProviderActivation as verifyProviderActivationChapa,
	verifyServiceTierPayment as verifyServiceTierPaymentChapa,
} from "@/services/payments/chapaServer";
import {
	finalizeBookingTelebirrPayment,
	verifyAndCreditWallet as verifyAndCreditWalletTelebirr,
	verifyFeaturedRequestPayment as verifyFeaturedRequestPaymentTelebirr,
	verifyProviderActivation as verifyProviderActivationTelebirr,
	verifyServiceTierPayment as verifyServiceTierPaymentTelebirr,
} from "@/services/payments/telebirrServer";
import {
	getAuthUserFromRequest,
	getSupabaseAdmin,
	resolveProviderIdForAuthUser,
} from "@/lib/supabase/admin";
import { advanceRecurringBookingPeriod } from "@/services/customer/recurringBookingsApi";

export const runtime = "nodejs";

interface VerifyBody {
	tx_ref?: string;
	purpose?: string;
	amount?: string;
	gateway?: "chapa" | "telebirr";
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

async function sleep(ms: number) {
	await new Promise((r) => setTimeout(r, ms));
}

export async function POST(request: Request) {
	const auth = await getAuthUserFromRequest(request);
	if (!auth.userId) {
		return NextResponse.json(
			{ error: auth.error ?? "Unauthorized" },
			{ status: 401 },
		);
	}

	try {
		const body = (await request.json()) as VerifyBody;
		const txRef = (body.tx_ref ?? "").trim();
		if (!txRef) {
			return NextResponse.json(
				{ error: "tx_ref is required" },
				{ status: 400 },
			);
		}

		const purpose = (body.purpose ?? "wallet").trim();
		const amount = (body.amount ?? "0").trim();
		const gateway = body.gateway === "chapa" ? "chapa" : "telebirr";
		const admin = getSupabaseAdmin();

		const maxAttempts = 3;
		let lastError: string | null = "Verification failed";
		let pending = false;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			if (attempt > 1) await sleep(2000);

			let result: { ok: boolean; pending?: boolean; error: string | null };

			switch (purpose) {
				case "wallet": {
					const accountType = body.accountType ?? "customer";
					const userId =
						body.userId?.trim() ||
						(accountType === "provider"
							? (await resolveProviderIdForAuthUser(admin, auth.userId)) ||
								auth.userId
							: auth.userId);
					result =
						gateway === "chapa"
							? await verifyAndCreditWalletChapa({
									admin,
									txRef,
									fallbackAmount: amount,
									userId,
									accountType,
								})
							: await verifyAndCreditWalletTelebirr({
									admin,
									txRef,
									fallbackAmount: amount,
									userId,
									accountType,
								});
					break;
				}
				case "activation": {
					const providerId =
						body.providerId?.trim() ||
						(await resolveProviderIdForAuthUser(admin, auth.userId));
					if (!providerId) {
						return NextResponse.json(
							{ error: "Provider not found" },
							{ status: 404 },
						);
					}
					result =
						gateway === "chapa"
							? await verifyProviderActivationChapa({
									txRef,
									providerId,
									amount,
								})
							: await verifyProviderActivationTelebirr({
									admin,
									txRef,
									providerId,
									amount,
								});
					break;
				}
				case "booking": {
					const bookingId = (body.bookingId ?? "").trim();
					if (!bookingId) {
						return NextResponse.json(
							{ error: "bookingId is required" },
							{ status: 400 },
						);
					}
					const { data: booking, error: bookingError } = await admin
						.from("booked_service")
						.select("customer_id, customerId")
						.eq("id", bookingId)
						.maybeSingle();
					if (bookingError) {
						return NextResponse.json(
							{ error: bookingError.message },
							{ status: 500 },
						);
					}
					if (!booking) {
						return NextResponse.json(
							{ error: "Booking not found" },
							{ status: 404 },
						);
					}
					const bookingRow = booking as Record<string, unknown>;
					const bookingCustomerId = String(
						bookingRow.customer_id ?? bookingRow.customerId ?? "",
					).trim();
					if (bookingCustomerId !== auth.userId) {
						return NextResponse.json({ error: "Forbidden" }, { status: 403 });
					}
					result =
						gateway === "chapa"
							? await finalizeBookingChapaPayment({
									admin,
									txRef,
									bookingId,
									fallbackAmount: amount,
								})
							: await finalizeBookingTelebirrPayment({
									admin,
									txRef,
									bookingId,
									fallbackAmount: amount,
								});
					if (result.ok && body.nextCycle) {
						const advanced = await advanceRecurringBookingPeriod({
							admin,
							bookingId,
							billingInterval: body.billingInterval,
							billingIntervalCount: body.billingIntervalCount,
						});
						if (!advanced.ok) result = advanced;
					}
					break;
				}
				case "tier": {
					const providerId =
						body.providerId?.trim() ||
						(await resolveProviderIdForAuthUser(admin, auth.userId));
					if (!providerId) {
						return NextResponse.json(
							{ error: "Provider not found" },
							{ status: 404 },
						);
					}
					result =
						gateway === "chapa"
							? await verifyServiceTierPaymentChapa({
									txRef,
									providerId,
									userId: auth.userId,
									fromTierMax: Number(body.fromTierMax ?? 0),
									toTierMax: Number(body.toTierMax ?? 0),
									amount,
								})
							: await verifyServiceTierPaymentTelebirr({
									admin,
									txRef,
									providerId,
									userId: auth.userId,
									fromTierMax: Number(body.fromTierMax ?? 0),
									toTierMax: Number(body.toTierMax ?? 0),
									amount,
								});
					break;
				}
				case "featured": {
					const providerId =
						body.providerId?.trim() ||
						(await resolveProviderIdForAuthUser(admin, auth.userId));
					const serviceId = (body.serviceId ?? "").trim();
					if (!providerId || !serviceId) {
						return NextResponse.json(
							{ error: "providerId and serviceId are required" },
							{ status: 400 },
						);
					}
					result =
						gateway === "chapa"
							? await verifyFeaturedRequestPaymentChapa({
									txRef,
									providerId,
									userId: auth.userId,
									amount,
									serviceId,
								})
							: await verifyFeaturedRequestPaymentTelebirr({
									admin,
									txRef,
									providerId,
									userId: auth.userId,
									amount,
									serviceId,
								});
					break;
				}
				default:
					return NextResponse.json(
						{ error: "Unknown payment purpose" },
						{ status: 400 },
					);
			}

			if (result.ok) {
				return NextResponse.json({
					status: "success",
					purpose,
					gateway,
					tx_ref: txRef,
				});
			}

			lastError = result.error;
			pending = Boolean(result.pending);
			if (!result.pending) break;
		}

		return NextResponse.json(
			{ status: pending ? "pending" : "failed", error: lastError, tx_ref: txRef },
			{ status: pending ? 202 : 402 },
		);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unexpected error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
