"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { StatusBadge } from "@/components/provider/status-badge";
import { Button } from "@/components/ui/button";
import { ServiceLoading } from "@/components/service/service-loading";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
import { cancelCustomerBooking } from "@/services/customer/bookingsApi";
import { useAppDispatch } from "@/store/hooks";
import { invalidateBookings } from "@/store/customerCacheSlice";
import { useCachedBookingDetail } from "@/store/useCustomerCache";

export default function CustomerBookingDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { booking, loading, error, refresh } = useCachedBookingDetail(params.id);
	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

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

	const canCancel = (booking.status || "").toLowerCase() === "pending";
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
				<p className="mt-3 text-sm text-destructive">
					{actionError || error}
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
				<Row label="Payment" value={booking.paymentType || "cash"} />
				{address ? <Row label="Address" value={address} /> : null}
				{booking.description ? (
					<Row label="Notes" value={booking.description} />
				) : null}
				{booking.otp &&
				["accepted", "ongoing", "inprogress", "driving"].includes(
					(booking.status || "").toLowerCase(),
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

			{canCancel ? (
				<Button
					variant="outline"
					className="mt-5 w-full text-destructive"
					disabled={busy}
					onClick={onCancel}
				>
					{busy ? "Cancelling…" : "Cancel booking"}
				</Button>
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
