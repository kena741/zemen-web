import Link from "next/link";
import { ArrowRightIcon, CheckIcon, PhoneIcon } from "lucide-react";

import { MarketingBreadcrumbs } from "@/components/marketing/breadcrumbs";
import { breadcrumbJsonLd, faqJsonLd, JsonLd } from "@/components/marketing/seo-json-ld";
import { MarketingShell } from "@/components/marketing/site-chrome";
import { BRAND_NAME } from "@/lib/brand";
import { PROVIDER_APP_STORE_URL, SHORT_CODE } from "@/lib/marketing";

/** Mirrors the provider sign-up flow in this app (signup → verify-id → activation → services). */
const STEPS = [
	{
		title: "Create a provider account",
		desc: "Sign up as a provider on this website or in the Zemen Provider app, and confirm your phone number.",
	},
	{
		title: "Verify your identity",
		desc: "Upload clear photos of the front and back of your Fayda National ID.",
	},
	{
		title: "Send the documents for your services",
		desc: "Each service category lists the documents it needs, such as proof of training, work history or business papers. The Zemen team reviews them.",
	},
	{
		title: "Activate your account",
		desc: "Pay the one-time activation fee shown in the app to switch on your provider account.",
	},
	{
		title: "Add your services",
		desc: "Create a listing for each service with your price and a clear description. Each listing is reviewed before it appears to customers.",
	},
	{
		title: "Receive bookings",
		desc: "Accept jobs, assign them to yourself or to workers on your team, and track bookings and payments in one place.",
	},
] as const;

const REQUIREMENTS = [
	"A phone number in Ethiopia",
	"A Fayda National ID",
	"The documents required for each service category you offer",
	"A medical checkup if you offer childcare",
	"The ability to serve customers in Addis Ababa",
];

const FAQS = [
	{
		question: "Who can join Zemen Service as a provider?",
		answer:
			"Individual professionals and service businesses that offer home or office services in Addis Ababa, such as cleaning, cooking, childcare, plumbing, electrical work and repairs.",
	},
	{
		question: "Is there a fee to join?",
		answer:
			"There is a one-time account activation fee, shown in the app when you sign up. You can list a limited number of services on the free plan and buy a listing plan to list more.",
	},
	{
		question: "Which documents do I need?",
		answer:
			"The front and back of your Fayda National ID, plus the documents required for each service category you choose. The app shows the list when you pick a category.",
	},
	{
		question: "Can a company with several workers join?",
		answer:
			"Yes. A provider account can add workers to its team and assign bookings to them.",
	},
	{
		question: "How do customers find my services?",
		answer: `Approved listings appear on the ${BRAND_NAME} website and app, where customers in Addis Ababa browse and book them.`,
	},
];

export function BecomeProviderView() {
	return (
		<MarketingShell active="home">
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", path: "/" },
					{ name: "Become a provider", path: "/become-a-provider" },
				])}
			/>
			<JsonLd data={faqJsonLd(FAQS) ?? {}} />

			<section className="bg-[#eef5ea] py-12 sm:py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<MarketingBreadcrumbs
						items={[{ label: "Home", href: "/" }, { label: "Become a provider" }]}
					/>
					<h1 className="mt-4 max-w-3xl text-[clamp(2rem,4.4vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#0f1a0c] text-balance">
						Become a service provider in Addis Ababa
					</h1>
					<p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[#3d5240]">
						{BRAND_NAME} is a marketplace where customers in Addis Ababa book verified
						home and office service professionals. Join as an individual or a company,
						get verified, list your services and receive bookings through the website and
						app.
					</p>
					<div className="mt-7 flex flex-wrap gap-3">
						<Link
							href="/signup?mode=provider"
							className="inline-flex h-12 items-center gap-3 rounded-full bg-primary px-8 text-[16px] font-medium text-primary-foreground transition hover:bg-primary/90"
						>
							Sign up as a provider
							<ArrowRightIcon className="size-5" aria-hidden />
						</Link>
						<a
							href={PROVIDER_APP_STORE_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex h-12 items-center rounded-full border border-[#0f1a0c] px-7 text-[16px] font-medium text-[#0f1a0c] transition hover:bg-[#0f1a0c]/5"
						>
							Zemen Provider on the App Store
						</a>
					</div>
				</div>
			</section>

			<section className="bg-white py-12 sm:py-14">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
						How to join, step by step
					</h2>
					<ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{STEPS.map((step, index) => (
							<li
								key={step.title}
								className="rounded-2xl bg-[#f7faf5] p-5 ring-1 ring-black/5"
							>
								<span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
									{index + 1}
								</span>
								<h3 className="mt-4 text-[15px] font-semibold text-[#0f1a0c]">
									{step.title}
								</h3>
								<p className="mt-1.5 text-sm leading-relaxed text-[#52634c]">{step.desc}</p>
							</li>
						))}
					</ol>
				</div>
			</section>

			<section className="bg-[#f4f8f1] py-12 sm:py-14">
				<div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
					<div>
						<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
							What you need
						</h2>
						<ul className="mt-6 space-y-3">
							{REQUIREMENTS.map((item) => (
								<li key={item} className="flex gap-3 text-[15px] text-[#3d5240]">
									<CheckIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
									{item}
								</li>
							))}
						</ul>
					</div>
					<div>
						<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
							Why verification matters
						</h2>
						<p className="mt-4 text-[15px] leading-relaxed text-[#3d5240]">
							Customers let providers into their homes, so every provider is checked
							before they can take jobs: identity, documents, and the training or work
							history behind each service. Read more{" "}
							<Link href="/about" className="font-medium text-primary underline underline-offset-4">
								about how {BRAND_NAME} works
							</Link>
							.
						</p>
						<p className="mt-4 text-[15px] leading-relaxed text-[#3d5240]">
							Questions before you sign up? Call{" "}
							<a href={`tel:${SHORT_CODE}`} className="inline-flex items-center gap-1 font-medium text-primary">
								<PhoneIcon className="size-4" aria-hidden />
								{SHORT_CODE}
							</a>
							.
						</p>
					</div>
				</div>
			</section>

			<section className="bg-white py-12 sm:py-14">
				<div className="mx-auto max-w-3xl px-4 sm:px-6">
					<h2 className="text-2xl font-bold tracking-tight text-[#0f1a0c]">
						Questions from providers
					</h2>
					<div className="mt-4 divide-y divide-black/10">
						{FAQS.map((faq) => (
							<div key={faq.question} className="py-4">
								<h3 className="font-semibold text-[#0f1a0c]">{faq.question}</h3>
								<p className="mt-1.5 text-[15px] leading-relaxed text-[#3d5240]">{faq.answer}</p>
							</div>
						))}
					</div>
				</div>
			</section>
		</MarketingShell>
	);
}
