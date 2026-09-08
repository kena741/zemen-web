"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
	clearPaymentPending,
	savePaymentPending,
	type PaymentPending,
	type PaymentPurpose,
} from "@/lib/payment-pending";

export interface ChapaCheckoutProps {
	amount?: string;
	email?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	phone?: string | null;
	purpose: PaymentPurpose;
	accountType: "customer" | "provider";
	userId: string;
	providerId?: string;
	bookingId?: string;
	serviceId?: string;
	fromTierMax?: number;
	toTierMax?: number;
	returnPath?: string;
	showAmountInput?: boolean;
	label?: string;
	className?: string;
	/** Full-width CTA matching mobile “Proceed to Pay”. */
	variant?: "card" | "cta";
	buttonLabel?: string;
	disabled?: boolean;
}

export function ChapaCheckout({
	amount: fixedAmount,
	email,
	firstName,
	lastName,
	phone,
	purpose,
	accountType,
	userId,
	providerId,
	bookingId,
	serviceId,
	fromTierMax,
	toTierMax,
	returnPath,
	showAmountInput = purpose === "wallet",
	label,
	className,
	variant = "card",
	buttonLabel,
	disabled,
}: ChapaCheckoutProps) {
	const { t } = useLocale();
	const [amount, setAmount] = useState(fixedAmount ?? "100");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (fixedAmount != null) setAmount(fixedAmount);
	}, [fixedAmount]);

	const payAmount = fixedAmount ?? amount;

	async function pay() {
		if (disabled || busy) return;
		setBusy(true);
		setError(null);

		const pending: PaymentPending = {
			purpose,
			userId,
			accountType,
			amount: payAmount,
			providerId,
			bookingId,
			serviceId,
			fromTierMax,
			toTierMax,
		};
		savePaymentPending(pending);

		const path =
			returnPath ??
			`/pay/done?purpose=${encodeURIComponent(purpose)}&amount=${encodeURIComponent(payAmount)}`;

		try {
			const res = await fetch("/api/pay/chapa", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: payAmount,
					email,
					first_name: firstName,
					last_name: lastName,
					phone_number: phone,
					purpose,
					return_path: path,
					provider_id: providerId,
					booking_id: bookingId,
					service_id: serviceId,
				}),
			});
			const data = (await res.json()) as {
				checkout_url?: string;
				tx_ref?: string;
				error?: string;
			};
			if (!res.ok || !data.checkout_url) {
				clearPaymentPending();
				setError(data.error || t("paymentFailed"));
				return;
			}
			if (data.tx_ref) {
				savePaymentPending({ ...pending, txRef: data.tx_ref });
			}
			window.location.href = data.checkout_url;
		} catch {
			clearPaymentPending();
			setError(t("noInternet"));
		} finally {
			setBusy(false);
		}
	}

	if (variant === "cta") {
		return (
			<div className={className}>
				<Button
					type="button"
					className="h-12 w-full rounded-[10px] text-base font-semibold"
					onClick={() => void pay()}
					disabled={busy || disabled || !(Number(payAmount) > 0)}
				>
					{busy ? t("commonLoading") : (buttonLabel ?? t("providerProceedToPay"))}
				</Button>
				{error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
			</div>
		);
	}

	return (
		<div
			className={cn(
				"mt-4 rounded-xl border border-border bg-white p-4 dark:bg-card",
				className,
			)}
		>
			<p className="text-sm font-medium">{label ?? t("walletTopUp")}</p>
			<div className="mt-3 flex gap-2">
				{showAmountInput ? (
					<Input
						type="number"
						min={1}
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						className="h-10"
					/>
				) : (
					<p className="flex h-10 flex-1 items-center text-sm font-semibold tabular-nums">
						ETB {payAmount}
					</p>
				)}
				<Button
					type="button"
					onClick={() => void pay()}
					disabled={busy || disabled}
				>
					{busy ? "…" : t("payWithChapa")}
				</Button>
			</div>
			{error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
		</div>
	);
}
