"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { ChapaCheckout } from "@/components/payments/chapa-checkout";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/services/bookings/types";
import {
	planSubtitleForTier,
	planTitleForTier,
} from "@/services/provider/profileExtrasApi";
import {
	fetchProviderTierMax,
	fetchServicePostingTiers,
	isUnlimitedTier,
	purchasableServiceTiers,
	tierUpgradeAmount,
	type ServiceTier,
} from "@/services/provider/tiersApi";
import { useAuth } from "@/store/useAuth";

export default function ProviderTierPage() {
	const { t } = useLocale();
	const router = useRouter();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const [tiers, setTiers] = useState<ServiceTier[]>([]);
	const [currentMax, setCurrentMax] = useState(0);
	const [loading, setLoading] = useState(true);
	const [selectedMax, setSelectedMax] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [payMethod, setPayMethod] = useState<"chapa">("chapa");

	useEffect(() => {
		void (async () => {
			setLoading(true);
			const tierRes = await fetchServicePostingTiers();
			setTiers(tierRes.tiers);
			setError(tierRes.error);
			const max = providerId ? await fetchProviderTierMax(providerId) : 0;
			setCurrentMax(max);
			const next = purchasableServiceTiers(tierRes.tiers, max);
			setSelectedMax(next[0]?.max_services ?? null);
			setLoading(false);
		})();
	}, [providerId]);

	const upgrades = useMemo(() => {
		const list = purchasableServiceTiers(tiers, currentMax);
		if (list.length > 0) return list;
		if (!isUnlimitedTier(currentMax)) {
			const unlimited = tiers.find((tier) =>
				isUnlimitedTier(tier.max_services),
			);
			if (unlimited) return [unlimited];
		}
		return list;
	}, [tiers, currentMax]);

	const currentTier = useMemo(
		() => tiers.find((tier) => tier.max_services === currentMax) ?? null,
		[tiers, currentMax],
	);

	const selected =
		upgrades.find((tier) => tier.max_services === selectedMax) ??
		upgrades[0] ??
		null;

	const payAmount = selected
		? tierUpgradeAmount(tiers, currentMax, selected.max_services)
		: 0;

	const isUpgrade = currentMax !== 0;
	const planLabels = {
		unlimited: t("providerPlanUnlimited"),
		starter: t("providerPlanStarter"),
		growth: t("providerPlanGrowth"),
		business: t("providerPlanBusiness"),
		services: (count: number) =>
			t("providerServiceTierServices", { count: String(count) }),
	};
	const subtitleLabels = {
		unlimited: t("providerPlanUnlimitedHint"),
		one: t("providerPlanOneListing"),
		upTo: (count: number) => t("providerTierUpTo", { count: String(count) }),
	};

	return (
		<div className="mx-auto flex max-w-lg flex-col gap-4">
			<ProfileBackLink
				href="/provider/profile"
				label={t("providerListingPlansTitle")}
			/>

			{loading ? (
				<ServiceLoading compact />
			) : error ? (
				<p className="text-sm text-destructive">{error}</p>
			) : (
				<>
					{currentMax !== 0 && currentTier ? (
						<div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/10 p-3.5">
							<CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-primary" />
							<div className="min-w-0">
								<p className="text-xs text-muted-foreground">
									{t("providerCurrentPlan")}
								</p>
								<p className="text-sm font-bold">
									{planTitleForTier(currentTier, planLabels)}
								</p>
								<p className="text-xs text-muted-foreground">
									{planSubtitleForTier(currentTier, subtitleLabels)}
								</p>
							</div>
						</div>
					) : null}

					<div>
						<h1 className="text-base font-bold">
							{isUpgrade
								? t("providerUpgradeYourPlan")
								: t("providerChooseListingPlan")}
						</h1>
						<p className="mt-1 text-xs text-muted-foreground">
							{isUpgrade
								? t("providerUpgradePlanHint")
								: t("providerChoosePlanHint")}
						</p>
					</div>

					{upgrades.length === 0 ? (
						<div className="rounded-xl bg-white p-4 text-sm">
							{t("providerHighestPlanNoUpgrade")}
						</div>
					) : (
						<ul className="space-y-3">
							{upgrades.map((tier) => {
								const price = tierUpgradeAmount(
									tiers,
									currentMax,
									tier.max_services,
								);
								const isSelected =
									selected?.max_services === tier.max_services;
								return (
									<li key={`tier-${tier.max_services}`}>
										<button
											type="button"
											onClick={() => setSelectedMax(tier.max_services)}
											className={cn(
												"flex w-full items-start gap-3 rounded-xl bg-white p-3.5 text-left ring-1 transition-colors",
												isSelected
													? "ring-2 ring-primary"
													: "ring-black/10",
											)}
										>
											{isSelected ? (
												<CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-primary" />
											) : (
												<CircleIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
											)}
											<div className="min-w-0 flex-1">
												<p className="text-sm font-bold">
													{planTitleForTier(tier, planLabels)}
												</p>
												<p className="mt-0.5 text-xs text-muted-foreground">
													{planSubtitleForTier(tier, subtitleLabels)}
												</p>
												{isUpgrade ? (
													<p className="mt-1 text-[11px] text-muted-foreground">
														{t("providerPlanTotal", {
															amount: String(Math.round(tier.total_price)),
														})}
													</p>
												) : null}
											</div>
											<div className="shrink-0 text-right">
												<p className="text-base font-bold tabular-nums text-primary">
													{Math.round(price)} {t("commonCurrencyEtb")}
												</p>
												<p className="text-[11px] text-muted-foreground">
													{isUpgrade
														? t("providerUpgradeShort")
														: t("providerOneTime")}
												</p>
											</div>
										</button>
									</li>
								);
							})}
						</ul>
					)}

					{upgrades.length > 0 ? (
						<div>
							<p className="text-sm font-semibold">
								{t("providerChoosePaymentMethod")}
							</p>
							<button
								type="button"
								onClick={() => setPayMethod("chapa")}
								className={cn(
									"mt-3 flex w-full items-center gap-3 rounded-[10px] bg-white p-3 text-left ring-1",
									payMethod === "chapa"
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
								{payMethod === "chapa" ? (
									<CheckCircle2Icon className="size-5 text-primary" />
								) : (
									<CircleIcon className="size-5 text-muted-foreground" />
								)}
							</button>
						</div>
					) : null}

					<div className="space-y-3 border-t border-border pt-4">
						{upgrades.length > 0 ? (
							<>
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold">
										{t("providerAmountToPay")}
									</span>
									<span className="text-lg font-bold tabular-nums text-primary">
										{formatAmount(payAmount)}
									</span>
								</div>
								<ChapaCheckout
									variant="cta"
									email={user?.email}
									firstName={user?.provider?.firstName ?? user?.name}
									lastName={user?.provider?.lastName ?? ""}
									phone={user?.provider?.phoneNumber}
									purpose="tier"
									accountType="provider"
									userId={user?.id ?? ""}
									providerId={providerId}
									amount={String(payAmount)}
									fromTierMax={currentMax}
									toTierMax={selected?.max_services}
									returnPath="/pay/done?purpose=tier"
									showAmountInput={false}
									buttonLabel={t("providerProceedToPay")}
									disabled={!selected || payAmount <= 0}
								/>
							</>
						) : (
							<Button
								className="h-12 w-full rounded-[10px]"
								onClick={() => router.push("/provider/profile")}
							>
								{t("commonBack")}
							</Button>
						)}
					</div>
				</>
			)}
		</div>
	);
}
