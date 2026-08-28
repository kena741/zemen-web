"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import appIcon from "@/assets/images/app_icon.png";
import { ServiceLoading } from "@/components/service/service-loading";
import { BRAND_NAME } from "@/lib/brand";
import { useLocale } from "@/lib/i18n";
import { useServiceTabNavItems } from "@/lib/i18n/nav";
import { cn } from "@/lib/utils";
import { selectAuthSessionPending } from "@/store/authSlice";
import { useAppSelector } from "@/store/hooks";
import { useAuth } from "@/store/useAuth";

function isTabActive(pathname: string | null, href: string) {
	if (href === "/service") return pathname === "/service";
	return Boolean(pathname?.startsWith(href));
}

function showBottomNav(
	pathname: string | null,
	tabs: ReturnType<typeof useServiceTabNavItems>,
) {
	if (!pathname) return false;
	return tabs.some((tab) =>
		tab.href === "/service"
			? pathname === "/service"
			: pathname === tab.href,
	);
}

export default function ServiceLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const { user } = useAuth();
	const { t } = useLocale();
	const tabNav = useServiceTabNavItems();
	const sessionPending = useAppSelector(selectAuthSessionPending);
	const bottomVisible = showBottomNav(pathname, tabNav);

	useEffect(() => {
		if (sessionPending) return;
		if (!user) {
			router.replace("/login");
			return;
		}
		if (user.mode !== "service") {
			router.replace("/provider");
		}
	}, [user, router, sessionPending]);

	if (sessionPending || !user || user.mode !== "service") {
		return (
			<div className="flex min-h-svh items-center justify-center bg-[#f6faf4]">
				<ServiceLoading className="min-h-0" />
			</div>
		);
	}

	return (
		<div className="min-h-svh bg-[#f6faf4]">
			<header className="sticky top-0 z-30 hidden border-b border-border/60 bg-white/90 backdrop-blur-md md:block">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
					<Link href="/service" className="flex items-center gap-2.5">
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
							<p className="text-[11px] text-muted-foreground">
								{t("customer")}
							</p>
						</div>
					</Link>
					<nav className="flex items-center gap-1">
						{tabNav.map((item) => {
							const active = isTabActive(pathname, item.href);
							const Icon = item.icon;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
										active
											? "bg-primary/10 text-primary"
											: "text-muted-foreground hover:bg-muted hover:text-foreground",
									)}
								>
									<Icon className="size-4" />
									{item.label}
								</Link>
							);
						})}
					</nav>
				</div>
			</header>

			<main
				className={cn(
					"mx-auto w-full max-w-6xl",
					bottomVisible
						? "pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-8"
						: "pb-8",
				)}
			>
				{children}
			</main>

			{bottomVisible ? (
				<nav
					className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-[#f6faf4] md:hidden"
					style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
				>
					<div className="flex items-stretch">
						{tabNav.map((item) => {
							const active = isTabActive(pathname, item.href);
							const Icon = item.icon;
							return (
								<Link
									key={item.href}
									href={item.href}
									className="flex flex-1 flex-col items-center gap-1 py-1.5"
								>
									<span
										className={cn(
											"flex h-7 items-center justify-center rounded-full transition-all duration-200",
											active
												? "w-[60px] bg-primary text-primary-foreground"
												: "w-7 text-[#9CA3AF]",
										)}
									>
										<Icon
											className={cn(
												"transition-all",
												active ? "size-[17px]" : "size-[20px]",
											)}
											strokeWidth={active ? 2.25 : 1.75}
										/>
									</span>
									<span
										className={cn(
											"text-[12px] leading-none transition-colors",
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
