"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
	CheckCircle2Icon,
	CircleAlertIcon,
	Loader2Icon,
	Clock3Icon,
} from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { refreshAccessToken } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/tokenStore";
import { useLocale } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { isBackendMode } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";
import {
	clearPaymentPending,
	readPaymentPending,
} from "@/lib/payment-pending";
import { sanitizeMerchOrderId } from "@/lib/telebirr";
import { cn } from "@/lib/utils";

type PayStatus = "verifying" | "success" | "pending" | "error";

function continueHref(purpose: string, bookingId?: string | null): string {
	if (purpose === "activation" || purpose === "tier") return "/provider";
	if (purpose === "featured") return "/provider/services";
	if (purpose === "booking") {
		const id = bookingId?.trim();
		return id ? `/service/bookings/${id}` : "/service/bookings";
	}
	return "/service/wallet";
}

function continueLabelKey(purpose: string): MessageKey {
	if (purpose === "booking") return "paymentContinueBooking";
	if (purpose === "activation" || purpose === "tier") {
		return "paymentContinueProvider";
	}
	if (purpose === "featured") return "paymentContinueServices";
	return "paymentContinueWallet";
}

function cleanTxRef(raw: string): string {
	const base = raw.trim().split("?")[0]?.split("&")[0]?.split("#")[0] ?? "";
	if (!base) return "";
	if (base.startsWith("tier-") || base.startsWith("web-")) return base.slice(0, 80);
	return sanitizeMerchOrderId(base);
}

function resolveTxRef(search: URLSearchParams): string {
	const pending = readPaymentPending();
	const fromPending = cleanTxRef(pending?.txRef ?? "");
	if (fromPending) return fromPending;

	const merch = cleanTxRef(search.get("merch_order_id") ?? "");
	if (merch) return merch;

	return cleanTxRef(
		search.get("tx_ref") ??
			search.get("trx_ref") ??
			search.get("ref") ??
			"",
	);
}

function prefersReducedMotion(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function PayDoneContent() {
	const router = useRouter();
	const search = useSearchParams();
	const { t } = useLocale();
	const purpose = search.get("purpose") ?? "wallet";
	const txRef = resolveTxRef(search);
	const amount = search.get("amount") ?? "";
	const bookingIdFromUrl = (
		search.get("bookingId") ??
		search.get("booking_id") ??
		""
	).trim();
	const pendingBootstrap = readPaymentPending();
	const bookingId =
		bookingIdFromUrl ||
		(pendingBootstrap?.bookingId ?? "").trim() ||
		null;
	const href = continueHref(purpose, bookingId);
	const ctaLabel = t(continueLabelKey(purpose));

	const [status, setStatus] = useState<PayStatus>(
		txRef ? "verifying" : "pending",
	);
	const [message, setMessage] = useState<string | null>(null);
	const [needsSignIn, setNeedsSignIn] = useState(false);
	const [retryToken, setRetryToken] = useState(0);
	const redirected = useRef(false);

	const signInHref = (() => {
		const q = new URLSearchParams();
		q.set("purpose", purpose);
		if (amount) q.set("amount", amount);
		if (txRef) q.set("tx_ref", txRef);
		if (bookingIdFromUrl) q.set("bookingId", bookingIdFromUrl);
		const next = `/pay/done?${q.toString()}`;
		return `/login?next=${encodeURIComponent(next)}`;
	})();

	const verify = useCallback(async () => {
		if (!txRef) return;

		setStatus("verifying");
		setMessage(null);
		setNeedsSignIn(false);

		const pending = readPaymentPending();
		const purposeResolved = pending?.purpose ?? purpose;
		const gatewayResolved = pending?.gateway ?? "telebirr";
		const accountResolved =
			pending?.accountType ??
			(search.get("account") === "provider" ? "provider" : "customer");
		const userIdResolved =
			(pending?.userId ?? "").trim() || (search.get("uid") ?? "").trim();
		const canAuthlessWallet =
			gatewayResolved === "telebirr" &&
			purposeResolved === "wallet" &&
			Boolean(userIdResolved);

		let token = getAccessToken();
		if (!token && isBackendMode()) {
			token = await refreshAccessToken();
		}
		if (!token) {
			const session = await getSupabase().auth.getSession();
			token = session.data.session?.access_token ?? null;
		}
		if (!token && !canAuthlessWallet) {
			setStatus("error");
			setNeedsSignIn(true);
			setMessage(t("paymentSignInVerify"));
			return;
		}

		const body = {
			tx_ref: txRef,
			purpose: purposeResolved,
			amount: pending?.amount ?? amount,
			gateway: gatewayResolved,
			accountType: accountResolved,
			userId: userIdResolved || undefined,
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
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify(body),
			});
			const data = (await res.json()) as { status?: string; error?: string };

			if (res.ok && data.status === "success") {
				clearPaymentPending();
				setStatus("success");
				setMessage(t("paymentSuccess"));
				return;
			}

			setStatus(res.status === 202 ? "pending" : "error");
			setMessage(data.error ?? t("paymentPending"));
		} catch {
			setStatus("error");
			setMessage(t("paymentVerifyFailed"));
		}
	}, [txRef, purpose, amount, t, bookingIdFromUrl, search]);

	useEffect(() => {
		void verify();
	}, [verify, retryToken]);

	useEffect(() => {
		if (status !== "success" || redirected.current) return;
		const delay = prefersReducedMotion() ? 0 : 1200;
		const timer = window.setTimeout(() => {
			redirected.current = true;
			router.replace(href);
		}, delay);
		return () => window.clearTimeout(timer);
	}, [status, href, router]);

	const titleKey: MessageKey =
		status === "success"
			? "paymentSuccessTitle"
			: status === "pending"
				? "paymentPendingTitle"
				: status === "error"
					? "paymentErrorTitle"
					: "paymentVerifyingTitle";

	const shellSubtitle =
		status === "success"
			? t("paymentRedirecting")
			: amount
				? t("paymentAmountPaid", { amount })
				: undefined;

	return (
		<AuthShell title={t(titleKey)} subtitle={shellSubtitle}>
			<div className="flex flex-col items-center text-center">
				<div
					className={cn(
						"mb-4 flex size-14 items-center justify-center rounded-2xl",
						status === "success" && "bg-[#174309]/10 text-[#174309]",
						status === "verifying" && "bg-muted text-muted-foreground",
						status === "pending" && "bg-amber-500/10 text-amber-700",
						status === "error" && "bg-destructive/10 text-destructive",
					)}
					aria-hidden
				>
					{status === "success" ? (
						<CheckCircle2Icon className="size-7" />
					) : status === "verifying" ? (
						<Loader2Icon className="size-7 animate-spin" />
					) : status === "pending" ? (
						<Clock3Icon className="size-7" />
					) : (
						<CircleAlertIcon className="size-7" />
					)}
				</div>

				<p className="max-w-[22rem] text-[14px] leading-snug text-muted-foreground">
					{status === "verifying"
						? t("paymentVerifying")
						: (message ?? t("paymentSubmitted", { purpose, amount: "" }))}
				</p>

				{amount && status !== "verifying" ? (
					<p className="mt-3 text-[20px] font-semibold tracking-tight text-[#0f1a0c]">
						{t("paymentAmountPaid", { amount })}
					</p>
				) : null}

				<div className="mt-6 flex w-full flex-col gap-2">
					{status === "success" ? (
						<Link
							href={href}
							className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#174309] px-4 text-[14px] font-semibold text-[#f4faf0] transition-colors duration-150 hover:bg-[#1f5a0b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174309]/35 focus-visible:ring-offset-2"
						>
							{ctaLabel}
						</Link>
					) : null}

					{status === "error" || status === "pending" ? (
						<>
							{needsSignIn ? (
								<Link
									href={signInHref}
									className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#174309] px-4 text-[14px] font-semibold text-[#f4faf0] transition-colors duration-150 hover:bg-[#1f5a0b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174309]/35 focus-visible:ring-offset-2"
								>
									{t("signIn")}
								</Link>
							) : (
								<button
									type="button"
									onClick={() => setRetryToken((n) => n + 1)}
									className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#174309] px-4 text-[14px] font-semibold text-[#f4faf0] transition-colors duration-150 hover:bg-[#1f5a0b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174309]/35 focus-visible:ring-offset-2"
								>
									{t("paymentRetry")}
								</button>
							)}
							<Link
								href={href}
								className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-transparent px-4 text-[14px] font-semibold text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174309]/25 focus-visible:ring-offset-2"
							>
								{ctaLabel}
							</Link>
						</>
					) : null}

				</div>

				{txRef ? (
					<details className="mt-6 w-full text-left">
						<summary className="cursor-pointer list-none text-center text-[12px] font-medium text-muted-foreground underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
							{t("paymentOrderRef")}
						</summary>
						<p className="mt-2 break-all rounded-xl bg-muted/80 px-3 py-2 text-center font-mono text-[11px] text-muted-foreground">
							{txRef}
						</p>
					</details>
				) : null}
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
