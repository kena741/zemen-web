"use client";

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { StatusBadge } from "@/components/provider/status-badge";
import {
	customerDisplayName,
	formatAmount,
	formatDateTime,
	type Booking,
} from "@/services/bookings/types";
import { cn } from "@/lib/utils";

export function BookingRow({
	booking,
	className,
	href,
	subtitle,
}: {
	booking: Booking;
	className?: string;
	href?: string;
	subtitle?: string | null;
}) {
	const title =
		booking.service?.serviceName?.trim() ||
		`Booking #${booking.id.slice(0, 8)}`;
	const line =
		subtitle ??
		customerDisplayName(booking) +
			(booking.phoneNumber ? ` · ${booking.phoneNumber}` : "");

	return (
		<Link
			href={href ?? `/provider/bookings/${booking.id}`}
			className={cn(
				"group -mx-1 flex items-start justify-between gap-3 rounded-lg px-2 py-3.5 transition-colors last:border-b-0 hover:bg-muted/40 sm:py-4",
				"border-b border-border",
				className,
			)}
		>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
					<p className="max-w-full truncate text-sm font-semibold text-foreground">
						{title}
					</p>
					<StatusBadge status={booking.status} />
				</div>
				<p className="mt-1 truncate text-sm text-muted-foreground">
					{line}
				</p>
				<p className="mt-0.5 text-xs text-muted-foreground">
					{formatDateTime(booking.bookingDate ?? booking.startTime)}
				</p>
			</div>
			<div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
				<p className="text-sm font-semibold tabular-nums text-primary sm:font-medium sm:text-foreground">
					{formatAmount(booking.totalAmount ?? booking.subTotal)}
				</p>
				<ChevronRightIcon className="hidden size-4 text-muted-foreground opacity-60 transition group-hover:opacity-100 sm:block" />
			</div>
		</Link>
	);
}
