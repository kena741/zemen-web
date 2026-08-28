"use client";

import type { LucideIcon } from "lucide-react";
import {
	BanknoteIcon,
	BellIcon,
	BriefcaseIcon,
	CalendarDaysIcon,
	ClipboardListIcon,
	HomeIcon,
	MessagesSquareIcon,
	TagIcon,
	UserIcon,
	UsersIcon,
	WalletIcon,
	WrenchIcon,
} from "lucide-react";

import { useLocale } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";

export interface NavItem {
	href: string;
	labelKey: MessageKey;
	icon: LucideIcon;
}

export function useServiceTabNav(): NavItem[] {
	const { t } = useLocale();
	return [
		{ href: "/service", labelKey: "navHome", icon: HomeIcon },
		{ href: "/service/bookings", labelKey: "navBookings", icon: CalendarDaysIcon },
		{ href: "/service/requests", labelKey: "navRequests", icon: ClipboardListIcon },
		{ href: "/service/profile", labelKey: "navProfile", icon: UserIcon },
	].map((item) => ({ ...item, label: t(item.labelKey) })) as NavItem & { label: string }[];
}

export function useServiceTabNavItems() {
	const { t } = useLocale();
	const items = [
		{ href: "/service", labelKey: "navHome" as const, icon: HomeIcon },
		{ href: "/service/bookings", labelKey: "navBookings" as const, icon: CalendarDaysIcon },
		{ href: "/service/requests", labelKey: "navRequests" as const, icon: ClipboardListIcon },
		{ href: "/service/profile", labelKey: "navProfile" as const, icon: UserIcon },
	];
	return items.map((item) => ({ ...item, label: t(item.labelKey) }));
}

export function useProviderSidebarNavItems() {
	const { t } = useLocale();
	const items = [
		{ href: "/provider", labelKey: "navDashboard" as const, icon: HomeIcon },
		{ href: "/provider/bookings", labelKey: "navBookings" as const, icon: CalendarDaysIcon },
		{ href: "/provider/offers", labelKey: "navOffers" as const, icon: TagIcon },
		{ href: "/provider/jobs", labelKey: "navJobs" as const, icon: BriefcaseIcon },
		{ href: "/provider/services", labelKey: "navServices" as const, icon: WrenchIcon },
		{ href: "/provider/handymen", labelKey: "navHandymen" as const, icon: UsersIcon },
		{ href: "/provider/wallet", labelKey: "navWallet" as const, icon: WalletIcon },
		{ href: "/provider/bank", labelKey: "navBank" as const, icon: BanknoteIcon },
		{ href: "/provider/inbox", labelKey: "navInbox" as const, icon: MessagesSquareIcon },
		{ href: "/provider/notifications", labelKey: "notifications" as const, icon: BellIcon },
		{ href: "/provider/profile", labelKey: "navProfile" as const, icon: UserIcon },
	];
	return items.map((item) => ({ ...item, label: t(item.labelKey) }));
}

export function useProviderTabNavItems() {
	const { t } = useLocale();
	const items = [
		{ href: "/provider", labelKey: "navHome" as const, icon: HomeIcon },
		{ href: "/provider/bookings", labelKey: "navBookings" as const, icon: CalendarDaysIcon },
		{ href: "/provider/offers", labelKey: "navOffers" as const, icon: TagIcon },
		{ href: "/provider/profile", labelKey: "navProfile" as const, icon: UserIcon },
	];
	return items.map((item) => ({ ...item, label: t(item.labelKey) }));
}
