"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { StatusBadge } from "@/components/provider/status-badge";
import { ServiceLoading } from "@/components/service/service-loading";
import { formatBookingStatus } from "@/lib/booking-status";
import { useLocale } from "@/lib/i18n";
import { fetchProviderCompletedPayments } from "@/services/bookings/bookingsApi";
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
							Number(booking.totalAmount ?? booking.subTotal ?? 0) || 0;
						const extra = Number(booking.extraChargeAmount ?? 0) || 0;
						const image = booking.service?.serviceImage?.[0] ?? null;
						const subCategory =
							booking.service?.subCategoryName ||
							booking.service?.categoryName ||
							null;
						return (
							<li key={booking.id}>
								<Link
									href={`/provider/bookings/${booking.id}`}
									className="block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5"
								>
									<div className="flex gap-3 p-3">
										<div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
											{image ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={image}
													alt=""
													className="size-full object-cover"
												/>
											) : (
												<div className="flex size-full items-center justify-center text-muted-foreground">
													<ImageIcon className="size-6 opacity-40" />
												</div>
											)}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold">
												{booking.service?.serviceName || t("bookingTitle")}
											</p>
											{subCategory ? (
												<p className="mt-0.5 truncate text-xs text-muted-foreground">
													{subCategory}
												</p>
											) : null}
											<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
												<StatusBadge status={booking.status} />
												<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">
													{booking.paymentCompleted
														? t("commonPaid")
														: booking.status === "pending_approval"
															? t("statusPendingApproval")
															: t("commonUnpaid")}
												</span>
											</div>
										</div>
									</div>
									<div className="space-y-1.5 border-t border-border/60 px-3 py-2.5 text-sm">
										<div className="flex justify-between gap-2">
											<span className="text-muted-foreground">
												{t("commonStatus")}
											</span>
											<span className="capitalize">
												{formatBookingStatus(booking.status)}
											</span>
										</div>
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
											<span className="font-semibold text-primary tabular-nums">
												{formatAmount(amount)}
											</span>
										</div>
										<div className="flex justify-between gap-2">
											<span className="text-muted-foreground">
												{t("providerExtraCharge")}
											</span>
											<span className="tabular-nums">
												{formatAmount(extra)}
											</span>
										</div>
										<div className="flex justify-between gap-2">
											<span className="text-muted-foreground">
												{t("bookingWhen")}
											</span>
											<span className="text-right text-xs">
												{formatDateTime(
													booking.createdAt ??
														booking.endTime ??
														booking.bookingDate,
												)}
											</span>
										</div>
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
