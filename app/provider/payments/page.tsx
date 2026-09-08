"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { StatusBadge } from "@/components/provider/status-badge";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import {
	fetchProviderCompletedPayments,
} from "@/services/bookings/bookingsApi";
import {
	formatAmount,
	formatDateTime,
	type Booking,
} from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";

export default function ProviderPaymentsPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? user?.id ?? "";
	const authUserId = user?.id ?? "";
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [todayTotal, setTodayTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!providerId) return;
		void (async () => {
			setLoading(true);
			const res = await fetchProviderCompletedPayments(providerId, authUserId);
			setBookings(res.bookings);
			setTodayTotal(res.todayTotal);
			setError(res.error);
			setLoading(false);
		})();
	}, [providerId, authUserId]);

	return (
		<div className="mx-auto max-w-3xl px-4 pb-8 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink href="/provider/profile" label={t("providerProfileMy")} />
			<h1 className="admin-page-title mt-2">{t("providerPaymentsTitle")}</h1>

			<div className="mt-4 rounded-xl bg-primary px-4 py-5 text-primary-foreground">
				<p className="text-sm opacity-90">{t("providerTodayEarning")}</p>
				<p className="mt-1 text-2xl font-bold tabular-nums">
					{formatAmount(todayTotal)}
				</p>
			</div>

			{loading ? (
				<div className="mt-6">
					<ServiceLoading compact />
				</div>
			) : error ? (
				<p className="mt-6 text-sm text-destructive">{error}</p>
			) : bookings.length === 0 ? (
				<p className="mt-6 text-sm text-muted-foreground">
					{t("providerPaymentsEmpty")}
				</p>
			) : (
				<ul className="mt-6 space-y-3">
					{bookings.map((booking) => {
						const amount =
							Number(booking.subTotal ?? booking.totalAmount ?? 0) || 0;
						const extra = Number(booking.extraChargeAmount ?? 0) || 0;
						const name = [booking.firstName, booking.lastName]
							.filter(Boolean)
							.join(" ");
						return (
							<li key={booking.id}>
								<Link
									href={`/provider/bookings/${booking.id}`}
									className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="truncate text-sm font-semibold">
												{booking.service?.serviceName || t("bookingTitle")}
											</p>
											<p className="mt-0.5 text-xs text-muted-foreground">
												{name || t("customer")}
											</p>
											<p className="text-xs text-muted-foreground">
												#{booking.id.slice(0, 6)} ·{" "}
												{formatDateTime(
													booking.endTime ??
														booking.createdAt ??
														booking.bookingDate,
												)}
											</p>
										</div>
										<StatusBadge status={booking.status} />
									</div>
									<div className="mt-3 space-y-1.5 rounded-lg border border-border px-3 py-2 text-sm">
										<div className="flex justify-between gap-2">
											<span className="text-muted-foreground">
												{t("bookingPayment")}
											</span>
											<span>
												{booking.paymentCompleted
													? t("commonPaid")
													: t("commonUnpaid")}
												{booking.paymentType
													? ` · ${booking.paymentType}`
													: ""}
											</span>
										</div>
										<div className="flex justify-between gap-2">
											<span className="text-muted-foreground">
												{t("bookingAmount")}
											</span>
											<span className="font-medium text-primary tabular-nums">
												{formatAmount(amount)}
											</span>
										</div>
										{extra > 0 ? (
											<div className="flex justify-between gap-2">
												<span className="text-muted-foreground">
													{t("providerExtraCharge")}
												</span>
												<span className="tabular-nums text-primary">
													{formatAmount(extra)}
												</span>
											</div>
										) : null}
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
