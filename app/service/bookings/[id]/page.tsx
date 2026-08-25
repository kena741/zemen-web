"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { StatusBadge } from "@/components/provider/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServiceLoading } from "@/components/service/service-loading";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
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

	useEffect(() => {
		if (!booking?.id) return;
		void fetchOfferByBookingId(booking.id).then((res) => setOffer(res.offer));
		void fetchReviewForBooking(booking.id).then((res) =>
			setHasReview(Boolean(res.review)),
		);
	}, [booking?.id]);

	async function onCancel() {
		if (!booking || busy) return;
		if (!window.confirm("Cancel this pending booking?")) return;
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
				`Pay ${formatAmount(amount)} from your wallet for this booking?`,
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
				<ProfileBackLink href="/service/bookings" label="Bookings" />
				<p className="text-sm text-destructive">
					{error || "Booking not found"}
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
	const address =
		booking.bookingAddress?.address ||
		booking.bookingAddress?.locality ||
		null;

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<div className="flex items-center justify-between gap-2">
				<ProfileBackLink href="/service/bookings" label="Bookings" />
				<button
					type="button"
					onClick={refresh}
					className="mb-3 text-xs font-medium text-primary"
				>
					Refresh
				</button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<h1 className="admin-page-title">
					{booking.service?.serviceName || "Booking"}
				</h1>
				<StatusBadge status={booking.status} />
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
					Custom price offer ·{" "}
					<span className="capitalize font-medium">{offer.status}</span>
					{offer.offeredPrice != null
						? ` · ${formatAmount(offer.offeredPrice)}`
						: ""}
				</p>
			) : null}

			<div className="mt-5 space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
				<Row
					label="When"
					value={formatDateTime(booking.bookingDate ?? booking.startTime)}
				/>
				<Row
					label="Amount"
					value={formatAmount(booking.totalAmount ?? booking.subTotal)}
				/>
				<Row
					label="Payment"
					value={
						booking.paymentCompleted
							? `${booking.paymentType || "paid"} · paid`
							: booking.paymentType || "unpaid"
					}
				/>
				{address ? <Row label="Address" value={address} /> : null}
				{booking.description ? (
					<Row label="Notes" value={booking.description} />
				) : null}
				{booking.otp &&
				["accepted", "ongoing", "inprogress", "driving", "on_the_way"].includes(
					status,
				) ? (
					<div className="rounded-lg bg-primary/10 px-3 py-3">
						<p className="text-xs font-medium text-primary">Start OTP</p>
						<p className="mt-1 text-2xl font-bold tracking-[0.3em] text-primary">
							{booking.otp}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Share with the provider when they arrive
						</p>
					</div>
				) : null}
				{booking.reason ? (
					<Row label="Reason" value={booking.reason} />
				) : null}
			</div>

			{showWalletPay ? (
				<Button
					className="mt-5 w-full"
					disabled={busy}
					onClick={() => void onPayWallet()}
				>
					{busy ? "Paying…" : "Pay with wallet"}
				</Button>
			) : null}

			{canCancel ? (
				<Button
					variant="outline"
					className="mt-3 w-full text-destructive"
					disabled={busy}
					onClick={onCancel}
				>
					{busy ? "Cancelling…" : "Cancel booking"}
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
							Add review
						</Button>
					) : (
						<div className="mt-3 space-y-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
							<Label htmlFor="rating">Rating (1–5)</Label>
							<Input
								id="rating"
								type="number"
								min={1}
								max={5}
								value={rating}
								onChange={(e) => setRating(Number(e.target.value) || 5)}
							/>
							<Label htmlFor="comment">Comment</Label>
							<Textarea
								id="comment"
								rows={3}
								value={comment}
								onChange={(e) => setComment(e.target.value)}
							/>
							<div className="flex gap-2">
								<Button disabled={busy} onClick={() => void onReview()}>
									Submit review
								</Button>
								<Button variant="ghost" onClick={() => setShowReview(false)}>
									Cancel
								</Button>
							</div>
						</div>
					)}
				</>
			) : null}

			{hasReview ? (
				<p className="mt-3 text-center text-xs text-muted-foreground">
					You already reviewed this booking.
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
					Message provider
				</Button>
			) : null}
		</div>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-0.5 text-sm font-medium whitespace-pre-wrap">{value}</p>
		</div>
	);
}
