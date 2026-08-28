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

export interface NavItemWithLabel extends NavItem {
	label: string;
}

function withLabels<const T extends readonly NavItem[]>(
	items: T,
	t: (key: MessageKey) => string,
): (T[number] & { label: string })[] {
	return items.map((item) => ({ ...item, label: t(item.labelKey) }));
}

export function useServiceTabNavItems(): NavItemWithLabel[] {
	const { t } = useLocale();
	return withLabels(
		[
			{ href: "/service", labelKey: "navHome", icon: HomeIcon },
			{ href: "/service/bookings", labelKey: "navBookings", icon: CalendarDaysIcon },
			{ href: "/service/requests", labelKey: "navRequests", icon: ClipboardListIcon },
			{ href: "/service/profile", labelKey: "navProfile", icon: UserIcon },
		] as const,
		t,
	);
}

export function useProviderSidebarNavItems(): NavItemWithLabel[] {
	const { t } = useLocale();
	return withLabels(
		[
			{ href: "/provider", labelKey: "navDashboard", icon: HomeIcon },
			{ href: "/provider/bookings", labelKey: "navBookings", icon: CalendarDaysIcon },
			{ href: "/provider/offers", labelKey: "navOffers", icon: TagIcon },
			{ href: "/provider/jobs", labelKey: "navJobs", icon: BriefcaseIcon },
			{ href: "/provider/services", labelKey: "navServices", icon: WrenchIcon },
			{ href: "/provider/handymen", labelKey: "navHandymen", icon: UsersIcon },
			{ href: "/provider/wallet", labelKey: "navWallet", icon: WalletIcon },
			{ href: "/provider/bank", labelKey: "navBank", icon: BanknoteIcon },
			{ href: "/provider/inbox", labelKey: "navInbox", icon: MessagesSquareIcon },
			{ href: "/provider/notifications", labelKey: "notifications", icon: BellIcon },
			{ href: "/provider/profile", labelKey: "navProfile", icon: UserIcon },
		] as const,
		t,
	);
}

export function useProviderTabNavItems(): NavItemWithLabel[] {
	const { t } = useLocale();
	return withLabels(
		[
			{ href: "/provider", labelKey: "navHome", icon: HomeIcon },
			{ href: "/provider/bookings", labelKey: "navBookings", icon: CalendarDaysIcon },
			{ href: "/provider/offers", labelKey: "navOffers", icon: TagIcon },
			{ href: "/provider/profile", labelKey: "navProfile", icon: UserIcon },
		] as const,
		t,
	);
}
