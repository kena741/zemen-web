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
import { createHmac } from "node:crypto";

import { proxyToBackend } from "@/lib/backend/proxy";
import { getApiBaseUrl, isBackendMode } from "@/lib/env";
import {
	getAuthUserFromRequest,
	getSupabaseAdmin,
	resolveProviderIdForAuthUser,
} from "@/lib/supabase/admin";
import {
	loadTelebirrConfig,
	queryTelebirrOrderStatus,
	sanitizeMerchOrderId,
} from "@/lib/telebirr";
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
	remainingBalance?: boolean;
	extraPayment?: boolean;
	billingInterval?: string;
	billingIntervalCount?: number;
}

async function sleep(ms: number) {
	await new Promise((r) => setTimeout(r, ms));
}

function paymentConfirmSecret(): string {
	return (
		process.env.PAYMENT_CONFIRM_SECRET?.trim() ||
		process.env.TELEBIRR_APP_SECRET?.trim() ||
		""
	);
}

function signTierConfirm(params: {
	txRef: string;
	providerId: string;
	tierMax: number | null;
	amount: number | null;
}): string | null {
	const secret = paymentConfirmSecret();
	if (!secret) return null;
	const amt =
		params.amount == null ? "" : Number(params.amount).toFixed(2);
	const payload = `${params.txRef}:${params.providerId}:${params.tierMax ?? ""}:${amt}`;
	return createHmac("sha256", secret).update(payload).digest("hex");
}

async function normalizeBackendResponse(
	proxied: Response,
	txRef: string,
	purpose: string,
): Promise<NextResponse> {
	const text = await proxied.text();
	let data: Record<string, unknown> = {};
	try {
		data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
	} catch {
		data = { error: text || "Verification failed" };
	}
	if (proxied.ok && data.status == null) {
		data = { ...data, status: "success", tx_ref: txRef, purpose };
	}
	return NextResponse.json(data, { status: proxied.status });
}

export async function POST(request: Request) {
	if (isBackendMode()) {
		const cloned = request.clone();
		const body = (await cloned.json().catch(() => ({}))) as VerifyBody;
		const purpose = (body.purpose ?? "wallet").trim();
		const gateway = body.gateway === "chapa" ? "chapa" : "telebirr";
		const rawTxRef = (body.tx_ref ?? "").trim();
		const txRef =
			gateway === "telebirr" ? sanitizeMerchOrderId(rawTxRef) : rawTxRef;
		const amountNum = Number.parseFloat(String(body.amount ?? "").trim());
		const amount = Number.isFinite(amountNum) ? amountNum : null;
		const tierMax =
			body.toTierMax != null && Number.isFinite(Number(body.toTierMax))
				? Number(body.toTierMax)
				: null;
		const providerId = body.providerId?.trim() || "";

		// Telebirr listing plan: confirm with Telebirr, then apply tier on backend.
		if (
			gateway === "telebirr" &&
			(purpose === "tier" || purpose === "service-tier")
		) {
			if (!txRef) {
				return NextResponse.json(
					{ error: "tx_ref is required" },
					{ status: 400 },
				);
			}
			const config = await loadTelebirrConfig();
			if (!config) {
				return NextResponse.json(
					{ error: "Telebirr is not configured" },
					{ status: 500 },
				);
			}
			try {
				const order = await queryTelebirrOrderStatus({
					config,
					merchOrderId: txRef,
				});
				if (!order.paid) {
					return NextResponse.json(
						{
							status: order.failed ? "failed" : "pending",
							error: order.failed
								? `Telebirr status is ${order.tradeStatus || "failed"}`
								: "Payment not confirmed yet",
							tx_ref: txRef,
						},
						{ status: order.failed ? 402 : 202 },
					);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Telebirr verify failed";
				return NextResponse.json({ error: message }, { status: 502 });
			}

			const sig = signTierConfirm({
				txRef,
				providerId,
				tierMax,
				amount,
			});
			const base = getApiBaseUrl();
			if (!base || !sig || !providerId || tierMax == null) {
				return NextResponse.json(
					{
						error:
							!sig
								? "PAYMENT_CONFIRM_SECRET (or TELEBIRR_APP_SECRET) required"
								: "providerId and toTierMax are required",
					},
					{ status: 500 },
				);
			}
			const auth = request.headers.get("authorization") || "";
			const res = await fetch(`${base}/api/v1/payments/service-tier/verify`, {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					...(auth ? { Authorization: auth } : {}),
					"X-Zemen-Pay-Sig": sig,
				},
				body: JSON.stringify({
					txRef,
					providerId,
					amount,
					tierMax,
					skipGatewayVerify: true,
				}),
			});
			return normalizeBackendResponse(res, txRef, purpose);
		}

		// Telebirr booking: confirm with Telebirr, then mark paid on BE.
		// ponytail: getSupabaseAdmin() is a stub in backend mode — never finalize via Supabase.
		if (gateway === "telebirr" && purpose === "booking") {
			const bookingId = body.bookingId?.trim() || "";
			if (!txRef) {
				return NextResponse.json(
					{ error: "tx_ref is required" },
					{ status: 400 },
				);
			}
			if (!bookingId) {
				return NextResponse.json(
					{ error: "bookingId is required" },
					{ status: 400 },
				);
			}
			const config = await loadTelebirrConfig();
			if (!config) {
				return NextResponse.json(
					{ error: "Telebirr is not configured" },
					{ status: 500 },
				);
			}
			let paidAmount =
				amount != null ? amount.toFixed(2) : String(body.amount ?? "0");
			try {
				const order = await queryTelebirrOrderStatus({
					config,
					merchOrderId: txRef,
				});
				if (!order.paid) {
					return NextResponse.json(
						{
							status: order.failed ? "failed" : "pending",
							error: order.failed
								? `Telebirr status is ${order.tradeStatus || "failed"}`
								: "Payment not confirmed yet",
							tx_ref: txRef,
						},
						{ status: order.failed ? 402 : 202 },
					);
				}
				if (order.amount && Number(order.amount) > 0) {
					paidAmount = Number(order.amount).toFixed(2);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Telebirr verify failed";
				return NextResponse.json({ error: message }, { status: 502 });
			}

			const base = getApiBaseUrl();
			const auth = request.headers.get("authorization") || "";
			if (!base) {
				return NextResponse.json(
					{ error: "API_BASE_URL not configured" },
					{ status: 500 },
				);
			}

			try {
				const getRes = await fetch(`${base}/api/v1/bookings/${bookingId}`, {
					headers: {
						Accept: "application/json",
						...(auth ? { Authorization: auth } : {}),
					},
				});
				if (getRes.status === 404) {
					return NextResponse.json(
						{ error: "Booking not found", tx_ref: txRef, bookingId },
						{ status: 404 },
					);
				}
				if (!getRes.ok) {
					const text = await getRes.text();
					return NextResponse.json(
						{
							error: text || "Failed to load booking for payment finalize",
							tx_ref: txRef,
							bookingId,
						},
						{ status: getRes.status >= 500 ? 502 : getRes.status },
					);
				}
				const booking = (await getRes.json()) as Record<string, unknown>;
				if (booking.paymentCompleted === true || booking.payment_completed === true) {
					return NextResponse.json({
						status: "success",
						tx_ref: txRef,
						purpose,
						bookingId,
					});
				}
				const providerId = String(
					booking.providerId ?? booking.provider_id ?? "",
				).trim();
				if (!providerId) {
					return NextResponse.json(
						{ error: "Booking is missing providerId", tx_ref: txRef, bookingId },
						{ status: 502 },
					);
				}

				const markBody: Record<string, unknown> = {
					id: bookingId,
					providerId,
					paymentCompleted: true,
					paymentStatus: "payment_completed",
					paymentType: "telebirr",
					totalAmount: Number(paidAmount),
				};
				if (body.extraPayment === true) {
					markBody.status = "pending_approval";
				}

				const markRes = await fetch(`${base}/api/v1/bookings`, {
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
						...(auth ? { Authorization: auth } : {}),
					},
					body: JSON.stringify(markBody),
				});
				if (!markRes.ok) {
					const text = await markRes.text();
					console.error("[pay/verify] telebirr booking mark paid failed", {
						bookingId,
						txRef,
						status: markRes.status,
						text: text.slice(0, 500),
					});
					return NextResponse.json(
						{
							status: "error",
							error:
								text ||
								"Telebirr paid, but booking was not marked paid on the server",
							tx_ref: txRef,
							bookingId,
						},
						{ status: 502 },
					);
				}
				return NextResponse.json({
					status: "success",
					tx_ref: txRef,
					purpose,
					bookingId,
				});
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Booking finalize unavailable";
				console.error("[pay/verify] telebirr booking finalize", message);
				return NextResponse.json(
					{
						status: "error",
						error: `Telebirr paid, but booking was not marked paid: ${message}`,
						tx_ref: txRef,
						bookingId,
					},
					{ status: 503 },
				);
			}
		}

		let path = "/payments/chapa/verify";
		let proxyBody: Record<string, unknown> = {
			txRef: rawTxRef,
			purpose,
			bookingId: body.bookingId?.trim() || null,
		};
		if (purpose === "activation") {
			path = "/payments/provider-activation/verify";
			proxyBody = {
				txRef: rawTxRef,
				providerId: providerId || null,
				amount: amount ?? 0,
			};
		} else if (purpose === "tier" || purpose === "service-tier") {
			path = "/payments/service-tier/verify";
			proxyBody = {
				txRef: rawTxRef,
				providerId: providerId || null,
				amount,
				tierMax,
			};
		} else if (purpose === "featured") {
			path = "/payments/featured-request/verify";
			proxyBody = {
				txRef: rawTxRef,
				providerId: providerId || null,
				serviceId: body.serviceId?.trim() || null,
				amount,
			};
		} else if (purpose === "booking" && body.bookingId?.trim()) {
			// Chapa booking verify (Telebirr handled above)
			path = "/payments/chapa/verify";
			proxyBody = {
				txRef: rawTxRef,
				purpose: "booking",
				bookingId: body.bookingId.trim(),
			};
		}
		const proxied = await proxyToBackend(path, request, {
			method: "POST",
			body: proxyBody,
		});
		if (proxied) {
			return normalizeBackendResponse(proxied, rawTxRef, purpose);
		}
	}

	const auth = await getAuthUserFromRequest(request);
	if (!auth.userId) {
		return NextResponse.json(
			{ error: auth.error ?? "Unauthorized" },
			{ status: 401 },
		);
	}

	try {
		const body = (await request.json()) as VerifyBody;
		const purpose = (body.purpose ?? "wallet").trim();
		const amount = (body.amount ?? "0").trim();
		const gateway = body.gateway === "chapa" ? "chapa" : "telebirr";
		const rawTxRef = (body.tx_ref ?? "").trim();
		const txRef =
			gateway === "telebirr" ? sanitizeMerchOrderId(rawTxRef) : rawTxRef;
		if (!txRef) {
			return NextResponse.json(
				{ error: "tx_ref is required" },
				{ status: 400 },
			);
		}

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
									remainingBalance: body.remainingBalance === true,
									extraPayment: body.extraPayment === true,
								})
							: await finalizeBookingTelebirrPayment({
									admin,
									txRef,
									bookingId,
									fallbackAmount: amount,
									remainingBalance: body.remainingBalance === true,
									extraPayment: body.extraPayment === true,
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
