"use client";

import { TelebirrCheckout } from "@/components/payments/telebirr-checkout";

export function TelebirrTopUp({
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
	return (
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
		/>
	);
}
