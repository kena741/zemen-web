"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { useLocale } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase/client";
import {
	clearPaymentPending,
	readPaymentPending,
} from "@/lib/payment-pending";

function continueHref(purpose: string): string {
	if (purpose === "activation" || purpose === "tier") return "/provider";
	if (purpose === "featured") return "/provider/services";
	if (purpose === "booking") return "/service/bookings";
	return "/service/wallet";
}

function PayDoneContent() {
	const search = useSearchParams();
	const { t } = useLocale();
	const purpose = search.get("purpose") ?? "wallet";
	const txRef =
		search.get("tx_ref") ?? search.get("trx_ref") ?? search.get("ref") ?? "";
	const amount = search.get("amount") ?? "";

	const [status, setStatus] = useState<"verifying" | "success" | "pending" | "error">(
		txRef ? "verifying" : "pending",
	);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!txRef) return;

		let cancelled = false;

		async function verify() {
			const pending = readPaymentPending();
			const session = await getSupabase().auth.getSession();
			const token = session.data.session?.access_token;
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
				accountType: pending?.accountType ?? "customer",
				userId: pending?.userId,
				providerId: pending?.providerId,
				bookingId: pending?.bookingId,
				serviceId: pending?.serviceId,
				fromTierMax: pending?.fromTierMax,
				toTierMax: pending?.toTierMax,
				nextCycle: pending?.nextCycle,
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
	}, [txRef, purpose, amount, t]);

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
					href={continueHref(purpose)}
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
