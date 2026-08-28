"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, PencilIcon, StarIcon, Trash2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { ChapaCheckout } from "@/components/payments/chapa-checkout";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/services/bookings/types";
import {
	deleteService,
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="text-sm font-medium text-foreground sm:text-right">
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

	useEffect(() => {
		if (!service || !user?.provider?.id) return;
		if (service.providerId && service.providerId !== user.provider.id) {
			setError(t("providerServiceNotOwned"));
		}
	}, [service, user?.provider?.id, t]);

	async function toggleActive() {
		if (!service) return;
		setBusy(true);
		setError(null);
		setInfo(null);
		const res = await setServiceActive({
			serviceId: service.id,
			active: !service.status,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		dispatch(
			patchProviderService({
				id: service.id,
				patch: { status: !service.status },
			}),
		);
		dispatch(invalidateProviderServices());
		refresh();
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

	async function handleDelete() {
		if (!service) return;
		if (
			!window.confirm(
				t("providerDeleteServiceConfirm", {
					name: service.serviceName ?? t("serviceTitle"),
				}),
			)
		) {
			return;
		}
		setBusy(true);
		setError(null);
		const res = await deleteService(service.id);
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
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
						<div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
							{service.serviceImage.map((src, i) => (
								<div
									key={src}
									className={cn(
										"relative overflow-hidden rounded-xl border border-border bg-muted",
										i === 0
											? "col-span-2 aspect-[16/9] sm:col-span-3"
											: "aspect-square",
									)}
								>
									<Image
										src={src}
										alt=""
										fill
										className="object-cover"
										unoptimized
										sizes="(max-width: 672px) 100vw, 672px"
									/>
								</div>
							))}
						</div>
					) : null}

					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p className="admin-eyebrow">{t("serviceTitle")}</p>
							<h1 className="admin-page-title mt-1">
								{service.serviceName ?? t("providerServiceUntitled")}
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								{service.status ? t("providerServiceActive") : t("providerServiceInactive")}
								{service.feature ? ` · ${t("providerServiceFeaturedLabel")}` : null}
								{featuredPending ? ` · ${t("providerFeaturePending")}` : null}
								{service.approved === false ? ` · ${t("providerPendingApproval")}` : null}
							</p>
						</div>
						<Link
							href={`/provider/services/${service.id}/edit`}
							className={cn(
								buttonVariants({ variant: "outline", size: "sm" }),
								"inline-flex items-center gap-1.5",
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

					{service.description ? (
						<p className="mt-4 text-sm leading-relaxed text-muted-foreground">
							{service.description}
						</p>
					) : null}

					<dl className="mt-6 rounded-xl border border-border bg-white px-4 shadow-xs">
						<DetailRow label={t("commonPrice")} value={formatAmount(service.price)} />
						<DetailRow
							label={t("commonCategory")}
							value={
								[service.categoryName, service.subCategoryName]
									.filter(Boolean)
									.join(" · ") || null
							}
						/>
						<DetailRow label={t("commonType")} value={service.type} />
						<DetailRow
							label={t("providerLocationMode")}
							value={service.serviceLocationMode}
						/>
						<DetailRow label={t("commonAddress")} value={service.address} />
						<DetailRow
							label={t("serviceReviews")}
							value={
								<Link
									href={`/provider/services/${service.id}/reviews`}
									className="text-primary hover:underline"
								>
									{t("providerReviewsCount", {
										rating: service.reviewSum ?? "0",
										count: service.reviewCount ?? "0",
									})}
								</Link>
							}
						/>
						{service.discount && service.discount !== "0" ? (
							<DetailRow label={t("commonDiscount")} value={`${service.discount}%`} />
						) : null}
					</dl>

					<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
						<Button
							variant={service.status ? "outline" : "default"}
							disabled={busy}
							onClick={() => void toggleActive()}
						>
							{service.status ? t("providerServiceDeactivate") : t("providerServiceActivate")}
						</Button>

						{canRequestFeatured ? (
							<Button
								variant="outline"
								disabled={busy}
								className="gap-1.5"
								onClick={() => void handleFeatured()}
							>
								<StarIcon className="size-3.5" />
								{t("providerServiceFeatured")}
							</Button>
						) : null}

						{featuredPending ? (
							<span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-900">
								{t("providerServiceFeaturedPending")}
							</span>
						) : null}

						{featuredFee ? (
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
						) : null}

						{service.feature ? (
							<span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground">
								<StarIcon className="size-3.5" />
								{t("providerServiceFeaturedLabel")}
							</span>
						) : null}

						<Button
							variant="destructive"
							disabled={busy}
							className="gap-1.5 sm:ml-auto"
							onClick={() => void handleDelete()}
						>
							<Trash2Icon className="size-3.5" />
							{t("commonDelete")}
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
