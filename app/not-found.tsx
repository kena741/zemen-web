import Link from "next/link";
import { ArrowRightIcon, HomeIcon } from "lucide-react";

import { MarketingShell } from "@/components/marketing/site-chrome";
import { BRAND_NAME } from "@/lib/brand";

export default function NotFound() {
	return (
		<MarketingShell active="home">
			<section className="relative overflow-hidden">
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,_#e8f5e3_0%,_#f4f8f1_55%,_transparent_80%)]"
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute -right-20 top-24 size-64 rounded-full bg-[#c8e6b8]/35 blur-3xl"
				/>

				<div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 sm:py-28">
					<p className="text-xs font-semibold tracking-[0.16em] text-[#1f5a0b] uppercase">
						{BRAND_NAME}
					</p>
					<p className="mt-6 font-semibold tracking-tight text-[#13452A]/20 text-[clamp(6rem,22vw,11rem)] leading-none select-none">
						404
					</p>
					<h1 className="mt-2 max-w-lg text-3xl font-semibold tracking-tight text-[#0f1a0c] sm:text-4xl">
						Page not found
					</h1>
					<p className="mt-4 max-w-md text-base leading-relaxed text-[#52634c] sm:text-lg">
						This page doesn’t exist or may have moved. Head home to keep booking
						trusted services in Addis Ababa.
					</p>

					<div className="mt-10 flex flex-wrap items-center justify-center gap-3">
						<Link
							href="/"
							className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#13452A] px-6 text-sm font-semibold text-white transition hover:bg-[#1a5c38]"
						>
							<HomeIcon className="size-4" aria-hidden />
							Back to home
						</Link>
						<Link
							href="/services"
							className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#d7e3d2] bg-white px-6 text-sm font-semibold text-[#0f1a0c] transition hover:border-[#b7c7b0]"
						>
							Browse services
							<ArrowRightIcon className="size-4" aria-hidden />
						</Link>
					</div>
				</div>
			</section>
		</MarketingShell>
	);
}
