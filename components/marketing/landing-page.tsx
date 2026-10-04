"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightIcon, CheckIcon, PhoneIcon } from "lucide-react";

import marketing1 from "@/assets/images/1.png";
import marketing2 from "@/assets/images/2.png";
import marketing3 from "@/assets/images/3.png";
import marketing4 from "@/assets/images/4.png";
import appIcon from "@/assets/images/app_icon.png";
import authHero from "@/assets/images/auth_page.png";
import { MarketingShell } from "@/components/marketing/site-chrome";
import { Button, buttonVariants } from "@/components/ui/button";
import { BRAND_NAME, homePathForMode } from "@/lib/brand";
import { enableGuestBrowse } from "@/lib/guest";
import { SHORT_CODE, SPONSORS } from "@/lib/marketing";
import { slugifyCategoryName } from "@/lib/seo-services";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/services/bookings/types";
import {
	fetchCatalogServices,
	fetchCategories,
} from "@/services/catalog/catalogApi";
import type { ProviderService, ServiceCategory } from "@/services/services/types";
import { useAuth } from "@/store/useAuth";

const VET_STEPS = [
	{
		title: "Identity verified",
		desc: "We confirm who the provider is before they can take jobs.",
	},
	{
		title: "Documents reviewed",
		desc: "IDs and business papers are checked by the Zemen team.",
	},
	{
		title: "Skills assessed",
		desc: "Services are tied to approved categories and subcategories.",
	},
	{
		title: "Training & experience verified",
		desc: "We verify documented training or work history.",
	},
	{
		title: "Medical checkup completed",
		desc: "Required for Zemen providers offering childcare.",
	},
	{
		title: "Supervised on the job",
		desc: "We continue to monitor performance and gather feedback after placement. Vetting doesn't stop at hiring.",
	},
] as const;

const HOW_IT_WORKS = [
	{
		step: "1",
		title: "Choose a service",
		desc: "Browse home service categories in Addis Ababa, from cleaning and cooking to repairs and care.",
	},
	{
		step: "2",
		title: "Book a verified provider",
		desc: "Pick a listing from a vetted professional and book through the website, app, or call center.",
	},
	{
		step: "3",
		title: "Get the job done",
		desc: "Your provider delivers the service, and Zemen stays available if you need support afterward.",
	},
] as const;

type LandingCategory = ServiceCategory & { slug?: string };

const WHY_IMAGES: { image: StaticImageData; alt: string }[] = [
	{ image: marketing1, alt: "Zemen Service cleaning professional" },
	{ image: marketing2, alt: "Zemen Service cooking and care" },
	{ image: marketing3, alt: "Zemen Service babysitting support" },
	{ image: marketing4, alt: "Zemen Service home help in Addis Ababa" },
];

function SponsorsCarousel({
	sponsors,
}: {
	sponsors: readonly { src: string; alt: string }[];
}) {
	// Duplicate the row so translateX(-50%) loops seamlessly.
	const loop = [...sponsors, ...sponsors];

	return (
		<div className="overflow-hidden" aria-label="Sponsors">
			<div className="flex w-max gap-3 animate-[sponsors-marquee_28s_linear_infinite] hover:[animation-play-state:paused] sm:gap-3.5 motion-reduce:animate-none">
				{loop.map((p, index) => (
					<div
						key={`${p.alt}-${index}`}
						className="flex h-14 w-[132px] shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-[#f7faf5] px-3 shadow-[0_1px_2px_rgba(23,67,9,0.04)] sm:h-[3.75rem] sm:w-[148px]"
						aria-hidden={index >= sponsors.length}
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={p.src}
							alt={index >= sponsors.length ? "" : p.alt}
							draggable={false}
							className="max-h-7 w-auto max-w-full object-contain opacity-80 sm:max-h-8"
						/>
					</div>
				))}
			</div>
		</div>
	);
}

const HELP_WITH: {
	title: string;
	desc: string;
	image: StaticImageData;
	alt: string;
	match: string[];
}[] = [
	{
		title: "Home professionals",
		desc: "Electricians, plumbers, painters, chefs, and more, booked in minutes.",
		image: marketing1,
		alt: "Zemen Service professionals in Addis Ababa",
		match: ["maintenance", "electrical", "plumbing", "art"],
	},
	{
		title: "Care & domestic help",
		desc: "Trusted caregivers and home support from verified local providers.",
		image: marketing2,
		alt: "Domestic help and care with Zemen Service",
		match: ["domestic", "care", "nursing", "babysit"],
	},
	{
		title: "Repairs & maintenance",
		desc: "The right professional at the right time for plumbing and fixes.",
		image: marketing3,
		alt: "Home repair and maintenance in Addis Ababa",
		match: ["maintenance", "repair", "plumb"],
	},
	{
		title: "Cleaning & quality",
		desc: "Quality and cleanliness with trained experts through Zemen Service.",
		image: marketing4,
		alt: "Cleaning services in Addis Ababa",
		match: ["cleaning", "domestic"],
	},
];

function ServiceTile({
	service,
	onOpen,
}: {
	service: ProviderService;
	onOpen: () => void;
}) {
	const image = service.serviceImage[0];
	return (
		<button
			type="button"
			onClick={onOpen}
			className="group flex w-[200px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_8px_30px_rgba(23,67,9,0.08)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(23,67,9,0.14)] sm:w-[220px]"
		>
			<div className="relative aspect-[4/3] overflow-hidden bg-[#e8f5e3]">
				{image ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={image}
						alt=""
						className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
					/>
				) : (
					<div className="flex size-full items-center justify-center">
						<Image
							src={appIcon}
							alt=""
							width={48}
							height={48}
							className="opacity-35"
						/>
					</div>
				)}
			</div>
			<div className="flex flex-1 flex-col gap-1 p-3.5">
				<p className="line-clamp-2 text-sm font-semibold leading-snug text-[#0f1a0c]">
					{service.serviceName || "Service"}
				</p>
				<p className="text-xs text-muted-foreground">
					{service.categoryName || service.subCategoryName || "Home service"}
				</p>
				<p className="mt-auto pt-1 text-sm font-bold tabular-nums text-primary">
					{formatAmount(service.price)}
				</p>
			</div>
		</button>
	);
}

export function LandingPage({
	initialCategories = [],
}: {
	initialCategories?: LandingCategory[];
}) {
	const router = useRouter();
	const { user, setMode } = useAuth();
	const [services, setServices] = useState<ProviderService[]>([]);
	const [categories, setCategories] =
		useState<LandingCategory[]>(initialCategories);
	const [loading, setLoading] = useState(true);
	const [whyIndex, setWhyIndex] = useState(0);

	useEffect(() => {
		if (!user) return;
		router.replace(homePathForMode(user.mode));
	}, [user, router]);

	useEffect(() => {
		const id = window.setInterval(() => {
			setWhyIndex((i) => (i + 1) % WHY_IMAGES.length);
		}, 2000);
		return () => window.clearInterval(id);
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const [svc, cats] = await Promise.all([
				fetchCatalogServices({ featuredOnly: true, limit: 8 }),
				fetchCategories(),
			]);
			if (cancelled) return;
			let list = svc.services;
			if (list.length < 4) {
				const more = await fetchCatalogServices({ limit: 12 });
				list = more.services;
			}
			setServices(list.slice(0, 8));
			setCategories(
				cats.categories.map((c) => ({
					...c,
					slug: slugifyCategoryName(c.categoryName),
				})),
			);
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	function categoryHref(category: LandingCategory) {
		return `/services/${category.slug || slugifyCategoryName(category.categoryName)}`;
	}

	function helpHref(match: string[]) {
		const found = categories.find((c) => {
			const slug = (c.slug || slugifyCategoryName(c.categoryName)).toLowerCase();
			const name = c.categoryName.toLowerCase();
			return match.some((token) => slug.includes(token) || name.includes(token));
		});
		return found ? categoryHref(found) : "/services";
	}

	function goCustomerLogin() {
		setMode("service");
		router.push("/login?mode=service");
	}

	function goProviderLogin() {
		setMode("provider");
		router.push("/login?mode=provider");
	}

	function browseServices() {
		enableGuestBrowse();
		setMode("service");
		router.push("/service");
	}

	function openService(id: string) {
		enableGuestBrowse();
		setMode("service");
		router.push(`/service/services/${id}`);
	}

	return (
		<MarketingShell active="home">
			{/* ── Hero: full-bleed auth visual ── */}
			<section className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
				{/* Edge-to-edge hero image */}
				<div className="absolute inset-0">
					<Image
						src={authHero}
						alt="Zemen Service professionals: electrician, plumber, cleaning, painting, catering"
						fill
						priority
						sizes="100vw"
						className="object-cover object-[center_35%] md:object-center"
					/>
					{/* Readability plane — left fade, not a floating card */}
					<div
						aria-hidden
						className="absolute inset-0 bg-gradient-to-r from-[#f4f8f1] via-[#f4f8f1]/92 to-[#f4f8f1]/25 md:via-[#f4f8f1]/85 md:to-transparent"
					/>
					<div
						aria-hidden
						className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f4f8f1] to-transparent"
					/>
					{/* Soft brand watermark */}
					<div
						aria-hidden
						className="pointer-events-none absolute -right-16 bottom-8 opacity-[0.06] md:right-8 md:opacity-[0.08]"
					>
						<Image
							src={appIcon}
							alt=""
							width={420}
							height={420}
							className="size-[280px] md:size-[360px] animate-[marketing-float_14s_ease-in-out_infinite]"
						/>
					</div>
				</div>

				{/* Hero copy — brand first */}
				<div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] max-w-6xl flex-col justify-center px-4 pb-20 pt-10 sm:px-6 lg:pb-28">
					<div className="max-w-xl animate-[marketing-fade-up_0.75s_ease_both]">
						<p className="font-[family-name:var(--font-sans-app)] text-[clamp(3.25rem,10vw,6.5rem)] font-bold leading-[0.9] tracking-[-0.045em] text-primary">
							{BRAND_NAME}
						</p>

						<h1 className="mt-5 max-w-lg text-[clamp(1.4rem,3.6vw,1.95rem)] font-semibold leading-snug tracking-tight text-[#142610] animate-[marketing-fade-up_0.85s_ease_0.08s_both]">
							Home Services in Addis Ababa
						</h1>

						<p className="mt-3 max-w-md text-base leading-relaxed text-[#3d5240] animate-[marketing-fade-up_0.9s_ease_0.14s_both]">
							Book trusted professionals for cleaning, cooking, domestic help,
							repairs, maintenance, moving, beauty, care, and other home
							services across Addis Ababa.
						</p>

						<div className="mt-8 flex flex-wrap items-center gap-3 animate-[marketing-fade-up_0.95s_ease_0.2s_both]">
							<button
								type="button"
								onClick={goCustomerLogin}
								className={cn(
									buttonVariants({ size: "lg" }),
									"h-12 rounded-full px-7 text-[15px] shadow-[0_12px_32px_rgba(23,67,9,0.3)]",
								)}
							>
								Get started
								<ArrowRightIcon className="ml-1.5 size-4" />
							</button>
							<button
								type="button"
								onClick={browseServices}
								className={cn(
									buttonVariants({ variant: "outline", size: "lg" }),
									"h-12 rounded-full border-primary/25 bg-white/90 px-6 text-[15px] backdrop-blur-sm",
								)}
							>
								Browse services
							</button>
						</div>

						<p className="mt-5 text-sm text-[#3d5240] animate-[marketing-fade-up_1s_ease_0.26s_both]">
							Provider?{" "}
							<button
								type="button"
								onClick={goProviderLogin}
								className="font-semibold text-primary underline-offset-4 hover:underline"
							>
								Sign in to your dashboard
							</button>
						</p>
					</div>
				</div>
			</section>

			{/* Services */}
			<section
				id="services"
				className="relative z-10 scroll-mt-20 border-t border-primary/10 bg-white py-14 sm:py-16"
			>
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="flex flex-wrap items-end justify-between gap-3">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
								Home services
							</p>
							<h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
								Services in Addis Ababa
							</h2>
							<p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
								Explore cleaning, cooking, domestic help, repairs, maintenance,
								moving, beauty, care, and more from verified providers.
							</p>
						</div>
						<Link
							href="/services"
							className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
						>
							View all services
							<ArrowRightIcon className="size-3.5" />
						</Link>
					</div>

					{categories.length > 0 ? (
						<ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{categories.map((c) => (
								<li key={c.id}>
									<Link
										href={categoryHref(c)}
										className="group flex items-center justify-between gap-3 rounded-2xl bg-[#f7faf5] px-4 py-3.5 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_28px_rgba(23,67,9,0.08)]"
									>
										<span>
											<span className="block text-[15px] font-semibold text-[#0f1a0c]">
												{c.categoryName}
											</span>
											<span className="mt-0.5 block text-sm text-[#52634c]">
												{c.categoryName} services in Addis Ababa
											</span>
										</span>
										<ArrowRightIcon className="size-4 shrink-0 text-primary transition group-hover:translate-x-0.5" />
									</Link>
								</li>
							))}
						</ul>
					) : null}

					<div className="mt-10 flex flex-wrap items-end justify-between gap-3">
						<div>
							<h3 className="text-lg font-bold tracking-tight text-[#0f1a0c]">
								Popular listings
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Real listings from verified providers. Sign in to book.
							</p>
						</div>
						<button
							type="button"
							onClick={browseServices}
							className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
						>
							Browse in app
							<ArrowRightIcon className="size-3.5" />
						</button>
					</div>

					<div className="mt-5 -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">
						{loading ? (
							Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									className="h-[240px] w-[200px] shrink-0 animate-pulse rounded-2xl bg-muted sm:w-[220px]"
								/>
							))
						) : services.length === 0 ? (
							<p className="py-10 text-sm text-muted-foreground">
								Services will appear here once providers publish listings.
							</p>
						) : (
							services.map((s) => (
								<ServiceTile
									key={s.id}
									service={s}
									onOpen={() => openService(s.id)}
								/>
							))
						)}
					</div>
				</div>
			</section>

			{/* Why Zemen Service */}
			<section
				id="why"
				className="relative z-10 scroll-mt-20 overflow-hidden bg-white py-14 sm:py-18"
			>
				<div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
							Trusted in Addis Ababa
						</p>
						<h2 className="mt-2 text-[clamp(1.75rem,3.8vw,2.4rem)] font-bold tracking-tight text-[#0f1a0c]">
							Why {BRAND_NAME}?
						</h2>
						<div className="mt-2 h-0.5 w-16 bg-primary" />
						<p className="mt-5 text-[15px] leading-relaxed text-[#3d5240]">
							{BRAND_NAME} helps households in Addis Ababa book trusted home
							services with confidence. We carefully vet and upskill certified
							professionals for cleaning, cooking, domestic help, repairs, and
							care.
						</p>
						<p className="mt-4 text-[15px] leading-relaxed text-[#3d5240]">
							Easy booking through our app, website, or call center (
							<a
								href={`tel:${SHORT_CODE}`}
								className="font-semibold text-primary underline-offset-4 hover:underline"
							>
								{SHORT_CODE}
							</a>
							), with support when you need it and a satisfaction focus on every
							visit.
						</p>
						<ul className="mt-7 space-y-3">
							{[
								"Vetted & upskilled professionals",
								"Book via app, web, or call center",
								"Dedicated account manager",
								"Satisfaction guarantee every visit",
							].map((item) => (
								<li key={item} className="flex items-center gap-3 text-[15px] text-[#142610]">
									<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e8f5e3]">
										<CheckIcon
											className="size-3.5 text-primary"
											strokeWidth={2.75}
										/>
									</span>
									{item}
								</li>
							))}
						</ul>
						<div className="mt-8 flex flex-wrap gap-3">
							<button
								type="button"
								onClick={goCustomerLogin}
								className={cn(
									buttonVariants({ size: "lg" }),
									"h-11 rounded-full px-6",
								)}
							>
								Get started
								<ArrowRightIcon className="ml-1.5 size-4" />
							</button>
							<a
								href={`tel:${SHORT_CODE}`}
								className={cn(
									buttonVariants({ variant: "outline", size: "lg" }),
									"h-11 rounded-full border-primary/25 px-5",
								)}
							>
								<PhoneIcon className="mr-1.5 size-4" />
								Call {SHORT_CODE}
							</a>
						</div>
					</div>

					<div className="relative">
						<div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-[#e8f5e3] shadow-[0_24px_60px_rgba(23,67,9,0.14)] sm:aspect-[5/4] lg:aspect-[4/5]">
							{WHY_IMAGES.map((slide, i) => (
								<div
									key={slide.alt}
									className={cn(
										"absolute inset-0 transition-opacity duration-700 ease-out",
										i === whyIndex ? "opacity-100" : "opacity-0",
									)}
									aria-hidden={i !== whyIndex}
								>
									<Image
										src={slide.image}
										alt={slide.alt}
										fill
										sizes="(max-width: 1024px) 100vw, 520px"
										className={cn(
											"object-cover",
											i === whyIndex &&
												"animate-[marketing-why-ken_2s_ease-out_forwards]",
										)}
										priority={i === 0}
									/>
								</div>
							))}
							<div
								aria-hidden
								className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f1a0c]/35 via-transparent to-transparent"
							/>
							<div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
								<p className="text-sm font-medium text-white drop-shadow">
									Cleaning · Cooking · Babysitting
								</p>
								<div className="flex gap-1.5">
									{WHY_IMAGES.map((slide, i) => (
										<button
											key={slide.alt}
											type="button"
											aria-label={`Show image ${i + 1}`}
											onClick={() => setWhyIndex(i)}
											className={cn(
												"h-1.5 rounded-full transition-all duration-300",
												i === whyIndex
													? "w-6 bg-white"
													: "w-1.5 bg-white/45 hover:bg-white/70",
											)}
										/>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How it works */}
			<section
				id="how-it-works"
				className="relative z-10 scroll-mt-20 border-t border-primary/8 bg-[#f4f8f1] py-14 sm:py-16"
			>
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
						Simple booking
					</p>
					<h2 className="mt-2 text-[clamp(1.65rem,3.5vw,2.15rem)] font-bold tracking-tight text-[#0f1a0c]">
						How it works
					</h2>
					<p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#3d5240]">
						From finding a cleaner, cook, plumber, or caregiver to confirming
						the booking, {BRAND_NAME} keeps the process clear and local to Addis
						Ababa.
					</p>
					<ol className="mt-8 grid gap-4 md:grid-cols-3">
						{HOW_IT_WORKS.map((item) => (
							<li
								key={item.step}
								className="rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(23,67,9,0.05)] ring-1 ring-black/5"
							>
								<span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
									{item.step}
								</span>
								<h3 className="mt-4 text-[15px] font-semibold text-[#0f1a0c]">
									{item.title}
								</h3>
								<p className="mt-1.5 text-sm leading-relaxed text-[#52634c]">
									{item.desc}
								</p>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* How we vet + what Zemen helps with */}
			<section
				id="about"
				className="relative z-10 scroll-mt-20 bg-[#eef5ea] py-14 sm:py-18"
			>
				<div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
					{/* Left — vetting */}
					<div>
						<h2 className="text-[clamp(1.65rem,3.5vw,2.15rem)] font-bold tracking-tight text-primary">
							How we vet every provider
						</h2>
						<div className="mt-2 h-0.5 w-16 bg-primary" />
						<p className="mt-4 text-[15px] leading-relaxed text-[#3d5240]">
							Trust matters when someone enters your home. Before a {BRAND_NAME}{" "}
							provider can take jobs in Addis Ababa, we review identity,
							documents, skills, and experience, then keep monitoring after
							placement.
						</p>
						<ul className="mt-8 space-y-5">
							{VET_STEPS.map((step) => (
								<li key={step.title} className="flex gap-3.5">
									<span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/15">
										<CheckIcon
											className="size-3.5 text-primary"
											strokeWidth={2.75}
										/>
									</span>
									<div>
										<p className="text-[15px] font-semibold text-[#0f1a0c]">
											{step.title}
										</p>
										<p className="mt-0.5 text-sm leading-relaxed text-[#52634c]">
											{step.desc}
										</p>
									</div>
								</li>
							))}
						</ul>
					</div>

					{/* Right — help with */}
					<div id="help" className="scroll-mt-24">
						<h2 className="text-[clamp(1.65rem,3.5vw,2.15rem)] font-bold tracking-tight text-primary">
							What can Zemen help with?
						</h2>
						<div className="mt-2 h-0.5 w-16 bg-primary" />
						<div className="mt-8 space-y-3">
							{HELP_WITH.map((item) => (
								<Link
									key={item.title}
									href={helpHref(item.match)}
									className="group flex w-full items-center gap-4 rounded-2xl bg-white p-3.5 text-left shadow-[0_6px_24px_rgba(23,67,9,0.07)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(23,67,9,0.12)]"
								>
									<div className="relative size-[72px] shrink-0 overflow-hidden rounded-xl bg-[#e8f5e3] sm:size-[84px]">
										<Image
											src={item.image}
											alt={item.alt}
											fill
											sizes="84px"
											className="object-cover transition duration-500 group-hover:scale-[1.04]"
										/>
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-[15px] font-semibold text-[#0f1a0c]">
											{item.title}
										</p>
										<p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-[#52634c]">
											{item.desc}
										</p>
										<span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
											Explore {item.title}
											<ArrowRightIcon className="size-3.5 transition group-hover:translate-x-0.5" />
										</span>
									</div>
								</Link>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Platforms CTA with auth visual strip */}
			<section className="relative z-10 px-4 pb-14 sm:px-6 sm:pb-16">
				<div className="relative mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] bg-primary">
					<div className="grid lg:grid-cols-2">
						<div className="relative z-10 px-6 py-10 text-primary-foreground sm:px-10 sm:py-12">
							<div
								aria-hidden
								className="pointer-events-none absolute -left-6 -top-6 opacity-20"
							>
								<Image
									src={appIcon}
									alt=""
									width={160}
									height={160}
									className="size-28 brightness-0 invert"
								/>
							</div>
							<div className="relative max-w-md">
								<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
									One platform
								</p>
								<h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
									Customers book. Providers deliver.
								</h2>
								<p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
									Sign in as a customer to book, or as a provider to manage
									jobs. Same Zemen web app.
								</p>
								<div className="mt-6 flex flex-wrap gap-3">
									<Button
										size="lg"
										variant="secondary"
										className="h-11 rounded-full bg-white text-primary hover:bg-white/90"
										onClick={goCustomerLogin}
									>
										Customer login
									</Button>
									<button
										type="button"
										onClick={goProviderLogin}
										className="inline-flex h-11 items-center rounded-full border border-white/35 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
									>
										Provider login
									</button>
								</div>
							</div>
						</div>
						<div className="relative hidden min-h-[260px] lg:block">
							<Image
								src={authHero}
								alt=""
								fill
								sizes="50vw"
								className="object-cover object-center opacity-95"
							/>
							<div
								aria-hidden
								className="absolute inset-0 bg-gradient-to-r from-primary via-primary/40 to-transparent"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Sponsors */}
			<section className="relative z-10 border-t border-primary/8 bg-white py-8 sm:py-9">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						Sponsored by
					</p>
					<div className="relative mt-5">
						<div
							aria-hidden
							className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent sm:w-8"
						/>
						<div
							aria-hidden
							className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent sm:w-12"
						/>
						<SponsorsCarousel sponsors={SPONSORS} />
					</div>
				</div>
			</section>

		</MarketingShell>
	);
}
