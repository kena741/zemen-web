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
	MessagesSquareIcon,
	PencilIcon,
	PercentIcon,
	TagIcon,
	UsersIcon,
	WalletIcon,
	WrenchIcon,
} from "lucide-react";

import { ProviderMobileTabBar } from "@/components/provider/mobile-chrome";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatAmount } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";

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
	const { user, logout } = useAuth();
	const provider = user?.provider;

	return (
		<div className="mx-auto max-w-3xl">
			<ProviderMobileTabBar title="My Profile" />

			<div className="hidden lg:block">
				<p className="admin-eyebrow">Provider</p>
				<h1 className="admin-page-title mt-1">Profile</h1>
			</div>

			<div className="px-4 pb-8 lg:px-0 lg:pt-6">
				{/* Flutter hero */}
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
						Edit profile
					</Link>
				</div>

				<MenuGroup title="Service">
					<MenuItem
						href="/provider/services"
						icon={WrenchIcon}
						label="Services"
					/>
					<Divider />
					<MenuItem
						href="/provider/handymen"
						icon={UsersIcon}
						label="Handyman List"
					/>
					<Divider />
					<MenuItem href="/provider/offers" icon={TagIcon} label="Offers" />
					<Divider />
					<MenuItem
						href="/provider/jobs"
						icon={BriefcaseIcon}
						label="Job requests"
					/>
				</MenuGroup>

				<MenuGroup title="Payment">
					<MenuItem
						href="/provider/bank"
						icon={BanknoteIcon}
						label="Bank Detail"
					/>
					<Divider />
					<MenuItem
						href="/provider/wallet"
						icon={WalletIcon}
						label="Wallet"
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
						label="Wallet History"
					/>
				</MenuGroup>

				<MenuGroup title="Messages">
					<MenuItem
						href="/provider/inbox"
						icon={MessagesSquareIcon}
						label="Inbox"
					/>
					<Divider />
					<MenuItem
						href="/provider/notifications"
						icon={BellIcon}
						label="Notifications"
					/>
				</MenuGroup>

				<MenuGroup title="App setting">
					<MenuItem
						href="/provider/profile/password"
						icon={KeyRoundIcon}
						label="Change Password"
					/>
					<Divider />
					<div className="flex items-center gap-3 px-4 py-3.5 opacity-50">
						<FileCheckIcon className="size-[22px]" strokeWidth={1.75} />
						<span className="flex-1 text-sm">Verify Documents</span>
						<span className="text-[10px] text-muted-foreground">Soon</span>
					</div>
					<Divider />
					<div className="flex items-center gap-3 px-4 py-3.5 opacity-50">
						<PercentIcon className="size-[22px]" strokeWidth={1.75} />
						<span className="flex-1 text-sm">Taxes</span>
						<span className="text-[10px] text-muted-foreground">Soon</span>
					</div>
				</MenuGroup>

				<Button
					variant="outline"
					className="mt-8 w-full gap-2 text-destructive"
					onClick={logout}
				>
					<LogOutIcon className="size-4" />
					Sign out
				</Button>
			</div>
		</div>
	);
}
