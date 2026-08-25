"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { StatusBadge } from "@/components/provider/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppLoading } from "@/components/ui/app-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BOOKING_STATUS } from "@/lib/booking-status";
import { updateBookingStatus } from "@/services/bookings/bookingsApi";
import {
	customerDisplayName,
	formatAmount,
	formatDateTime,
} from "@/services/bookings/types";
import { useAppDispatch } from "@/store/hooks";
import {
	invalidateProviderBookings,
} from "@/store/providerCacheSlice";
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
	const params = useParams<{ id: string }>();
	const id = params?.id ?? "";
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const { booking, loading, error: loadError, refresh } =
		useCachedProviderBookingDetail(id);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [rejectReason, setRejectReason] = useState("");
	const [showReject, setShowReject] = useState(false);
	const [otpInput, setOtpInput] = useState("");
	const [showOtp, setShowOtp] = useState(false);

	useEffect(() => {
		if (!booking || !user?.provider?.id) return;
		if (
			booking.providerId &&
			booking.providerId !== user.provider.id
		) {
			setError("This booking does not belong to your account.");
		}
	}, [booking, user?.provider?.id]);

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
		dispatch(invalidateProviderBookings());
		refresh();
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
			setError("Incorrect OTP. Ask the customer for the booking code.");
			return;
		}
		void setStatus(BOOKING_STATUS.inProgress);
	}

	const status = booking?.status;
	const address =
		booking?.bookingAddress?.address ||
		booking?.bookingAddress?.locality ||
		null;

	return (
		<div className="mx-auto max-w-2xl">
			<Button
				variant="ghost"
				size="sm"
				className="-ml-2 mb-3 gap-1.5"
				onClick={() => router.push("/provider/bookings")}
			>
				<ArrowLeftIcon className="size-4" />
				Bookings
			</Button>

			{loading ? (
				<AppLoading compact />
			) : !booking ? (
				<p className="text-sm text-destructive">
					{error || loadError || "Booking not found"}
				</p>
			) : (
				<>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p className="admin-eyebrow">Booking</p>
							<h1 className="admin-page-title mt-1">
								{booking.service?.serviceName ?? "Service booking"}
							</h1>
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
						<DetailRow label="Customer" value={customerDisplayName(booking)} />
						<DetailRow label="Phone" value={booking.phoneNumber} />
						<DetailRow
							label="Scheduled"
							value={formatDateTime(booking.bookingDate ?? booking.startTime)}
						/>
						<DetailRow label="Address" value={address} />
						<DetailRow
							label="Amount"
							value={formatAmount(booking.totalAmount ?? booking.subTotal)}
						/>
						<DetailRow label="Payment" value={booking.paymentType} />
						<DetailRow
							label="Paid"
							value={booking.paymentCompleted ? "Yes" : "No"}
						/>
						{booking.description ? (
							<DetailRow label="Notes" value={booking.description} />
						) : null}
						{booking.reason ? (
							<DetailRow label="Reason" value={booking.reason} />
						) : null}
					</dl>

					{booking.serviceId ? (
						<p className="mt-3 text-sm">
							<Link
								href={`/provider/services/${booking.serviceId}`}
								className="text-brand-ink underline-offset-4 hover:underline"
							>
								View service
							</Link>
						</p>
					) : null}

					<div className="mt-6 flex flex-col gap-2">
						{status === BOOKING_STATUS.pending ? (
							<>
								<Button
									disabled={busy}
									onClick={() => void setStatus(BOOKING_STATUS.accepted)}
								>
									Accept booking
								</Button>
								{!showReject ? (
									<Button
										variant="outline"
										disabled={busy}
										onClick={() => setShowReject(true)}
									>
										Reject
									</Button>
								) : (
									<div className="space-y-2 rounded-xl border border-border bg-white p-4">
										<Label htmlFor="reject-reason">Reason (optional)</Label>
										<Input
											id="reject-reason"
											value={rejectReason}
											onChange={(e) => setRejectReason(e.target.value)}
											placeholder="Why are you declining?"
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
												Confirm reject
											</Button>
											<Button
												variant="ghost"
												onClick={() => setShowReject(false)}
											>
												Cancel
											</Button>
										</div>
									</div>
								)}
							</>
						) : null}

						{status === BOOKING_STATUS.accepted ? (
							<Button
								disabled={busy}
								onClick={() => void setStatus(BOOKING_STATUS.onTheWay)}
							>
								Start drive
							</Button>
						) : null}

						{status === BOOKING_STATUS.onTheWay ? (
							<>
								{!showOtp ? (
									<Button disabled={busy} onClick={handleStartService}>
										Start service
									</Button>
								) : (
									<div className="space-y-2 rounded-xl border border-border bg-white p-4">
										<Label htmlFor="otp">Customer OTP</Label>
										<Input
											id="otp"
											value={otpInput}
											onChange={(e) => setOtpInput(e.target.value)}
											placeholder="Enter booking OTP"
											inputMode="numeric"
										/>
										<div className="flex gap-2">
											<Button disabled={busy} onClick={confirmOtp}>
												Confirm & start
											</Button>
											<Button
												variant="ghost"
												onClick={() => setShowOtp(false)}
											>
												Cancel
											</Button>
										</div>
									</div>
								)}
							</>
						) : null}

						{status === BOOKING_STATUS.inProgress ||
						status === BOOKING_STATUS.hold ? (
							<Button
								disabled={busy}
								onClick={() => void setStatus(BOOKING_STATUS.completed)}
							>
								Mark completed
							</Button>
						) : null}
					</div>
				</>
			)}
		</div>
	);
}
