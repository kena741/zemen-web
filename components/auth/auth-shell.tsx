"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import appIcon from "@/assets/images/app_icon.png";
import authPageBg from "@/assets/images/auth_page.png";
import { LocaleThemeToggle } from "@/components/app/locale-theme-toggle";
import { BRAND_NAME } from "@/lib/brand";

const authCardClass =
	"w-full max-w-[25rem] overflow-hidden rounded-2xl border border-white/45 bg-white/45 shadow-[0_15px_35px_rgba(23,23,23,0.12),0_5px_15px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/15 dark:bg-black/35 sm:rounded-xl";

export function AuthShell({
	title,
	children,
	footer,
}: {
	title: string;
	children: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<main className="relative flex min-h-svh flex-col overflow-hidden bg-[#0e2604] pb-[env(safe-area-inset-bottom)]">
			<div className="pointer-events-none absolute inset-0 z-0">
				<Image
					src={authPageBg}
					alt=""
					fill
					priority
					sizes="100vw"
					className="object-cover object-center"
				/>
			</div>

			<header className="relative z-10 flex items-center justify-between gap-2.5 px-6 py-5 sm:px-8">
				<Link href="/login" className="flex items-center gap-2.5">
					<Image
						src={appIcon}
						alt=""
						priority
						width={28}
						height={28}
						className="size-7 rounded-md"
					/>
					<span className="text-[15px] font-semibold tracking-tight text-white drop-shadow-sm">
						{BRAND_NAME}
					</span>
				</Link>
				<LocaleThemeToggle variant="auth" />
			</header>
			<div className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
				<div className={authCardClass}>
					<div className="px-5 py-7 sm:px-8 sm:py-8">
						<h1 className="text-center text-[20px] font-semibold tracking-tight text-foreground sm:text-[22px]">
							{title}
						</h1>
						{children}
					</div>
					{footer ? (
						<div className="border-t border-white/30 bg-white/25 px-6 py-4 text-center text-[13px] text-muted-foreground backdrop-blur-sm dark:border-white/10 dark:bg-black/20 sm:px-8">
							{footer}
						</div>
					) : null}
				</div>
			</div>
		</main>
	);
}
