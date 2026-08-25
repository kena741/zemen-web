"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

import { StatusBadge } from "@/components/provider/status-badge";
import {
	customerDisplayName,
	formatAmount,
	formatDateTime,
	type Booking,
} from "@/services/bookings/types";
import { cn } from "@/lib/utils";

/** Flutter-style 2-column booking grid card. */
export function BookingGridCard({
	booking,
	className,
}: {
	booking: Booking;
	className?: string;
}) {
	const [imgFailed, setImgFailed] = useState(false);
	const image = booking.service?.serviceImage?.[0];
	const title =
		booking.service?.serviceName?.trim() ||
		`Booking #${booking.id.slice(0, 8)}`;

	return (
		<Link
			href={`/provider/bookings/${booking.id}`}
			className={cn(
				"flex h-full flex-col overflow-hidden rounded-[14px] bg-white active:scale-[0.99]",
				className,
			)}
		>
			<div className="relative aspect-[5/4] w-full bg-muted">
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
						<ImageIcon className="size-8 opacity-35" />
					</div>
				)}
			</div>
			<div className="flex flex-1 flex-col gap-1 px-2.5 pt-2 pb-2.5">
				<p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
					{title}
				</p>
				<p className="truncate text-[11px] text-[#7C7C7C]">
					{customerDisplayName(booking)}
				</p>
				<div className="mt-auto flex items-center justify-between gap-1 pt-1">
					<p className="text-[12px] font-semibold tabular-nums text-primary">
						{formatAmount(booking.totalAmount ?? booking.subTotal)}
					</p>
					<StatusBadge
						status={booking.status}
						className="rounded-full px-1.5 py-0 text-[10px]"
					/>
				</div>
				<p className="text-[10px] text-[#7C7C7C]">
					{formatDateTime(booking.bookingDate ?? booking.startTime)}
				</p>
			</div>
		</Link>
	);
}

/** Horizontal upcoming card used on Flutter home. */
export function UpcomingBookingCard({ booking }: { booking: Booking }) {
	const [imgFailed, setImgFailed] = useState(false);
	const image = booking.service?.serviceImage?.[0];
	const title =
		booking.service?.serviceName?.trim() ||
		`Booking #${booking.id.slice(0, 8)}`;

	return (
		<Link
			href={`/provider/bookings/${booking.id}`}
			className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-xl bg-white sm:w-[320px]"
		>
			<div className="relative h-[160px] w-full bg-muted sm:h-[180px]">
				{image && !imgFailed ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={image}
						alt=""
						className="size-full rounded-t-[10px] object-cover"
						onError={() => setImgFailed(true)}
					/>
				) : (
					<div className="flex size-full items-center justify-center rounded-t-[10px] text-muted-foreground">
						<ImageIcon className="size-10 opacity-35" />
					</div>
				)}
			</div>
			<div className="flex h-20 flex-col justify-center gap-1 rounded-b-xl bg-white px-2">
				<p className="line-clamp-1 text-base font-semibold">{title}</p>
				<div className="flex items-center justify-between gap-2">
					<p className="text-sm font-semibold tabular-nums text-primary">
						{formatAmount(booking.totalAmount ?? booking.subTotal)}
					</p>
					<StatusBadge status={booking.status} className="text-[11px]" />
				</div>
			</div>
		</Link>
	);
}
