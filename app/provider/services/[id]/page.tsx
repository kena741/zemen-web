"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, PencilIcon, StarIcon, Trash2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { Button, buttonVariants } from "@/components/ui/button";
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

	useEffect(() => {
		if (!service || !user?.provider?.id) return;
		if (service.providerId && service.providerId !== user.provider.id) {
			setError("This service does not belong to your account.");
		}
	}, [service, user?.provider?.id]);

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
		const res = await requestServiceFeatured(service.id);
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		setInfo("Featured request submitted. An admin will review it.");
		dispatch(invalidateProviderServices());
		refresh();
	}

	async function handleDelete() {
		if (!service) return;
		if (
			!window.confirm(
				`Delete “${service.serviceName ?? "this service"}”? This cannot be undone.`,
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
				Services
			</Button>

			{loading ? (
				<AppLoading compact />
			) : !service ? (
				<p className="text-sm text-destructive">
					{error || loadError || "Service not found"}
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
							<p className="admin-eyebrow">Service</p>
							<h1 className="admin-page-title mt-1">
								{service.serviceName ?? "Untitled service"}
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								{service.status ? "Active" : "Inactive"}
								{service.feature ? " · Featured" : null}
								{featuredPending ? " · Feature pending" : null}
								{service.approved === false ? " · Pending approval" : null}
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
							Edit
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
						<DetailRow label="Price" value={formatAmount(service.price)} />
						<DetailRow
							label="Category"
							value={
								[service.categoryName, service.subCategoryName]
									.filter(Boolean)
									.join(" · ") || null
							}
						/>
						<DetailRow label="Type" value={service.type} />
						<DetailRow
							label="Location mode"
							value={service.serviceLocationMode}
						/>
						<DetailRow label="Address" value={service.address} />
						<DetailRow
							label="Reviews"
							value={`${service.reviewSum ?? "0"} · ${service.reviewCount ?? "0"} reviews`}
						/>
						{service.discount && service.discount !== "0" ? (
							<DetailRow label="Discount" value={`${service.discount}%`} />
						) : null}
					</dl>

					<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
						<Button
							variant={service.status ? "outline" : "default"}
							disabled={busy}
							onClick={() => void toggleActive()}
						>
							{service.status ? "Deactivate" : "Activate"}
						</Button>

						{canRequestFeatured ? (
							<Button
								variant="outline"
								disabled={busy}
								className="gap-1.5"
								onClick={() => void handleFeatured()}
							>
								<StarIcon className="size-3.5" />
								Make featured
							</Button>
						) : null}

						{featuredPending ? (
							<span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-900">
								Featured request pending review
							</span>
						) : null}

						{service.feature ? (
							<span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground">
								<StarIcon className="size-3.5" />
								Featured
							</span>
						) : null}

						<Button
							variant="destructive"
							disabled={busy}
							className="gap-1.5 sm:ml-auto"
							onClick={() => void handleDelete()}
						>
							<Trash2Icon className="size-3.5" />
							Delete
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
