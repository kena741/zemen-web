"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { getAccessToken } from "@/lib/auth/tokenStore";
import { useLocale } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase/client";
import {
	clearPaymentPending,
	readPaymentPending,
} from "@/lib/payment-pending";
import { sanitizeMerchOrderId } from "@/lib/telebirr";

function continueHref(purpose: string, bookingId?: string | null): string {
	if (purpose === "activation" || purpose === "tier") return "/provider";
	if (purpose === "featured") return "/provider/services";
	if (purpose === "booking") {
		const id = bookingId?.trim();
		return id ? `/service/bookings/${id}` : "/service/bookings";
	}
	return "/service/wallet";
}

function cleanTxRef(raw: string): string {
	const base = raw.trim().split("?")[0]?.split("&")[0]?.split("#")[0] ?? "";
	if (!base) return "";
	// Chapa tier refs keep hyphens (tier-…); Telebirr merch ids are alnum-only.
	if (base.startsWith("tier-") || base.startsWith("web-")) return base.slice(0, 80);
	return sanitizeMerchOrderId(base);
}

function resolveTxRef(search: URLSearchParams): string {
	const pending = readPaymentPending();
	const fromPending = cleanTxRef(pending?.txRef ?? "");
	if (fromPending) return fromPending;

	// Telebirr return often appends "?trans_end_time=…" onto tx_ref; merch_order_id stays clean.
	const merch = cleanTxRef(search.get("merch_order_id") ?? "");
	if (merch) return merch;

	return cleanTxRef(
		search.get("tx_ref") ??
			search.get("trx_ref") ??
			search.get("ref") ??
			"",
	);
}

function PayDoneContent() {
	const search = useSearchParams();
	const { t } = useLocale();
	const purpose = search.get("purpose") ?? "wallet";
	const txRef = resolveTxRef(search);
	const amount = search.get("amount") ?? "";
	const bookingIdFromUrl = (search.get("bookingId") ?? search.get("booking_id") ?? "").trim();
	const pendingBootstrap = readPaymentPending();
	const bookingId =
		bookingIdFromUrl ||
		(pendingBootstrap?.bookingId ?? "").trim() ||
		null;

	const [status, setStatus] = useState<"verifying" | "success" | "pending" | "error">(
		txRef ? "verifying" : "pending",
	);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!txRef) return;

		let cancelled = false;

		async function verify() {
			const pending = readPaymentPending();
			let token = getAccessToken();
			if (!token) {
				const session = await getSupabase().auth.getSession();
				token = session.data.session?.access_token ?? null;
			}
			if (!token) {
				if (!cancelled) {
					setStatus("error");
					setMessage(t("paymentSignInVerify"));
				}
				return;
			}

			const body = {
				tx_ref: txRef,
				purpose: pending?.purpose ?? purpose,
				amount: pending?.amount ?? amount,
				gateway: pending?.gateway ?? "telebirr",
				accountType: pending?.accountType ?? "customer",
				userId: pending?.userId,
				providerId: pending?.providerId,
				bookingId: pending?.bookingId?.trim() || bookingIdFromUrl || undefined,
				serviceId: pending?.serviceId,
				fromTierMax: pending?.fromTierMax,
				toTierMax: pending?.toTierMax,
				nextCycle: pending?.nextCycle,
				remainingBalance: pending?.remainingBalance,
				extraPayment: pending?.extraPayment,
				billingInterval: pending?.billingInterval,
				billingIntervalCount: pending?.billingIntervalCount,
			};

			try {
				const res = await fetch("/api/pay/verify", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(body),
				});
				const data = (await res.json()) as { status?: string; error?: string };
				if (cancelled) return;

				if (res.ok && data.status === "success") {
					clearPaymentPending();
					setStatus("success");
					setMessage(t("paymentSuccess"));
					return;
				}

				setStatus(res.status === 202 ? "pending" : "error");
				setMessage(data.error ?? t("paymentPending"));
			} catch {
				if (!cancelled) {
					setStatus("error");
					setMessage(t("paymentVerifyFailed"));
				}
			}
		}

		void verify();
		return () => {
			cancelled = true;
		};
	}, [txRef, purpose, amount, t, bookingIdFromUrl]);

	return (
		<AuthShell title={t("paymentTitle")}>
			<div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
				{status === "verifying" ? (
					<p>{t("paymentVerifying")}</p>
				) : status === "success" ? (
					<p className="text-primary">{message}</p>
				) : status === "pending" ? (
					<p>{message}</p>
				) : status === "error" ? (
					<p className="text-destructive">{message}</p>
				) : (
					<p>
						{t("paymentSubmitted", {
							purpose,
							amount: amount ? ` of ETB ${amount}` : "",
						})}
					</p>
				)}
				{txRef ? <p className="font-mono text-xs">{txRef}</p> : null}
				<Link
					href={continueHref(purpose, bookingId)}
					className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
				>
					{t("commonContinue")}
				</Link>
			</div>
		</AuthShell>
	);
}

export default function PayDonePage() {
	return (
		<Suspense>
			<PayDoneContent />
		</Suspense>
	);
}
