"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, MessageSquareIcon } from "lucide-react";

import { StatusBadge } from "@/components/provider/status-badge";
import { RecurringBadge } from "@/components/recurring/recurring-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BOOKING_STATUS } from "@/lib/booking-status";
import {
	calendarDaysUntil,
	isRecurringPricingType,
} from "@/lib/recurring";
import {
	saveBookingExtraCharge,
	saveBookingServiceProof,
	updateBookingStatus,
	uploadProofImages,
} from "@/services/bookings/bookingsApi";
import {
	customerDisplayName,
	formatAmount,
	formatDateTime,
} from "@/services/bookings/types";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderBookings } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderBookingDetail } from "@/store/useProviderCache";

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

export default function BookingDetailPage() {
	const { t } = useLocale();
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const authUserId = user?.id ?? "";
	const { booking, loading, error: loadError, refresh } =
		useCachedProviderBookingDetail(id);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [rejectReason, setRejectReason] = useState("");
	const [showReject, setShowReject] = useState(false);
	const [otpInput, setOtpInput] = useState("");
	const [showOtp, setShowOtp] = useState(false);
	const [showHold, setShowHold] = useState(false);
	const [holdReason, setHoldReason] = useState("");
	const [showExtra, setShowExtra] = useState(false);
	const [extraDetail, setExtraDetail] = useState("");
	const [extraAmount, setExtraAmount] = useState("");
	const [showProof, setShowProof] = useState(false);
	const [proofTitle, setProofTitle] = useState("");
	const [proofDesc, setProofDesc] = useState("");
	const [proofFiles, setProofFiles] = useState<FileList | null>(null);

	useEffect(() => {
		if (!booking || !user?.provider?.id) return;
		if (booking.providerId && booking.providerId !== user.provider.id) {
			setError(t("providerBookingNotOwned"));
		}
	}, [booking, user?.provider?.id]);

	useEffect(() => {
		if (!booking) return;
		setExtraDetail(booking.extraCharge?.chargeDetail ?? "");
		setExtraAmount(booking.extraCharge?.extraCharge ?? "");
		setProofTitle(booking.serviceProof?.title ?? "");
		setProofDesc(booking.serviceProof?.description ?? "");
	}, [booking]);

	async function afterUpdate() {
		dispatch(invalidateProviderBookings());
		refresh();
	}

	async function setStatus(status: string, reason?: string | null) {
		if (!booking) return;
		setBusy(true);
		setError(null);
		const res = await updateBookingStatus({
			bookingId: booking.id,
			status,
			reason: reason ?? null,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		setShowReject(false);
		setShowOtp(false);
		setShowHold(false);
		await afterUpdate();
	}

	function handleStartService() {
		if (booking?.otp) {
			setShowOtp(true);
			return;
		}
		void setStatus(BOOKING_STATUS.inProgress);
	}

	function confirmOtp() {
		if (!booking?.otp) {
			void setStatus(BOOKING_STATUS.inProgress);
			return;
		}
		if (otpInput.trim() !== booking.otp.trim()) {
			setError(t("providerIncorrectOtp"));
			return;
		}
		void setStatus(BOOKING_STATUS.inProgress);
	}

	async function finishWork() {
		if (!booking) return;
		const extra = Number(booking.extraChargeAmount ?? booking.extraCharge?.extraCharge ?? 0);
		const next =
			!Number.isNaN(extra) && extra >= 1
				? BOOKING_STATUS.pendingExtraPayment
				: BOOKING_STATUS.pendingApproval;
		await setStatus(next);
	}

	async function saveExtra() {
		if (!booking) return;
		setBusy(true);
		setError(null);
		const res = await saveBookingExtraCharge({
			bookingId: booking.id,
			detail: extraDetail,
			amount: extraAmount,
			existingId: booking.extraCharge?.id,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		setShowExtra(false);
		await afterUpdate();
	}

	async function saveProof() {
		if (!booking) return;
		setBusy(true);
		setError(null);
		let imageUrls = booking.serviceProof?.image ?? [];
		if (proofFiles && proofFiles.length) {
			const upload = await uploadProofImages({
				authUserId,
				files: Array.from(proofFiles).slice(0, 5),
			});
			if (upload.error) {
				setBusy(false);
				setError(upload.error);
				return;
			}
			imageUrls = [...imageUrls, ...upload.urls].slice(0, 5);
		}
		const res = await saveBookingServiceProof({
			bookingId: booking.id,
			title: proofTitle,
			description: proofDesc,
			imageUrls,
			existingId: booking.serviceProof?.id,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		setShowProof(false);
		setProofFiles(null);
		await afterUpdate();
	}

	const status = booking?.status;
	const address =
		booking?.bookingAddress?.address ||
		booking?.bookingAddress?.locality ||
		null;
	const canManageWork =
		status === BOOKING_STATUS.inProgress || status === BOOKING_STATUS.hold;
	const assigneeLabel = booking?.providerMySelf
		? t("providerYourself")
		: booking?.handymanId
			? `${t("handymanTitle")} · ${booking.handymanId.slice(0, 8)}`
			: null;
	const isRecurring =
		isRecurringPricingType(booking?.service?.pricingType ?? null) ||
		Boolean(booking?.nextCycleDue) ||
		Boolean(booking?.currentPeriodEnd);
	const daysLeft = calendarDaysUntil(booking?.currentPeriodEnd);

	return (
		<div className="mx-auto max-w-2xl">
			<Button
				variant="ghost"
				size="sm"
				className="-ml-2 mb-3 gap-1.5"
				onClick={() => router.push("/provider/bookings")}
			>
				<ArrowLeftIcon className="size-4" />
				{t("bookingsTitle")}
			</Button>

			{loading ? (
				<AppLoading compact />
			) : !booking ? (
				<p className="text-sm text-destructive">
					{error || loadError || t("bookingNotFound")}
				</p>
			) : (
				<>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p className="admin-eyebrow">{t("bookingTitle")}</p>
							<div className="mt-1 flex flex-wrap items-center gap-2">
								<h1 className="admin-page-title">
									{booking.service?.serviceName ?? t("providerServiceBooking")}
								</h1>
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
						</div>
						<StatusBadge status={status} className="mt-1" />
					</div>

					{error ? (
						<Alert variant="destructive" className="mt-4">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}

					<dl className="mt-6 rounded-xl border border-border bg-white px-4 shadow-xs">
						<DetailRow label={t("customer")} value={customerDisplayName(booking)} />
						<DetailRow label={t("phone")} value={booking.phoneNumber} />
						{assigneeLabel ? (
							<DetailRow label={t("providerAssignedTo")} value={assigneeLabel} />
						) : null}
						<DetailRow
							label={t("providerScheduled")}
							value={formatDateTime(booking.bookingDate ?? booking.startTime)}
						/>
						<DetailRow label={t("bookingAddress")} value={address} />
						<DetailRow
							label={t("bookingAmount")}
							value={formatAmount(booking.totalAmount ?? booking.subTotal)}
						/>
						{booking.extraChargeAmount || booking.extraCharge?.extraCharge ? (
							<DetailRow
								label={t("providerExtraCharge")}
								value={formatAmount(
									booking.extraChargeAmount ??
										booking.extraCharge?.extraCharge,
								)}
							/>
						) : null}
						<DetailRow label={t("bookingPayment")} value={booking.paymentType} />
						<DetailRow
							label={t("commonPaid")}
							value={booking.paymentCompleted ? t("commonYes") : t("commonNo")}
						/>
						{booking.currentPeriodEnd ? (
							<DetailRow
								label={t("bookingPeriodEnds")}
								value={formatDateTime(booking.currentPeriodEnd)}
							/>
						) : null}
						{isRecurring ? (
							<DetailRow
								label={t("bookingPayNextCycle")}
								value={booking.nextCycleDue ? t("commonYes") : t("commonNo")}
							/>
						) : null}
						{isRecurring && daysLeft != null ? (
							<DetailRow
								label={
									daysLeft < 0
										? t("bookingCycleEnded")
										: t("bookingDaysLeft", { days: String(daysLeft) })
								}
								value=" "
							/>
						) : null}
						{booking.description ? (
							<DetailRow label={t("bookingNotes")} value={booking.description} />
						) : null}
						{booking.reason ? (
							<DetailRow label={t("bookingReason")} value={booking.reason} />
						) : null}
						{booking.serviceProof?.title ? (
							<DetailRow
								label={t("serviceProof")}
								value={booking.serviceProof.title}
							/>
						) : null}
					</dl>

					<div className="mt-3 flex flex-wrap gap-3 text-sm">
						{booking.serviceId ? (
							<Link
								href={`/provider/services/${booking.serviceId}`}
								className="text-brand-ink underline-offset-4 hover:underline"
							>
								{t("providerViewService")}
							</Link>
						) : null}
						{booking.customerId ? (
							<Link
								href={`/provider/inbox/${booking.customerId}`}
								className="inline-flex items-center gap-1 text-brand-ink underline-offset-4 hover:underline"
							>
								<MessageSquareIcon className="size-3.5" />
								{t("providerMessageCustomer")}
							</Link>
						) : null}
					</div>

					{booking.serviceProof?.image?.length ? (
						<div className="mt-4 flex flex-wrap gap-2">
							{booking.serviceProof.image.map((url) => (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									key={url}
									src={url}
									alt={t("providerProofAlt")}
									className="size-20 rounded-lg object-cover ring-1 ring-black/5"
								/>
							))}
						</div>
					) : null}

					<div className="mt-6 flex flex-col gap-2">
						{status === BOOKING_STATUS.pending ? (
							<>
								<Link
									href={`/provider/bookings/${booking.id}/assign`}
									className={cn(buttonVariants(), "justify-center")}
								>
									{t("providerAssignWorker")}
								</Link>
								{!showReject ? (
									<Button
										variant="outline"
										disabled={busy}
										onClick={() => setShowReject(true)}
									>
										{t("commonReject")}
									</Button>
								) : (
									<div className="space-y-2 rounded-xl border border-border bg-white p-4">
										<Label htmlFor="reject-reason">{t("providerRejectReasonOptional")}</Label>
										<Input
											id="reject-reason"
											value={rejectReason}
											onChange={(e) => setRejectReason(e.target.value)}
											placeholder={t("providerRejectPlaceholder")}
										/>
										<div className="flex gap-2">
											<Button
												variant="destructive"
												disabled={busy}
												onClick={() =>
													void setStatus(
														BOOKING_STATUS.rejected,
														rejectReason.trim() || null,
													)
												}
											>
												{t("providerConfirmReject")}
											</Button>
											<Button
												variant="ghost"
												onClick={() => setShowReject(false)}
											>
												{t("commonCancel")}
											</Button>
										</div>
									</div>
								)}
							</>
						) : null}

						{status === BOOKING_STATUS.accepted ? (
							<>
								{!booking.providerMySelf && !booking.handymanId ? (
									<Link
										href={`/provider/bookings/${booking.id}/assign`}
										className={cn(
											buttonVariants({ variant: "outline" }),
											"justify-center",
										)}
									>
										{t("providerAssignWorker")}
									</Link>
								) : null}
								{booking.providerMySelf ? (
									<Button
										disabled={busy}
										onClick={() => void setStatus(BOOKING_STATUS.onTheWay)}
									>
										{t("providerStartDrive")}
									</Button>
								) : (
									<p className="text-sm text-muted-foreground">
										{t("providerHandymanAssignedHint")}
									</p>
								)}
							</>
						) : null}

						{status === BOOKING_STATUS.onTheWay && booking.providerMySelf ? (
							<>
								{!showOtp ? (
									<Button disabled={busy} onClick={handleStartService}>
										{t("providerStartService")}
									</Button>
								) : (
									<div className="space-y-2 rounded-xl border border-border bg-white p-4">
										<Label htmlFor="otp">{t("providerCustomerOtp")}</Label>
										<Input
											id="otp"
											value={otpInput}
											onChange={(e) => setOtpInput(e.target.value)}
											placeholder={t("providerOtpPlaceholder")}
											inputMode="numeric"
										/>
										<div className="flex gap-2">
											<Button disabled={busy} onClick={confirmOtp}>
												{t("providerConfirmStart")}
											</Button>
											<Button
												variant="ghost"
												onClick={() => setShowOtp(false)}
											>
												{t("commonCancel")}
											</Button>
										</div>
									</div>
								)}
							</>
						) : null}

						{canManageWork && booking.providerMySelf ? (
							<>
								{status === BOOKING_STATUS.inProgress ? (
									<>
										{!showHold ? (
											<Button
												variant="outline"
												disabled={busy}
												onClick={() => setShowHold(true)}
											>
												{t("providerPutOnHold")}
											</Button>
										) : (
											<div className="space-y-2 rounded-xl border border-border bg-white p-4">
												<Label htmlFor="hold-reason">{t("providerHoldReason")}</Label>
												<Input
													id="hold-reason"
													value={holdReason}
													onChange={(e) => setHoldReason(e.target.value)}
													placeholder={t("providerHoldPlaceholder")}
												/>
												<div className="flex gap-2">
													<Button
														disabled={busy}
														onClick={() =>
															void setStatus(
																BOOKING_STATUS.hold,
																holdReason.trim() || null,
															)
														}
													>
														{t("providerConfirmHold")}
													</Button>
													<Button
														variant="ghost"
														onClick={() => setShowHold(false)}
													>
														{t("commonCancel")}
													</Button>
												</div>
											</div>
										)}
									</>
								) : null}
								{status === BOOKING_STATUS.hold ? (
									<Button
										disabled={busy}
										onClick={() => void setStatus(BOOKING_STATUS.inProgress)}
									>
										{t("providerContinueWork")}
									</Button>
								) : null}
								<Button disabled={busy} onClick={() => void finishWork()}>
									{t("providerSubmitApproval")}
								</Button>
							</>
						) : null}

						{(canManageWork ||
							status === BOOKING_STATUS.pendingApproval ||
							status === BOOKING_STATUS.accepted ||
							status === BOOKING_STATUS.onTheWay) && (
							<>
								{!showExtra ? (
									<Button
										variant="outline"
										disabled={busy}
										onClick={() => setShowExtra(true)}
									>
										{booking.extraCharge ? t("providerEditExtraCharge") : t("providerAddExtraCharge")}
									</Button>
								) : (
									<div className="space-y-2 rounded-xl border border-border bg-white p-4">
										<Label htmlFor="extra-detail">{t("commonDescription")}</Label>
										<Input
											id="extra-detail"
											value={extraDetail}
											onChange={(e) => setExtraDetail(e.target.value)}
											placeholder={t("providerExtraDetailPlaceholder")}
										/>
										<Label htmlFor="extra-amount">{t("commonAmountEtb")}</Label>
										<Input
											id="extra-amount"
											value={extraAmount}
											onChange={(e) => setExtraAmount(e.target.value)}
											inputMode="decimal"
											placeholder={t("providerMinAmount")}
										/>
										<div className="flex gap-2">
											<Button disabled={busy} onClick={() => void saveExtra()}>
												{t("providerSaveCharge")}
											</Button>
											<Button
												variant="ghost"
												onClick={() => setShowExtra(false)}
											>
												{t("commonCancel")}
											</Button>
										</div>
									</div>
								)}

								{!showProof ? (
									<Button
										variant="outline"
										disabled={busy}
										onClick={() => setShowProof(true)}
									>
										{booking.serviceProof ? t("providerEditServiceProof") : t("providerAddServiceProof")}
									</Button>
								) : (
									<div className="space-y-2 rounded-xl border border-border bg-white p-4">
										<Label htmlFor="proof-title">{t("commonTitle")}</Label>
										<Input
											id="proof-title"
											value={proofTitle}
											onChange={(e) => setProofTitle(e.target.value)}
										/>
										<Label htmlFor="proof-desc">{t("commonDescription")}</Label>
										<textarea
											id="proof-desc"
											value={proofDesc}
											onChange={(e) => setProofDesc(e.target.value)}
											rows={3}
											className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
										/>
										<Label htmlFor="proof-files">{t("providerProofImages")}</Label>
										<Input
											id="proof-files"
											type="file"
											accept="image/*"
											multiple
											onChange={(e) => setProofFiles(e.target.files)}
										/>
										<div className="flex gap-2">
											<Button disabled={busy} onClick={() => void saveProof()}>
												{t("providerSaveProof")}
											</Button>
											<Button
												variant="ghost"
												onClick={() => setShowProof(false)}
											>
												{t("commonCancel")}
											</Button>
										</div>
									</div>
								)}
							</>
						)}
					</div>
				</>
			)}
		</div>
	);
}
