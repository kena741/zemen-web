"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import appIcon from "@/assets/images/app_icon.png";
import { LoginMeshBackground } from "@/components/login/login-mesh-bg";
import { LocaleThemeToggle } from "@/components/app/locale-theme-toggle";
import { BRAND_NAME } from "@/lib/brand";

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
		<main className="relative flex min-h-svh flex-col overflow-hidden bg-[#f6f6f6] pb-[env(safe-area-inset-bottom)] dark:bg-background">
			<LoginMeshBackground />
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
					<span className="text-[15px] font-semibold tracking-tight text-foreground">
						{BRAND_NAME}
					</span>
				</Link>
				<LocaleThemeToggle variant="auth" />
			</header>
			<div className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
				<div className="w-full max-w-[25rem] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_15px_35px_rgba(23,23,23,0.08),0_5px_15px_rgba(0,0,0,0.04)] dark:border-border dark:bg-card sm:rounded-xl">
					<div className="px-5 py-7 sm:px-8 sm:py-8">
						<h1 className="text-center text-[20px] font-semibold tracking-tight text-foreground sm:text-[22px]">
							{title}
						</h1>
						{children}
					</div>
					{footer ? (
						<div className="border-t border-border bg-muted/60 px-6 py-4 text-center text-[13px] text-muted-foreground sm:px-8">
							{footer}
						</div>
					) : null}
				</div>
			</div>
		</main>
	);
}
