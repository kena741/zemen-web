import { NextResponse } from "next/server";

import {
	finalizeBookingChapaPayment,
	verifyAndCreditWallet,
	verifyFeaturedRequestPayment,
	verifyProviderActivation,
	verifyServiceTierPayment,
} from "@/services/payments/chapaServer";
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
		return NextResponse.json({ error: auth.error ?? "Unauthorized" }, { status: 401 });
	}

	try {
		const body = (await request.json()) as VerifyBody;
		const txRef = (body.tx_ref ?? "").trim();
		if (!txRef) {
			return NextResponse.json({ error: "tx_ref is required" }, { status: 400 });
		}

		const purpose = (body.purpose ?? "wallet").trim();
		const amount = (body.amount ?? "0").trim();
		const admin = getSupabaseAdmin();

		const maxAttempts = 3;
		let lastError: string | null = "Verification failed";

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
					result = await verifyAndCreditWallet({
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
						return NextResponse.json({ error: "Provider not found" }, { status: 404 });
					}
					result = await verifyProviderActivation({
						txRef,
						providerId,
						amount,
					});
					break;
				}
				case "booking": {
					const bookingId = (body.bookingId ?? "").trim();
					if (!bookingId) {
						return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
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
					const providerId =
						body.providerId?.trim() ||
						(await resolveProviderIdForAuthUser(admin, auth.userId));
					if (!providerId) {
						return NextResponse.json({ error: "Provider not found" }, { status: 404 });
					}
					result = await verifyServiceTierPayment({
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
					result = await verifyFeaturedRequestPayment({
						txRef,
						providerId,
						userId: auth.userId,
						amount,
						serviceId,
					});
					break;
				}
				default:
					return NextResponse.json({ error: "Unknown payment purpose" }, { status: 400 });
			}

			if (result.ok) {
				return NextResponse.json({ status: "success", purpose, tx_ref: txRef });
			}

			lastError = result.error;
			if (!result.pending) break;
		}

		return NextResponse.json(
			{ status: "pending", error: lastError, tx_ref: txRef },
			{ status: 202 },
		);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unexpected error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
