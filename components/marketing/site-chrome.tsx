"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronDownIcon, PhoneIcon } from "lucide-react";

import appIcon from "@/assets/images/app_icon.png";
import { BRAND_NAME } from "@/lib/brand";
import {
	APP_STORE_URL,
	PLAY_STORE_URL,
	SHORT_CODE,
	TELEGRAM_URL,
} from "@/lib/marketing";
import { enableGuestBrowse } from "@/lib/guest";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";

export function MarketingHeader({ active = "home" }: { active?: "home" | "about" }) {
	const router = useRouter();
	const { setMode } = useAuth();
	const [servicesOpen, setServicesOpen] = useState(false);

	function goCustomerLogin() {
		setMode("service");
		router.push("/login?mode=service");
	}

	function browseServices() {
		enableGuestBrowse();
		setMode("service");
		router.push("/service");
	}

	return (
		<header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
				<Link href="/" className="flex shrink-0 items-center gap-2.5">
					<Image
						src={appIcon}
						alt=""
						width={36}
						height={36}
						priority
						className="size-9 rounded-lg"
					/>
					<span className="text-[17px] font-bold tracking-tight text-[#0f1a0c]">
						{BRAND_NAME}
					</span>
				</Link>

				<nav className="ml-auto hidden items-center gap-6 md:flex">
					<div
						className="relative"
						onMouseLeave={() => setServicesOpen(false)}
					>
						<button
							type="button"
							onClick={() => setServicesOpen((v) => !v)}
							onMouseEnter={() => setServicesOpen(true)}
							className="inline-flex items-center gap-1 text-sm font-medium text-[#5a6b55] transition hover:text-foreground"
						>
							Services
							<ChevronDownIcon
								className={cn(
									"size-3.5 transition",
									servicesOpen && "rotate-180",
								)}
							/>
						</button>
						{servicesOpen ? (
							<div className="absolute top-full left-0 z-50 mt-2 min-w-[200px] rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/8">
								<Link
									href="/#services"
									className="block px-4 py-2 text-sm text-[#3d5240] hover:bg-[#e8f5e3] hover:text-primary"
									onClick={() => setServicesOpen(false)}
								>
									Popular services
								</Link>
								<button
									type="button"
									className="block w-full px-4 py-2 text-left text-sm text-[#3d5240] hover:bg-[#e8f5e3] hover:text-primary"
									onClick={() => {
										setServicesOpen(false);
										browseServices();
									}}
								>
									Browse all
								</button>
								<Link
									href="/#help"
									className="block px-4 py-2 text-sm text-[#3d5240] hover:bg-[#e8f5e3] hover:text-primary"
									onClick={() => setServicesOpen(false)}
								>
									What we offer
								</Link>
							</div>
						) : null}
					</div>
					<Link
						href="/about"
						className={cn(
							"text-sm font-medium transition hover:text-foreground",
							active === "about" ? "text-primary" : "text-[#5a6b55]",
						)}
					>
						About
					</Link>
					<button
						type="button"
						onClick={goCustomerLogin}
						className="text-sm font-medium text-[#5a6b55] transition hover:text-foreground"
					>
						Sign in
					</button>
				</nav>

				<div className="ml-auto flex items-center gap-2 md:ml-4">
					<a
						href={TELEGRAM_URL}
						target="_blank"
						rel="noreferrer"
						aria-label="Telegram"
						className="hidden size-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#229ED9] transition hover:border-primary/30 hover:bg-[#e8f5e3] sm:inline-flex"
						title="Telegram"
					>
						<svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.21-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12a.5.5 0 01.17.33c.02.1.02.23.01.36z" />
						</svg>
					</a>
					<a
						href={PLAY_STORE_URL}
						target="_blank"
						rel="noreferrer"
						aria-label="Google Play"
						className="hidden size-9 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-primary/30 hover:bg-[#e8f5e3] sm:inline-flex"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src="/marketing/google-play.svg"
							alt=""
							width={18}
							height={18}
							className="size-[18px]"
							draggable={false}
						/>
					</a>
					<a
						href={APP_STORE_URL}
						target="_blank"
						rel="noreferrer"
						aria-label="App Store"
						className="hidden size-9 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-primary/30 hover:bg-[#e8f5e3] sm:inline-flex"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src="/marketing/apple.svg"
							alt=""
							width={18}
							height={18}
							className="size-[18px]"
							draggable={false}
						/>
					</a>
					<a
						href={`tel:${SHORT_CODE}`}
						className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_6px_18px_rgba(23,67,9,0.25)] transition hover:bg-brand-ink"
					>
						<PhoneIcon className="size-4" />
						{SHORT_CODE}
					</a>
				</div>
			</div>
		</header>
	);
}

export function MarketingFooter() {
	const router = useRouter();
	const { setMode } = useAuth();

	function goCustomerLogin() {
		setMode("service");
		router.push("/login?mode=service");
	}

	return (
		<footer className="relative z-10 bg-[#0e2604] text-white">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<div className="flex items-center gap-3">
					<Image
						src={appIcon}
						alt=""
						width={44}
						height={44}
						className="size-11 rounded-xl bg-white p-1"
					/>
					<div>
						<p className="font-semibold">{BRAND_NAME}</p>
						<p className="text-sm text-white/65">
							© {new Date().getFullYear()} {BRAND_NAME}
						</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
					<Link href="/about" className="hover:text-white">
						About
					</Link>
					<Link href="/legal/privacy" className="hover:text-white">
						Privacy
					</Link>
					<Link href="/legal/terms" className="hover:text-white">
						Terms
					</Link>
					<a
						href={TELEGRAM_URL}
						target="_blank"
						rel="noreferrer"
						className="hover:text-white"
					>
						Telegram
					</a>
					<button
						type="button"
						onClick={goCustomerLogin}
						className="font-medium text-white hover:underline"
					>
						Sign in
					</button>
				</div>
			</div>
		</footer>
	);
}

export function MarketingShell({
	children,
	active = "home",
}: {
	children: ReactNode;
	active?: "home" | "about";
}) {
	return (
		<div className="marketing-landing relative min-h-svh overflow-x-hidden bg-[#f4f8f1] text-[#0f1a0c]">
			<MarketingHeader active={active} />
			{children}
			<MarketingFooter />
		</div>
	);
}
