"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	ArrowLeftIcon,
	ClockIcon,
	HeartIcon,
	ImageIcon,
	MapPinIcon,
	StarIcon,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ServiceLoading } from "@/components/service/service-loading";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RecurringBadge } from "@/components/recurring/recurring-badge";
import { useLocale } from "@/lib/i18n";
import { isRecurringPricingType } from "@/lib/recurring";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/services/bookings/types";
import { toggleServiceFavorite } from "@/services/catalog/catalogApi";
import {
	fetchServiceReviews,
	type ServiceReview,
} from "@/services/customer/reviewsApi";
import type { ProviderService } from "@/services/services/types";
import { useAppDispatch } from "@/store/hooks";
import { useAuth } from "@/store/useAuth";
import { useCachedServiceDetail } from "@/store/useCustomerCache";
import {
	invalidateFavorites,
	patchServiceInCache,
} from "@/store/customerCacheSlice";

function averageRating(service: ProviderService): number | null {
	const count = Number(service.reviewCount ?? 0);
	const sum = Number(service.reviewSum ?? 0);
	if (!count || Number.isNaN(count) || Number.isNaN(sum) || count <= 0) {
		return null;
	}
	return Math.round((sum / count) * 10) / 10;
}

export default function ServiceDetailPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const userId = user?.id ?? "";
	const {
		service,
		loading,
		error,
	} = useCachedServiceDetail(params.id);
	const [imgIndex, setImgIndex] = useState(0);
	const [imgFailed, setImgFailed] = useState(false);
	const [favBusy, setFavBusy] = useState(false);
	const [reviews, setReviews] = useState<ServiceReview[]>([]);

	const liked = Boolean(userId && service?.likedUser.includes(userId));
	const rating = service ? averageRating(service) : null;
	const image = service?.serviceImage[imgIndex] ?? service?.serviceImage[0];

	useEffect(() => {
		if (!params.id) return;
		void fetchServiceReviews(params.id).then((res) => setReviews(res.reviews));
	}, [params.id]);

	async function onToggleFavorite() {
		if (!service || !userId || favBusy) return;
		setFavBusy(true);
		const res = await toggleServiceFavorite({
			serviceId: service.id,
			userId,
			likedUser: service.likedUser,
		});
		setFavBusy(false);
		if (!res.error) {
			dispatch(
				patchServiceInCache({
					id: service.id,
					patch: { likedUser: res.likedUser },
				}),
			);
			dispatch(invalidateFavorites());
		}
	}

	if (loading) {
		return <ServiceLoading />;
	}

	if (!service) {
		return (
			<div className="px-4 pt-4 md:px-6 md:pt-8">
				<button
					type="button"
					onClick={() => router.push("/service")}
					className="mb-3 text-sm text-primary"
				>
					← {t("navHome")}
				</button>
				<p className="text-sm text-destructive">
					{error || t("serviceNotFound")}
				</p>
			</div>
		);
	}

	return (
		<div className="pb-24 md:pb-8">
			<div className="relative aspect-[16/10] w-full bg-muted md:mx-6 md:mt-6 md:aspect-[21/9] md:max-w-6xl md:overflow-hidden md:rounded-2xl">
				{image && !imgFailed ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={image}
						alt=""
						className="size-full object-cover"
						onError={() => setImgFailed(true)}
					/>
				) : (
					<div className="flex size-full items-center justify-center text-muted-foreground">
						<ImageIcon className="size-12 opacity-40" />
					</div>
				)}
				<button
					type="button"
					onClick={() => router.back()}
					className="absolute top-3 left-3 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm md:top-4 md:left-4"
					aria-label={t("commonBack")}
				>
					<ArrowLeftIcon className="size-5" />
				</button>
				<button
					type="button"
					onClick={onToggleFavorite}
					disabled={favBusy || !userId}
					className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm md:top-4 md:right-4"
					aria-label={t("serviceFavorite")}
				>
					<HeartIcon
						className={liked ? "size-5 fill-[#E53935] text-[#E53935]" : "size-5"}
					/>
				</button>
				{service.serviceImage.length > 1 ? (
					<div className="absolute right-0 bottom-3 left-0 flex justify-center gap-1.5">
						{service.serviceImage.map((_, i) => (
							<button
								key={i}
								type="button"
								onClick={() => {
									setImgIndex(i);
									setImgFailed(false);
								}}
								className={`size-2 rounded-full ${
									i === imgIndex ? "bg-white" : "bg-white/50"
								}`}
							/>
						))}
					</div>
				) : null}
			</div>

			<div className="px-4 pt-4 md:px-6">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<h1 className="text-xl font-semibold tracking-tight">
							{service.serviceName}
						</h1>
						{isRecurringPricingType(service.pricingType) ? (
							<div className="mt-2">
								<RecurringBadge
									interval={service.billingInterval}
									count={service.billingIntervalCount}
								/>
							</div>
						) : null}
						<p className="mt-1 text-sm text-muted-foreground">
							{service.subCategoryName || service.categoryName || t("serviceTitle")}
						</p>
					</div>
					<p className="shrink-0 text-lg font-bold tabular-nums text-primary">
						{formatAmount(service.price)}
					</p>
				</div>

				<div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
					{rating != null ? (
						<span className="inline-flex items-center gap-1">
							<StarIcon className="size-4 fill-amber-400 text-amber-400" />
							{rating.toFixed(1)}
							<span className="text-xs">
								{t("serviceReviewCount", {
									count: String(service.reviewCount ?? 0),
								})}
							</span>
						</span>
					) : null}
					{service.duration ? (
						<span className="inline-flex items-center gap-1">
							<ClockIcon className="size-4" />
							{service.duration}
						</span>
					) : null}
					{service.address ? (
						<span className="inline-flex max-w-full items-center gap-1">
							<MapPinIcon className="size-4 shrink-0" />
							<span className="truncate">{service.address}</span>
						</span>
					) : null}
				</div>

				<div className="mt-5 flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
					<UserAvatar
						src={service.providerImage}
						name={service.providerName}
						size="md"
					/>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold">
							{service.providerName || t("provider")}
						</p>
						<p className="text-xs text-muted-foreground">{t("serviceProvider")}</p>
					</div>
				</div>

				{service.description ? (
					<section className="mt-5">
						<h2 className="text-sm font-semibold">{t("serviceAbout")}</h2>
						<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
							{service.description}
						</p>
					</section>
				) : null}

				{service.discount && service.discount !== "0" ? (
					<p className="mt-4 text-sm font-medium text-[#E53935]">
						{t("serviceDiscountAvailable", { percent: service.discount })}
					</p>
				) : null}

				{service.allowsCustomOffer ? (
					<p className="mt-3 text-xs text-muted-foreground">
						{t("serviceCustomOfferHint")}
					</p>
				) : null}

				{reviews.length > 0 ? (
					<section className="mt-6 mb-24 md:mb-8">
						<h2 className="text-sm font-semibold">{t("serviceReviews")}</h2>
						<ul className="mt-3 space-y-3">
							{reviews.slice(0, 8).map((r) => (
								<li
									key={r.id}
									className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5"
								>
									<p className="text-sm font-medium">
										{"★".repeat(Math.min(5, Math.max(1, r.rating)))}
										<span className="ml-2 text-xs text-muted-foreground">
											{r.rating}/5
										</span>
									</p>
									{r.comment ? (
										<p className="mt-1 text-sm text-muted-foreground">
											{r.comment}
										</p>
									) : null}
								</li>
							))}
						</ul>
					</section>
				) : null}
			</div>

			<div
				className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white px-4 py-3 md:static md:mt-8 md:border-0 md:bg-transparent md:px-6 md:py-0"
				style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
			>
				<div className="mx-auto flex max-w-6xl gap-3">
					<Link
						href="/service/inbox"
						className={cn(
							buttonVariants({ variant: "outline" }),
							"hidden flex-1 sm:inline-flex",
						)}
					>
						{t("serviceMessage")}
					</Link>
					<Button
						className="flex-1"
						onClick={() => router.push(`/service/book/${service.id}`)}
					>
						{t("serviceBook")}
					</Button>
				</div>
			</div>
		</div>
	);
}
