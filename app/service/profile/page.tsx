"use client";

import Link from "next/link";
import { TelegramLink } from "@/components/app/telegram-link";
import {
	BellIcon,
	ChevronRightIcon,
	HeartIcon,
	HistoryIcon,
	KeyRoundIcon,
	LogOutIcon,
	MapPinIcon,
	MessagesSquareIcon,
	TagIcon,
	WalletIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLocale } from "@/lib/i18n";
import { formatAmount } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";

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

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<h1 className="text-xl font-semibold tracking-tight md:text-[1.65rem]">
				{t("profileMyProfile")}
			</h1>

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
				onClick={logout}
			>
				<LogOutIcon className="size-4" />
				{t("signOut")}
			</Button>
		</div>
	);
}
