import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "lucide-react";

import { MarketingBreadcrumbs } from "@/components/marketing/breadcrumbs";
import { MarketingShell } from "@/components/marketing/site-chrome";
import {
	breadcrumbJsonLd,
	faqJsonLd,
	JsonLd,
	serviceJsonLd,
} from "@/components/marketing/seo-json-ld";
import { buttonVariants } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";
import { SHORT_CODE } from "@/lib/marketing";
import type { CategorySeoCopy } from "@/lib/seo-services";
import { cn } from "@/lib/utils";
import type { PublicCategory } from "@/services/catalog/publicCatalog";
import type { ProviderService } from "@/services/services/types";
import { formatAmount } from "@/services/bookings/types";

function BookingCta({ className }: { className?: string }) {
	return (
		<div className={cn("flex flex-wrap gap-3", className)}>
			<Link
				href="/login?mode=service"
				className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full px-6")}
			>
				Book with {BRAND_NAME}
				<ArrowRightIcon className="ml-1.5 size-4" />
			</Link>
			<a
				href={`tel:${SHORT_CODE}`}
				className={cn(
					buttonVariants({ variant: "outline", size: "lg" }),
					"h-11 rounded-full border-primary/25 px-5",
				)}
			>
				Call {SHORT_CODE}
			</a>
		</div>
	);
}

export function ServicesHubView({
	categories,
}: {
	categories: PublicCategory[];
}) {
	const crumbs = [
		{ label: "Home", href: "/" },
		{ label: "Services" },
	];

	return (
		<MarketingShell active="services">
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", path: "/" },
					{ name: "Services", path: "/services" },
				])}
			/>
			<section className="bg-[#eef5ea] py-12 sm:py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<MarketingBreadcrumbs items={crumbs} />
					<h1 className="mt-4 max-w-3xl text-[clamp(1.85rem,4vw,2.75rem)] font-bold tracking-tight text-[#0f1a0c]">
						Home Services in Addis Ababa
					</h1>
					<p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#3d5240]">
						Browse trusted service categories on {BRAND_NAME}. Book verified
						professionals for cleaning, cooking, babysitting, plumbing,
						electrical, repairs, and more across Addis Ababa.
					</p>
					<BookingCta className="mt-7" />
				</div>
			</section>

			<section className="bg-white py-12 sm:py-14">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
						Service categories
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-[#52634c]">
						These categories come from active listings on {BRAND_NAME}. Open a
						category to learn more and see public services when available.
					</p>
					{categories.length === 0 ? (
						<p className="mt-8 text-sm text-muted-foreground">
							Categories will appear here once they are published.
						</p>
					) : (
						<ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{categories.map((category) => (
								<li key={category.id}>
									<Link
										href={`/services/${category.slug}`}
										className="group flex h-full items-center gap-4 rounded-2xl bg-[#f7faf5] p-4 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_32px_rgba(23,67,9,0.1)]"
									>
										<div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[#e8f5e3]">
											{category.image ? (
												<Image
													src={category.image}
													alt={`${category.categoryName} services`}
													fill
													sizes="56px"
													loading="lazy"
													quality={65}
													className="object-cover"
												/>
											) : (
												<span className="flex size-full items-center justify-center text-xs font-semibold text-primary">
													{category.categoryName.slice(0, 1)}
												</span>
											)}
										</div>
										<div className="min-w-0 flex-1">
											<p className="font-semibold text-[#0f1a0c]">
												{category.categoryName}
											</p>
											<p className="mt-0.5 text-sm text-[#52634c]">
												View {category.categoryName.toLowerCase()} in Addis
												Ababa
											</p>
										</div>
										<ArrowRightIcon className="size-4 shrink-0 text-primary transition group-hover:translate-x-0.5" />
									</Link>
								</li>
							))}
						</ul>
					)}
					<p className="mt-8 text-sm text-[#52634c]">
						Also see{" "}
						<Link
							href="/locations/addis-ababa"
							className="font-semibold text-primary underline-offset-4 hover:underline"
						>
							home services in Addis Ababa
						</Link>{" "}
						and learn{" "}
						<Link
							href="/about"
							className="font-semibold text-primary underline-offset-4 hover:underline"
						>
							about {BRAND_NAME}
						</Link>
						.
					</p>
				</div>
			</section>
		</MarketingShell>
	);
}

export function ServiceCategoryView({
	category,
	copy,
	services,
	related,
}: {
	category: PublicCategory;
	copy: CategorySeoCopy;
	services: ProviderService[];
	related: PublicCategory[];
}) {
	const path = `/services/${category.slug}`;
	const crumbs = [
		{ label: "Home", href: "/" },
		{ label: "Services", href: "/services" },
		{ label: category.categoryName },
	];
	const faqSchema = faqJsonLd(copy.faqs);

	return (
		<MarketingShell active="services">
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", path: "/" },
					{ name: "Services", path: "/services" },
					{ name: category.categoryName, path },
				])}
			/>
			<JsonLd
				data={serviceJsonLd({
					name: copy.h1,
					description: copy.description,
					path,
				})}
			/>
			{faqSchema ? <JsonLd data={faqSchema} /> : null}

			<section className="bg-[#eef5ea] py-12 sm:py-14">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<MarketingBreadcrumbs items={crumbs} />
					<div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
						<div>
							<h1 className="max-w-3xl text-[clamp(1.75rem,4vw,2.6rem)] font-bold tracking-tight text-[#0f1a0c]">
								{copy.h1}
							</h1>
							<p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#3d5240]">
								{copy.intro}
							</p>
							<BookingCta className="mt-7" />
						</div>
						{category.image ? (
							<div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[#e8f5e3] shadow-[0_16px_40px_rgba(23,67,9,0.1)]">
								<Image
									src={category.image}
									alt={`${category.categoryName} services in Addis Ababa`}
									fill
									sizes="(max-width: 1024px) 100vw, 520px"
									loading="lazy"
									quality={70}
									className="object-cover"
								/>
							</div>
						) : null}
					</div>
				</div>
			</section>

			<section className="bg-white py-12 sm:py-14">
				<div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
					<div>
						<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
							Services offered
						</h2>
						<ul className="mt-5 space-y-3">
							{copy.offered.map((item) => (
								<li
									key={item}
									className="flex items-start gap-3 text-[15px] text-[#142610]"
								>
									<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e8f5e3]">
										<CheckIcon
											className="size-3.5 text-primary"
											strokeWidth={2.75}
										/>
									</span>
									{item}
								</li>
							))}
						</ul>
					</div>
					<div>
						<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
							How booking works
						</h2>
						<ol className="mt-5 space-y-4 text-[15px] text-[#3d5240]">
							<li>
								<span className="font-semibold text-[#0f1a0c]">1. Choose</span>{" "}
								a verified {category.categoryName.toLowerCase()} listing.
							</li>
							<li>
								<span className="font-semibold text-[#0f1a0c]">2. Book</span> on
								the website or app, or call {SHORT_CODE}.
							</li>
							<li>
								<span className="font-semibold text-[#0f1a0c]">3. Confirm</span>{" "}
								details with support when you need help.
							</li>
						</ol>
						<p className="mt-5 text-sm text-[#52634c]">
							Serving households in{" "}
							<Link
								href="/locations/addis-ababa"
								className="font-semibold text-primary underline-offset-4 hover:underline"
							>
								Addis Ababa
							</Link>
							.
						</p>
					</div>
				</div>
			</section>

			<section className="border-y border-primary/8 bg-[#f4f8f1] py-12 sm:py-14">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
						Public {category.categoryName.toLowerCase()} listings
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-[#52634c]">
						Approved, active listings in this category. Sign in to book.
					</p>
					{services.length === 0 ? (
						<p className="mt-6 text-sm text-muted-foreground">
							No public listings are available in this category right now.
							Check back soon or browse other{" "}
							<Link
								href="/services"
								className="font-semibold text-primary underline-offset-4 hover:underline"
							>
								service categories
							</Link>
							.
						</p>
					) : (
						<ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{services.map((service) => (
								<li
									key={service.id}
									className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5"
								>
									<div className="relative aspect-[4/3] bg-[#e8f5e3]">
										{service.serviceImage[0] ? (
											<Image
												src={service.serviceImage[0]}
												alt={
													service.serviceName
														? `${service.serviceName} in Addis Ababa`
														: `${category.categoryName} service`
												}
												fill
												sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
												loading="lazy"
												quality={65}
												className="object-cover"
											/>
										) : null}
									</div>
									<div className="p-4">
										<p className="font-semibold text-[#0f1a0c]">
											{service.serviceName || category.categoryName}
										</p>
										{service.subCategoryName ? (
											<p className="mt-0.5 text-xs text-[#52634c]">
												{service.subCategoryName}
											</p>
										) : null}
										<p className="mt-2 text-sm font-bold tabular-nums text-primary">
											{formatAmount(service.price)}
										</p>
										<Link
											href="/login?mode=service"
											className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
										>
											Sign in to book
											<ArrowRightIcon className="size-3.5" />
										</Link>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>

			{copy.faqs.length > 0 ? (
				<section className="bg-white py-12 sm:py-14">
					<div className="mx-auto max-w-6xl px-4 sm:px-6">
						<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
							Frequently asked questions
						</h2>
						<ul className="mt-6 space-y-4">
							{copy.faqs.map((faq) => (
								<li
									key={faq.question}
									className="rounded-2xl bg-[#f7faf5] p-5 ring-1 ring-black/5"
								>
									<h3 className="text-[15px] font-semibold text-[#0f1a0c]">
										{faq.question}
									</h3>
									<p className="mt-2 text-sm leading-relaxed text-[#3d5240]">
										{faq.answer}
									</p>
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}

			{related.length > 0 ? (
				<section className="border-t border-primary/8 bg-[#eef5ea] py-12 sm:py-14">
					<div className="mx-auto max-w-6xl px-4 sm:px-6">
						<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
							Related services
						</h2>
						<ul className="mt-6 flex flex-wrap gap-2">
							{related.map((item) => (
								<li key={item.id}>
									<Link
										href={`/services/${item.slug}`}
										className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-primary ring-1 ring-primary/15 transition hover:bg-[#e8f5e3]"
									>
										{item.categoryName}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</section>
			) : null}
		</MarketingShell>
	);
}

export function LocationAddisView({
	categories,
	services,
}: {
	categories: PublicCategory[];
	services: ProviderService[];
}) {
	return (
		<MarketingShell active="home">
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", path: "/" },
					{ name: "Locations", path: "/locations/addis-ababa" },
					{ name: "Addis Ababa", path: "/locations/addis-ababa" },
				])}
			/>
			<section className="bg-[#eef5ea] py-12 sm:py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<MarketingBreadcrumbs
						items={[
							{ label: "Home", href: "/" },
							{ label: "Addis Ababa" },
						]}
					/>
					<h1 className="mt-4 max-w-3xl text-[clamp(1.85rem,4vw,2.75rem)] font-bold tracking-tight text-[#0f1a0c]">
						Home Services in Addis Ababa
					</h1>
					<p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#3d5240]">
						{BRAND_NAME} connects households in Addis Ababa with verified local
						professionals for cleaning, cooking, babysitting, plumbing,
						electrical work, and more.
					</p>
					<BookingCta className="mt-7" />
				</div>
			</section>

			<section className="bg-white py-12 sm:py-14">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
						Available service categories
					</h2>
					{categories.length === 0 ? (
						<p className="mt-4 text-sm text-muted-foreground">
							Categories will appear as they are published.
						</p>
					) : (
						<ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{categories.map((category) => (
								<li key={category.id}>
									<Link
										href={`/services/${category.slug}`}
										className="flex items-center justify-between rounded-2xl bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#0f1a0c] ring-1 ring-black/5 transition hover:bg-white"
									>
										{category.categoryName}
										<ArrowRightIcon className="size-4 text-primary" />
									</Link>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>

			<section className="border-t border-primary/8 bg-[#f4f8f1] py-12 sm:py-14">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
						Recent public listings
					</h2>
					{services.length === 0 ? (
						<p className="mt-4 text-sm text-muted-foreground">
							Public listings will show here when providers publish approved
							services.
						</p>
					) : (
						<ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							{services.map((service) => (
								<li
									key={service.id}
									className="rounded-2xl bg-white p-4 ring-1 ring-black/5"
								>
									<p className="font-semibold text-[#0f1a0c]">
										{service.serviceName || "Service"}
									</p>
									<p className="mt-1 text-xs text-[#52634c]">
										{service.categoryName || "Home service"}
									</p>
									<p className="mt-2 text-sm font-bold text-primary">
										{formatAmount(service.price)}
									</p>
								</li>
							))}
						</ul>
					)}
					<p className="mt-8 text-sm text-[#52634c]">
						Explore all{" "}
						<Link
							href="/services"
							className="font-semibold text-primary underline-offset-4 hover:underline"
						>
							service categories
						</Link>{" "}
						or{" "}
						<Link
							href="/about"
							className="font-semibold text-primary underline-offset-4 hover:underline"
						>
							learn about {BRAND_NAME}
						</Link>
						.
					</p>
				</div>
			</section>
		</MarketingShell>
	);
}
