"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon, ImageIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/services/bookings/types";
import {
	fetchOfferById,
	formatOfferPrice,
	respondToOffer,
	type ServiceOffer,
} from "@/services/offers/offersApi";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderOffers } from "@/store/providerCacheSlice";

function statusClass(status: string) {
	switch (status) {
		case "pending":
			return "bg-amber-100 text-amber-900";
		case "accepted":
			return "bg-[#e8f5e3] text-primary";
		default:
			return "bg-muted text-muted-foreground";
	}
}

export default function ProviderOfferDetailPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [offer, setOffer] = useState<ServiceOffer | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		if (!params.id) return;
		setLoading(true);
		const res = await fetchOfferById(params.id);
		setOffer(res.offer);
		setError(res.error);
		setLoading(false);
	}, [params.id]);

	useEffect(() => {
		void load();
	}, [load]);

	async function onRespond(accept: boolean) {
		if (!offer || busy) return;
		setBusy(true);
		setError(null);
		const res = await respondToOffer({ offerId: offer.id, accept });
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		dispatch(invalidateProviderOffers());
		await load();
	}

	return (
		<div className="mx-auto max-w-2xl">
			<Button
				variant="ghost"
				size="sm"
				className="-ml-2 mb-3 gap-1.5"
				onClick={() => router.push("/provider/offers")}
			>
				<ArrowLeftIcon className="size-4" />
				{t("offersTitle")}
			</Button>

			{loading ? (
				<AppLoading compact />
			) : !offer ? (
				<p className="text-sm text-destructive">
					{error || t("commonNotFound")}
				</p>
			) : (
				<>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p className="admin-eyebrow">{t("offerDetailTitle")}</p>
							<h1 className="admin-page-title mt-1">
								{offer.serviceName || t("providerServiceOffer")}
							</h1>
						</div>
						<span
							className={cn(
								"mt-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
								statusClass(offer.status),
							)}
						>
							{offer.status}
						</span>
					</div>

					{error ? (
						<Alert variant="destructive" className="mt-4">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}

					<div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
						<div className="aspect-[16/9] bg-muted">
							{offer.serviceImage ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={offer.serviceImage}
									alt=""
									className="size-full object-cover"
								/>
							) : (
								<div className="flex size-full items-center justify-center text-muted-foreground">
									<ImageIcon className="size-10 opacity-40" />
								</div>
							)}
						</div>
						<dl className="px-4">
							<div className="flex flex-col gap-0.5 border-b border-border py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
								<dt className="text-sm text-muted-foreground">{t("customer")}</dt>
								<dd className="text-sm font-medium">
									{offer.customerName || t("customer")}
								</dd>
							</div>
							<div className="flex flex-col gap-0.5 border-b border-border py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
								<dt className="text-sm text-muted-foreground">
									{t("bookingAmount")}
								</dt>
								<dd className="text-sm font-semibold text-primary">
									{formatOfferPrice(offer.offeredPrice)}
								</dd>
							</div>
							{offer.createdAt ? (
								<div className="flex flex-col gap-0.5 border-b border-border py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
									<dt className="text-sm text-muted-foreground">
										{t("offerBookedFor")}
									</dt>
									<dd className="text-sm font-medium">
										{formatDateTime(offer.createdAt)}
									</dd>
								</div>
							) : null}
							{offer.message ? (
								<div className="flex flex-col gap-0.5 py-3">
									<dt className="text-sm text-muted-foreground">
										{t("offerMessage")}
									</dt>
									<dd className="mt-0.5 whitespace-pre-wrap text-sm font-medium">
										{offer.message}
									</dd>
								</div>
							) : null}
						</dl>
					</div>

					{offer.bookingId ? (
						<p className="mt-3 text-sm">
							<Link
								href={`/provider/bookings/${offer.bookingId}`}
								className="text-brand-ink underline-offset-4 hover:underline"
							>
								{t("bookingTitle")} #{offer.bookingId.slice(0, 8)}
							</Link>
						</p>
					) : null}

					{offer.status === "pending" ? (
						<div className="mt-6 flex flex-col gap-2 sm:flex-row">
							<Button
								variant="outline"
								className="flex-1"
								disabled={busy}
								onClick={() => void onRespond(false)}
							>
								{t("commonReject")}
							</Button>
							<Button
								className="flex-1"
								disabled={busy}
								onClick={() => void onRespond(true)}
							>
								{t("commonAccept")}
							</Button>
						</div>
					) : null}
				</>
			)}
		</div>
	);
}
