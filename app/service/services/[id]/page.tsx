"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	ArrowLeftIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	HeartIcon,
	ImageIcon,
	MapPinIcon,
	StarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ServiceLoading } from "@/components/service/service-loading";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RecurringBadge } from "@/components/recurring/recurring-badge";
import { loginPathForGuest } from "@/lib/guest";
import { useLocale } from "@/lib/i18n";
import {
	effectivePrePaymentPercent,
	isRecurringPricingType,
} from "@/lib/recurring";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/services/bookings/types";
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

function haversineKm(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ServiceDetailPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const userId = user?.id ?? "";
	const { service, loading, error } = useCachedServiceDetail(params.id);
	const [imgIndex, setImgIndex] = useState(0);
	const [imgFailed, setImgFailed] = useState(false);
	const [favBusy, setFavBusy] = useState(false);
	const [reviews, setReviews] = useState<ServiceReview[]>([]);
	const [distanceKm, setDistanceKm] = useState<number | null>(null);
	const [tab, setTab] = useState<"about" | "gallery" | "feedback">("about");
	const [galleryFailed, setGalleryFailed] = useState<Record<number, boolean>>(
		{},
	);

	const liked = Boolean(userId && service?.likedUser.includes(userId));
	const rating = service ? averageRating(service) : null;
	const image = service?.serviceImage[imgIndex] ?? service?.serviceImage[0];
	const detailPath = `/service/services/${params.id}`;
	const isRecurring = isRecurringPricingType(service?.pricingType ?? null);
	const prePayPercent = effectivePrePaymentPercent({
		pricingType: service?.pricingType,
		prePaymentPercent: service?.prePaymentPercent,
	});
	const hasPartialPrePayment = !isRecurring && prePayPercent < 100;

	useEffect(() => {
		if (!params.id) return;
		void fetchServiceReviews(params.id).then((res) => setReviews(res.reviews));
	}, [params.id]);

	useEffect(() => {
		if (
			service?.latitude == null ||
			service?.longitude == null ||
			typeof navigator === "undefined" ||
			!navigator.geolocation
		) {
			setDistanceKm(null);
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setDistanceKm(
					haversineKm(
						pos.coords.latitude,
						pos.coords.longitude,
						service.latitude!,
						service.longitude!,
					),
				);
			},
			() => setDistanceKm(null),
			{ maximumAge: 60_000, timeout: 8_000 },
		);
	}, [service?.latitude, service?.longitude]);

	const reviewStars = useMemo(
		() =>
			reviews.slice(0, 8).map((r) => ({
				...r,
				stars: Math.min(5, Math.max(1, Math.round(r.rating))),
			})),
		[reviews],
	);

	function requireAuth(next: string) {
		if (userId) return false;
		router.push(loginPathForGuest(next));
		return true;
	}

	async function onToggleFavorite() {
		if (!service || favBusy) return;
		if (requireAuth(detailPath)) return;
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

	function onBook() {
		if (!service) return;
		const bookPath = `/service/book/${service.id}`;
		if (requireAuth(bookPath)) return;
		router.push(bookPath);
	}

	function stepImage(delta: number) {
		if (!service || service.serviceImage.length < 2) return;
		const next =
			(imgIndex + delta + service.serviceImage.length) %
			service.serviceImage.length;
		setImgIndex(next);
		setImgFailed(false);
	}

	if (loading) return <ServiceLoading />;

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

	const hasDiscount =
		Boolean(service.discount) &&
		service.discount !== "0" &&
		Number(service.discount) > 0;
	const typeLabel =
		(service.type ?? "").trim().toLowerCase() === "fixed"
			? t("bookServiceTypeFixed")
			: (service.type?.trim() || null);
	const descPrefix = hasDiscount
		? Number(service.discount) <= 100
			? `(${service.discount}% off) `
			: `(ETB ${service.discount} off) `
		: "";

	return (
		<div className="mx-auto max-w-lg bg-[#f6f6f6] pb-28 md:max-w-2xl md:pb-10">
			{/* Image header — full bleed like mobile */}
			<div className="relative h-70 w-full bg-muted sm:h-80">
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
					className="absolute top-3 left-3 flex size-10 items-center justify-center text-white drop-shadow"
					aria-label={t("commonBack")}
				>
					<ArrowLeftIcon className="size-7" strokeWidth={2.25} />
				</button>
				<button
					type="button"
					onClick={onToggleFavorite}
					disabled={favBusy}
					className="absolute top-3 right-3 flex size-10 items-center justify-center text-white drop-shadow"
					aria-label={t("serviceFavorite")}
				>
					<HeartIcon
						className={
							liked ? "size-6 fill-[#E53935] text-[#E53935]" : "size-6 opacity-80"
						}
					/>
				</button>
				{service.serviceImage.length > 1 ? (
					<>
						<button
							type="button"
							onClick={() => stepImage(-1)}
							className="absolute top-1/2 left-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white"
							aria-label={t("commonBack")}
						>
							<ChevronLeftIcon className="size-5" />
						</button>
						<button
							type="button"
							onClick={() => stepImage(1)}
							className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white"
						>
							<ChevronRightIcon className="size-5" />
						</button>
						<span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white tabular-nums">
							{imgIndex + 1}/{service.serviceImage.length}
						</span>
						<div className="absolute right-0 bottom-3 left-0 flex justify-center gap-1.5">
							{service.serviceImage.map((_, i) => (
								<button
									key={i}
									type="button"
									onClick={() => {
										setImgIndex(i);
										setImgFailed(false);
									}}
									className={cn(
										"size-2 rounded-full",
										i === imgIndex ? "bg-white" : "bg-white/50",
									)}
								/>
							))}
						</div>
					</>
				) : null}
			</div>

			<div className="bg-white px-4 pt-4 pb-2">
				<h1 className="text-[20px] font-bold leading-tight tracking-tight text-foreground text-balance">
					{service.serviceName}
				</h1>
				{service.address ? (
					<p className="mt-1.5 text-[14px] text-[#8E8E93]">{service.address}</p>
				) : null}

				<div className="mt-4 flex gap-2">
					{(
						[
							{ id: "about" as const, label: t("serviceTabAbout") },
							{ id: "gallery" as const, label: t("serviceTabGallery") },
							{ id: "feedback" as const, label: t("serviceTabFeedback") },
						] as const
					).map((item) => {
						const active = tab === item.id;
						return (
							<button
								key={item.id}
								type="button"
								onClick={() => setTab(item.id)}
								className={cn(
									"rounded-full border px-4 py-1.5 text-[13px] font-bold transition-colors duration-150",
									active
										? "border-primary/40 bg-primary/12 text-primary"
										: "border-black/15 bg-white text-foreground/75",
								)}
							>
								{item.label}
							</button>
						);
					})}
				</div>

				{distanceKm != null ? (
					<div className="mt-3 flex justify-end">
						<span className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground">
							<MapPinIcon className="size-3.5 text-primary" />
							{t("serviceDistanceAway", {
								km:
									distanceKm < 10
										? distanceKm.toFixed(1)
										: String(Math.round(distanceKm)),
							})}
						</span>
					</div>
				) : null}
			</div>

			<div className="px-4 pt-3">
				{tab === "about" ? (
					<div className="space-y-5">
						<section>
							<h2 className="text-[15px] font-extrabold text-foreground">
								{t("serviceDescription")}
							</h2>
							{service.description ? (
								<p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[#6B6B6B]">
									{descPrefix}
									{service.description}
								</p>
							) : (
								<p className="mt-2 text-sm text-muted-foreground">—</p>
							)}
							{service.address ? (
								<p className="mt-2 inline-flex items-start gap-1.5 text-[13px] text-[#8E8E93]">
									<MapPinIcon className="mt-0.5 size-3.5 shrink-0" />
									<span>{service.address}</span>
								</p>
							) : null}
							<div className="mt-3 flex flex-wrap gap-2">
								{typeLabel ? (
									<span className="rounded-md bg-[#EFEFEF] px-2.5 py-1 text-[12px] font-semibold text-[#525252]">
										{typeLabel}
									</span>
								) : null}
								{isRecurring ? (
									<RecurringBadge
										interval={service.billingInterval}
										count={service.billingIntervalCount}
									/>
								) : hasPartialPrePayment ? (
									<span className="rounded-md bg-[#EFEFEF] px-2.5 py-1 text-[12px] font-semibold text-[#525252]">
										{t("bookingPayPercentNow", {
											percent: String(prePayPercent),
										})}
									</span>
								) : null}
							</div>
						</section>

						<section>
							<h2 className="text-[15px] font-extrabold text-foreground">
								{t("serviceOperatedBy")}
							</h2>
							<div className="mt-3 flex items-center gap-3">
								<UserAvatar
									src={service.providerImage}
									name={service.providerName}
									size="md"
									className="size-12"
								/>
								<div className="min-w-0">
									<p className="truncate text-[15px] font-bold text-foreground">
										{service.providerName || t("provider")}
									</p>
									{rating != null ? (
										<div className="mt-0.5 flex items-center gap-1.5">
											{Array.from({ length: 5 }).map((_, i) => (
												<StarIcon
													key={i}
													className={cn(
														"size-3.5",
														i < Math.round(rating)
															? "fill-[#FFA723] text-[#FFA723]"
															: "text-muted-foreground/30",
													)}
												/>
											))}
											<span className="text-[13px] text-[#6B6B6B]">
												{rating.toFixed(1)} (
												{t("serviceReviewCount", {
													count: String(service.reviewCount ?? 0),
												})}
												)
											</span>
										</div>
									) : (
										<p className="text-sm text-[#8E8E93]">
											{t("serviceProvider")}
										</p>
									)}
								</div>
							</div>
						</section>
					</div>
				) : null}

				{tab === "gallery" ? (
					<div className="mt-5">
						{service.serviceImage.length === 0 ? (
							<p className="py-10 text-center text-sm text-muted-foreground">
								{t("serviceNoGallery")}
							</p>
						) : (
							<div className="grid grid-cols-3 gap-2.5">
								{service.serviceImage.map((src, i) => (
									<button
										key={`${src}-${i}`}
										type="button"
										onClick={() => {
											setImgIndex(i);
											setImgFailed(false);
											window.scrollTo({ top: 0, behavior: "smooth" });
										}}
										className="aspect-square overflow-hidden rounded-xl bg-muted"
									>
										{galleryFailed[i] ? (
											<div className="flex size-full items-center justify-center text-muted-foreground">
												<ImageIcon className="size-6 opacity-40" />
											</div>
										) : (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={src}
												alt=""
												className="size-full object-cover"
												onError={() =>
													setGalleryFailed((prev) => ({ ...prev, [i]: true }))
												}
											/>
										)}
									</button>
								))}
							</div>
						)}
					</div>
				) : null}

				{tab === "feedback" ? (
					<div className="mt-5">
						{reviewStars.length === 0 ? (
							<p className="py-10 text-center text-sm text-muted-foreground">
								{t("serviceNoReviewsYet")}
							</p>
						) : (
							<ul className="space-y-3">
								{reviewStars.map((r) => (
									<li
										key={r.id}
										className="rounded-2xl border border-black/10 bg-white p-3.5"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate text-sm font-bold text-foreground">
													{r.customerName?.trim() || t("customer")}
												</p>
												<div className="mt-1 flex items-center gap-1.5">
													{Array.from({ length: 5 }).map((_, i) => (
														<StarIcon
															key={i}
															className={cn(
																"size-3.5",
																i < r.stars
																	? "fill-foreground text-foreground"
																	: "text-muted-foreground/30",
															)}
														/>
													))}
													<span className="ml-0.5 text-xs text-[#8E8E93]">
														{r.rating}/5
													</span>
												</div>
											</div>
											{r.date ? (
												<p className="shrink-0 text-xs text-[#8E8E93]">
													{formatDateTime(r.date)}
												</p>
											) : null}
										</div>
										{r.comment ? (
											<p className="mt-2.5 line-clamp-3 text-sm text-[#6B6B6B]">
												{r.comment}
											</p>
										) : null}
									</li>
								))}
							</ul>
						)}
					</div>
				) : null}
			</div>

			<div
				className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white px-4 py-3 md:static md:mt-8 md:border-0 md:px-4 md:py-0"
				style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
			>
				<div className="mx-auto max-w-lg md:max-w-2xl">
					<Button
						className="h-12 w-full rounded-xl text-[15px] font-semibold"
						onClick={onBook}
					>
						{t("serviceBook")}
					</Button>
				</div>
			</div>
		</div>
	);
}
