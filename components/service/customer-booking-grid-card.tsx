"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

import {
	BookingOtpChip,
	shouldShowCustomerBookingOtp,
} from "@/components/service/booking-otp-chip";
import {
	bookingListStatusClass,
	formatBookingStatus,
} from "@/lib/booking-status";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatAmount, type Booking } from "@/services/bookings/types";

function bookingTitle(booking: Booking): string {
	return (
		booking.service?.serviceName?.trim() ||
		booking.description?.trim() ||
		`Booking #${booking.id.slice(0, 8)}`
	);
}

function bookingAmount(booking: Booking): string {
	return formatAmount(
		booking.service?.price ?? booking.totalAmount ?? booking.subTotal,
	);
}

/** Flutter customer booked-status 2-column grid card. */
export function CustomerBookingGridCard({
	booking,
	statusLabel,
	className,
}: {
	booking: Booking;
	statusLabel?: string;
	className?: string;
}) {
	const [imgFailed, setImgFailed] = useState(false);
	const image = booking.service?.serviceImage?.[0];
	const label = statusLabel ?? formatBookingStatus(booking.status);
	const showOtp = shouldShowCustomerBookingOtp(booking.otp, booking.status);

	return (
		<Link
			href={`/service/bookings/${booking.id}`}
			className={cn(
				"flex h-full flex-col overflow-hidden rounded-xl bg-white active:scale-[0.99]",
				className,
			)}
		>
			<div className="relative aspect-[4/3] w-full bg-muted">
				{image && !imgFailed ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={image}
						alt=""
						className="size-full object-cover"
						onError={() => setImgFailed(true)}
					/>
				) : (
					<div className="flex size-full items-center justify-center text-muted-foreground">
						<ImageIcon className="size-6 opacity-35" />
					</div>
				)}
			</div>
			<div className="flex flex-1 flex-col gap-1 px-2 pt-1.5 pb-2">
				<p className="line-clamp-1 text-[13px] font-bold text-foreground">
					{bookingTitle(booking)}
				</p>
				<div className="mt-auto flex items-end justify-between gap-1">
					<p className="min-w-0 truncate text-[12px] font-semibold tabular-nums text-[#525252]">
						{bookingAmount(booking)}
					</p>
					<p
						className={cn(
							"max-w-[55%] truncate text-right text-[11px] font-bold",
							booking.nextCycleDue
								? "text-[#CC5A02]"
								: bookingListStatusClass(booking.status),
						)}
					>
						{label}
					</p>
				</div>
				{showOtp && booking.otp ? (
					<BookingOtpChip otp={booking.otp} className="mt-0.5" />
				) : null}
			</div>
		</Link>
	);
}
