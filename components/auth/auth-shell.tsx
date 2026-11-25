"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import appIcon from "@/assets/images/app_icon.png";
import authPageBg from "@/assets/images/optimized/auth_page_hero.jpg";
import { LocaleThemeToggle } from "@/components/app/locale-theme-toggle";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const AUTH_FRAME = "mx-auto w-full max-w-[25rem]";

export function AuthShell({
	title,
	subtitle,
	children,
	footer,
	belowCard,
	className,
}: {
	title: string;
	subtitle?: string;
	children: ReactNode;
	footer?: ReactNode;
	belowCard?: ReactNode;
	className?: string;
}) {
	return (
		<main className="relative flex min-h-svh flex-col bg-[#0e2604] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] sm:px-6">
			<div className="pointer-events-none absolute inset-0 z-0">
				<Image
					src={authPageBg}
					alt=""
					fill
					preload
					fetchPriority="high"
					quality={70}
					sizes="(max-width: 768px) 100vw, 1280px"
					className="object-cover object-[center_20%]"
				/>
				<div
					className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#0e2604]/60 to-[#0e2604]"
					aria-hidden
				/>
			</div>

			<header
				className={cn(
					AUTH_FRAME,
					"relative z-10 flex shrink-0 items-center justify-between gap-3 pb-3 pt-3",
				)}
			>
				<Link
					href="/"
					className="inline-flex items-center gap-2.5"
				>
					<Image
						src={appIcon}
						alt=""
						priority
						width={40}
						height={40}
						className="size-10 rounded-lg mix-blend-lighten"
					/>
					<span className="text-[15px] font-semibold tracking-tight text-white">
						{BRAND_NAME}
					</span>
				</Link>
				<LocaleThemeToggle variant="auth" className="shrink-0" />
			</header>

			<div
				className={cn(
					AUTH_FRAME,
					"relative z-10 max-h-[calc(100svh-5.5rem)] overflow-y-auto overscroll-contain rounded-[1.5rem] bg-white text-foreground shadow-[0_12px_40px_rgba(0,0,0,0.28)] sm:my-2 sm:rounded-2xl",
					className,
				)}
			>
				<div className="px-5 py-6 sm:px-7 sm:py-7">
					<div className="mb-5 text-center sm:text-left">
						<h1 className="text-[22px] font-semibold tracking-tight text-[#0f1a0c]">
							{title}
						</h1>
						{subtitle ? (
							<p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
								{subtitle}
							</p>
						) : null}
					</div>
					{children}
					{footer ? (
						<div className="mt-5 text-center text-[13px] text-muted-foreground">
							{footer}
						</div>
					) : null}
					{belowCard ? <div className="mt-5">{belowCard}</div> : null}
				</div>
			</div>
		</main>
	);
}
