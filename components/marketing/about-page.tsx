"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownIcon, ArrowRightIcon, CheckIcon } from "lucide-react";

import marketing1 from "@/assets/images/1.png";
import marketing2 from "@/assets/images/2.png";
import marketing3 from "@/assets/images/3.png";
import marketing4 from "@/assets/images/4.png";
import { buttonVariants } from "@/components/ui/button";
import { MarketingShell } from "@/components/marketing/site-chrome";
import { BRAND_NAME } from "@/lib/brand";
import { SHORT_CODE, TRUST_STATS, WHATSAPP_URL } from "@/lib/marketing";
import { enableGuestBrowse } from "@/lib/guest";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";

const TRUST_POINTS = [
	{
		label: "Verified",
		title: "Identity & documents checked",
		desc: "We confirm who each provider is before they can take jobs.",
	},
	{
		label: "Trained",
		title: "Training & experience verified",
		desc: "Documented training or work history is reviewed for fit.",
	},
	{
		label: "Supported",
		title: "Supervised on the job",
		desc: "We keep monitoring performance and gathering feedback after placement.",
	},
	{
		label: "Guaranteed",
		title: "Satisfaction on every visit",
		desc: "Easy booking, dedicated support, and a clear path when something needs attention.",
	},
] as const;

const PRINCIPLES = [
	{
		eyebrow: "1 Standard",
		title: "The same care, every time.",
		desc: "Every provider is vetted against the same checks: identity, documents, skills, and relevant experience.",
	},
	{
		eyebrow: "1 Experience",
		title: "Clear from booking to finish.",
		desc: "Book on the app, website, or call center. Pricing, communication, and follow-up stay consistent.",
	},
	{
		eyebrow: "1 Customer",
		title: "Your home comes first.",
		desc: "Dedicated support and post-service follow-up so you always know who to call when you need help.",
	},
] as const;

const STORY = [
	{
		title: "Where it began",
		question: "Why build Zemen Service?",
		body: "Finding reliable people for home work in Addis Ababa should not feel like a gamble. Zemen Service started to make quality local services easier to access and more dependable to use.",
	},
	{
		title: "Building the network",
		question: "How did we grow?",
		body: "We registered providers across plumbing, electrical, painting, cooking, cleaning, and more, then brought them onto one platform customers could trust.",
	},
	{
		title: "Going mobile & web",
		question: "How do people book?",
		body: "Customers book through our app, website, or call center. Providers manage jobs in the same Zemen ecosystem.",
	},
	{
		title: "Learning what trust means",
		question: "What did customers teach us?",
		body: "People do not simply need more choices. They need quality they can rely on, people they can trust in their home, and support when something does not go as expected.",
	},
	{
		title: "Focusing the promise",
		question: "Where are we today?",
		body: "With 1.5+ years of experience, 5k+ providers, and over 10k services delivered, we carefully vet and upskill trusted professionals for cleaning, cooking, babysitting, housemaid support, and skilled home services across Addis Ababa—with satisfaction support on every visit.",
	},
] as const;

export function AboutPage() {
	const router = useRouter();
	const { setMode } = useAuth();

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
		<MarketingShell active="about">
			{/* Hero */}
			<section className="relative overflow-hidden bg-[#eef5ea]">
				<div
					aria-hidden
					className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl"
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full bg-[#c8e6b8]/50 blur-3xl"
				/>
				<div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
						About {BRAND_NAME}
					</p>
					<h1 className="mt-4 max-w-3xl text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-tight text-[#0f1a0c]">
						What would it feel like to know your home is in good hands?
					</h1>
					<p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#3d5240]">
						At {BRAND_NAME}, good service is more than getting the job done. It
						is about feeling confident in who you welcome into your home,
						knowing what to expect, and having support when you need it. With{" "}
						{TRUST_STATS[0].value} years of experience, {TRUST_STATS[1].value}{" "}
						providers, and {TRUST_STATS[2].value} services delivered across Addis
						Ababa, we keep that promise practical.
					</p>
					<dl className="mt-8 grid max-w-xl grid-cols-3 gap-3">
						{TRUST_STATS.map((stat) => (
							<div
								key={stat.label}
								className="rounded-2xl bg-white/80 px-3 py-3 text-center ring-1 ring-black/5"
							>
								<dt className="text-lg font-bold tabular-nums text-primary sm:text-xl">
									{stat.value}
								</dt>
								<dd className="mt-0.5 text-[11px] leading-snug text-[#52634c] sm:text-xs">
									{stat.label}
								</dd>
							</div>
						))}
					</dl>
					<div className="mt-8 flex flex-wrap gap-3">
						<a
							href="#mission"
							className={cn(
								buttonVariants({ size: "lg" }),
								"h-11 rounded-full px-6",
							)}
						>
							Our Mission
							<ArrowDownIcon className="ml-1.5 size-4" />
						</a>
						<a
							href="#story"
							className={cn(
								buttonVariants({ variant: "outline", size: "lg" }),
								"h-11 rounded-full border-primary/25 bg-white/80 px-6",
							)}
						>
							Our Story
						</a>
					</div>
				</div>
			</section>

			{/* Opening story + imagery */}
			<section className="bg-white py-14 sm:py-16">
				<div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
							Where did {BRAND_NAME} begin?
						</p>
						<h2 className="mt-3 text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-[#0f1a0c]">
							It started with a simple need for reliable help.
						</h2>
						<p className="mt-4 text-[15px] leading-relaxed text-[#3d5240]">
							Finding dependable people for home services should not mean
							asking around endlessly or hoping for the best. That need became
							the beginning of {BRAND_NAME}: a marketplace built to make quality
							services easier to access and more dependable to use.
						</p>
						<p className="mt-4 text-[15px] leading-relaxed text-[#3d5240]">
							Over time we learned that customers do not simply need more
							choices.{" "}
							<span className="font-semibold text-[#142610]">
								They need quality they can rely on, people they can trust, and
								support when something does not go as expected.
							</span>
						</p>
					</div>
					<div className="grid grid-cols-2 gap-3">
						{[marketing1, marketing2, marketing3, marketing4].map((img, i) => (
							<div
								key={i}
								className={cn(
									"relative overflow-hidden rounded-2xl bg-[#e8f5e3]",
									i % 2 === 1 ? "mt-6" : "",
									"aspect-[4/5]",
								)}
							>
								<Image
									src={img}
									alt=""
									fill
									sizes="(max-width: 1024px) 45vw, 260px"
									className="object-cover"
								/>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Why trust */}
			<section className="border-y border-primary/8 bg-[#f4f8f1] py-14 sm:py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
						Why trust {BRAND_NAME}?
					</p>
					<h2 className="mt-2 max-w-xl text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-[#0f1a0c]">
						Vetting that does not stop at hiring
					</h2>
					<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{TRUST_POINTS.map((item) => (
							<div
								key={item.label}
								className="rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(23,67,9,0.06)] ring-1 ring-black/5"
							>
								<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
									{item.label}
								</p>
								<p className="mt-2 text-[15px] font-semibold text-[#0f1a0c]">
									{item.title}
								</p>
								<p className="mt-1.5 text-sm leading-relaxed text-[#52634c]">
									{item.desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Mission */}
			<section
				id="mission"
				className="scroll-mt-20 bg-white py-14 sm:py-16"
			>
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
						What are we here to change?
					</p>
					<h2 className="mt-2 max-w-2xl text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-[#0f1a0c]">
						Raise the standard of home services in Ethiopia
					</h2>
					<p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#3d5240]">
						{BRAND_NAME} connects households with vetted local professionals so
						customers can confidently welcome help into their homes, and skilled
						providers can build meaningful work with clear bookings and support.
					</p>
					<p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#3d5240]">
						Through cleaning, cooking, babysitting, and skilled trades, we put
						quality, care, professionalism, and reliability into practice every
						day.
					</p>

					<div className="mt-10">
						<p className="text-sm font-semibold text-[#142610]">
							How do we hold ourselves to that standard?
						</p>
						<p className="mt-1 text-sm text-[#52634c]">
							Our promise for service excellence:
						</p>
						<div className="mt-6 grid gap-4 md:grid-cols-3">
							{PRINCIPLES.map((p) => (
								<div
									key={p.eyebrow}
									className="rounded-2xl border border-primary/10 bg-[#f7faf5] p-6"
								>
									<p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
										{p.eyebrow}
									</p>
									<h3 className="mt-3 text-lg font-bold tracking-tight text-[#0f1a0c]">
										{p.title}
									</h3>
									<p className="mt-2 text-sm leading-relaxed text-[#52634c]">
										{p.desc}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Story timeline */}
			<section
				id="story"
				className="scroll-mt-20 bg-[#eef5ea] py-14 sm:py-16"
			>
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
						Our Story
					</p>
					<h2 className="mt-2 text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-[#0f1a0c]">
						How {BRAND_NAME} took shape
					</h2>
					<ol className="mt-10 space-y-6">
						{STORY.map((step, i) => (
							<li
								key={step.title}
								className="grid gap-3 rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(23,67,9,0.05)] ring-1 ring-black/5 sm:grid-cols-[auto_1fr] sm:gap-6 sm:p-6"
							>
								<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
									{i + 1}
								</span>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
										{step.title}
									</p>
									<h3 className="mt-1 text-lg font-bold text-[#0f1a0c]">
										{step.question}
									</h3>
									<p className="mt-2 text-[15px] leading-relaxed text-[#3d5240]">
										{step.body}
									</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* Team / responsibility */}
			<section className="bg-white py-14 sm:py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
						Who is responsible for the experience?
					</p>
					<h2 className="mt-2 text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-[#0f1a0c]">
						All of us.
					</h2>
					<p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#3d5240]">
						Great service cannot depend on the person providing it alone. Our
						operations, support, and product teams are equally responsible for
						the experience a customer receives, from first call to final
						follow-up.
					</p>
					<ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{[
							"Provider vetting & approval",
							"Booking & call-center support",
							"On-the-job supervision",
							"Customer satisfaction follow-up",
							"Payments & partner integrations",
							"App and web experience",
						].map((item) => (
							<li
								key={item}
								className="flex items-center gap-3 rounded-xl bg-[#f7faf5] px-4 py-3 text-sm font-medium text-[#142610]"
							>
								<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-primary/15">
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
			</section>

			{/* CTA */}
			<section className="px-4 pb-14 sm:px-6 sm:pb-16">
				<div className="mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12">
					<div className="max-w-xl">
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
							Ready to experience {BRAND_NAME}?
						</p>
						<h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
							Book trusted help for your home
						</h2>
						<p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
							Start on the web, download the app, or call{" "}
							<a
								href={`tel:${SHORT_CODE}`}
								className="font-semibold text-white underline-offset-4 hover:underline"
							>
								{SHORT_CODE}
							</a>{" "}
							or{" "}
							<a
								href={WHATSAPP_URL}
								target="_blank"
								rel="noreferrer"
								className="font-semibold text-white underline-offset-4 hover:underline"
							>
								WhatsApp
							</a>
							.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<button
								type="button"
								onClick={goCustomerLogin}
								className={cn(
									buttonVariants({ size: "lg", variant: "secondary" }),
									"h-11 rounded-full bg-white px-6 text-primary hover:bg-white/90",
								)}
							>
								Get started
								<ArrowRightIcon className="ml-1.5 size-4" />
							</button>
							<button
								type="button"
								onClick={browseServices}
								className={cn(
									buttonVariants({ size: "lg", variant: "outline" }),
									"h-11 rounded-full border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white",
								)}
							>
								Browse services
							</button>
							<Link
								href="/#why"
								className={cn(
									buttonVariants({ size: "lg", variant: "outline" }),
									"h-11 rounded-full border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white",
								)}
							>
								Why {BRAND_NAME}
							</Link>
						</div>
					</div>
				</div>
			</section>
		</MarketingShell>
	);
}
