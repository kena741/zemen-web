"use client";

import Link from "next/link";
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
	const { user, logout } = useAuth();
	const customer = user?.customer;
	const wallet = customer?.walletAmount ?? "0";

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<h1 className="text-xl font-semibold tracking-tight md:text-[1.65rem]">
				My Profile
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
				<h2 className="mb-3 text-sm font-semibold">Service</h2>
				<div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
					<MenuLink
						href="/service/wallet"
						icon={WalletIcon}
						label="Wallet Balance"
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
						label="Wallet History"
					/>
					<div className="mx-4 border-t border-border/60" />
					<MenuLink
						href="/service/addresses"
						icon={MapPinIcon}
						label="Addresses"
					/>
					<div className="mx-4 border-t border-border/60" />
					<MenuLink
						href="/service/favorites"
						icon={HeartIcon}
						label="Favourite Services"
					/>
					<div className="mx-4 border-t border-border/60" />
					<MenuLink
						href="/service/offers"
						icon={TagIcon}
						label="My offers"
					/>
				</div>
			</section>

			<section className="mt-6">
				<h2 className="mb-3 text-sm font-semibold">Messages</h2>
				<div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
					<MenuLink
						href="/service/inbox"
						icon={MessagesSquareIcon}
						label="Inbox"
					/>
					<div className="mx-4 border-t border-border/60" />
					<MenuLink
						href="/service/notifications"
						icon={BellIcon}
						label="Notifications"
					/>
				</div>
			</section>

			<section className="mt-6">
				<h2 className="mb-3 text-sm font-semibold">App setting</h2>
				<div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
					<MenuLink
						href="/service/profile/password"
						icon={KeyRoundIcon}
						label="Change Password"
					/>
				</div>
			</section>

			<Button
				variant="outline"
				className="mt-8 w-full gap-2 text-destructive"
				onClick={logout}
			>
				<LogOutIcon className="size-4" />
				Sign out
			</Button>
		</div>
	);
}
