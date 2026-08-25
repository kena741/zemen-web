"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { BookingGridCard } from "@/components/provider/booking-grid-card";
import { BookingRow } from "@/components/provider/booking-row";
import { ProviderMobileTabBar } from "@/components/provider/mobile-chrome";
import { AppLoading } from "@/components/ui/app-loading";
import { Input } from "@/components/ui/input";
import { BOOKING_STATUS, formatBookingStatus } from "@/lib/booking-status";
import { cn } from "@/lib/utils";
import { customerDisplayName } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderBookings } from "@/store/useProviderCache";

const FILTERS = [
	{ id: "all", label: "All" },
	{ id: BOOKING_STATUS.pending, label: "Pending" },
	{ id: BOOKING_STATUS.accepted, label: "Accepted" },
	{ id: BOOKING_STATUS.inProgress, label: "In progress" },
	{ id: BOOKING_STATUS.completed, label: "Completed" },
	{ id: BOOKING_STATUS.rejected, label: "Rejected" },
] as const;

export default function ProviderBookingsPage() {
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const { data: bookings, loading, error, refresh, refreshing } =
		useCachedProviderBookings(providerId);
	const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		let list = bookings;
		if (filter !== "all") {
			if (filter === BOOKING_STATUS.inProgress) {
				list = list.filter(
					(b) =>
						b.status === BOOKING_STATUS.inProgress ||
						b.status === BOOKING_STATUS.onTheWay ||
						b.status === BOOKING_STATUS.hold,
				);
			} else {
				list = list.filter((b) => b.status === filter);
			}
		}
		const q = query.trim().toLowerCase();
		if (q) {
			list = list.filter((b) => {
				const name = customerDisplayName(b).toLowerCase();
				const service = (b.service?.serviceName ?? "").toLowerCase();
				const phone = (b.phoneNumber ?? "").toLowerCase();
				return (
					name.includes(q) || service.includes(q) || phone.includes(q)
				);
			});
		}
		return list;
	}, [bookings, filter, query]);

	return (
		<div className="mx-auto max-w-3xl">
			<ProviderMobileTabBar title="Booking" />

			<div className="hidden lg:block">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="admin-eyebrow">Provider</p>
						<h1 className="admin-page-title mt-1">Bookings</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							{loading
								? "Loading…"
								: `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`}
						</p>
					</div>
					<button
						type="button"
						onClick={refresh}
						className="text-xs font-medium text-primary"
					>
						{refreshing ? "Refreshing…" : "Refresh"}
					</button>
				</div>
			</div>

			<div className="px-4 pt-2 lg:px-0 lg:pt-5">
				<div className="mb-2 flex justify-end lg:hidden">
					<button
						type="button"
						onClick={refresh}
						className="text-xs font-medium text-primary"
					>
						{refreshing ? "Refreshing…" : "Refresh"}
					</button>
				</div>

				<div className="relative">
					<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search bookings"
						className="h-11 rounded-xl border-0 bg-white pl-9 shadow-none ring-0"
					/>
				</div>

				<div className="-mx-4 mt-3 flex h-[38px] gap-2 overflow-x-auto px-4 scrollbar-none">
					{FILTERS.map((f) => {
						const active = filter === f.id;
						return (
							<button
								key={f.id}
								type="button"
								onClick={() => setFilter(f.id)}
								className={cn(
									"shrink-0 rounded-full px-3.5 text-xs font-medium transition-colors",
									active
										? "bg-primary text-primary-foreground"
										: "bg-white text-[#525252] ring-1 ring-black/10",
								)}
							>
								{f.label}
							</button>
						);
					})}
				</div>

				{error ? (
					<p className="mt-4 text-sm text-destructive">{error}</p>
				) : null}

				<div className="mt-4 lg:hidden">
					{loading ? (
						<AppLoading compact />
					) : filtered.length === 0 ? (
						<p className="py-12 text-center text-sm text-muted-foreground">
							No{" "}
							{filter === "all"
								? ""
								: `${formatBookingStatus(filter).toLowerCase()} `}
							bookings.
						</p>
					) : (
						<div className="grid grid-cols-2 gap-3 pb-4">
							{filtered.map((b) => (
								<BookingGridCard key={b.id} booking={b} />
							))}
						</div>
					)}
				</div>

				<div className="mt-4 hidden rounded-xl bg-white px-2 lg:block">
					{loading ? (
						<AppLoading compact />
					) : filtered.length === 0 ? (
						<p className="py-10 text-center text-sm text-muted-foreground">
							No bookings.
						</p>
					) : (
						filtered.map((b) => <BookingRow key={b.id} booking={b} />)
					)}
				</div>
			</div>
		</div>
	);
}
