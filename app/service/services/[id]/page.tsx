"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	ArrowLeftIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ClockIcon,
	HeartIcon,
	ImageIcon,
	MapPinIcon,
	MinusIcon,
	PlusIcon,
	StarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ServiceLoading } from "@/components/service/service-loading";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RecurringBadge } from "@/components/recurring/recurring-badge";
import { loginPathForGuest } from "@/lib/guest";
import { useLocale } from "@/lib/i18n";
import { isRecurringPricingType } from "@/lib/recurring";
import { cn } from "@/lib/utils";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
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

/** Matches mobile ServiceModel.discountAmount (≤100 = %, else fixed per unit). */
function serviceDiscountAmount(
	discountRaw: string | null | undefined,
	unitPrice: number,
	quantity: number,
): number {
	const discountValue = Number(String(discountRaw ?? "").trim()) || 0;
	if (discountValue <= 0) return 0;
	const lineSubtotal = quantity * unitPrice;
	if (lineSubtotal <= 0) return 0;
	if (discountValue <= 100) {
		return Math.round(((lineSubtotal * discountValue) / 100) * 100) / 100;
	}
	const fixedTotal = quantity * discountValue;
	return Math.min(fixedTotal, lineSubtotal);
}

function discountOffLabel(discountRaw: string | null | undefined): string {
	const raw = String(discountRaw ?? "").trim();
	if (!raw) return "0% off";
	const n = Number(raw) || 0;
	if (n > 0 && n <= 100) return `${raw}% off`;
	return `ETB ${raw} off`;
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
	const [quantity, setQuantity] = useState(1);
	const [tab, setTab] = useState<"about" | "gallery" | "feedback">("about");
	const [galleryFailed, setGalleryFailed] = useState<Record<number, boolean>>(
		{},
	);

	const liked = Boolean(userId && service?.likedUser.includes(userId));
	const rating = service ? averageRating(service) : null;
	const image = service?.serviceImage[imgIndex] ?? service?.serviceImage[0];
	const detailPath = `/service/services/${params.id}`;
	const isRecurring = isRecurringPricingType(service?.pricingType ?? null);

	const unitPrice = Number(service?.price ?? 0) || 0;
	const priceLine = unitPrice * quantity;
	const discountAmt = serviceDiscountAmount(
		service?.discount,
		unitPrice,
		quantity,
	);
	const total = Math.max(0, Math.round((priceLine - discountAmt) * 100) / 100);

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
		const bookPath = `/service/book/${service.id}?qty=${quantity}`;
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

	const category =
		service.subCategoryName || service.categoryName || t("serviceTitle");
	const hasDiscount =
		Boolean(service.discount) &&
		service.discount !== "0" &&
		Number(service.discount) > 0;

	return (
		<div className="mx-auto max-w-lg bg-white pb-28 md:max-w-2xl md:pb-10">
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

			<div className="px-4 pt-4">
				{/* Title + price */}
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<h1 className="text-[20px] font-bold leading-tight tracking-tight text-foreground">
							{service.serviceName}
						</h1>
						<div className="mt-2 flex flex-wrap items-center gap-2">
							{isRecurring ? (
								<RecurringBadge
									interval={service.billingInterval}
									count={service.billingIntervalCount}
								/>
							) : (
								<span className="inline-flex items-center rounded-full bg-[#F2F2F2] px-2.5 py-0.5 text-[11px] font-medium text-[#525252]">
									{t("pricingOneTime")}
								</span>
							)}
							{hasDiscount ? (
								<span className="inline-flex items-center rounded-full bg-[#E53935] px-2.5 py-0.5 text-[11px] font-bold text-white">
									{Number(service.discount) <= 100
										? `${service.discount}% OFF`
										: `ETB ${service.discount} OFF`}
								</span>
							) : null}
						</div>
						<p className="mt-1.5 text-sm text-[#8E8E93]">{category}</p>
					</div>
					<p className="shrink-0 text-[18px] font-bold tabular-nums text-primary">
						{formatAmount(service.price)}
					</p>
				</div>

				{/* Meta rows */}
				<div className="mt-4 space-y-2 text-sm text-[#6B6B6B]">
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
						{rating != null ? (
							<span className="inline-flex items-center gap-1">
								<StarIcon className="size-4 fill-[#FFA723] text-[#FFA723]" />
								<span>
									{rating.toFixed(1)}{" "}
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
					</div>
					{service.address ? (
						<div className="flex items-start gap-1.5">
							<MapPinIcon className="mt-0.5 size-4 shrink-0" />
							<span className="leading-snug">{service.address}</span>
						</div>
					) : null}
					{distanceKm != null ? (
						<div className="flex items-center gap-1.5">
							<MapPinIcon className="size-4 shrink-0" />
							{t("serviceDistanceAway", {
								km:
									distanceKm < 10
										? distanceKm.toFixed(1)
										: String(Math.round(distanceKm)),
							})}
						</div>
					) : null}
				</div>

				{/* Tabs — About / Gallery / Feedback */}
				<div className="mt-5 flex gap-2">
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
									"flex-1 rounded-full border px-2 py-1.5 text-[13px] font-bold transition-colors duration-150",
									active
										? "border-primary/55 bg-primary/10 text-primary"
										: "border-black/20 bg-white text-foreground/70",
								)}
							>
								{item.label}
							</button>
						);
					})}
				</div>

				{tab === "about" ? (
					<div className="mt-5 space-y-5">
						<section>
							<h2 className="text-[15px] font-extrabold text-foreground">
								{t("serviceDescription")}
							</h2>
							{service.description ? (
								<p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[#8E8E93]">
									{service.description}
								</p>
							) : (
								<p className="mt-2 text-sm text-muted-foreground">—</p>
							)}
							{service.allowsCustomOffer ? (
								<p className="mt-2 text-xs text-muted-foreground">
									{t("serviceCustomOfferHint")}
								</p>
							) : null}
						</section>

						<section>
							<h2 className="text-[15px] font-extrabold text-foreground">
								{t("serviceOperatedBy")}
							</h2>
							<div className="mt-3 flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-3.5">
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
									<p className="text-sm text-[#8E8E93]">
										{t("serviceProvider")}
									</p>
								</div>
							</div>
						</section>

						<section>
							<div className="flex items-center justify-between">
								<h2 className="text-[15px] font-extrabold text-foreground">
									{t("bookServiceQty")}
								</h2>
								<div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-2 py-1.5">
									<button
										type="button"
										onClick={() => setQuantity((q) => Math.max(1, q - 1))}
										disabled={quantity <= 1}
										className="inline-flex size-8 items-center justify-center rounded-lg text-foreground disabled:opacity-40"
										aria-label="−"
									>
										<MinusIcon className="size-4" />
									</button>
									<span className="min-w-6 text-center text-sm font-bold tabular-nums">
										{quantity}
									</span>
									<button
										type="button"
										onClick={() => setQuantity((q) => Math.min(10, q + 1))}
										disabled={quantity >= 10}
										className="inline-flex size-8 items-center justify-center rounded-lg text-foreground disabled:opacity-40"
										aria-label="+"
									>
										<PlusIcon className="size-4" />
									</button>
								</div>
							</div>

							<h2 className="mt-5 text-[15px] font-extrabold text-foreground">
								{t("servicePriceDetail")}
							</h2>
							<div className="mt-3 space-y-2.5 rounded-xl border border-black/10 bg-[#FAFAFA] p-4 dark:bg-muted/40">
								<div className="flex items-start justify-between gap-3 text-sm">
									<span className="text-[#6B6B6B]">
										{t("bookServicePriceLine")}
									</span>
									<span className="text-right font-medium tabular-nums text-foreground">
										{formatAmount(unitPrice)} × {quantity} ={" "}
										{formatAmount(priceLine)}
									</span>
								</div>
								{discountAmt > 0 ? (
									<div className="flex items-center justify-between gap-3 text-sm">
										<span className="text-[#6B6B6B]">
											{t("commonDiscount")} ({discountOffLabel(service.discount)})
										</span>
										<span className="font-medium tabular-nums text-primary">
											−{formatAmount(discountAmt)}
										</span>
									</div>
								) : null}
								<div className="border-t border-black/5 pt-2.5" />
								<div className="flex items-center justify-between gap-3 text-sm font-bold">
									<span>{t("commonTotal")}</span>
									<span className="tabular-nums text-primary">
										{formatAmount(total)}
									</span>
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
					<Button className="h-12 w-full rounded-xl text-[15px] font-semibold" onClick={onBook}>
						{t("serviceBook")} · {formatAmount(total)}
					</Button>
				</div>
			</div>
		</div>
	);
}
