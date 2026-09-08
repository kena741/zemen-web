"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
	BanknoteIcon,
	BriefcaseIcon,
	Building2Icon,
	ChevronRightIcon,
	FileCheckIcon,
	GlobeIcon,
	HistoryIcon,
	InfoIcon,
	KeyRoundIcon,
	LogOutIcon,
	MailIcon,
	PaletteIcon,
	PercentIcon,
	TagIcon,
	Trash2Icon,
	TrendingUpIcon,
	UsersIcon,
	VerifiedIcon,
	WalletIcon,
	WrenchIcon,
} from "lucide-react";

import { LocaleThemeToggle } from "@/components/app/locale-theme-toggle";
import { TelegramLink } from "@/components/app/telegram-link";
import { ProviderMobileTabBar } from "@/components/provider/mobile-chrome";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLocale } from "@/lib/i18n";
import {
	fetchAdminCommission,
	formatAdminCommissionLabel,
	planSubtitleForTier,
	planTitleForTier,
	type AdminCommission,
} from "@/services/provider/profileExtrasApi";
import {
	fetchProviderTierMax,
	fetchServicePostingTiers,
	isUnlimitedTier,
	purchasableServiceTiers,
	type ServiceTier,
} from "@/services/provider/tiersApi";
import { useAuth } from "@/store/useAuth";

const SUPPORT_EMAIL = "support@zemenservice.com";

function MenuGroup({
	title,
	trailing,
	children,
}: {
	title: string;
	trailing?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section className="mt-6">
			<div className="mb-3 flex items-center gap-2">
				<h2 className="text-base font-bold text-[#464646]">{title}</h2>
				{trailing}
			</div>
			<div className="overflow-hidden rounded-xl bg-white">{children}</div>
		</section>
	);
}

function MenuItem({
	href,
	icon: Icon,
	label,
	trailing,
	danger,
}: {
	href: string;
	icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
	label: string;
	trailing?: React.ReactNode;
	danger?: boolean;
}) {
	return (
		<Link
			href={href}
			className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
		>
			<Icon
				className={`size-[22px] shrink-0 ${danger ? "text-destructive" : "text-foreground"}`}
				strokeWidth={1.75}
			/>
			<span
				className={`min-w-0 flex-1 text-sm ${danger ? "text-destructive" : ""}`}
			>
				{label}
			</span>
			{trailing}
			<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
		</Link>
	);
}

function Divider() {
	return <div className="mx-4 border-t border-black/5" />;
}

function Badge({
	icon: Icon,
	label,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
}) {
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e3] px-2.5 py-1 text-[11px] font-medium text-primary">
			<Icon className="size-3.5" />
			{label}
		</span>
	);
}

export default function ProviderProfilePage() {
	const { t } = useLocale();
	const { user, logout } = useAuth();
	const provider = user?.provider;
	const providerId = provider?.id ?? "";

	const [tiers, setTiers] = useState<ServiceTier[]>([]);
	const [tierMax, setTierMax] = useState(0);
	const [planLoading, setPlanLoading] = useState(true);
	const [commission, setCommission] = useState<AdminCommission | null>(null);

	useEffect(() => {
		if (!providerId) {
			setPlanLoading(false);
			return;
		}
		void (async () => {
			setPlanLoading(true);
			const [tierRes, max, commissionRes] = await Promise.all([
				fetchServicePostingTiers(),
				fetchProviderTierMax(providerId),
				fetchAdminCommission(),
			]);
			setTiers(tierRes.tiers);
			setTierMax(max);
			setCommission(commissionRes);
			setPlanLoading(false);
		})();
	}, [providerId]);

	const currentTier = useMemo(
		() => tiers.find((tier) => tier.max_services === tierMax) ?? null,
		[tiers, tierMax],
	);
	const hasPlan = tierMax >= 1 || isUnlimitedTier(tierMax);
	const upgrades = purchasableServiceTiers(tiers, tierMax);
	const canUpgrade = !hasPlan ? tiers.length > 0 : upgrades.length > 0;

	const planTitle = hasPlan
		? planTitleForTier(currentTier, {
				unlimited: t("providerPlanUnlimited"),
				starter: t("providerPlanStarter"),
				growth: t("providerPlanGrowth"),
				business: t("providerPlanBusiness"),
				services: (count) =>
					t("providerServiceTierServices", { count: String(count) }),
			})
		: t("providerChooseListingPlan");

	const planSubtitle = hasPlan
		? planSubtitleForTier(currentTier, {
				unlimited: t("providerPlanUnlimitedHint"),
				one: t("providerPlanOneListing"),
				upTo: (count) => t("providerTierUpTo", { count: String(count) }),
			})
		: tiers.length
			? t("providerPlanPricesHint", {
					prices: tiers.map((tier) => String(Math.round(tier.total_price))).join(" · "),
				})
			: t("providerPlanNotConfigured");

	const planCta = !hasPlan
		? t("providerGetListingPlan")
		: canUpgrade
			? t("providerUpgradePlan")
			: t("providerViewPlan");

	const providerTypeLabel =
		(provider?.providerType ?? "").toLowerCase() === "company"
			? t("providerTypeCompany")
			: t("providerTypeIndividual");

	function onDeleteAccount() {
		if (!window.confirm(t("deleteAccountConfirm"))) return;
		window.alert(t("deleteAccountContactSupport", { email: SUPPORT_EMAIL }));
		logout();
	}

	return (
		<div className="mx-auto max-w-3xl">
			<ProviderMobileTabBar title={t("providerProfileMy")} />

			<div className="hidden items-start justify-between gap-3 lg:flex">
				<div>
					<p className="admin-eyebrow">{t("provider")}</p>
					<h1 className="admin-page-title mt-1">{t("profileTitle")}</h1>
				</div>
				<LocaleThemeToggle />
			</div>

			<div className="px-4 pb-8 lg:px-0 lg:pt-6">
				<div className="flex flex-col items-center pt-6 text-center lg:pt-0">
					<div className="relative">
						<UserAvatar
							src={provider?.profileImage}
							name={provider?.fullName ?? user?.name}
							size="lg"
							className="size-[90px] text-2xl"
						/>
						<Link
							href="/provider/profile/edit"
							className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5"
							aria-label={t("profileEdit")}
						>
							<span className="text-xs font-semibold text-primary">✎</span>
						</Link>
					</div>
					<p className="mt-3 text-base font-semibold">
						{provider?.firstName || provider?.fullName || user?.name}
					</p>
					<div className="mt-2 flex flex-wrap items-center justify-center gap-2">
						<Badge icon={UsersIcon} label={providerTypeLabel} />
						<Badge
							icon={PercentIcon}
							label={`${t("providerAdminCommission")}: ${formatAdminCommissionLabel(commission)}`}
						/>
					</div>
				</div>

				<section className="mt-6">
					<h2 className="mb-3 text-base font-bold text-[#464646]">
						{t("providerListingPlan")}
					</h2>
					<div className="rounded-xl border border-primary/20 bg-white p-4">
						{planLoading ? (
							<p className="text-sm text-muted-foreground">{t("commonLoading")}</p>
						) : (
							<>
								<div className="flex items-start gap-3">
									{hasPlan ? (
										<VerifiedIcon className="mt-0.5 size-6 shrink-0 text-muted-foreground" />
									) : (
										<span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-sm text-destructive">
											!
										</span>
									)}
									<div className="min-w-0 flex-1 text-left">
										<p className="text-sm font-semibold">{planTitle}</p>
										<p className="mt-1 text-xs text-muted-foreground">
											{planSubtitle}
										</p>
									</div>
									<span
										className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
											hasPlan
												? "bg-primary/10 text-primary"
												: "bg-destructive/10 text-destructive"
										}`}
									>
										{hasPlan
											? t("providerPlanActive")
											: t("providerPlanInactive")}
									</span>
								</div>
								<Link
									href="/provider/tier"
									className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground"
								>
									{canUpgrade && hasPlan ? (
										<TrendingUpIcon className="size-4" />
									) : (
										<VerifiedIcon className="size-4" />
									)}
									{planCta}
								</Link>
							</>
						)}
					</div>
				</section>

				<MenuGroup title={t("providerMenuService")}>
					<MenuItem
						href="/provider/services"
						icon={WrenchIcon}
						label={t("navServices")}
					/>
					<Divider />
					<MenuItem
						href="/provider/offers"
						icon={TagIcon}
						label={t("providerServiceOffers")}
					/>
					<Divider />
					<MenuItem
						href="/provider/jobs?tab=bids"
						icon={BriefcaseIcon}
						label={t("providerBidList")}
					/>
				</MenuGroup>

				<MenuGroup title={t("providerMenuPayment")}>
					<MenuItem
						href="/provider/bank"
						icon={BanknoteIcon}
						label={t("providerBankDetail")}
					/>
					<Divider />
					<MenuItem
						href="/provider/payments"
						icon={WalletIcon}
						label={t("providerPaymentsTitle")}
					/>
					<Divider />
					<MenuItem
						href="/provider/wallet"
						icon={HistoryIcon}
						label={t("profileWalletHistory")}
					/>
				</MenuGroup>

				<MenuGroup title={t("providerMenuCompany")}>
					<MenuItem
						href="/provider/onboarding"
						icon={Building2Icon}
						label={t("companyDetails")}
					/>
				</MenuGroup>

				<MenuGroup title={t("providerMenuHandyman")}>
					<MenuItem
						href="/provider/handymen"
						icon={UsersIcon}
						label={t("profileHandymanList")}
					/>
				</MenuGroup>

				<MenuGroup title={t("providerMenuAbout")}>
					<MenuItem
						href="/provider/verify-id"
						icon={FileCheckIcon}
						label={t("profileVerifyDocuments")}
					/>
				</MenuGroup>

				<MenuGroup title={t("profileAppSettings")}>
					<div className="flex items-center gap-3 px-4 py-3.5">
						<PaletteIcon
							className="size-[22px] shrink-0 text-foreground"
							strokeWidth={1.75}
						/>
						<span className="min-w-0 flex-1 text-sm">{t("theme")}</span>
						<LocaleThemeToggle mode="theme" />
					</div>
					<Divider />
					<MenuItem
						href="/provider/profile/password"
						icon={KeyRoundIcon}
						label={t("profileChangePassword")}
					/>
					<Divider />
					<div className="flex items-center gap-3 px-4 py-3.5">
						<GlobeIcon
							className="size-[22px] shrink-0 text-foreground"
							strokeWidth={1.75}
						/>
						<span className="min-w-0 flex-1 text-sm">{t("language")}</span>
						<LocaleThemeToggle mode="locale" />
					</div>
					<Divider />
					<MenuItem
						href="/legal/about"
						icon={InfoIcon}
						label={t("legalAbout")}
					/>
				</MenuGroup>

				<MenuGroup title={t("providerHelpSupport")}>
					<a
						href={`mailto:${SUPPORT_EMAIL}`}
						className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
					>
						<MailIcon
							className="size-[22px] shrink-0 text-foreground"
							strokeWidth={1.75}
						/>
						<span className="min-w-0 flex-1 text-sm">{t("contactUs")}</span>
						<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
					</a>
					<Divider />
					<div className="px-4 py-3">
						<TelegramLink className="w-full justify-start" />
					</div>
				</MenuGroup>

				<div className="mt-6 flex justify-center gap-4 text-xs text-muted-foreground">
					<Link href="/legal/privacy" className="hover:text-primary">
						{t("legalPrivacy")}
					</Link>
					<Link href="/legal/terms" className="hover:text-primary">
						{t("legalTerms")}
					</Link>
				</div>

				<div className="mt-4 overflow-hidden rounded-xl bg-white">
					<button
						type="button"
						onClick={onDeleteAccount}
						className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
					>
						<Trash2Icon className="size-[22px] text-destructive" strokeWidth={1.75} />
						<span className="text-sm text-destructive">{t("deleteAccount")}</span>
					</button>
				</div>

				<div className="mt-3 overflow-hidden rounded-xl bg-white">
					<button
						type="button"
						onClick={logout}
						className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
					>
						<LogOutIcon className="size-[22px] text-destructive" strokeWidth={1.75} />
						<span className="text-sm text-destructive">{t("signOut")}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
