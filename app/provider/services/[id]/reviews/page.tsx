"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import {
	fetchServiceReviews,
	type ServiceReview,
} from "@/services/customer/reviewsApi";
import { useCachedProviderServiceDetail } from "@/store/useProviderCache";

export default function ProviderServiceReviewsPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const serviceId = params.id ?? "";
	const { service, loading: serviceLoading } =
		useCachedProviderServiceDetail(serviceId);
	const [reviews, setReviews] = useState<ServiceReview[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!serviceId) return;
		setLoading(true);
		void fetchServiceReviews(serviceId).then((res) => {
			setReviews(res.reviews);
			setError(res.error);
			setLoading(false);
		});
	}, [serviceId]);

	return (
		<div className="mx-auto max-w-2xl px-4 py-6">
			<ProfileBackLink
				href={`/provider/services/${serviceId}`}
				label={t("serviceTitle")}
			/>
			<h1 className="admin-page-title mt-2">{t("serviceReviews")}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{t("providerReviewsTotal", {
					name: service?.serviceName ?? t("serviceTitle"),
					count: service?.reviewCount ?? 0,
				})}
			</p>
			{serviceLoading || loading ? (
				<ServiceLoading compact />
			) : error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : reviews.length === 0 ? (
				<p className="mt-6 text-sm text-muted-foreground">{t("serviceNoReviews")}</p>
			) : (
				<ul className="mt-6 space-y-3">
					{reviews.map((r) => (
						<li
							key={r.id}
							className="rounded-xl border border-border bg-white p-4 dark:bg-card"
						>
							<div className="flex items-center justify-between gap-2">
								<p className="text-sm font-semibold">{r.customerName || t("customer")}</p>
								<p className="text-sm tabular-nums">{r.rating}/5</p>
							</div>
							{r.comment ? (
								<p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
							) : null}
							{r.date ? (
								<p className="mt-2 text-xs text-muted-foreground">
									{new Date(r.date).toLocaleDateString()}
								</p>
							) : null}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
