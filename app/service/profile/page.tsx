"use client";

import Link from "next/link";
import {
	BellIcon,
	ChevronRightIcon,
	HeartIcon,
	HistoryIcon,
	KeyRoundIcon,
	LogOutIcon,
	MailIcon,
	MapPinIcon,
	MessagesSquareIcon,
	TagIcon,
	Trash2Icon,
	WalletIcon,
} from "lucide-react";

import { LocaleThemeToggle } from "@/components/app/locale-theme-toggle";
import { TelegramLink } from "@/components/app/telegram-link";
import { NotificationPermissionControl } from "@/components/push/notification-permission-control";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { clearGuestBrowse } from "@/lib/guest";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";

const SUPPORT_EMAIL = "support@zemenservice.com";

function MenuLink({
	href,
	icon: Icon,
	label,
	trailing,
}: {
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	trailing?: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
		>
			<Icon className="size-[22px] shrink-0 text-foreground" />
			<span className="min-w-0 flex-1 text-sm">{label}</span>
			{trailing}
			<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
		</Link>
	);
}

export default function CustomerProfilePage() {
	const { t } = useLocale();
	const { user, logout } = useAuth();
	const customer = user?.customer;
	const wallet = customer?.walletAmount ?? "0";

	function onLogout() {
		clearGuestBrowse();
		logout();
	}

	function onDeleteAccount() {
		if (!window.confirm(t("deleteAccountConfirm"))) return;
		window.alert(t("deleteAccountContactSupport", { email: SUPPORT_EMAIL }));
		clearGuestBrowse();
		logout();
	}

	if (!user) {
		return (
			<div className="px-4 pt-4 md:px-6 md:pt-8">
				<h1 className="text-xl font-semibold tracking-tight md:text-[1.65rem]">
					{t("guestProfileTitle")}
				</h1>
				<p className="mt-3 text-sm text-muted-foreground">
					{t("guestProfileBody")}
				</p>
				<Link
					href="/login"
					className={cn(buttonVariants(), "mt-8 w-full")}
				>
					{t("guestSignInCta")}
				</Link>
			</div>
		);
	}

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<div className="flex items-start justify-between gap-3">
				<h1 className="text-xl font-semibold tracking-tight md:text-[1.65rem]">
					{t("profileMyProfile")}
				</h1>
				<LocaleThemeToggle />
			</div>

			<div className="mt-8 flex flex-col items-center text-center">
				<UserAvatar
					src={customer?.profileImage}
					name={user?.name}
					size="lg"
					className="size-20 text-xl"
				/>
				<p className="mt-3 text-base font-semibold">
					{customer?.fullName || user?.name}
				</p>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{customer?.email || user?.email}
				</p>
				{customer?.phone ? (
					<p className="mt-0.5 text-sm text-muted-foreground">
						{customer.phone}
					</p>
				) : null}
			</div>

			<section className="mt-8">
				<h2 className="mb-3 text-sm font-semibold">{t("profileService")}</h2>
				<div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
					<MenuLink
						href="/service/wallet"
						icon={WalletIcon}
						label={t("profileWalletBalance")}
						trailing={
							<span className="mr-1 text-sm font-medium text-primary">
								{formatAmount(wallet)}
							</span>
						}
					/>
					<div className="mx-4 border-t border-border/60" />
					<MenuLink
						href="/service/wallet"
						icon={HistoryIcon}
						label={t("profileWalletHistory")}
					/>
					<div className="mx-4 border-t border-border/60" />
					<MenuLink
						href="/service/addresses"
						icon={MapPinIcon}
						label={t("profileAddresses")}
					/>
					<div className="mx-4 border-t border-border/60" />
					<MenuLink
						href="/service/favorites"
						icon={HeartIcon}
						label={t("profileFavorites")}
					/>
					<div className="mx-4 border-t border-border/60" />
					<MenuLink
						href="/service/offers"
						icon={TagIcon}
						label={t("profileOffers")}
					/>
					<div className="mx-4 border-t border-border/60" />
					<MenuLink
						href="/service/my-services"
						icon={TagIcon}
						label={t("profileMyServices")}
					/>
				</div>
			</section>

			<section className="mt-6">
				<h2 className="mb-3 text-sm font-semibold">{t("profileMessages")}</h2>
				<div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
					<MenuLink
						href="/service/inbox"
						icon={MessagesSquareIcon}
						label={t("profileInbox")}
					/>
					<div className="mx-4 border-t border-border/60" />
					<MenuLink
						href="/service/notifications"
						icon={BellIcon}
						label={t("notificationsTitle")}
					/>
					<div className="mx-4 border-t border-border/60" />
					<NotificationPermissionControl />
				</div>
			</section>

			<section className="mt-6">
				<h2 className="mb-3 text-sm font-semibold">{t("profileAppSettings")}</h2>
				<div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
					<MenuLink
						href="/service/profile/password"
						icon={KeyRoundIcon}
						label={t("profileChangePassword")}
					/>
					<div className="mx-4 border-t border-border/60" />
					<a
						href={`mailto:${SUPPORT_EMAIL}`}
						className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
					>
						<MailIcon className="size-[22px] shrink-0 text-foreground" />
						<span className="min-w-0 flex-1 text-sm">{t("contactUs")}</span>
						<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
					</a>
				</div>
			</section>

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
				onClick={onLogout}
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
	);
}
