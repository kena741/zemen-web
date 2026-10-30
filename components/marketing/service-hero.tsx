import Image from "next/image";
import Link from "next/link";
import {
	ArrowRightIcon,
	Building2Icon,
	CheckIcon,
	HouseIcon,
	MapPinIcon,
	PaintbrushIcon,
	PhoneIcon,
	PlugZapIcon,
	SprayCanIcon,
	TruckIcon,
	WrenchIcon,
	type LucideIcon,
} from "lucide-react";

import { MarketingBreadcrumbs, type Crumb } from "@/components/marketing/breadcrumbs";
import { VerticalVideo } from "@/components/marketing/vertical-video";
import { SHORT_CODE, WHATSAPP_URL } from "@/lib/marketing";
import type { CategorySeoCopy, ServiceIconName } from "@/lib/seo-services";

const ICONS: Record<ServiceIconName, LucideIcon> = {
	spray: SprayCanIcon,
	home: HouseIcon,
	building: Building2Icon,
	wrench: WrenchIcon,
	truck: TruckIcon,
	paintbrush: PaintbrushIcon,
	plug: PlugZapIcon,
};

const CATEGORY_ICONS: Record<string, ServiceIconName> = {
	"domestic-help": "home",
	maintenance: "wrench",
	technical: "plug",
	logistics: "truck",
	"art-and-design": "paintbrush",
};

/** Icon for chips linking to specialties of a category. */
export function categoryIcon(categorySlug: string): ServiceIconName {
	return CATEGORY_ICONS[categorySlug] ?? "home";
}

/** Trust points that hold for every service on Zemen Service. */
export const DEFAULT_TRUST = [
	"Verified professionals",
	"Prices shown upfront",
	"Support after booking",
];

export type ServiceHeroChip = { label: string; icon: ServiceIconName; href: string };

export type ServiceHeroMedia =
	| { kind: "video"; video: NonNullable<CategorySeoCopy["video"]> }
	| { kind: "image"; src: string; alt: string; title: string; detail?: string };

function WhatsAppGlyph({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden>
			<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
		</svg>
	);
}

const MEDIA_CLASS =
	"mx-auto w-full max-w-[min(420px,100%)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:self-start";

function HeroMedia({ media }: { media: ServiceHeroMedia }) {
	if (media.kind === "video") {
		const { video } = media;
		return (
			<VerticalVideo
				src={video.src}
				poster={video.poster}
				title={video.title}
				caption={video.caption}
				durationSeconds={video.durationSeconds}
				className={`aspect-[13/18] ${MEDIA_CLASS}`}
			/>
		);
	}
	return (
		<figure
			className={`relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#dfeada] shadow-[0_24px_60px_-20px_rgba(15,26,12,0.35)] ring-1 ring-black/5 ${MEDIA_CLASS}`}
		>
			<Image
				src={media.src}
				alt={media.alt}
				fill
				priority
				sizes="(max-width: 1024px) 100vw, 432px"
				quality={70}
				className="object-cover"
			/>
			<figcaption className="absolute inset-x-0 bottom-0 flex items-end gap-3 bg-gradient-to-t from-black/65 via-black/30 to-transparent px-5 pb-4 pt-16 text-white">
				<span className="min-w-0 flex-1 truncate text-[15px] font-medium">{media.title}</span>
				{media.detail ? (
					<span className="shrink-0 text-sm font-semibold tabular-nums">{media.detail}</span>
				) : null}
			</figcaption>
		</figure>
	);
}

/**
 * Service page hero: optional slogan, keyword H1, chips, CTAs and trust points,
 * with the service video or a listing photo on the right. Uses the same
 * container and background as the rest of the page so edges line up.
 */
export function ServiceHero({
	crumbs,
	location = "Addis Ababa, Ethiopia",
	slogan,
	heading,
	intro,
	primaryCta,
	chips,
	trust = DEFAULT_TRUST,
	media,
}: {
	crumbs: Crumb[];
	location?: string;
	/** Two-line display text above the H1. Without it the H1 is shown large. */
	slogan?: [string, string];
	/** The page H1; keep the search keywords here. */
	heading: string;
	intro: string;
	primaryCta: string;
	chips: ServiceHeroChip[];
	trust?: string[];
	media?: ServiceHeroMedia | null;
}) {
	return (
		<section className="bg-[#eef5ea] py-12 sm:py-14">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				{/* Phones: intro, media, then actions. Desktop: text left, media right. */}
				<div
					className={
						media
							? "grid gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:grid-rows-[auto_1fr] lg:gap-x-12"
							: "grid gap-y-8"
					}
				>
					<div className="max-w-3xl lg:col-start-1 lg:row-start-1">
						<MarketingBreadcrumbs items={crumbs} />
						<p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#dfeada] px-4 py-2 text-sm font-medium text-[#0f1a0c]">
							<MapPinIcon className="size-4 fill-primary text-[#dfeada]" aria-hidden />
							{location}
						</p>
						{slogan ? (
							<>
								<p className="mt-5 text-[clamp(2.5rem,5.6vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.035em] text-[#0f1a0c]">
									{slogan[0]}
									<span className="block text-[#4f6f3f]">{slogan[1]}</span>
								</p>
								<h1 className="mt-5 text-[clamp(1.3rem,2.3vw,1.75rem)] font-semibold tracking-tight text-[#0f1a0c]">
									{heading}
								</h1>
							</>
						) : (
							<h1 className="mt-5 text-[clamp(2.1rem,4.6vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#0f1a0c] text-balance">
								{heading}
							</h1>
						)}
						<p className="mt-3 max-w-xl text-[16px] leading-relaxed text-[#52634c]">{intro}</p>
					</div>

					{media ? <HeroMedia media={media} /> : null}

					<div className="lg:col-start-1 lg:row-start-2">
						{chips.length > 0 ? (
							<ul className="flex flex-wrap gap-3">
								{chips.map((chip) => {
									const Icon = ICONS[chip.icon];
									return (
										<li key={chip.href + chip.label}>
											<Link
												href={chip.href}
												className="inline-flex h-12 items-center gap-2.5 rounded-full bg-[#dfeada] px-5 text-[15px] font-medium text-[#0f1a0c] transition hover:bg-[#d3e2cc]"
											>
												<Icon className="size-5 text-primary" aria-hidden />
												{chip.label}
											</Link>
										</li>
									);
								})}
							</ul>
						) : null}

						<div className={chips.length > 0 ? "mt-6 flex flex-wrap gap-3" : "flex flex-wrap gap-3"}>
							<Link
								href="#listings"
								className="inline-flex h-13 items-center gap-3 rounded-full bg-primary px-9 text-[16px] font-medium text-primary-foreground transition hover:bg-primary/90"
							>
								{primaryCta}
								<ArrowRightIcon className="size-5" aria-hidden />
							</Link>
							<a
								href={`tel:${SHORT_CODE}`}
								className="inline-flex h-13 items-center gap-3 rounded-full border border-[#0f1a0c] bg-transparent px-8 text-[16px] font-medium text-[#0f1a0c] transition hover:bg-[#0f1a0c]/5"
							>
								<PhoneIcon className="size-5" aria-hidden />
								Call {SHORT_CODE}
							</a>
						</div>

						<p className="mt-5 flex items-center gap-2.5 text-[15px] text-[#52634c]">
							<WhatsAppGlyph className="size-5 fill-[#25D366]" />
							Prefer to chat?{" "}
							<a
								href={WHATSAPP_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="font-medium text-primary underline underline-offset-4"
							>
								WhatsApp us
							</a>
						</p>

						<ul className="mt-6 flex max-w-3xl flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:gap-0 sm:[&>li+li]:border-l sm:[&>li+li]:border-black/10 sm:[&>li+li]:pl-4 sm:[&>li]:pr-4">
							{trust.map((item) => (
								<li
									key={item}
									className="flex items-center gap-2.5 whitespace-nowrap text-[15px] text-[#52634c]"
								>
									<span className="flex size-7 items-center justify-center rounded-full bg-[#dfeada]">
										<CheckIcon className="size-4 text-primary" strokeWidth={2.75} aria-hidden />
									</span>
									{item}
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
