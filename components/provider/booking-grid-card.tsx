"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageIcon, StarIcon } from "lucide-react";

import {
	bookingListStatusClass,
	formatBookingStatus,
} from "@/lib/booking-status";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
	formatAmount,
	type Booking,
} from "@/services/bookings/types";

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

function serviceRating(booking: Booking): string | null {
	const count = booking.service?.reviewCount ?? 0;
	const sum = booking.service?.reviewSum ?? 0;
	if (count <= 0) return null;
	return (sum / count).toFixed(1);
}

/** Flutter booking screen 2-column grid card. */
export function BookingGridCard({
	booking,
	className,
}: {
	booking: Booking;
	className?: string;
}) {
	const [imgFailed, setImgFailed] = useState(false);
	const { t } = useLocale();
	const image = booking.service?.serviceImage?.[0];
	const statusLabel = booking.nextCycleDue
		? t("providerAwaitingCyclePayment")
		: formatBookingStatus(booking.status);

	return (
		<Link
			href={`/provider/bookings/${booking.id}`}
			className={cn(
				"flex h-full flex-col overflow-hidden rounded-[14px] bg-white active:scale-[0.99]",
				className,
			)}
		>
			<div className="relative aspect-4/3 w-full bg-muted">
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
			<div className="flex flex-1 flex-col gap-0.5 px-2 pt-1.5 pb-2">
				<p className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground">
					{bookingTitle(booking)}
				</p>
				<div className="mt-auto space-y-0.5 pt-0.5">
					<p className="text-[11px] font-semibold tabular-nums text-[#525252]">
						{bookingAmount(booking)}
					</p>
					<p
						className={cn(
							"truncate text-[10px] font-medium",
							booking.nextCycleDue
								? "text-[#CC5A02]"
								: bookingListStatusClass(booking.status),
						)}
					>
						{statusLabel}
					</p>
				</div>
			</div>
		</Link>
	);
}

/** Horizontal upcoming card used on Flutter home. */
export function UpcomingBookingCard({ booking }: { booking: Booking }) {
	const [imgFailed, setImgFailed] = useState(false);
	const image = booking.service?.serviceImage?.[0];
	const statusLabel = formatBookingStatus(booking.status);

	return (
		<Link
			href={`/provider/bookings/${booking.id}`}
			className="relative flex h-50 w-55 shrink-0 flex-col overflow-hidden sm:w-65"
		>
			<div className="h-35 w-full overflow-hidden rounded-[10px] bg-muted">
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
			<div className="absolute inset-x-0 bottom-2 flex h-16 flex-col justify-evenly rounded-b-xl bg-white px-2 py-1.5">
				<p className="line-clamp-1 text-sm font-semibold text-[#525252]">
					{bookingTitle(booking)}
				</p>
				<div className="flex items-center justify-between gap-2">
					<p className="min-w-0 truncate text-xs font-semibold tabular-nums text-[#525252]">
						{bookingAmount(booking)}
					</p>
					<p
						className={cn(
							"max-w-25 truncate text-right text-xs font-semibold",
							bookingListStatusClass(booking.status),
						)}
					>
						{statusLabel}
					</p>
				</div>
			</div>
		</Link>
	);
}

/** Flutter upcoming-booking-list full-width card. */
export function UpcomingListCard({
	booking,
	providerName,
	providerImage,
}: {
	booking: Booking;
	providerName?: string | null;
	providerImage?: string | null;
}) {
	const [imgFailed, setImgFailed] = useState(false);
	const [avatarFailed, setAvatarFailed] = useState(false);
	const image = booking.service?.serviceImage?.[0];
	const title =
		booking.service?.categoryName?.trim() ||
		booking.service?.serviceName?.trim() ||
		bookingTitle(booking);
	const rating = serviceRating(booking);

	return (
		<Link
			href={`/provider/bookings/${booking.id}`}
			className="block overflow-hidden rounded-xl bg-white"
		>
			<div className="relative">
				<div className="aspect-2/1 w-full bg-muted sm:h-35 sm:aspect-auto">
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
							<ImageIcon className="size-10 opacity-35" />
						</div>
					)}
				</div>
				{rating ? (
					<span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-white px-1.5 py-1 text-xs font-medium text-[#525252]">
						<StarIcon className="size-3.5 fill-[#F5C518] text-[#F5C518]" />
						{rating}
					</span>
				) : null}
			</div>
			<div className="space-y-2.5 px-2.5 py-2">
				<p className="text-lg font-bold text-[#525252]">{title}</p>
				<div className="flex items-center gap-2.5">
					<span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
						{providerImage && !avatarFailed ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={providerImage}
								alt=""
								className="size-full object-cover"
								onError={() => setAvatarFailed(true)}
							/>
						) : (
							<span className="text-xs font-semibold text-muted-foreground">
								{(providerName ?? "?").slice(0, 1).toUpperCase()}
							</span>
						)}
					</span>
					<p className="min-w-0 flex-1 truncate text-sm text-[#7C7C7C]">
						{providerName ?? "—"}
					</p>
					<p className="shrink-0 text-base font-bold tabular-nums text-primary">
						{bookingAmount(booking)}
					</p>
				</div>
			</div>
		</Link>
	);
}
