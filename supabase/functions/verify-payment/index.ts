import { verifyAuth } from "../_shared/auth.ts";
import { handleCors, requestOrigin } from "../_shared/cors.ts";
import {
	AppError,
	errorResponse,
	errorStatus,
	jsonResponse,
	safeError,
} from "../_shared/errors.ts";
import {
	advanceRecurringBookingPeriod,
	finalizeBookingChapaPayment,
	verifyAndCreditWallet,
	verifyFeaturedRequestPayment,
	verifyProviderActivation,
	verifyServiceTierPayment,
} from "../_shared/payments.ts";
import {
	getSupabaseAdmin,
	resolveProviderIdForAuthUser,
} from "../_shared/supabase.ts";
import type { AccountType, VerifyPaymentBody } from "../_shared/types.ts";

async function sleep(ms: number) {
	await new Promise((r) => setTimeout(r, ms));
}

Deno.serve(async (req) => {
	const origin = requestOrigin(req);
	const preflight = handleCors(req);
	if (preflight) return preflight;

	if (req.method !== "POST") {
		return errorResponse("Method not allowed", 405, origin);
	}

	try {
		const admin = getSupabaseAdmin();
		const userId = await verifyAuth(req, admin);
		const authHeader = req.headers.get("Authorization");

		const body = (await req.json()) as VerifyPaymentBody;
		const txRef = String(body.tx_ref ?? "").trim();
		if (!txRef) {
			throw new AppError("tx_ref is required", 400);
		}

		const purpose = String(body.purpose ?? "wallet").trim();
		const amount = String(body.amount ?? "0").trim();

		const maxAttempts = 3;
		let lastError: string | null = "Verification failed";

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			if (attempt > 1) await sleep(2000);

			let result: { ok: boolean; pending?: boolean; error: string | null };

			switch (purpose) {
				case "wallet": {
					const accountType: AccountType = body.accountType ?? "customer";
					// Never trust body.userId — resolve from JWT / provider row.
					const creditUserId =
						accountType === "provider"
							? (await resolveProviderIdForAuthUser(admin, userId)) || userId
							: userId;
					result = await verifyAndCreditWallet({
						admin,
						txRef,
						fallbackAmount: amount,
						userId: creditUserId,
						accountType,
					});
					break;
				}
				case "activation": {
					const providerId = await resolveProviderIdForAuthUser(admin, userId);
					if (!providerId) {
						throw new AppError("Provider not found", 404);
					}
					result = await verifyProviderActivation({
						txRef,
						providerId,
						amount,
						authHeader,
					});
					break;
				}
				case "booking": {
					const bookingId = String(body.bookingId ?? "").trim();
					if (!bookingId) {
						throw new AppError("bookingId is required", 400);
					}

					const { data: booking } = await admin
						.from("booked_service")
						.select("id, customer_id, customerId")
						.eq("id", bookingId)
						.maybeSingle();
					if (!booking) {
						throw new AppError("Booking not found", 404);
					}
					const brow = booking as Record<string, unknown>;
					const customerId = String(brow.customer_id ?? brow.customerId ?? "");
					if (customerId !== userId) {
						throw new AppError("Forbidden", 403);
					}

					result = await finalizeBookingChapaPayment({
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
					const providerId = await resolveProviderIdForAuthUser(admin, userId);
					if (!providerId) {
						throw new AppError("Provider not found", 404);
					}
					result = await verifyServiceTierPayment({
						txRef,
						providerId,
						userId,
						fromTierMax: Number(body.fromTierMax ?? 0),
						toTierMax: Number(body.toTierMax ?? 0),
						amount,
						authHeader,
					});
					break;
				}
				case "featured": {
					const providerId = await resolveProviderIdForAuthUser(admin, userId);
					const serviceId = String(body.serviceId ?? "").trim();
					if (!providerId || !serviceId) {
						throw new AppError("providerId and serviceId are required", 400);
					}
					result = await verifyFeaturedRequestPayment({
						txRef,
						providerId,
						userId,
						amount,
						serviceId,
						authHeader,
					});
					break;
				}
				default:
					throw new AppError("Unknown payment purpose", 400);
			}

			if (result.ok) {
				return jsonResponse({ status: "success", purpose, tx_ref: txRef }, 200, origin);
			}

			lastError = result.error;
			if (!result.pending) break;
		}

		return jsonResponse(
			{ status: "pending", error: lastError, tx_ref: txRef },
			202,
			origin,
		);
	} catch (e) {
		return errorResponse(safeError(e), errorStatus(e), origin);
	}
});
