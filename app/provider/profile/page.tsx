"use client";

import Link from "next/link";
import {
	BanknoteIcon,
	BellIcon,
	BriefcaseIcon,
	ChevronRightIcon,
	FileCheckIcon,
	HistoryIcon,
	KeyRoundIcon,
	LogOutIcon,
	MailIcon,
	MessagesSquareIcon,
	PencilIcon,
	PercentIcon,
	TagIcon,
	Trash2Icon,
	UsersIcon,
	WalletIcon,
	WrenchIcon,
} from "lucide-react";

import { LocaleThemeToggle } from "@/components/app/locale-theme-toggle";
import { TelegramLink } from "@/components/app/telegram-link";
import { NotificationPermissionControl } from "@/components/push/notification-permission-control";
import { ProviderMobileTabBar } from "@/components/provider/mobile-chrome";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLocale } from "@/lib/i18n";
import { formatAmount } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";

const SUPPORT_EMAIL = "support@zemenservice.com";

function MenuGroup({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mt-6">
			<h2 className="mb-3 text-base font-bold text-[#464646]">{title}</h2>
			<div className="overflow-hidden rounded-xl bg-white">{children}</div>
		</section>
	);
}

function MenuItem({
	href,
	icon: Icon,
	label,
	trailing,
}: {
	href: string;
	icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
	label: string;
	trailing?: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
		>
			<Icon className="size-[22px] shrink-0 text-foreground" strokeWidth={1.75} />
			<span className="min-w-0 flex-1 text-sm">{label}</span>
			{trailing}
			<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
		</Link>
	);
}

function Divider() {
	return <div className="mx-4 border-t border-black/5" />;
}

export default function ProviderProfilePage() {
	const { t } = useLocale();
	const { user, logout } = useAuth();
	const provider = user?.provider;

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

			<div className="flex justify-end px-4 pt-3 lg:hidden">
				<LocaleThemeToggle />
			</div>

			<div className="px-4 pb-8 lg:px-0 lg:pt-6">
				<div className="flex flex-col items-center pt-6 text-center lg:pt-0">
					<UserAvatar
						src={provider?.profileImage}
						name={provider?.fullName ?? user?.name}
						size="lg"
						className="size-[100px] text-2xl"
					/>
					<p className="mt-3 text-lg font-semibold">
						{provider?.fullName ?? user?.name}
					</p>
					<p className="mt-0.5 text-sm text-[#7C7C7C]">
						{provider?.email ?? user?.email}
					</p>
					{provider?.phoneNumber ? (
						<p className="mt-0.5 text-sm text-[#7C7C7C]">
							{provider.phoneNumber}
						</p>
					) : null}
					{provider?.providerType ? (
						<span className="mt-3 rounded-full bg-[#e8f5e3] px-3 py-1 text-xs font-medium capitalize text-primary">
							{provider.providerType}
						</span>
					) : null}
					<Link
						href="/provider/profile/edit"
						className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
					>
						<PencilIcon className="size-3.5" />
						{t("profileEdit")}
					</Link>
				</div>

				<MenuGroup title={t("providerMenuService")}>
					<MenuItem
						href="/provider/services"
						icon={WrenchIcon}
						label={t("navServices")}
					/>
					<Divider />
					<MenuItem
						href="/provider/handymen"
						icon={UsersIcon}
						label={t("profileHandymanList")}
					/>
					<Divider />
					<MenuItem href="/provider/offers" icon={TagIcon} label={t("offersTitle")} />
					<Divider />
					<MenuItem
						href="/provider/jobs"
						icon={BriefcaseIcon}
						label={t("providerJobRequests")}
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
						href="/provider/wallet"
						icon={WalletIcon}
						label={t("navWallet")}
						trailing={
							<span className="mr-1 text-sm font-medium text-primary">
								{formatAmount(provider?.walletAmount ?? "0")}
							</span>
						}
					/>
					<Divider />
					<MenuItem
						href="/provider/wallet"
						icon={HistoryIcon}
						label={t("profileWalletHistory")}
					/>
				</MenuGroup>

				<MenuGroup title={t("providerMenuMessages")}>
					<MenuItem
						href="/provider/inbox"
						icon={MessagesSquareIcon}
						label={t("inboxTitle")}
					/>
					<Divider />
					<MenuItem
						href="/provider/notifications"
						icon={BellIcon}
						label={t("notificationsTitle")}
					/>
					<Divider />
					<NotificationPermissionControl />
				</MenuGroup>

				<MenuGroup title={t("profileAppSettings")}>
					<MenuItem
						href="/provider/profile/password"
						icon={KeyRoundIcon}
						label={t("profileChangePassword")}
					/>
					<Divider />
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
					<MenuItem
						href="/provider/verify-id"
						icon={FileCheckIcon}
						label={t("profileVerifyDocuments")}
					/>
					<Divider />
					<MenuItem href="/provider/taxes" icon={PercentIcon} label={t("taxes")} />
					<Divider />
					<MenuItem
						href="/provider/activation"
						icon={WalletIcon}
						label={t("profileAccountActivation")}
					/>
					<Divider />
					<MenuItem
						href="/provider/tier"
						icon={PercentIcon}
						label={t("profileServiceTier")}
					/>
				</MenuGroup>

				<div className="mt-6 space-y-2">
					<TelegramLink className="w-full justify-center" />
					<div className="flex justify-center gap-4 text-xs text-muted-foreground">
						<Link href="/legal/privacy" className="hover:text-primary">
							{t("legalPrivacy")}
						</Link>
						<Link href="/legal/terms" className="hover:text-primary">
							{t("legalTerms")}
						</Link>
						<Link href="/legal/about" className="hover:text-primary">
							{t("legalAbout")}
						</Link>
					</div>
				</div>

				<Button
					variant="outline"
					className="mt-8 w-full gap-2 text-destructive"
					onClick={logout}
				>
					<LogOutIcon className="size-4" />
					{t("signOut")}
				</Button>
				<Button
					variant="ghost"
					className="mt-2 w-full gap-2 text-destructive"
					onClick={onDeleteAccount}
				>
					<Trash2Icon className="size-4" />
					{t("deleteAccount")}
				</Button>
			</div>
		</div>
	);
}
