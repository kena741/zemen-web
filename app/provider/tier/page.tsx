"use client";

import { useEffect, useState } from "react";

import { ChapaCheckout } from "@/components/payments/chapa-checkout";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import { formatAmount } from "@/services/bookings/types";
import {
	fetchProviderTierMax,
	fetchServicePostingTiers,
	type ServiceTier,
} from "@/services/provider/tiersApi";
import { useAuth } from "@/store/useAuth";

export default function ProviderTierPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const [tiers, setTiers] = useState<ServiceTier[]>([]);
	const [currentMax, setCurrentMax] = useState(0);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState<ServiceTier | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!providerId) return;
		void (async () => {
			setLoading(true);
			const [tierRes, max] = await Promise.all([
				fetchServicePostingTiers(),
				fetchProviderTierMax(providerId),
			]);
			setTiers(tierRes.tiers);
			setCurrentMax(max);
			setError(tierRes.error);
			setLoading(false);
		})();
	}, [providerId]);

	const upgrades = tiers.filter((tier) => tier.max_services > currentMax);

	return (
		<div className="mx-auto max-w-lg px-4 py-6">
			<ProfileBackLink href="/provider/profile" label={t("profileTitle")} />
			<h1 className="admin-page-title mt-2">{t("providerServiceTierTitle")}</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{t("providerServiceTierSubtitle")}
			</p>

			{loading ? (
				<ServiceLoading compact />
			) : error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : (
				<>
					<p className="mt-4 text-sm">
						{t("providerServiceTierCurrent")}{" "}
						<span className="font-semibold">
							{currentMax <= 0
								? t("providerServiceTierFree")
								: t("providerServiceTierServices", {
										count: currentMax,
									})}
						</span>
					</p>
					<div className="mt-4 space-y-2">
						{upgrades.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								{t("providerServiceTierHighest")}
							</p>
						) : (
							upgrades.map((tier) => (
								<button
									key={tier.max_services}
									type="button"
									onClick={() => setSelected(tier)}
									className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${
										selected?.max_services === tier.max_services
											? "border-primary bg-primary/5"
											: "border-border bg-white"
									}`}
								>
									<p className="font-semibold">
										{t("providerTierUpTo", {
											count: tier.max_services,
										})}
									</p>
									<p className="text-muted-foreground">
										{formatAmount(tier.total_price)}
									</p>
								</button>
							))
						)}
					</div>
					{selected ? (
						<ChapaCheckout
							email={user?.email}
							firstName={user?.provider?.firstName ?? user?.name}
							lastName={user?.provider?.lastName ?? ""}
							phone={user?.provider?.phoneNumber}
							purpose="tier"
							accountType="provider"
							userId={user?.id ?? ""}
							providerId={providerId}
							amount={String(selected.total_price)}
							fromTierMax={currentMax}
							toTierMax={selected.max_services}
							returnPath="/pay/done?purpose=tier"
							showAmountInput={false}
							label={t("providerServiceTierUpgrade", {
								count: selected.max_services,
							})}
						/>
					) : null}
				</>
			)}
		</div>
	);
}
