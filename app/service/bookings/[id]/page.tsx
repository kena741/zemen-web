"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RecurringBadge } from "@/components/recurring/recurring-badge";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { StatusBadge } from "@/components/provider/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
import {
	calendarDaysUntil,
	isNextCyclePaymentDue,
	isRecurringPricingType,
	periodNounKey,
	type RecurringPaymentSettings,
	RECURRING_PAYMENT_SETTINGS_DEFAULT,
} from "@/lib/recurring";
import { savePaymentPending } from "@/lib/payment-pending";
import { fetchRecurringPaymentSettings } from "@/services/config/recurringSettingsApi";
import {
	cancelCustomerBooking,
	payBookingWithWallet,
} from "@/services/customer/bookingsApi";
import {
	fetchOfferByBookingId,
	type ServiceOffer,
} from "@/services/customer/offersApi";
import {
	fetchReviewForBooking,
	submitServiceReview,
} from "@/services/customer/reviewsApi";
import { patchAuthUser } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { invalidateBookings } from "@/store/customerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedBookingDetail } from "@/store/useCustomerCache";

export default function CustomerBookingDetailPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const { booking, loading, error, refresh } = useCachedBookingDetail(params.id);
	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [offer, setOffer] = useState<ServiceOffer | null>(null);
	const [hasReview, setHasReview] = useState(false);
	const [showReview, setShowReview] = useState(false);
	const [rating, setRating] = useState(5);
	const [comment, setComment] = useState("");
	const [recurringSettings, setRecurringSettings] =
		useState<RecurringPaymentSettings>(RECURRING_PAYMENT_SETTINGS_DEFAULT);
	const [showNextCycleConfirm, setShowNextCycleConfirm] = useState(false);

	useEffect(() => {
		void fetchRecurringPaymentSettings().then(setRecurringSettings);
	}, []);

	useEffect(() => {
		if (!booking?.id) return;
		void fetchOfferByBookingId(booking.id).then((res) => setOffer(res.offer));
		void fetchReviewForBooking(booking.id).then((res) =>
			setHasReview(Boolean(res.review)),
		);
	}, [booking?.id]);

	async function onCancel() {
		if (!booking || busy) return;
		if (!window.confirm(t("bookingCancelConfirm"))) return;
		setBusy(true);
		setActionError(null);
		const res = await cancelCustomerBooking(booking.id);
		setBusy(false);
		if (!res.ok) {
			setActionError(res.error);
			return;
		}
		dispatch(invalidateBookings());
		refresh();
	}

	async function onPayWallet() {
		if (!booking || !user?.id || busy) return;
		const amount = Number(booking.totalAmount ?? booking.subTotal ?? 0) || 0;
		if (
			!window.confirm(
				t("bookingPayWalletConfirm", { amount: formatAmount(amount) }),
			)
		) {
			return;
		}
		setBusy(true);
		setActionError(null);
		const res = await payBookingWithWallet({
			bookingId: booking.id,
			customerId: user.customer?.id ?? user.id,
			amount,
		});
		setBusy(false);
		if (!res.ok) {
			setActionError(res.error);
			return;
		}
		if (res.newBalance != null && user.customer) {
			dispatch(
				patchAuthUser({
					customer: {
						...user.customer,
						walletAmount: String(res.newBalance),
					},
				}),
			);
		}
		dispatch(invalidateBookings());
		refresh();
	}

	async function onPayNextCycleWallet() {
		if (!booking || !user?.id || busy) return;
		const amount = Number(booking.subTotal ?? booking.totalAmount ?? 0) || 0;
		setBusy(true);
		setActionError(null);
		const res = await payBookingWithWallet({
			bookingId: booking.id,
			customerId: user.customer?.id ?? user.id,
			amount,
			nextCycle: true,
			billingInterval: booking.service?.billingInterval ?? undefined,
			billingIntervalCount: booking.service?.billingIntervalCount ?? undefined,
		});
		setBusy(false);
		setShowNextCycleConfirm(false);
		if (!res.ok) {
			setActionError(res.error);
			return;
		}
		if (res.newBalance != null && user.customer) {
			dispatch(
				patchAuthUser({
					customer: {
						...user.customer,
						walletAmount: String(res.newBalance),
					},
				}),
			);
		}
		dispatch(invalidateBookings());
		refresh();
	}

	async function onPayNextCycleChapa() {
		if (!booking || !user?.id || busy) return;
		const amount = Number(booking.subTotal ?? booking.totalAmount ?? 0) || 0;
		savePaymentPending({
			purpose: "booking",
			userId: user.id,
			accountType: "customer",
			amount: String(amount),
			bookingId: booking.id,
			nextCycle: true,
			billingInterval: booking.service?.billingInterval ?? undefined,
			billingIntervalCount: booking.service?.billingIntervalCount ?? undefined,
		});
		setBusy(true);
		setShowNextCycleConfirm(false);
		const res = await fetch("/api/pay/chapa", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				amount,
				email: user.email,
				first_name: booking.firstName,
				last_name: booking.lastName,
				phone_number: booking.phoneNumber,
				purpose: "booking",
				return_path: `/pay/done?purpose=booking&amount=${amount}`,
				booking_id: booking.id,
			}),
		});
		const data = (await res.json()) as { checkout_url?: string; error?: string };
		setBusy(false);
		if (!res.ok || !data.checkout_url) {
			setActionError(data.error || t("bookServiceChapaFailed"));
			return;
		}
		window.location.href = data.checkout_url;
	}

	async function onReview() {
		if (!booking?.serviceId || !user?.id || busy) return;
		setBusy(true);
		setActionError(null);
		const res = await submitServiceReview({
			customerId: user.id,
			bookingId: booking.id,
			serviceId: booking.serviceId,
			rating,
			comment,
		});
		setBusy(false);
		if (!res.ok) {
			setActionError(res.error);
			return;
		}
		setHasReview(true);
		setShowReview(false);
	}

	if (loading) {
		return <ServiceLoading />;
	}

	if (!booking) {
		return (
			<div className="px-4 pt-4">
				<ProfileBackLink href="/service/bookings" label={t("bookingsTitle")} />
				<p className="text-sm text-destructive">
					{error || t("bookingNotFound")}
				</p>
			</div>
		);
	}

	const status = (booking.status || "").toLowerCase();
	const canCancel = status === "pending" && !booking.paymentCompleted;
	const showWalletPay =
		!booking.paymentCompleted &&
		(offer?.status === "accepted" || status === "pending_extra_payment");
	const canReview = status === "completed" && !hasReview && booking.serviceId;
	const isRecurring =
		isRecurringPricingType(booking.service?.pricingType ?? null) ||
		booking.nextCycleDue ||
		Boolean(booking.currentPeriodEnd);
	const showNextCyclePay = isNextCyclePaymentDue({
		isRecurring,
		paymentCompleted: booking.paymentCompleted,
		status: booking.status,
		nextCycleDue: booking.nextCycleDue,
		currentPeriodEnd: booking.currentPeriodEnd,
		paymentWindowDays: recurringSettings.paymentWindowDays,
	});
	const daysLeft = calendarDaysUntil(booking.currentPeriodEnd);
	const periodNoun = t(periodNounKey(booking.service?.billingInterval));
	const nextCycleAmount =
		Number(booking.subTotal ?? booking.totalAmount ?? 0) || 0;
	const address =
		booking.bookingAddress?.address ||
		booking.bookingAddress?.locality ||
		null;

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<ProfileBackLink href="/service/bookings" label={t("bookingsTitle")} />
			<div className="flex flex-wrap items-center gap-2">
				<h1 className="admin-page-title">
					{booking.service?.serviceName || t("bookingTitle")}
				</h1>
				<StatusBadge status={booking.status} />
				{isRecurring ? (
					<RecurringBadge
						interval={booking.service?.billingInterval}
						count={booking.service?.billingIntervalCount}
					/>
				) : null}
			</div>
			<p className="mt-1 text-sm text-muted-foreground">
				#{booking.id.slice(0, 8)}
			</p>

			{actionError || error ? (
				<Alert variant="destructive" className="mt-3">
					<AlertDescription>{actionError || error}</AlertDescription>
				</Alert>
			) : null}

			{offer ? (
				<p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs">
					{t("bookingCustomOffer")} ·{" "}
					<span className="capitalize font-medium">{offer.status}</span>
					{offer.offeredPrice != null
						? ` · ${formatAmount(offer.offeredPrice)}`
						: ""}
				</p>
			) : null}

			<div className="mt-5 space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
				<Row
					label={t("bookingWhen")}
					value={formatDateTime(booking.bookingDate ?? booking.startTime)}
				/>
				<Row
					label={t("bookingAmount")}
					value={formatAmount(booking.totalAmount ?? booking.subTotal)}
				/>
				<Row
					label={t("bookingPayment")}
					value={
						booking.paymentCompleted
							? t("bookingPaidWith", {
									type: booking.paymentType || t("commonPaid"),
								})
							: booking.paymentType || t("commonUnpaid")
					}
				/>
				{address ? <Row label={t("bookingAddress")} value={address} /> : null}
				{booking.handymanId ? (
					<Row
						label={t("bookingHandyman")}
						value={
							<Link
								href={`/service/bookings/${booking.id}/handyman`}
								className="text-primary underline"
							>
								{t("bookingViewHandyman")}
							</Link>
						}
					/>
				) : null}
				{booking.currentPeriodEnd ? (
					<Row
						label={t("bookingPeriodEnds")}
						value={formatDateTime(booking.currentPeriodEnd)}
					/>
				) : null}
				{isRecurring && daysLeft != null ? (
					<p className="text-xs text-muted-foreground">
						{daysLeft < 0
							? t("bookingCycleEnded")
							: t("bookingDaysLeft", { days: String(daysLeft) })}
					</p>
				) : null}
				{booking.description ? (
					<Row label={t("bookingNotes")} value={booking.description} />
				) : null}
				{booking.otp &&
				["accepted", "ongoing", "inprogress", "driving", "on_the_way"].includes(
					status,
				) ? (
					<div className="rounded-lg bg-primary/10 px-3 py-3">
						<p className="text-xs font-medium text-primary">
							{t("bookingStartOtp")}
						</p>
						<p className="mt-1 text-2xl font-bold tracking-[0.3em] text-primary">
							{booking.otp}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{t("bookingShareOtp")}
						</p>
					</div>
				) : null}
				{booking.reason ? (
					<Row label={t("bookingReason")} value={booking.reason} />
				) : null}
			</div>

			{showNextCyclePay ? (
				<div className="mt-5 space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
					<p className="text-sm text-muted-foreground">
						{t("bookingNextCycleNotice", { period: periodNoun })}
					</p>
					{!showNextCycleConfirm ? (
						<Button
							className="w-full"
							disabled={busy}
							onClick={() => setShowNextCycleConfirm(true)}
						>
							{t("bookingPayNextCycleFor", { period: periodNoun })} ·{" "}
							{formatAmount(nextCycleAmount)}
						</Button>
					) : (
						<div className="space-y-2">
							<p className="text-sm font-medium">{t("bookingConfirmPayTitle")}</p>
							<p className="text-xs text-muted-foreground">
								{formatAmount(nextCycleAmount)}
							</p>
							<div className="flex flex-col gap-2 sm:flex-row">
								<Button
									className="flex-1"
									disabled={busy}
									onClick={() => void onPayNextCycleWallet()}
								>
									{busy ? t("bookingPaying") : t("bookingPayWithWallet")}
								</Button>
								<Button
									variant="outline"
									className="flex-1"
									disabled={busy}
									onClick={() => void onPayNextCycleChapa()}
								>
									{busy ? t("bookingStarting") : t("bookingPayWithChapa")}
								</Button>
							</div>
							<Button
								variant="ghost"
								className="w-full"
								disabled={busy}
								onClick={() => setShowNextCycleConfirm(false)}
							>
								{t("commonCancel")}
							</Button>
						</div>
					)}
				</div>
			) : null}

			{showWalletPay ? (
				<Button
					className="mt-5 w-full"
					disabled={busy}
					onClick={() => void onPayWallet()}
				>
					{busy ? t("bookingPaying") : t("bookingPayWallet")}
				</Button>
			) : null}

			{canCancel ? (
				<Button
					variant="outline"
					className="mt-3 w-full text-destructive"
					disabled={busy}
					onClick={onCancel}
				>
					{busy ? t("bookingCancelling") : t("bookingCancel")}
				</Button>
			) : null}

			{canReview ? (
				<>
					{!showReview ? (
						<Button
							variant="secondary"
							className="mt-3 w-full"
							onClick={() => setShowReview(true)}
						>
							{t("bookingAddReview")}
						</Button>
					) : (
						<div className="mt-3 space-y-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
							<Label htmlFor="rating">{t("bookingRating")}</Label>
							<Input
								id="rating"
								type="number"
								min={1}
								max={5}
								value={rating}
								onChange={(e) => setRating(Number(e.target.value) || 5)}
							/>
							<Label htmlFor="comment">{t("bookingComment")}</Label>
							<Textarea
								id="comment"
								rows={3}
								value={comment}
								onChange={(e) => setComment(e.target.value)}
							/>
							<div className="flex gap-2">
					<Button disabled={busy} onClick={() => void onReview()}>
									{t("bookingSubmitReview")}
								</Button>
								<Button variant="ghost" onClick={() => setShowReview(false)}>
									{t("commonCancel")}
								</Button>
							</div>
						</div>
					)}
				</>
			) : null}

			{hasReview ? (
				<p className="mt-3 text-center text-xs text-muted-foreground">
					{t("bookingAlreadyReviewed")}
				</p>
			) : null}

			{booking.providerId ? (
				<Button
					variant="secondary"
					className="mt-3 w-full"
					onClick={() =>
						router.push(`/service/inbox/${booking.providerId}`)
					}
				>
					{t("bookingMessageProvider")}
				</Button>
			) : null}
		</div>
	);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{label}</p>
			<div className="mt-0.5 text-sm font-medium whitespace-pre-wrap">{value}</div>
		</div>
	);
}
