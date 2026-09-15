"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	ImageIcon,
	MapPinIcon,
	MessageSquareIcon,
	ShieldCheckIcon,
} from "lucide-react";

import { RecurringBadge } from "@/components/recurring/recurring-badge";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import {
	BookingOtpChip,
	shouldShowCustomerBookingOtp,
} from "@/components/service/booking-otp-chip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServiceLoading } from "@/components/service/service-loading";
import {
	bookingListStatusClass,
	formatBookingStatus,
} from "@/lib/booking-status";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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
	completeCustomerBooking,
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

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-2">
			<h2 className="text-[16px] font-bold text-foreground">{title}</h2>
			<div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
				{children}
			</div>
		</section>
	);
}

function MoneyRow({
	label,
	value,
	strong,
}: {
	label: string;
	value: string;
	strong?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-3 px-3.5 py-3",
				strong && "border-t border-border/70",
			)}
		>
			<p
				className={cn(
					"text-[14px]",
					strong ? "font-bold text-foreground" : "font-medium text-muted-foreground",
				)}
			>
				{label}
			</p>
			<p
				className={cn(
					"tabular-nums",
					strong ? "text-[16px] font-bold" : "text-[14px] font-semibold",
				)}
			>
				{value}
			</p>
		</div>
	);
}

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
	const [showCancel, setShowCancel] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [proofOpen, setProofOpen] = useState(false);

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
		setBusy(true);
		setActionError(null);
		const res = await cancelCustomerBooking(booking.id, cancelReason);
		setBusy(false);
		if (!res.ok) {
			setActionError(res.error);
			return;
		}
		setShowCancel(false);
		dispatch(invalidateBookings());
		refresh();
	}

	async function onComplete() {
		if (!booking || busy) return;
		if (!window.confirm(t("bookingCompleteConfirm"))) return;
		setBusy(true);
		setActionError(null);
		const res = await completeCustomerBooking(booking.id);
		setBusy(false);
		if (!res.ok) {
			setActionError(res.error);
			return;
		}
		dispatch(invalidateBookings());
		router.replace("/service/bookings");
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
			customerName:
				user.customer?.fullName ||
				user.name ||
				[booking.firstName, booking.lastName].filter(Boolean).join(" ") ||
				null,
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
	const offerStatus = (offer?.status ?? "").toLowerCase();
	const isAwaitingCustomPricePayment =
		!booking.paymentCompleted && offerStatus === "accepted";
	const isAwaitingOfferApproval =
		!booking.paymentCompleted && offerStatus === "pending";
	const canCancel =
		(status === "pending" || status === "accepted") &&
		!isAwaitingCustomPricePayment;
	const canComplete =
		status === "pending_approval" || status === "pending_extra_payment";
	const showWalletPay =
		isAwaitingCustomPricePayment || status === "pending_extra_payment";
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
	const image = booking.service?.serviceImage?.[0] ?? null;
	const detailTitle = showNextCyclePay
		? t("bookingPayNow")
		: isAwaitingCustomPricePayment
			? t("bookingAwaitingPayment")
			: formatBookingStatus(booking.status);
	const showOtp = shouldShowCustomerBookingOtp(booking.otp, booking.status);
	const proof = booking.serviceProof;
	const hasProof =
		Boolean(proof?.title?.trim()) ||
		Boolean(proof?.description?.trim()) ||
		Boolean(proof?.image?.length);
	const qty = Number(booking.quantity) || 1;
	const unitPrice = Number(booking.service?.price ?? 0) || 0;
	const priceLine =
		unitPrice > 0
			? `${formatAmount(unitPrice)}${qty > 1 ? ` × ${qty}` : ""}`
			: formatAmount(booking.subTotal ?? booking.totalAmount);
	const extraAmount =
		booking.extraChargeAmount ?? booking.extraCharge?.extraCharge ?? null;

	const primaryActions =
		showNextCyclePay ||
		isAwaitingCustomPricePayment ||
		canComplete ||
		showWalletPay ||
		canReview ||
		canCancel;

	return (
		<div className="mx-auto flex min-h-[min(100dvh,56rem)] max-w-lg flex-col px-4 pt-4 md:px-6 md:pt-8">
			<div className="mb-3 flex items-center gap-2">
				<ProfileBackLink
					href="/service/bookings"
					label={detailTitle}
					className={cn(
						"min-w-0 flex-1 font-semibold",
						showNextCyclePay || isAwaitingCustomPricePayment
							? "text-[#CC5A02]"
							: bookingListStatusClass(booking.status),
					)}
				/>
				{offer ? (
					<span className="shrink-0 rounded-full bg-[#CC5A02]/15 px-2.5 py-1 text-[11px] font-bold text-[#CC5A02]">
						{t("bookingOfferBadge")}
					</span>
				) : null}
			</div>

			{actionError || error ? (
				<Alert variant="destructive" className="mb-3">
					<AlertDescription>{actionError || error}</AlertDescription>
				</Alert>
			) : null}

			<div className="flex-1 space-y-5 pb-28">
				<div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
					<div className="relative aspect-video w-full bg-muted">
						{image ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={image} alt="" className="size-full object-cover" />
						) : (
							<div className="flex size-full items-center justify-center text-muted-foreground">
								<ImageIcon className="size-10 opacity-35" />
							</div>
						)}
						{isRecurring ? (
							<div className="absolute top-2.5 left-2.5">
								<RecurringBadge
									interval={booking.service?.billingInterval}
									count={booking.service?.billingIntervalCount}
								/>
							</div>
						) : null}
					</div>
					<div className="space-y-2.5 px-3.5 py-3.5">
						<div className="flex items-start gap-2">
							<h1 className="min-w-0 flex-1 text-lg font-bold leading-snug text-balance">
								{booking.service?.serviceName || t("bookingTitle")}
							</h1>
							{isRecurring && daysLeft != null ? (
								<span className="shrink-0 pt-0.5 text-sm font-extrabold text-[#F59E0B]">
									{daysLeft < 0
										? t("bookingCycleEnded")
										: t("bookingDaysLeft", { days: String(daysLeft) })}
								</span>
							) : null}
						</div>
						{showOtp && booking.otp ? <BookingOtpChip otp={booking.otp} /> : null}
						{address ? (
							<div className="flex items-start gap-1.5">
								<MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" />
								<p className="min-w-0 text-sm font-semibold leading-snug wrap-break-word">
									{address}
								</p>
							</div>
						) : null}
					</div>
				</div>

				{status === "rejected" || status === "cancelled" || status === "canceled" ? (
					<section className="space-y-2">
						<h2 className="text-[16px] font-bold">{t("bookingReason")}</h2>
						<p className="rounded-xl bg-destructive/10 px-3.5 py-3 text-sm font-semibold wrap-break-word text-destructive">
							{booking.reason?.trim() || t("bookingNoReason")}
						</p>
					</section>
				) : null}

				{isAwaitingOfferApproval ? (
					<p className="rounded-xl bg-[#CC5A02]/12 px-3.5 py-3 text-[14px] font-medium text-[#9A3412]">
						{t("bookingCustomPriceWaitBanner")}
					</p>
				) : null}
				{isAwaitingCustomPricePayment ? (
					<p className="rounded-xl bg-[#CC5A02]/12 px-3.5 py-3 text-[14px] font-medium text-[#9A3412]">
						{t("bookingCustomPricePayBanner")}
					</p>
				) : null}
				{showNextCyclePay ? (
					<p className="rounded-xl bg-[#CC5A02]/12 px-3.5 py-3 text-[14px] font-medium text-[#9A3412]">
						{t("bookingNextCycleBanner", { period: periodNoun })}
					</p>
				) : null}

				<Section title={t("requestDescription")}>
					<p className="px-3.5 py-3 text-[14px] font-medium leading-relaxed wrap-break-word whitespace-pre-wrap">
						{booking.description?.trim() || t("bookingNoDescription")}
					</p>
					<div className="border-t border-border/60 px-3.5 py-3 text-[13px] text-muted-foreground">
						{t("bookingWhen")}:{" "}
						<span className="font-semibold text-foreground">
							{formatDateTime(booking.bookingDate ?? booking.startTime)}
						</span>
					</div>
				</Section>

				<Section title={t("bookingPaymentDetail")}>
					<MoneyRow label={t("bookServicePriceLine")} value={priceLine} />
					{booking.subTotal ? (
						<MoneyRow
							label={t("bookingSubTotal")}
							value={formatAmount(booking.subTotal)}
						/>
					) : null}
					<MoneyRow
						label={t("bookingTotalAmount")}
						value={formatAmount(booking.totalAmount ?? booking.subTotal)}
						strong
					/>
					<div className="border-t border-border/60 px-3.5 py-3 text-[13px]">
						<span className="text-muted-foreground">{t("bookingPayment")}: </span>
						<span className="font-semibold">
							{booking.paymentCompleted
								? t("bookingPaidWith", {
										type: booking.paymentType || t("commonPaid"),
									})
								: booking.paymentType || t("commonUnpaid")}
						</span>
					</div>
				</Section>

				{extraAmount ? (
					<Section title={t("bookingExtraCharges")}>
						{booking.extraCharge?.chargeDetail ? (
							<p className="border-b border-border/60 px-3.5 py-3 text-[14px] font-medium">
								{booking.extraCharge.chargeDetail}
							</p>
						) : null}
						<MoneyRow
							label={t("bookingTotalExtra")}
							value={formatAmount(extraAmount)}
						/>
						<MoneyRow
							label={t("bookingTotalCost")}
							value={formatAmount(booking.totalAmount ?? extraAmount)}
							strong
						/>
					</Section>
				) : null}

				{hasProof ? (
					<section className="space-y-2">
						<h2 className="text-[16px] font-bold">{t("bookingServiceProof")}</h2>
						{status === "pending_approval" ? (
							<button
								type="button"
								onClick={() => setProofOpen(true)}
								className="w-full rounded-xl bg-white p-3.5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-muted/40"
							>
								<div className="flex items-start gap-3">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
										<ShieldCheckIcon className="size-5" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-[15px] font-bold">
											{t("bookingServiceProofSubmitted")}
										</p>
										{proof?.title ? (
											<p className="mt-0.5 truncate text-[13px] text-muted-foreground">
												{proof.title}
											</p>
										) : null}
										{proof?.image?.length ? (
											<div className="mt-2 flex gap-1.5">
												{proof.image.slice(0, 4).map((url) => (
													// eslint-disable-next-line @next/next/no-img-element
													<img
														key={url}
														src={url}
														alt=""
														className="size-12 rounded-md object-cover"
													/>
												))}
											</div>
										) : null}
										<p className="mt-2 text-[13px] font-semibold text-primary">
											{t("bookingViewServiceProof")}
										</p>
									</div>
								</div>
							</button>
						) : (
							<div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
								{proof?.image?.length ? (
									<div className="flex gap-2 overflow-x-auto p-3">
										{proof.image.map((url) => (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												key={url}
												src={url}
												alt=""
												className="h-24 w-32 shrink-0 rounded-lg object-cover"
											/>
										))}
									</div>
								) : null}
								{proof?.title ? (
									<p className="px-3.5 pt-2 text-[15px] font-bold">{proof.title}</p>
								) : null}
								{proof?.description ? (
									<p className="line-clamp-3 px-3.5 pt-1 pb-3 text-[13px] text-muted-foreground">
										{proof.description}
									</p>
								) : null}
							</div>
						)}
					</section>
				) : null}

				{booking.handymanId ? (
					<Section title={t("bookingAboutHandyman")}>
						<div className="flex items-center justify-between gap-3 px-3.5 py-3">
							<p className="text-[14px] font-medium text-muted-foreground">
								{t("bookingHandyman")}
							</p>
							<Link
								href={`/service/bookings/${booking.id}/handyman`}
								className="text-[14px] font-semibold text-primary underline-offset-2 hover:underline"
							>
								{t("bookingViewHandyman")}
							</Link>
						</div>
					</Section>
				) : null}

				{booking.providerId ? (
					<Section title={t("bookingAboutProvider")}>
						<button
							type="button"
							onClick={() => router.push(`/service/inbox/${booking.providerId}`)}
							className="flex w-full items-center justify-between gap-3 px-3.5 py-3.5 text-left transition-colors hover:bg-muted/40"
						>
							<span className="text-[14px] font-semibold">
								{t("bookingMessageProvider")}
							</span>
							<MessageSquareIcon className="size-5 text-primary" />
						</button>
					</Section>
				) : null}

				{booking.currentPeriodEnd ? (
					<p className="text-center text-[13px] text-muted-foreground">
						{t("bookingPeriodEnds")}: {formatDateTime(booking.currentPeriodEnd)}
					</p>
				) : null}

				{showNextCyclePay && showNextCycleConfirm ? (
					<div className="space-y-2 rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
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
				) : null}

				{canReview && showReview ? (
					<div className="space-y-2 rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
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
				) : null}

				{hasReview ? (
					<p className="text-center text-xs text-muted-foreground">
						{t("bookingAlreadyReviewed")}
					</p>
				) : null}

				{showCancel ? (
					<div className="space-y-3 rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
						<p className="text-[15px] font-bold">{t("bookingCancelReasonTitle")}</p>
						<Textarea
							rows={3}
							placeholder={t("bookingCancelReasonHint")}
							value={cancelReason}
							onChange={(e) => setCancelReason(e.target.value)}
						/>
						<div className="flex gap-2">
							<Button
								variant="destructive"
								className="flex-1"
								disabled={busy}
								onClick={() => void onCancel()}
							>
								{busy ? t("bookingCancelling") : t("bookingCancelConfirmAction")}
							</Button>
							<Button
								variant="ghost"
								className="flex-1"
								disabled={busy}
								onClick={() => setShowCancel(false)}
							>
								{t("commonCancel")}
							</Button>
						</div>
					</div>
				) : null}
			</div>

			<div className="sticky bottom-0 -mx-4 mt-auto space-y-2 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
				{showNextCyclePay && !showNextCycleConfirm ? (
					<Button
						className="w-full"
						disabled={busy}
						onClick={() => setShowNextCycleConfirm(true)}
					>
						{t("bookingPayNow")} · {formatAmount(nextCycleAmount)}
					</Button>
				) : null}

				{isAwaitingCustomPricePayment ? (
					<Button className="w-full" disabled={busy} onClick={() => void onPayWallet()}>
						{busy ? t("bookingPaying") : t("bookingPayNow")}
					</Button>
				) : null}

				{status === "pending_extra_payment" && !isAwaitingCustomPricePayment ? (
					<>
						{extraAmount ? (
							<Button
								className="w-full"
								disabled={busy}
								onClick={() => void onPayWallet()}
							>
								{busy
									? t("bookingPaying")
									: t("bookingPayExtra", { amount: formatAmount(extraAmount) })}
							</Button>
						) : null}
						<Button
							variant="outline"
							className="w-full"
							disabled={busy}
							onClick={() => void onComplete()}
						>
							{busy ? t("bookingCompleting") : t("bookingCompleteWithoutExtra")}
						</Button>
					</>
				) : null}

				{status === "pending_approval" ? (
					<>
						{hasProof ? (
							<Button
								variant="outline"
								className="w-full"
								onClick={() => setProofOpen(true)}
							>
								{t("bookingViewServiceProof")}
							</Button>
						) : null}
						<Button
							className="w-full"
							disabled={busy}
							onClick={() => void onComplete()}
						>
							{busy ? t("bookingCompleting") : t("bookingComplete")}
						</Button>
					</>
				) : null}

				{canReview && !showReview ? (
					<Button
						variant="outline"
						className="w-full border-primary/30 text-primary"
						onClick={() => setShowReview(true)}
					>
						{t("bookingAddReview")}
					</Button>
				) : null}

				{canCancel && !showCancel && !showNextCyclePay && !isAwaitingCustomPricePayment ? (
					<Button
						variant="outline"
						className={cn(
							"w-full",
							booking.paymentCompleted
								? "border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90"
								: "border-destructive/30 text-destructive hover:bg-destructive/5",
						)}
						disabled={busy}
						onClick={() => setShowCancel(true)}
					>
						{t("bookingCancel")}
					</Button>
				) : null}

				{!primaryActions ? (
					<div
						className={cn(
							"rounded-xl px-4 py-3 text-center text-[14px] font-bold",
							"bg-muted/80",
							bookingListStatusClass(booking.status),
						)}
					>
						{detailTitle}
					</div>
				) : null}
			</div>

			{proofOpen && hasProof ? (
				<div
					className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
					onClick={() => setProofOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Escape") setProofOpen(false);
					}}
					role="presentation"
				>
					<div
						className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-4 shadow-xl"
						onClick={(e) => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-label={t("bookingServiceProof")}
					>
						<p className="text-[17px] font-bold">{t("bookingServiceProof")}</p>
						{proof?.title ? (
							<p className="mt-2 text-[15px] font-semibold">{proof.title}</p>
						) : null}
						{proof?.description ? (
							<p className="mt-1 text-[14px] text-muted-foreground whitespace-pre-wrap">
								{proof.description}
							</p>
						) : null}
						{proof?.image?.length ? (
							<div className="mt-3 grid grid-cols-2 gap-2">
								{proof.image.map((url) => (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										key={url}
										src={url}
										alt=""
										className="aspect-square w-full rounded-lg object-cover"
									/>
								))}
							</div>
						) : null}
						<Button className="mt-4 w-full" onClick={() => setProofOpen(false)}>
							{t("commonClose")}
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
