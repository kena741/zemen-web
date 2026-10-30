"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
	ChevronDownIcon,
	MapPinIcon,
	MenuIcon,
	PhoneIcon,
	XIcon,
} from "lucide-react";

import appIcon from "@/assets/images/app_icon.png";
import { BRAND_NAME } from "@/lib/brand";
import {
	APP_STORE_URL,
	OFFICE,
	PLAY_STORE_URL,
	PRIORITY_SERVICE_LINKS,
	SHORT_CODE,
	TELEGRAM_URL,
	WHATSAPP_URL,
} from "@/lib/marketing";
import { WhatsAppFab } from "@/components/app/whatsapp-fab";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";

type MarketingNavKey = "home" | "about" | "services" | "blog";

const NAV_LINKS: { key: MarketingNavKey; label: string; href: string }[] = [
	{ key: "services", label: "Services", href: "/services" },
	{ key: "about", label: "About", href: "/about" },
	{ key: "blog", label: "Blog", href: "/blog" },
];

export function MarketingHeader({
	active = "home",
}: {
	active?: MarketingNavKey;
}) {
	const { setMode } = useAuth();
	const [servicesOpen, setServicesOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
			<div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
				<Link
					href="/"
					className="flex shrink-0 items-center gap-2.5"
					aria-label={`${BRAND_NAME} home`}
				>
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

				<nav
					aria-label="Main"
					className="ml-auto hidden items-center gap-7 md:flex"
				>
					<div
						className="relative"
						onMouseLeave={() => setServicesOpen(false)}
					>
						<button
							type="button"
							aria-expanded={servicesOpen}
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
							<div className="absolute top-full left-0 z-50 w-[22rem] pt-2">
								<div className="rounded-2xl bg-white p-3 shadow-lg ring-1 ring-black/8">
									<ul className="grid grid-cols-2 gap-0.5">
										{PRIORITY_SERVICE_LINKS.map((item) => (
											<li key={item.href}>
												<Link
													href={item.href}
													className="block rounded-lg px-3 py-2 text-sm text-[#3d5240] hover:bg-[#e8f5e3] hover:text-primary"
													onClick={() => setServicesOpen(false)}
												>
													{item.label}
												</Link>
											</li>
										))}
									</ul>
									<div className="mt-2 flex items-center justify-between border-t border-black/5 px-3 pt-3 text-sm">
										<Link
											href="/services"
											className="font-semibold text-primary hover:underline"
											onClick={() => setServicesOpen(false)}
										>
											All services
										</Link>
										<Link
											href="/locations/addis-ababa"
											className="text-[#52634c] hover:text-primary"
											onClick={() => setServicesOpen(false)}
										>
											Addis Ababa
										</Link>
									</div>
								</div>
							</div>
						) : null}
					</div>
					{NAV_LINKS.filter((item) => item.key !== "services").map((item) => (
						<Link
							key={item.key}
							href={item.href}
							aria-current={active === item.key ? "page" : undefined}
							className={cn(
								"text-sm font-medium transition hover:text-foreground",
								active === item.key ? "text-primary" : "text-[#5a6b55]",
							)}
						>
							{item.label}
						</Link>
					))}
					<Link
						href="/login?mode=service"
						onClick={() => setMode("service")}
						className="text-sm font-medium text-[#5a6b55] transition hover:text-foreground"
					>
						Sign in
					</Link>
				</nav>

				<div className="ml-auto flex items-center gap-2 md:ml-4">
					<a
						href={`tel:${SHORT_CODE}`}
						className="inline-flex h-10 items-center gap-2 rounded-full bg-[#174309] px-4 text-sm font-semibold text-[#f4faf0] shadow-[0_6px_18px_rgba(23,67,9,0.25)] transition hover:bg-[#1f5a0b]"
						aria-label={`Call ${SHORT_CODE}`}
					>
						<PhoneIcon className="size-4" />
						{SHORT_CODE}
					</a>
					<button
						type="button"
						aria-label={menuOpen ? "Close menu" : "Open menu"}
						aria-expanded={menuOpen}
						aria-controls="marketing-mobile-menu"
						onClick={() => setMenuOpen((v) => !v)}
						className="inline-flex size-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#0f1a0c] md:hidden"
					>
						{menuOpen ? (
							<XIcon className="size-5" />
						) : (
							<MenuIcon className="size-5" />
						)}
					</button>
				</div>
			</div>

			{menuOpen ? (
				<nav
					id="marketing-mobile-menu"
					aria-label="Mobile"
					className="max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-black/5 bg-white px-4 pb-6 pt-2 md:hidden"
				>
					<ul className="divide-y divide-black/5">
						{NAV_LINKS.map((item) => (
							<li key={item.key}>
								<Link
									href={item.href}
									onClick={() => setMenuOpen(false)}
									className={cn(
										"block py-3.5 text-base font-medium",
										active === item.key ? "text-primary" : "text-[#0f1a0c]",
									)}
								>
									{item.label}
								</Link>
							</li>
						))}
						<li>
							<Link
								href="/locations/addis-ababa"
								onClick={() => setMenuOpen(false)}
								className="block py-3.5 text-base font-medium text-[#0f1a0c]"
							>
								Addis Ababa
							</Link>
						</li>
					</ul>
					<p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#52634c]">
						Popular services
					</p>
					<ul className="mt-2 flex flex-wrap gap-2">
						{PRIORITY_SERVICE_LINKS.map((item) => (
							<li key={item.href}>
								<Link
									href={item.href}
									onClick={() => setMenuOpen(false)}
									className="inline-flex rounded-full bg-[#f7faf5] px-3.5 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/15"
								>
									{item.label}
								</Link>
							</li>
						))}
					</ul>
					<div className="mt-6 grid grid-cols-2 gap-2">
						<a
							href={WHATSAPP_URL}
							target="_blank"
							rel="noreferrer"
							className="inline-flex h-11 items-center justify-center rounded-full border border-primary/20 text-sm font-semibold text-primary"
						>
							WhatsApp
						</a>
						<Link
							href="/login?mode=service"
							onClick={() => {
								setMode("service");
								setMenuOpen(false);
							}}
							className="inline-flex h-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
						>
							Sign in
						</Link>
					</div>
				</nav>
			) : null}
		</header>
	);
}

export function MarketingFooter() {
	const year = new Date().getFullYear();
	const serviceLinks = PRIORITY_SERVICE_LINKS.slice(0, 6);

	return (
		<footer className="relative z-10 bg-[#13452A] text-white">
			<div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr_auto]">
				<div className="space-y-3">
					<div className="flex items-center gap-2.5">
						<Image
							src={appIcon}
							alt=""
							width={36}
							height={36}
							className="size-9 rounded-lg bg-white p-0.5"
						/>
						<p className="font-semibold tracking-tight">{BRAND_NAME}</p>
					</div>
					<p className="max-w-[16rem] text-sm leading-snug text-white/65">
						Premium, verified home services in Addis Ababa, Ethiopia.
					</p>
					<a
						href={OFFICE.mapsUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="group flex max-w-[17rem] items-start gap-2 text-sm leading-snug text-white/80 transition hover:text-white"
					>
						<MapPinIcon className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden />
						<span>
							{OFFICE.building}, {OFFICE.city}
							<span className="mt-0.5 block text-xs font-semibold text-white/60 underline-offset-4 group-hover:underline">
								Get directions
							</span>
						</span>
					</a>
					<div className="flex flex-wrap items-center gap-2 pt-1">
						<a
							href={`tel:${SHORT_CODE}`}
							className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium transition hover:bg-white/25"
						>
							<PhoneIcon className="size-3.5" aria-hidden />
							{SHORT_CODE}
						</a>
						<a
							href={WHATSAPP_URL}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-[#13452A] transition hover:bg-white/90"
						>
							<svg viewBox="0 0 24 24" className="size-3.5 fill-[#25D366]" aria-hidden>
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
							</svg>
							WhatsApp
						</a>
						<a
							href={TELEGRAM_URL}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium transition hover:bg-white/25"
						>
							<svg viewBox="0 0 24 24" className="size-3.5 fill-[#2AABEE]" aria-hidden>
								<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
							</svg>
							Telegram
						</a>
					</div>
				</div>

				<div>
					<p className="mb-2.5 text-xs font-semibold tracking-[0.12em] text-white/80 uppercase">
						Services
					</p>
					<ul className="columns-2 gap-x-6 space-y-1.5 text-sm text-white/65 sm:columns-1">
						{serviceLinks.map((item) => (
							<li key={item.href}>
								<Link href={item.href} className="transition hover:text-white">
									{item.label}
								</Link>
							</li>
						))}
						<li>
							<Link href="/services" className="transition hover:text-white">
								All services
							</Link>
						</li>
					</ul>
				</div>

				<div>
					<p className="mb-2.5 text-xs font-semibold tracking-[0.12em] text-white/80 uppercase">
						Company
					</p>
					<ul className="space-y-1.5 text-sm text-white/65">
						<li>
							<Link href="/about" className="transition hover:text-white">
								About
							</Link>
						</li>
						<li>
							<Link href="/about#office" className="transition hover:text-white">
								Our office
							</Link>
						</li>
						<li>
							<Link href="/blog" className="transition hover:text-white">
								Blog
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
					</ul>
				</div>

				<div className="flex flex-col gap-2 md:items-end">
					<p className="mb-0.5 text-xs font-semibold tracking-[0.12em] text-white/80 uppercase md:text-right">
						Get the app
					</p>
					<a href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
						<Image
							src="/marketing/google-play-badge.svg"
							alt="Get it on Google Play"
							width={120}
							height={36}
							className="h-9 w-auto"
						/>
					</a>
					<a href={APP_STORE_URL} target="_blank" rel="noreferrer">
						<Image
							src="/marketing/app-store-badge.svg"
							alt="Download on the App Store"
							width={108}
							height={36}
							className="h-9 w-auto"
						/>
					</a>
				</div>
			</div>

			<div className="border-t border-white/10">
				<div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3.5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
					<p>
						© {year} {BRAND_NAME}
					</p>
					<div className="flex flex-wrap gap-4">
						<Link href="/legal/terms" className="transition hover:text-white/75">
							Terms
						</Link>
						<Link href="/legal/privacy" className="transition hover:text-white/75">
							Privacy
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
	active?: MarketingNavKey;
}) {
	return (
		<div className="marketing-landing relative min-h-svh overflow-x-clip bg-[#f4f8f1] text-[#0f1a0c]">
			<MarketingHeader active={active} />
			{/* Offset for fixed header (h-16 + safe area) */}
			<div className="h-16 pt-[env(safe-area-inset-top)]" aria-hidden />
			{children}
			<MarketingFooter />
			<WhatsAppFab />
		</div>
	);
}
