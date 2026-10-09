"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import appIcon from "@/assets/images/app_icon.png";
import authPageBg from "@/assets/images/optimized/auth_page_hero.jpg";
import { LocaleThemeToggle } from "@/components/app/locale-theme-toggle";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function AuthShell({
	title,
	children,
	footer,
	belowCard,
	className,
}: {
	title: string;
	children: ReactNode;
	footer?: ReactNode;
	belowCard?: ReactNode;
	className?: string;
}) {
	return (
		<main className="relative flex min-h-svh flex-col overflow-hidden bg-[#0e2604] pb-[env(safe-area-inset-bottom)]">
			{/* Fixed to viewport so tab height changes never shift the background */}
			<div className="pointer-events-none fixed inset-0 z-0">
				<Image
					src={authPageBg}
					alt=""
					fill
					preload
					fetchPriority="high"
					quality={70}
					sizes="(max-width: 768px) 100vw, 1280px"
					className="object-cover object-center"
				/>
				<div className="absolute inset-0 hidden bg-black/40 dark:block" aria-hidden />
			</div>

			<header className="relative z-10 flex shrink-0 items-center justify-between gap-2.5 px-6 py-5 sm:px-8">
				<Link href="/" className="flex items-center gap-2.5">
					<Image
						src={appIcon}
						alt=""
						priority
						width={28}
						height={28}
						className="size-7 rounded-md"
					/>
					<span className="text-[15px] font-semibold tracking-tight text-[#0f1a0c] dark:text-white">
						{BRAND_NAME}
					</span>
				</Link>
				<LocaleThemeToggle variant="auth" />
			</header>

			{/* Top-aligned so growing/shrinking card content does not re-center */}
			<div className="relative z-10 flex flex-1 flex-col items-center px-4 pb-8 pt-2 sm:px-6 sm:pt-4">
				<div
					className={cn(
						"w-full max-w-[25rem] overflow-hidden rounded-2xl border border-black/8 bg-white/92 text-foreground shadow-[0_15px_35px_rgba(23,23,23,0.12),0_5px_15px_rgba(0,0,0,0.06)] backdrop-blur-md dark:border-white/20 dark:bg-[#1c2618] dark:text-[#f4faf0] dark:shadow-[0_20px_40px_rgba(0,0,0,0.45)] sm:rounded-xl",
						className,
					)}
				>
					<div className="px-5 py-7 sm:px-8 sm:py-8">
						<h1 className="text-center text-[20px] font-semibold tracking-tight text-foreground dark:text-white sm:text-[22px]">
							{title}
						</h1>
						{children}
					</div>
					{footer ? (
						<div className="border-t border-black/8 bg-white/80 px-6 py-4 text-center text-[13px] text-muted-foreground dark:border-white/12 dark:bg-[#151c12] dark:text-[#c5d6bc] sm:px-8">
							{footer}
						</div>
					) : null}
				</div>
				{belowCard ? (
					<div className="mt-4 w-full max-w-[25rem]">{belowCard}</div>
				) : null}
			</div>
		</main>
	);
}
