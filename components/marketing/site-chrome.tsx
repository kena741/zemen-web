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
	PRIORITY_SERVICE_LINKS,
	SHORT_CODE,
	TELEGRAM_URL,
	TRUST_STATS,
	WHATSAPP_DISPLAY,
	WHATSAPP_URL,
} from "@/lib/marketing";
import { enableGuestBrowse } from "@/lib/guest";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";

export function MarketingHeader({
	active = "home",
}: {
	active?: "home" | "about" | "services";
}) {
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
		<header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
			<div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
				<Link href="/" className="flex shrink-0 items-center gap-2.5">
					<Image
						src={appIcon}
						alt=""
						width={36}
						height={36}
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
							className={cn(
								"inline-flex items-center gap-1 text-sm font-medium transition hover:text-foreground",
								active === "services" ? "text-primary" : "text-[#5a6b55]",
							)}
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
							<div className="absolute top-full left-0 z-50 mt-2 min-w-[220px] rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/8">
								<Link
									href="/services"
									className="block px-4 py-2 text-sm text-[#3d5240] hover:bg-[#e8f5e3] hover:text-primary"
									onClick={() => setServicesOpen(false)}
								>
									All services
								</Link>
								<Link
									href="/#services"
									className="block px-4 py-2 text-sm text-[#3d5240] hover:bg-[#e8f5e3] hover:text-primary"
									onClick={() => setServicesOpen(false)}
								>
									Popular on Zemen
								</Link>
								<button
									type="button"
									className="block w-full px-4 py-2 text-left text-sm text-[#3d5240] hover:bg-[#e8f5e3] hover:text-primary"
									onClick={() => {
										setServicesOpen(false);
										browseServices();
									}}
								>
									Browse in app
								</button>
								<Link
									href="/locations/addis-ababa"
									className="block px-4 py-2 text-sm text-[#3d5240] hover:bg-[#e8f5e3] hover:text-primary"
									onClick={() => setServicesOpen(false)}
								>
									Addis Ababa
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
						href={WHATSAPP_URL}
						target="_blank"
						rel="noreferrer"
						aria-label="WhatsApp"
						className="hidden size-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#25D366] transition hover:border-primary/30 hover:bg-[#e8f5e3] sm:inline-flex"
						title="WhatsApp"
					>
						<svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
						</svg>
					</a>
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
	const year = new Date().getFullYear();

	return (
		<footer className="relative z-10 border-t-2 border-[#4a9a2a] bg-[#0e2604] text-white">
			<div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
				<div className="space-y-5 lg:col-span-1">
					<div className="flex items-center gap-3">
						<Image
							src={appIcon}
							alt=""
							width={44}
							height={44}
							className="size-11 rounded-xl bg-white p-1"
						/>
						<p className="text-lg font-semibold tracking-tight">{BRAND_NAME}</p>
					</div>
					<p className="max-w-xs text-sm leading-relaxed text-white/70">
						Trusted home services in Addis Ababa — cleaning, cooking, babysitting,
						and skilled pros, fully managed for your peace of mind.
					</p>
					<div className="flex flex-wrap gap-6 text-sm">
						{TRUST_STATS.map((stat) => (
							<div key={stat.label}>
								<p className="text-lg font-semibold text-white">{stat.value}</p>
								<p className="text-xs text-white/55">{stat.label}</p>
							</div>
						))}
					</div>
					<div className="flex items-center gap-3">
						<a
							href={TELEGRAM_URL}
							target="_blank"
							rel="noreferrer"
							aria-label="Telegram"
							className="text-white/70 transition hover:text-white"
						>
							<svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
								<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
							</svg>
						</a>
					</div>
					<div className="flex flex-wrap gap-2">
						<a href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
							<Image
								src="/marketing/google-play-badge.svg"
								alt="Get it on Google Play"
								width={135}
								height={40}
								className="h-10 w-auto"
							/>
						</a>
						<a href={APP_STORE_URL} target="_blank" rel="noreferrer">
							<Image
								src="/marketing/app-store-badge.svg"
								alt="Download on the App Store"
								width={120}
								height={40}
								className="h-10 w-auto"
							/>
						</a>
					</div>
					<div className="flex flex-wrap gap-2">
						<a
							href={`tel:${SHORT_CODE}`}
							className="inline-flex items-center gap-2 rounded-lg bg-[#4a9a2a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d8222]"
						>
							<PhoneIcon className="size-4" aria-hidden />
							{SHORT_CODE}
						</a>
						<a
							href={WHATSAPP_URL}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#0e2604] transition hover:bg-white/90"
						>
							<svg viewBox="0 0 24 24" className="size-4 fill-[#25D366]" aria-hidden>
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
							</svg>
							WhatsApp
						</a>
					</div>
					<p className="text-xs text-white/45">{WHATSAPP_DISPLAY}</p>
				</div>

				<div>
					<p className="mb-4 text-xs font-semibold tracking-[0.14em] text-white/90 uppercase">
						Services
					</p>
					<ul className="space-y-2.5 text-sm text-white/70">
						{PRIORITY_SERVICE_LINKS.map((item) => (
							<li key={item.href}>
								<Link href={item.href} className="transition hover:text-white">
									{item.label}
								</Link>
							</li>
						))}
					</ul>
				</div>

				<div>
					<p className="mb-4 text-xs font-semibold tracking-[0.14em] text-white/90 uppercase">
						Resources
					</p>
					<ul className="space-y-2.5 text-sm text-white/70">
						<li>
							<Link href="/blog" className="transition hover:text-white">
								Blog
							</Link>
						</li>
						<li>
							<Link href="/about" className="transition hover:text-white">
								About
							</Link>
						</li>
						<li>
							<Link
								href="/locations/addis-ababa"
								className="transition hover:text-white"
							>
								Addis Ababa
							</Link>
						</li>
						<li>
							<Link href="/services" className="transition hover:text-white">
								All services
							</Link>
						</li>
					</ul>
				</div>

				<div>
					<p className="mb-4 text-xs font-semibold tracking-[0.14em] text-white/90 uppercase">
						Legal
					</p>
					<ul className="space-y-2.5 text-sm text-white/70">
						<li>
							<Link href="/legal/terms" className="transition hover:text-white">
								Terms of Service
							</Link>
						</li>
						<li>
							<Link href="/legal/privacy" className="transition hover:text-white">
								Privacy policy
							</Link>
						</li>
					</ul>
				</div>
			</div>

			<div className="border-t border-white/10">
				<div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
					<p>
						Copyright © {year} {BRAND_NAME}
					</p>
					<div className="flex flex-wrap gap-4">
						<Link href="/legal/terms" className="transition hover:text-white/80">
							Terms of Service
						</Link>
						<Link href="/legal/privacy" className="transition hover:text-white/80">
							Privacy policy
						</Link>
					</div>
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
	active?: "home" | "about" | "services";
}) {
	return (
		<div className="marketing-landing relative min-h-svh overflow-x-clip bg-[#f4f8f1] text-[#0f1a0c]">
			<MarketingHeader active={active} />
			{/* Offset for fixed header (h-16 + safe area) */}
			<div className="h-16 pt-[env(safe-area-inset-top)]" aria-hidden />
			{children}
			<MarketingFooter />
		</div>
	);
}
