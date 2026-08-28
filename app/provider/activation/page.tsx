"use client";

import { ChapaCheckout } from "@/components/payments/chapa-checkout";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/store/useAuth";

export default function ProviderActivationPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";

	return (
		<div className="mx-auto max-w-lg px-4 py-6">
			<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
			<h1 className="admin-page-title mt-2">{t("activation")}</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("providerActivationHint")}
			</p>
			<ChapaCheckout
				email={user?.email}
				firstName={user?.provider?.firstName ?? user?.name}
				lastName={user?.provider?.lastName ?? ""}
				phone={user?.provider?.phoneNumber}
				purpose="activation"
				accountType="provider"
				userId={user?.id ?? ""}
				providerId={providerId}
				returnPath="/pay/done?purpose=activation"
				showAmountInput
				label={t("activation")}
			/>
		</div>
	);
}
