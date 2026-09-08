"use client";

import { useMemo, useState } from "react";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CalendarIcon,
	FilterIcon,
	SearchIcon,
	XIcon,
} from "lucide-react";

import { CustomerBookingGridCard } from "@/components/service/customer-booking-grid-card";
import { ServiceLoading } from "@/components/service/service-loading";
import { Input } from "@/components/ui/input";
import { BOOKING_STATUS, formatBookingStatus } from "@/lib/booking-status";
import { useLocale } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { cn } from "@/lib/utils";
import type { Booking } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";
import { useCachedBookings } from "@/store/useCustomerCache";

const STATUS_OPTIONS = [
	"all",
	BOOKING_STATUS.pending,
	BOOKING_STATUS.accepted,
	BOOKING_STATUS.onTheWay,
	BOOKING_STATUS.inProgress,
	BOOKING_STATUS.hold,
	BOOKING_STATUS.completed,
	BOOKING_STATUS.pendingApproval,
	BOOKING_STATUS.rejected,
] as const;

const STATUS_KEYS: Partial<Record<(typeof STATUS_OPTIONS)[number], MessageKey>> =
	{
		all: "commonAll",
		[BOOKING_STATUS.pending]: "statusPending",
		[BOOKING_STATUS.accepted]: "statusAccepted",
		[BOOKING_STATUS.onTheWay]: "statusOnTheWay",
		[BOOKING_STATUS.inProgress]: "statusInProgress",
		[BOOKING_STATUS.hold]: "statusHold",
		[BOOKING_STATUS.completed]: "statusCompleted",
		[BOOKING_STATUS.pendingApproval]: "statusPendingApproval",
		[BOOKING_STATUS.rejected]: "statusCancelled",
	};

function normalizeStatus(status: string | null | undefined): string {
	return (status ?? "")
		.trim()
		.toLowerCase()
		.replace(/[\s_-]+/g, "");
}

function matchesStatus(status: string | null, filter: string) {
	if (filter === "all") return true;
	return normalizeStatus(status) === normalizeStatus(filter);
}

function bookingTime(booking: Booking): number {
	const raw = booking.bookingDate ?? booking.createdAt ?? booking.startTime;
	if (!raw) return 0;
	const t = Date.parse(raw);
	return Number.isFinite(t) ? t : 0;
}

function sameDay(isoDate: string, booking: Booking): boolean {
	const raw = booking.bookingDate ?? booking.createdAt;
	if (!raw) return false;
	const d = new Date(raw);
	if (Number.isNaN(d.getTime())) return false;
	const [y, m, day] = isoDate.split("-").map(Number);
	return (
		d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day
	);
}

function cardStatusLabel(
	booking: Booking,
	t: (key: MessageKey, params?: Record<string, string>) => string,
): string {
	if (booking.nextCycleDue) return t("bookingPayNow");
	return formatBookingStatus(booking.status);
}

export default function CustomerBookingsPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const customerId = user?.id ?? "";
	const { data: bookings, loading, error } = useCachedBookings(customerId);
	const [query, setQuery] = useState("");
	const [filter, setFilter] =
		useState<(typeof STATUS_OPTIONS)[number]>("all");
	const [date, setDate] = useState("");
	const [newest, setNewest] = useState(true);

	const filtered = useMemo(() => {
		let list = bookings.filter((b) => matchesStatus(b.status, filter));
		const q = query.trim().toLowerCase();
		if (q) {
			list = list.filter((b) => {
				const name = (b.service?.serviceName ?? "").toLowerCase();
				const id = b.id.toLowerCase();
				return name.includes(q) || id.includes(q);
			});
		}
		if (date) list = list.filter((b) => sameDay(date, b));
		const sorted = [...list];
		sorted.sort((a, b) =>
			newest ? bookingTime(b) - bookingTime(a) : bookingTime(a) - bookingTime(b),
		);
		return sorted;
	}, [bookings, filter, query, date, newest]);

	const hasExtraFilters = query.trim().length > 0 || Boolean(date);

	function clearExtra() {
		setQuery("");
		setDate("");
	}

	return (
		<div className="mx-auto max-w-5xl px-4 pt-4 md:px-6 md:pt-8">
			<div className="md:hidden">
				<h1 className="text-xl font-semibold tracking-tight">
					{t("bookingsTitle")}
				</h1>
			</div>
			<div className="hidden md:block">
				<p className="admin-eyebrow">{t("bookingsTitle")}</p>
				<h1 className="admin-page-title mt-1">{t("bookingsMyBookings")}</h1>
			</div>

			<div className="mt-4 space-y-2.5">
				<div className="relative">
					<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={t("bookingsSearch")}
						className="h-12 rounded-md border-0 bg-white pl-9 shadow-none ring-0"
					/>
					{query ? (
						<button
							type="button"
							onClick={() => setQuery("")}
							className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
							aria-label={t("commonClear")}
						>
							<XIcon className="size-4" />
						</button>
					) : null}
				</div>

				<div className="flex gap-2">
					<label className="relative flex h-12 w-22 shrink-0 items-center gap-1.5 rounded-md bg-white px-2 text-xs font-medium text-foreground">
						<CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
						<span className="truncate">
							{date
								? new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
										day: "2-digit",
										month: "short",
									})
								: t("bookingsDate")}
						</span>
						<input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							className="absolute inset-0 cursor-pointer opacity-0"
						/>
					</label>

					<label className="relative flex h-12 min-w-0 flex-6 items-center gap-1.5 rounded-md bg-white px-2.5 text-sm">
						<FilterIcon className="size-4 shrink-0 text-muted-foreground" />
						<select
							value={filter}
							onChange={(e) =>
								setFilter(e.target.value as (typeof STATUS_OPTIONS)[number])
							}
							className="h-full w-full appearance-none bg-transparent text-sm font-medium outline-none"
						>
							{STATUS_OPTIONS.map((id) => (
								<option key={id} value={id}>
									{t(STATUS_KEYS[id] ?? "commonAll")}
								</option>
							))}
						</select>
					</label>

					<button
						type="button"
						onClick={() => setNewest((v) => !v)}
						className="flex h-12 min-w-0 flex-4 items-center gap-1.5 rounded-md bg-white px-2.5 text-sm font-medium"
					>
						{newest ? (
							<ArrowDownIcon className="size-4 shrink-0 text-muted-foreground" />
						) : (
							<ArrowUpIcon className="size-4 shrink-0 text-muted-foreground" />
						)}
						<span className="truncate">
							{newest ? t("bookingsNewest") : t("bookingsOldest")}
						</span>
					</button>

					{hasExtraFilters ? (
						<button
							type="button"
							onClick={clearExtra}
							className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-white text-foreground"
							aria-label={t("commonClear")}
						>
							<XIcon className="size-4" />
						</button>
					) : null}
				</div>
			</div>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-4">
				{loading ? (
					<ServiceLoading compact />
				) : filtered.length === 0 ? (
					<p className="py-16 text-center text-sm text-muted-foreground">
						{hasExtraFilters || filter !== "all"
							? t("bookingsNoMatchFilters")
							: t("bookingsEmpty")}
					</p>
				) : (
					<div className="grid grid-cols-2 gap-3 pb-6 lg:grid-cols-3 xl:grid-cols-4">
						{filtered.map((b) => (
							<CustomerBookingGridCard
								key={b.id}
								booking={b}
								statusLabel={cardStatusLabel(b, t)}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
