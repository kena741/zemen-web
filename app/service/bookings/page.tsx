"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CalendarIcon,
	CheckCircle2Icon,
	ChevronDownIcon,
	ClipboardListIcon,
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
import {
	fetchCustomerOffers,
	type ServiceOffer,
} from "@/services/customer/offersApi";
import { useAuth } from "@/store/useAuth";
import { useCachedBookings } from "@/store/useCustomerCache";

const STATUS_OPTIONS = [
	"all",
	BOOKING_STATUS.pending,
	BOOKING_STATUS.accepted,
	BOOKING_STATUS.rejected,
	BOOKING_STATUS.onTheWay,
	BOOKING_STATUS.inProgress,
	BOOKING_STATUS.hold,
	BOOKING_STATUS.completed,
	BOOKING_STATUS.pendingExtraPayment,
	BOOKING_STATUS.pendingApproval,
] as const;

const STATUS_KEYS: Partial<Record<(typeof STATUS_OPTIONS)[number], MessageKey>> =
	{
		all: "commonAll",
		[BOOKING_STATUS.pending]: "statusPending",
		[BOOKING_STATUS.accepted]: "statusAccepted",
		[BOOKING_STATUS.rejected]: "statusRejected",
		[BOOKING_STATUS.onTheWay]: "statusOnTheWay",
		[BOOKING_STATUS.inProgress]: "statusInProgress",
		[BOOKING_STATUS.hold]: "statusHold",
		[BOOKING_STATUS.completed]: "statusCompleted",
		[BOOKING_STATUS.pendingExtraPayment]: "statusPendingExtraPayment",
		[BOOKING_STATUS.pendingApproval]: "statusPendingApproval",
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
	offer: ServiceOffer | undefined,
	t: (key: MessageKey, params?: Record<string, string>) => string,
): string {
	if (booking.nextCycleDue) return t("bookingPayNow");
	const key = normalizeStatus(booking.status);
	if (
		key !== "rejected" &&
		key !== "cancelled" &&
		key !== "canceled" &&
		!booking.paymentCompleted &&
		offer
	) {
		const offerStatus = offer.status.trim().toLowerCase();
		if (offerStatus === "accepted") return t("bookingAwaitingPayment");
		if (offerStatus === "pending") return t("bookingAwaitingApproval");
	}
	return formatBookingStatus(booking.status);
}

function StatusDropdown({
	label,
	options,
	value,
	onChange,
	optionLabel,
}: {
	label: string;
	options: readonly string[];
	value: string;
	onChange: (id: string) => void;
	optionLabel: (id: string) => string;
}) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onDocClick(e: MouseEvent) {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onDocClick);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDocClick);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	return (
		<div ref={rootRef} className="relative min-w-0 flex-6">
			<button
				type="button"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-label={label}
				onClick={() => setOpen((v) => !v)}
				className={cn(
					"flex h-12 w-full items-center justify-between gap-2 rounded-md bg-white px-2.5 text-left text-sm font-medium",
					"outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
					open && "ring-2 ring-primary/25",
				)}
			>
				<span className="min-w-0 truncate">{optionLabel(value)}</span>
				<ChevronDownIcon
					className={cn(
						"size-4 shrink-0 text-muted-foreground transition-transform duration-150",
						open && "rotate-180",
					)}
				/>
			</button>
			{open ? (
				<ul
					role="listbox"
					className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-auto rounded-xl border border-border/80 bg-white py-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
				>
					{options.map((id) => {
						const selected = id === value;
						return (
							<li key={id} role="option" aria-selected={selected}>
								<button
									type="button"
									className={cn(
										"flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors duration-150",
										selected
											? "bg-primary/8 font-semibold text-primary"
											: "font-medium hover:bg-[#eef3ea]",
									)}
									onClick={() => {
										setOpen(false);
										onChange(id);
									}}
								>
									<span className="truncate">{optionLabel(id)}</span>
									{selected ? (
										<CheckCircle2Icon className="size-4 shrink-0 text-primary" />
									) : null}
								</button>
							</li>
						);
					})}
				</ul>
			) : null}
		</div>
	);
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
	const [offersByBookingId, setOffersByBookingId] = useState<
		Record<string, ServiceOffer>
	>({});

	useEffect(() => {
		if (!customerId) return;
		void fetchCustomerOffers(customerId).then((res) => {
			const map: Record<string, ServiceOffer> = {};
			for (const offer of res.offers) {
				const id = offer.bookingId?.trim();
				if (!id) continue;
				map[id] = offer;
			}
			setOffersByBookingId(map);
		});
	}, [customerId, bookings.length]);

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
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={t("bookingsSearch")}
						className="h-12 rounded-md border-0 bg-white shadow-none ring-0"
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

					<StatusDropdown
						label={t("bookingsSelectStatus")}
						options={STATUS_OPTIONS}
						value={filter}
						onChange={(id) =>
							setFilter(id as (typeof STATUS_OPTIONS)[number])
						}
						optionLabel={(id) =>
							t(STATUS_KEYS[id as (typeof STATUS_OPTIONS)[number]] ?? "commonAll")
						}
					/>

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
					<div className="flex flex-col items-center px-6 py-16 text-center">
						<div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
							<ClipboardListIcon className="size-8" />
						</div>
						<p className="mt-4 text-[17px] font-bold text-foreground">
							{t("bookingsEmpty")}
						</p>
						<p className="mt-1.5 max-w-xs text-[14px] text-muted-foreground">
							{hasExtraFilters || filter !== "all"
								? t("bookingsNoMatchFilters")
								: t("bookingsEmptyHint")}
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-3 pb-6 lg:grid-cols-3 xl:grid-cols-4">
						{filtered.map((b) => (
							<CustomerBookingGridCard
								key={b.id}
								booking={b}
								statusLabel={cardStatusLabel(b, offersByBookingId[b.id], t)}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
