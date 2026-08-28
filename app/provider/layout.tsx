"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOutIcon, MessagesSquareIcon, BellIcon } from "lucide-react";

import appIcon from "@/assets/images/app_icon.png";
import { Button } from "@/components/ui/button";
import { AppLoading } from "@/components/ui/app-loading";
import { UserAvatar } from "@/components/ui/user-avatar";
import { BRAND_NAME } from "@/lib/brand";
import { useLocale } from "@/lib/i18n";
import {
	useProviderSidebarNavItems,
	useProviderTabNavItems,
} from "@/lib/i18n/nav";
import { cn } from "@/lib/utils";
import { selectAuthSessionPending } from "@/store/authSlice";
import { useAppSelector } from "@/store/hooks";
import { useAuth } from "@/store/useAuth";

function isActive(pathname: string | null, href: string) {
	if (href === "/provider") return pathname === "/provider";
	return Boolean(pathname?.startsWith(href));
}

export default function ProviderLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const { user, logout } = useAuth();
	const { t } = useLocale();
	const sessionPending = useAppSelector(selectAuthSessionPending);
	const sidebarNav = useProviderSidebarNavItems();
	const tabNav = useProviderTabNavItems();
	const bottomVisible = tabNav.some((tab) =>
		tab.href === "/provider"
			? pathname === "/provider"
			: pathname === tab.href,
	);

	useEffect(() => {
		if (sessionPending) return;
		if (!user) {
			router.replace("/login");
			return;
		}
		if (user.mode !== "provider") {
			router.replace("/service");
		}
	}, [user, router, sessionPending]);

	if (sessionPending || !user || user.mode !== "provider") {
		return (
			<div className="flex min-h-svh items-center justify-center bg-[#f6f6f6]">
				<AppLoading className="min-h-0" />
			</div>
		);
	}

	return (
		<div className="flex min-h-svh bg-[#f6f6f6]">
			<aside className="hidden w-60 shrink-0 border-r border-border bg-white px-3 py-5 lg:flex lg:flex-col">
				<div className="mb-8 flex items-center gap-2.5 px-2">
					<Image
						src={appIcon}
						alt=""
						width={28}
						height={28}
						className="size-7 rounded-md"
					/>
					<div>
						<p className="text-sm font-semibold tracking-tight">
							{BRAND_NAME}
						</p>
						<p className="text-[11px] text-muted-foreground">{t("provider")}</p>
					</div>
				</div>
				<nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
					{sidebarNav.map((item) => {
						const active = isActive(pathname, item.href);
						const Icon = item.icon;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
									active
										? "bg-secondary text-secondary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<Icon className="size-4 shrink-0" />
								{item.label}
							</Link>
						);
					})}
				</nav>
				<div className="mt-auto border-t border-border px-1 pt-4">
					<div className="mb-2 flex items-center gap-2 px-2">
						<UserAvatar
							src={user.provider?.profileImage}
							name={user.name}
							size="sm"
						/>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{user.name}</p>
							<p className="truncate text-xs text-muted-foreground">
								{user.email}
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						className="w-full justify-start gap-2"
						onClick={logout}
					>
						<LogOutIcon className="size-4" />
						{t("signOut")}
					</Button>
				</div>
			</aside>

			<div
				className={cn(
					"flex min-w-0 flex-1 flex-col",
					bottomVisible
						? "pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0"
						: "pb-0",
				)}
			>
				<header className="sticky top-0 z-10 hidden items-center justify-between gap-3 border-b border-border/80 bg-white px-8 py-3 lg:flex">
					<p className="text-sm text-muted-foreground">
						{t("welcomeBack", { name: user.name.split(" ")[0] })}
					</p>
					<div className="flex items-center gap-2">
						<Link
							href="/provider/inbox"
							className="inline-flex size-9 items-center justify-center rounded-full text-[#7C7C7C] hover:bg-muted"
							aria-label={t("inboxTitle")}
						>
							<MessagesSquareIcon className="size-5" />
						</Link>
						<Link
							href="/provider/notifications"
							className="inline-flex size-9 items-center justify-center rounded-full text-[#7C7C7C] hover:bg-muted"
							aria-label={t("notificationsTitle")}
						>
							<BellIcon className="size-5" />
						</Link>
					</div>
				</header>
				<main
					className={cn(
						"mx-auto w-full flex-1",
						bottomVisible
							? "lg:px-8 lg:py-6"
							: "px-4 py-4 sm:px-5 sm:py-6 lg:px-8",
					)}
				>
					{children}
				</main>
			</div>

			{bottomVisible ? (
				<nav
					className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#f6f6f6] lg:hidden"
					style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
				>
					<div className="flex items-stretch">
						{tabNav.map((item) => {
							const active = isActive(pathname, item.href);
							const Icon = item.icon;
							return (
								<Link
									key={item.href}
									href={item.href}
									className="flex flex-1 flex-col items-center gap-1 py-1.5"
								>
									<span
										className={cn(
											"flex h-7 items-center justify-center rounded-full transition-all duration-200 ease-out",
											active
												? "w-[60px] bg-primary text-primary-foreground"
												: "w-7 text-[#9CA3AF]",
										)}
									>
										<Icon
											className={cn(
												"transition-all duration-200",
												active ? "size-[17px]" : "size-5",
											)}
											strokeWidth={active ? 2.25 : 1.75}
										/>
									</span>
									<span
										className={cn(
											"text-[12px] leading-none transition-colors duration-200",
											active
												? "font-semibold text-primary"
												: "font-normal text-[#9CA3AF]",
										)}
									>
										{item.label}
									</span>
								</Link>
							);
						})}
					</div>
				</nav>
			) : null}
		</div>
	);
}
