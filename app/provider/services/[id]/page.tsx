"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
	ArrowLeftIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	MapPinIcon,
	PencilIcon,
	StarIcon,
	Trash2Icon,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AppLoading } from "@/components/ui/app-loading";
import { ChapaCheckout } from "@/components/payments/chapa-checkout";
import { TelebirrCheckout } from "@/components/payments/telebirr-checkout";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import type { PaymentGateway } from "@/lib/payment-pending";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/services/bookings/types";
import {
	hardDeleteService,
	requestServiceFeatured,
	setServiceActive,
} from "@/services/services/servicesApi";
import { useAppDispatch } from "@/store/hooks";
import {
	invalidateProviderServices,
	patchProviderService,
} from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderServiceDetail } from "@/store/useProviderCache";

function StatusChip({
	children,
	tone = "neutral",
}: {
	children: React.ReactNode;
	tone?: "neutral" | "good" | "warn" | "muted";
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold",
				tone === "good" && "bg-emerald-50 text-emerald-800",
				tone === "warn" && "bg-amber-50 text-amber-900",
				tone === "muted" && "bg-muted text-muted-foreground",
				tone === "neutral" && "bg-primary/10 text-primary",
			)}
		>
			{children}
		</span>
	);
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5 border-b border-border/70 py-3.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
			<dt className="text-[13px] text-muted-foreground">{label}</dt>
			<dd className="text-[14px] font-semibold text-foreground sm:text-right">
				{value ?? "—"}
			</dd>
		</div>
	);
}

export default function ServiceDetailPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const { service, loading, error: loadError, refresh } =
		useCachedProviderServiceDetail(id);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);
	const [featuredFee, setFeaturedFee] = useState<number | null>(null);
	const [featuredGateway, setFeaturedGateway] =
		useState<PaymentGateway>("telebirr");
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [imgIndex, setImgIndex] = useState(0);
	const carouselRef = useRef<HTMLDivElement>(null);
	const ignoreScrollRef = useRef(false);

	useEffect(() => {
		setImgIndex(0);
		carouselRef.current?.scrollTo({ left: 0 });
	}, [service?.id]);

	function goToImage(next: number) {
		const el = carouselRef.current;
		const count = service?.serviceImage.length ?? 0;
		if (!el || count < 1) return;
		const i = ((next % count) + count) % count;
		ignoreScrollRef.current = true;
		setImgIndex(i);
		const slide = el.children[i] as HTMLElement | undefined;
		el.scrollTo({
			left: slide?.offsetLeft ?? i * el.clientWidth,
			behavior: "smooth",
		});
		window.setTimeout(() => {
			ignoreScrollRef.current = false;
		}, 450);
	}

	useEffect(() => {
		if (!service || !user?.provider?.id) return;
		if (service.providerId && service.providerId !== user.provider.id) {
			setError(t("providerServiceNotOwned"));
		}
	}, [service, user?.provider?.id, t]);

	async function toggleActive() {
		if (!service) return;
		const nextActive = service.archived ? true : !service.status;
		setBusy(true);
		setError(null);
		setInfo(null);
		const res = await setServiceActive({
			serviceId: service.id,
			active: nextActive,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		dispatch(
			patchProviderService({
				id: service.id,
				patch: { status: nextActive, archived: false },
			}),
		);
	}

	async function handleFeatured() {
		if (!service) return;
		setBusy(true);
		setError(null);
		setInfo(null);
		setFeaturedFee(null);
		const res = await requestServiceFeatured(service.id);
		setBusy(false);
		if (res.requiresPayment && res.fee > 0) {
			setFeaturedFee(res.fee);
			setInfo(t("providerFeaturedPayHint", { amount: formatAmount(res.fee) }));
			return;
		}
		if (!res.ok) {
			setError(res.error);
			return;
		}
		setInfo(t("providerFeaturedSubmitted"));
		dispatch(invalidateProviderServices());
		refresh();
	}

	async function handleHardDelete() {
		if (!service) return;
		setBusy(true);
		setError(null);
		setInfo(null);
		const res = await hardDeleteService(service.id);
		setBusy(false);
		if (!res.ok) {
			setDeleteOpen(false);
			setError(
				res.hasActiveBooking
					? t("providerServiceDeleteActiveBooking")
					: (res.error ?? "Delete failed"),
			);
			return;
		}
		setDeleteOpen(false);
		dispatch(invalidateProviderServices());
		router.replace("/provider/services");
	}

	const featuredPending = service?.featureRequestedStatus === "pending";
	const canRequestFeatured =
		service &&
		!service.feature &&
		service.featureRequestedStatus !== "pending";

	return (
		<div className="mx-auto max-w-2xl">
			<Button
				variant="ghost"
				size="sm"
				className="-ml-2 mb-3 gap-1.5"
				onClick={() => router.push("/provider/services")}
			>
				<ArrowLeftIcon className="size-4" />
				{t("providerServicesTitle")}
			</Button>

			{loading ? (
				<AppLoading compact />
			) : !service ? (
				<p className="text-sm text-destructive">
					{error || loadError || t("providerServiceNotFound")}
				</p>
			) : (
				<>
					{service.serviceImage.length > 0 ? (
						<div className="relative mb-5">
							<div
								ref={carouselRef}
								className="flex aspect-[16/10] snap-x snap-mandatory overflow-x-auto rounded-2xl bg-muted ring-1 ring-black/5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
								onScroll={(e) => {
									if (ignoreScrollRef.current) return;
									const el = e.currentTarget;
									const w = el.clientWidth || 1;
									const next = Math.round(el.scrollLeft / w);
									if (
										next !== imgIndex &&
										next >= 0 &&
										next < service.serviceImage.length
									) {
										setImgIndex(next);
									}
								}}
							>
								{service.serviceImage.map((src, i) => (
									<div
										key={`${src}-${i}`}
										className="relative h-full min-w-full shrink-0 snap-center"
									>
										<Image
											src={src}
											alt=""
											fill
											className="object-cover"
											unoptimized
											sizes="(max-width: 672px) 100vw, 672px"
											priority={i === 0}
										/>
									</div>
								))}
							</div>
							{service.serviceImage.length > 1 ? (
								<>
									<button
										type="button"
										onClick={() => goToImage(imgIndex - 1)}
										className="absolute top-1/2 left-2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/60"
										aria-label={t("commonBack")}
									>
										<ChevronLeftIcon className="size-5" />
									</button>
									<button
										type="button"
										onClick={() => goToImage(imgIndex + 1)}
										className="absolute top-1/2 right-2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/60"
										aria-label={t("commonNext")}
									>
										<ChevronRightIcon className="size-5" />
									</button>
									<span className="absolute top-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white tabular-nums">
										{imgIndex + 1}/{service.serviceImage.length}
									</span>
									<div className="mt-3 flex justify-center gap-1.5">
										{service.serviceImage.map((_, i) => (
											<button
												key={i}
												type="button"
												onClick={() => goToImage(i)}
												aria-label={`${i + 1}`}
												className={cn(
													"h-1.5 rounded-full transition-all",
													i === imgIndex
														? "w-5 bg-primary"
														: "w-1.5 bg-muted-foreground/35",
												)}
											/>
										))}
									</div>
								</>
							) : null}
						</div>
					) : null}

					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="min-w-0 flex-1">
							<p className="admin-eyebrow">{t("serviceTitle")}</p>
							<h1 className="admin-page-title mt-1 text-balance">
								{service.serviceName ?? t("providerServiceUntitled")}
							</h1>
							<div className="mt-3 flex flex-wrap gap-1.5">
								{service.archived ? (
									<StatusChip tone="muted">
										{t("providerServiceArchived")}
									</StatusChip>
								) : service.status ? (
									<StatusChip tone="good">
										{t("providerServiceActive")}
									</StatusChip>
								) : (
									<StatusChip tone="muted">
										{t("providerServiceInactive")}
									</StatusChip>
								)}
								{service.feature ? (
									<StatusChip tone="neutral">
										{t("providerServiceFeaturedLabel")}
									</StatusChip>
								) : null}
								{featuredPending ? (
									<StatusChip tone="warn">
										{t("providerFeaturePending")}
									</StatusChip>
								) : null}
								{service.approved === false ? (
									<StatusChip tone="warn">
										{t("providerPendingApproval")}
									</StatusChip>
								) : service.approved === true ? (
									<StatusChip tone="good">{t("statusApproved")}</StatusChip>
								) : null}
							</div>
						</div>
						<Link
							href={`/provider/services/${service.id}/edit`}
							className={cn(
								buttonVariants({ variant: "outline", size: "sm" }),
								"inline-flex shrink-0 items-center gap-1.5",
							)}
						>
							<PencilIcon className="size-3.5" />
							{t("commonEdit")}
						</Link>
					</div>

					{error ? (
						<Alert variant="destructive" className="mt-4">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}
					{info ? (
						<Alert className="mt-4">
							<AlertDescription>{info}</AlertDescription>
						</Alert>
					) : null}

					<section className="mt-5 overflow-hidden rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-sm">
						<p className="text-[13px] font-medium text-primary-foreground/80">
							{t("commonPrice")}
						</p>
						<p className="mt-1 text-[28px] font-bold tracking-tight tabular-nums">
							{formatAmount(service.price)}
						</p>
						<p className="mt-1 text-[13px] text-primary-foreground/80">
							{service.pricingType === "RECURRING"
								? `${t("pricingRecurring")} · ${service.billingInterval ?? "MONTH"} × ${service.billingIntervalCount || 1}`
								: t("pricingOneTime")}
							{service.discount && service.discount !== "0"
								? ` · ${service.discount}% ${t("commonDiscount")}`
								: null}
						</p>
					</section>

					{service.description ? (
						<section className="mt-5 rounded-2xl bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
							<h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
								{t("serviceDescription")}
							</h2>
							<p className="mt-2 text-[14px] leading-relaxed whitespace-pre-wrap text-foreground/90">
								{service.description}
							</p>
						</section>
					) : null}

					{(service.categoryName ||
						service.subCategoryName ||
						service.address) && (
						<section className="mt-4 rounded-2xl bg-white px-4 py-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
							<dl>
								{(service.categoryName || service.subCategoryName) && (
									<DetailRow
										label={t("commonCategory")}
										value={
											[service.categoryName, service.subCategoryName]
												.filter(Boolean)
												.join(" · ") || null
										}
									/>
								)}
								{service.address ? (
									<DetailRow
										label={t("commonAddress")}
										value={
											<span className="inline-flex items-start justify-end gap-1.5 sm:max-w-xs">
												<MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
												<span>{service.address}</span>
											</span>
										}
									/>
								) : null}
							</dl>
						</section>
					)}

					<dl className="mt-4 rounded-2xl bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
						{service.pricingType !== "RECURRING" ? (
							<DetailRow
								label={t("providerPrePaymentPercent")}
								value={
									service.prePayment
										? `${service.prePaymentPercent ?? 100}%`
										: t("commonOptional")
								}
							/>
						) : null}
						<DetailRow
							label={t("providerAllowCustomPrice")}
							value={service.allowsCustomOffer ? t("commonYes") : t("commonNo")}
						/>
						<DetailRow
							label={t("serviceReviews")}
							value={
								<Link
									href={`/provider/services/${service.id}/reviews`}
									className="inline-flex items-center gap-1 text-primary hover:underline"
								>
									<StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
									{(() => {
										const count = Number(service.reviewCount ?? 0) || 0;
										const sum = Number(service.reviewSum ?? 0) || 0;
										const avg =
											count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
										return t("providerReviewsAvg", {
											rating: avg.toFixed(1),
											count: String(count),
										});
									})()}
								</Link>
							}
						/>
					</dl>

					<div className="mt-6 flex flex-col gap-2.5 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/5 sm:flex-row sm:flex-wrap sm:items-center">
						{service.archived ? (
							<Button
								disabled={busy}
								className="h-11 rounded-xl sm:min-w-36"
								onClick={() => void toggleActive()}
							>
								{t("providerServiceRestore")}
							</Button>
						) : (
							<Button
								variant={service.status ? "outline" : "default"}
								disabled={busy}
								className="h-11 rounded-xl sm:min-w-36"
								onClick={() => void toggleActive()}
							>
								{service.status
									? t("providerServiceDeactivate")
									: t("providerServiceActivate")}
							</Button>
						)}

						{canRequestFeatured ? (
							<Button
								variant="outline"
								disabled={busy}
								className="h-11 gap-1.5 rounded-xl"
								onClick={() => void handleFeatured()}
							>
								<StarIcon className="size-3.5" />
								{t("providerServiceFeatured")}
							</Button>
						) : null}

						{featuredPending ? (
							<StatusChip tone="warn">
								{t("providerServiceFeaturedPending")}
							</StatusChip>
						) : null}

						{featuredFee != null && featuredFee > 0 ? (
							<div className="w-full space-y-2 sm:w-auto">
								<p className="text-sm text-muted-foreground">
									{t("providerFeaturedPayHint", {
										amount: formatAmount(featuredFee),
									})}
								</p>
								<div className="flex gap-2">
									<Button
										type="button"
										variant={
											featuredGateway === "telebirr" ? "default" : "outline"
										}
										size="sm"
										onClick={() => setFeaturedGateway("telebirr")}
									>
										{t("paymentTelebirr")}
									</Button>
									<Button
										type="button"
										variant={
											featuredGateway === "chapa" ? "default" : "outline"
										}
										size="sm"
										onClick={() => setFeaturedGateway("chapa")}
									>
										{t("paymentChapa")}
									</Button>
								</div>
								{featuredGateway === "chapa" ? (
									<ChapaCheckout
										className="w-full"
										email={user?.email}
										firstName={user?.provider?.firstName ?? user?.name}
										lastName={user?.provider?.lastName ?? ""}
										phone={user?.provider?.phoneNumber}
										purpose="featured"
										accountType="provider"
										userId={user?.id ?? ""}
										providerId={user?.provider?.id}
										serviceId={service.id}
										amount={String(featuredFee)}
										returnPath="/pay/done?purpose=featured"
										showAmountInput={false}
										label={t("providerFeaturedListing", {
											amount: formatAmount(featuredFee),
										})}
									/>
								) : (
									<TelebirrCheckout
										className="w-full"
										email={user?.email}
										firstName={user?.provider?.firstName ?? user?.name}
										lastName={user?.provider?.lastName ?? ""}
										phone={user?.provider?.phoneNumber}
										purpose="featured"
										accountType="provider"
										userId={user?.id ?? ""}
										providerId={user?.provider?.id}
										serviceId={service.id}
										amount={String(featuredFee)}
										returnPath="/pay/done?purpose=featured"
										showAmountInput={false}
										label={t("providerFeaturedListing", {
											amount: formatAmount(featuredFee),
										})}
									/>
								)}
							</div>
						) : null}

						{service.feature ? (
							<StatusChip tone="neutral">
								<span className="inline-flex items-center gap-1">
									<StarIcon className="size-3.5" />
									{t("providerServiceFeaturedLabel")}
								</span>
							</StatusChip>
						) : null}

						<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
							<AlertDialogTrigger
								render={
									<Button
										variant="destructive"
										disabled={busy}
										className="h-11 gap-1.5 rounded-xl sm:ml-auto"
									/>
								}
							>
								<Trash2Icon className="size-3.5" />
								{t("providerServiceDelete")}
							</AlertDialogTrigger>
							<AlertDialogContent size="sm">
								<AlertDialogHeader>
									<AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
										<Trash2Icon />
									</AlertDialogMedia>
									<AlertDialogTitle>
										{t("providerDeleteServiceConfirm", {
											name: service.serviceName ?? t("serviceTitle"),
										})}
									</AlertDialogTitle>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel disabled={busy}>
										{t("commonCancel")}
									</AlertDialogCancel>
									<AlertDialogAction
										variant="destructive"
										disabled={busy}
										onClick={() => void handleHardDelete()}
									>
										{t("providerServiceDelete")}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</>
			)}
		</div>
	);
}
