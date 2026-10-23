"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageIcon, StarIcon } from "lucide-react";

import { RecurringBadge } from "@/components/recurring/recurring-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLocale } from "@/lib/i18n";
import { isRecurringPricingType } from "@/lib/recurring";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/services/bookings/types";
import { setServiceActive } from "@/services/services/servicesApi";
import type { ProviderService } from "@/services/services/types";
import { useAppDispatch } from "@/store/hooks";
import { patchProviderService } from "@/store/providerCacheSlice";

function averageRating(service: ProviderService): number | null {
	const count = Number(service.reviewCount ?? 0);
	const sum = Number(service.reviewSum ?? 0);
	if (!count || Number.isNaN(count) || Number.isNaN(sum) || count <= 0) {
		return null;
	}
	return Math.round((sum / count) * 10) / 10;
}

function discountLabel(discount: string | null): string | null {
	if (!discount || discount === "0") return null;
	const n = Number(discount);
	if (Number.isNaN(n) || n <= 0) return null;
	return `${n % 1 === 0 ? n : n.toFixed(0)}% OFF`;
}

export function ServiceCard({
	service,
	providerName,
	providerImage,
	compact = false,
	href,
	showFeaturedPending = true,
	showActiveToggle = false,
}: {
	service: ProviderService;
	providerName?: string | null;
	providerImage?: string | null;
	compact?: boolean;
	href?: string;
	showFeaturedPending?: boolean;
	showActiveToggle?: boolean;
}) {
	const { t } = useLocale();
	const dispatch = useAppDispatch();
	const [imgFailed, setImgFailed] = useState(false);
	const [busy, setBusy] = useState(false);
	const [toggleError, setToggleError] = useState<string | null>(null);
	const image = service.serviceImage[0];
	const rating = averageRating(service);
	const discount = discountLabel(service.discount);
	const featuredPending =
		showFeaturedPending && service.featureRequestedStatus === "pending";
	const isRecurring = isRecurringPricingType(service.pricingType);
	const displayName = providerName ?? service.providerName;
	const displayImage = providerImage ?? service.providerImage;

	async function onToggleActive(next: boolean) {
		if (busy || service.archived) return;
		setBusy(true);
		setToggleError(null);
		const res = await setServiceActive({
			serviceId: service.id,
			active: next,
		});
		setBusy(false);
		if (!res.ok) {
			setToggleError(res.error ?? t("commonError"));
			return;
		}
		// Patch only — do not invalidate (that clears cache and sticks the list on loading)
		dispatch(
			patchProviderService({
				id: service.id,
				patch: { status: next, archived: false },
			}),
		);
	}

	return (
		<div
			className={cn(
				"group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md",
				!service.status && "opacity-75",
				compact ? "h-full" : "",
			)}
		>
			<Link
				href={href ?? `/provider/services/${service.id}`}
				className="flex flex-1 flex-col active:scale-[0.99]"
			>
				<div
					className={cn(
						"relative w-full overflow-hidden bg-muted",
						compact ? "aspect-4/3" : "aspect-video",
					)}
				>
					{image && !imgFailed ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={image}
							alt=""
							className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
							onError={() => setImgFailed(true)}
						/>
					) : (
						<div className="flex size-full items-center justify-center text-muted-foreground">
							<ImageIcon className="size-8 opacity-40" />
						</div>
					)}

					{rating != null ? (
						<span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
							<StarIcon className="size-3 fill-amber-400 text-amber-400" />
							{rating.toFixed(1)}
						</span>
					) : null}

					{discount ? (
						<span className="absolute bottom-2 left-2 rounded-full bg-[#E53935] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
							{discount}
						</span>
					) : null}

					{service.feature ? (
						<span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
							<StarIcon className="size-2.5 fill-current" />
							Featured
						</span>
					) : featuredPending ? (
						<span className="absolute top-2 right-2 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-semibold text-white">
							Pending
						</span>
					) : isRecurring ? (
						<span className="absolute top-2 right-2">
							<RecurringBadge
								interval={service.billingInterval}
								count={service.billingIntervalCount}
							/>
						</span>
					) : null}

					{isRecurring && (service.feature || featuredPending) ? (
						<span className="absolute right-2 bottom-2">
							<RecurringBadge
								interval={service.billingInterval}
								count={service.billingIntervalCount}
							/>
						</span>
					) : null}

					{!service.status || service.archived ? (
						<span className="absolute right-2 bottom-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
							{service.archived ? "Archived" : "Inactive"}
						</span>
					) : null}
				</div>

				<div className={cn("flex flex-1 flex-col gap-1.5 p-3", compact && "p-2.5")}>
					<p className="line-clamp-1 text-[15px] font-semibold tracking-tight text-foreground">
						{service.serviceName ?? "Untitled service"}
					</p>

					{!compact ? (
						<div className="flex items-center gap-2">
							<UserAvatar
								src={displayImage}
								name={displayName}
								size="sm"
								className="size-7 text-[10px]"
							/>
							<p className="min-w-0 flex-1 truncate text-xs text-[#7C7C7C]">
								{displayName || "Provider"}
							</p>
						</div>
					) : (
						<p className="truncate text-xs text-[#7C7C7C]">
							{displayName || "Provider"}
						</p>
					)}

					<div className="mt-auto flex items-end justify-between gap-2 pt-1">
						<p className="truncate text-xs text-[#7C7C7C]">
							{service.subCategoryName ||
								service.categoryName ||
								service.type ||
								"Service"}
						</p>
						<p className="shrink-0 text-sm font-bold tabular-nums text-primary">
							{formatAmount(service.price)}
						</p>
					</div>
				</div>
			</Link>

			{showActiveToggle && !service.archived ? (
				<div
					className="border-t border-black/5 px-2.5 py-2"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<button
						type="button"
						disabled={busy}
						aria-pressed={service.status}
						onClick={() => void onToggleActive(!service.status)}
						className={cn(
							"flex h-9 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-semibold transition-colors",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
							service.status
								? "bg-muted text-foreground hover:bg-muted/80"
								: "bg-primary text-primary-foreground hover:bg-primary/90",
							busy && "opacity-60",
						)}
					>
						<span
							className={cn(
								"relative h-4 w-7 shrink-0 rounded-full transition-colors",
								service.status ? "bg-primary" : "bg-white/40",
							)}
							aria-hidden
						>
							<span
								className={cn(
									"absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow transition-transform",
									service.status && "translate-x-3",
								)}
							/>
						</span>
						{busy
							? t("commonLoading")
							: service.status
								? t("providerServiceDeactivate")
								: t("providerServiceActivate")}
					</button>
					{toggleError ? (
						<p className="mt-1 text-center text-[10px] text-destructive">
							{toggleError}
						</p>
					) : null}
				</div>
			) : null}
		</div>
	);
}
