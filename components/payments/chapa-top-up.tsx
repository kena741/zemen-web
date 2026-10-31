"use client";

import { ChapaCheckout } from "@/components/payments/chapa-checkout";

export function ChapaTopUp({
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
		/>
	);
}
