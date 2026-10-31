"use client";

import { useState } from "react";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";

import { ChapaCheckout } from "@/components/payments/chapa-checkout";
import { TelebirrCheckout } from "@/components/payments/telebirr-checkout";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { PaymentGateway } from "@/lib/payment-pending";

export function GatewayTopUp({
	email,
	firstName,
	lastName,
	phone,
	userId,
	accountType = "customer",
	returnPath,
	defaultGateway = "telebirr",
}: {
	email?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	phone?: string | null;
	userId: string;
	accountType?: "customer" | "provider";
	returnPath?: string;
	defaultGateway?: PaymentGateway;
}) {
	const { t } = useLocale();
	const [gateway, setGateway] = useState<PaymentGateway>(defaultGateway);

	return (
		<div className="mt-4 space-y-3">
			<p className="text-sm font-medium">{t("providerChoosePaymentMethod")}</p>
			<div className="grid gap-2 sm:grid-cols-2">
				<button
					type="button"
					onClick={() => setGateway("telebirr")}
					className={cn(
						"flex items-center gap-3 rounded-[10px] bg-white p-3 text-left ring-1",
						gateway === "telebirr"
							? "ring-[1.6px] ring-primary"
							: "ring-black/20",
					)}
				>
					<span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
						T
					</span>
					<span className="min-w-0 flex-1">
						<p className="text-sm font-semibold">{t("paymentTelebirr")}</p>
						<p className="text-xs text-muted-foreground">
							{t("providerTelebirrPayHint")}
						</p>
					</span>
					{gateway === "telebirr" ? (
						<CheckCircle2Icon className="size-5 text-primary" />
					) : (
						<CircleIcon className="size-5 text-muted-foreground" />
					)}
				</button>
				<button
					type="button"
					onClick={() => setGateway("chapa")}
					className={cn(
						"flex items-center gap-3 rounded-[10px] bg-white p-3 text-left ring-1",
						gateway === "chapa"
							? "ring-[1.6px] ring-primary"
							: "ring-black/20",
					)}
				>
					<span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
						C
					</span>
					<span className="min-w-0 flex-1">
						<p className="text-sm font-semibold">{t("paymentChapa")}</p>
						<p className="text-xs text-muted-foreground">
							{t("providerChapaPayHint")}
						</p>
					</span>
					{gateway === "chapa" ? (
						<CheckCircle2Icon className="size-5 text-primary" />
					) : (
						<CircleIcon className="size-5 text-muted-foreground" />
					)}
				</button>
			</div>

			{gateway === "telebirr" ? (
				<TelebirrCheckout
					email={email}
					firstName={firstName}
					lastName={lastName}
					phone={phone}
					purpose="wallet"
					accountType={accountType}
					userId={userId}
					returnPath={returnPath}
					showAmountInput
					className="mt-0"
				/>
			) : (
				<ChapaCheckout
					email={email}
					firstName={firstName}
					lastName={lastName}
					phone={phone}
					purpose="wallet"
					accountType={accountType}
					userId={userId}
					returnPath={returnPath}
					showAmountInput
					className="mt-0"
				/>
			)}
		</div>
	);
}
