"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import {
	cancelCustomerOffer,
	fetchCustomerOffers,
	formatOfferPrice,
	type ServiceOffer,
} from "@/services/customer/offersApi";
import { formatDateTime } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";

export default function CustomerOffersPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const customerId = user?.id ?? "";
	const [offers, setOffers] = useState<ServiceOffer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);

	const load = useCallback(async () => {
		if (!customerId) return;
		setLoading(true);
		const res = await fetchCustomerOffers(customerId);
		setOffers(res.offers);
		setError(res.error);
		setLoading(false);
	}, [customerId]);

	useEffect(() => {
		void load();
	}, [load]);

	async function onCancel(id: string) {
		if (!window.confirm(t("offersCancelConfirm"))) return;
		setBusyId(id);
		const res = await cancelCustomerOffer(id);
		setBusyId(null);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		await load();
	}

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<div className="flex items-center justify-between gap-2">
				<ProfileBackLink href="/service/profile" label={t("profileTitle")} />
				<button
					type="button"
					onClick={() => void load()}
					className="mb-3 text-xs font-medium text-primary"
				>
					{t("commonRefresh")}
				</button>
			</div>
			<h1 className="admin-page-title">{t("offersTitle")}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{t("offersSubtitle")}
			</p>

			{error ? (
				<p className="mt-3 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
				{loading ? (
					<ServiceLoading compact />
				) : offers.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						{t("offersEmpty")}
					</p>
				) : (
					offers.map((o) => (
						<div
							key={o.id}
							className="border-b border-border px-4 py-3 last:border-b-0"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold">
										{o.serviceName || t("serviceTitle")}
									</p>
									<p className="mt-0.5 text-sm text-primary">
										{formatOfferPrice(o.offeredPrice)}
									</p>
									<p className="mt-0.5 text-xs capitalize text-muted-foreground">
										{o.status}
										{o.createdAt ? ` · ${formatDateTime(o.createdAt)}` : ""}
									</p>
								</div>
								<div className="flex shrink-0 flex-col gap-1">
									{o.bookingId ? (
										<Link
											href={`/service/bookings/${o.bookingId}`}
											className="text-xs font-medium text-primary"
										>
											{t("bookingTitle")}
										</Link>
									) : null}
									{o.status === "pending" ? (
										<Button
											size="sm"
											variant="outline"
											disabled={busyId === o.id}
											onClick={() => void onCancel(o.id)}
										>
											{t("commonCancel")}
										</Button>
									) : null}
									{o.status === "accepted" && o.bookingId ? (
										<Link
											href={`/service/bookings/${o.bookingId}`}
											className="text-xs font-medium text-primary"
										>
											{t("offersPayView")}
										</Link>
									) : null}
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
