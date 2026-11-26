"use client";

import { TelebirrCheckout } from "@/components/payments/telebirr-checkout";
import { useLocale } from "@/lib/i18n";

export function GatewayTopUp({
	email,
	firstName,
	lastName,
	phone,
	userId,
	accountType = "customer",
	returnPath,
}: {
	email?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	phone?: string | null;
	userId: string;
	accountType?: "customer" | "provider";
	returnPath?: string;
}) {
	const { t } = useLocale();

	return (
		<div className="mt-4 space-y-3">
			<p className="text-xs text-muted-foreground">
				{t("providerTelebirrPayHint")}
			</p>
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
		</div>
	);
}
