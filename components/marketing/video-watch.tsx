import Link from "next/link";
import { ArrowRightIcon, PhoneIcon } from "lucide-react";

import { MarketingBreadcrumbs } from "@/components/marketing/breadcrumbs";
import { breadcrumbJsonLd, JsonLd, videoJsonLd } from "@/components/marketing/seo-json-ld";
import { MarketingShell } from "@/components/marketing/site-chrome";
import { VerticalVideo } from "@/components/marketing/vertical-video";
import { SHORT_CODE } from "@/lib/marketing";
import type { ServiceVideo } from "@/lib/seo-services";

function formatDuration(seconds: number): string {
	const total = Math.round(seconds);
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "Africa/Addis_Ababa",
	});
}

/** Watch page: the video is the main content, so Google can index it. */
export function VideoWatchView({ video }: { video: ServiceVideo }) {
	const path = `/videos/${video.slug}`;

	return (
		<MarketingShell active="home">
			<JsonLd data={videoJsonLd(video)} />
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", path: "/" },
					{ name: video.serviceLabel, path: video.servicePath },
					{ name: "Video", path },
				])}
			/>

			<section className="bg-[#eef5ea] py-10 sm:py-14">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<MarketingBreadcrumbs
						items={[
							{ label: "Home", href: "/" },
							{ label: video.serviceLabel, href: video.servicePath },
							{ label: "Video" },
						]}
					/>
					<h1 className="mt-4 max-w-3xl text-[clamp(1.6rem,3.4vw,2.4rem)] font-bold leading-tight tracking-tight text-[#0f1a0c] text-balance">
						{video.title}
					</h1>

					<div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:gap-12">
						<VerticalVideo
							src={video.src}
							poster={video.poster}
							title={video.title}
							caption={video.caption}
							durationSeconds={video.durationSeconds}
							className="mx-auto w-full max-w-[min(420px,100%)] lg:max-w-none"
						/>

						<div className="lg:pt-2">
							<p className="text-sm text-[#52634c]">
								{formatDuration(video.durationSeconds)} · {formatDate(video.uploadDate)}
							</p>
							<p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#3d5240]">
								{video.description}
							</p>
							<div className="mt-7 flex flex-wrap gap-3">
								<Link
									href={video.servicePath}
									className="inline-flex h-12 items-center gap-3 rounded-full bg-primary px-8 text-[16px] font-medium text-primary-foreground transition hover:bg-primary/90"
								>
									Book {video.serviceLabel.toLowerCase()}
									<ArrowRightIcon className="size-5" aria-hidden />
								</Link>
								<a
									href={`tel:${SHORT_CODE}`}
									className="inline-flex h-12 items-center gap-3 rounded-full border border-[#0f1a0c] px-7 text-[16px] font-medium text-[#0f1a0c] transition hover:bg-[#0f1a0c]/5"
								>
									<PhoneIcon className="size-5" aria-hidden />
									Call {SHORT_CODE}
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
		</MarketingShell>
	);
}
