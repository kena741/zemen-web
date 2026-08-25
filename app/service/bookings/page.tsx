"use client";

import { useMemo, useState } from "react";

import { BookingRow } from "@/components/provider/booking-row";
import { ServiceLoading } from "@/components/service/service-loading";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";
import { useCachedBookings } from "@/store/useCustomerCache";

const FILTERS = [
	{ id: "all", label: "All" },
	{ id: "pending", label: "Pending" },
	{ id: "accepted", label: "Accepted" },
	{ id: "ongoing", label: "Ongoing" },
	{ id: "completed", label: "Completed" },
	{ id: "rejected", label: "Cancelled" },
] as const;

function matchesFilter(status: string | null, filter: string) {
	if (filter === "all") return true;
	const s = (status || "").toLowerCase();
	if (filter === "ongoing") {
		return (
			s === "ongoing" ||
			s === "inprogress" ||
			s === "in_progress" ||
			s === "onGoing" ||
			s.includes("progress") ||
			s === "driving"
		);
	}
	if (filter === "rejected") {
		return s === "rejected" || s === "cancelled" || s === "canceled";
	}
	return s === filter;
}

export default function CustomerBookingsPage() {
	const { user } = useAuth();
	const customerId = user?.id ?? "";
	const { data: bookings, loading, error, refresh, refreshing } =
		useCachedBookings(customerId);
	const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

	const filtered = useMemo(
		() => bookings.filter((b) => matchesFilter(b.status, filter)),
		[bookings, filter],
	);

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<div className="flex items-start justify-between gap-3">
				<div className="md:hidden">
					<h1 className="text-xl font-semibold tracking-tight">Bookings</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Your service appointments
					</p>
				</div>
				<div className="hidden md:block">
					<p className="admin-eyebrow">Bookings</p>
					<h1 className="admin-page-title mt-1">My bookings</h1>
				</div>
				<button
					type="button"
					onClick={refresh}
					className="shrink-0 text-xs font-medium text-primary"
				>
					{refreshing ? "Refreshing…" : "Refresh"}
				</button>
			</div>

			<div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
				{FILTERS.map((f) => (
					<button
						key={f.id}
						type="button"
						onClick={() => setFilter(f.id)}
						className={cn(
							"shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
							filter === f.id
								? "bg-primary text-primary-foreground"
								: "bg-white text-muted-foreground ring-1 ring-black/5",
						)}
					>
						{f.label}
					</button>
				))}
			</div>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-4 rounded-xl bg-white px-2 shadow-sm ring-1 ring-black/5">
				{loading ? (
					<ServiceLoading compact />
				) : filtered.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						No bookings here yet.
					</p>
				) : (
					filtered.map((b) => (
						<BookingRow
							key={b.id}
							booking={b}
							href={`/service/bookings/${b.id}`}
							subtitle={
								b.bookingAddress?.address || b.status || "Booking"
							}
						/>
					))
				)}
			</div>
		</div>
	);
}
