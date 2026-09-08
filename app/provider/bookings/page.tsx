"use client";

import { useEffect, useMemo, useState } from "react";
import {
	CalendarIcon,
	NavigationIcon,
	SearchIcon,
	XIcon,
} from "lucide-react";

import { BookingGridCard } from "@/components/provider/booking-grid-card";
import { ProviderMobileTabBar } from "@/components/provider/mobile-chrome";
import { AppLoading } from "@/components/ui/app-loading";
import { Input } from "@/components/ui/input";
import { BOOKING_STATUS } from "@/lib/booking-status";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Booking } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderBookings } from "@/store/useProviderCache";

function dayStart(iso: string): number {
	const d = new Date(`${iso}T00:00:00`);
	return d.getTime();
}

function dayEnd(iso: string): number {
	const d = new Date(`${iso}T23:59:59.999`);
	return d.getTime();
}

function bookingTime(booking: Booking): number {
	const raw = booking.bookingDate ?? booking.createdAt ?? booking.startTime;
	if (!raw) return 0;
	const t = Date.parse(raw);
	return Number.isFinite(t) ? t : 0;
}

function distanceMeters(
	from: { lat: number; lng: number },
	booking: Booking,
): number | null {
	const lat = booking.bookingAddress?.latitude;
	const lng = booking.bookingAddress?.longitude;
	if (lat == null || lng == null || (lat === 0 && lng === 0)) return null;
	const toRad = (n: number) => (n * Math.PI) / 180;
	const R = 6371000;
	const dLat = toRad(lat - from.lat);
	const dLng = toRad(lng - from.lng);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(from.lat)) *
			Math.cos(toRad(lat)) *
			Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(a));
}

function formatRangeLabel(from: string, to: string): string {
	const fmt = (iso: string) => {
		const d = new Date(`${iso}T12:00:00`);
		return d.toLocaleDateString(undefined, {
			day: "2-digit",
			month: "short",
		});
	};
	return `${fmt(from)} - ${fmt(to)}`;
}

export default function ProviderBookingsPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const { data: bookings, loading, error, refresh } =
		useCachedProviderBookings(providerId);
	const [filter, setFilter] = useState<string>("all");
	const [query, setQuery] = useState("");
	const [nearest, setNearest] = useState(false);
	const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(
		null,
	);
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [draftFrom, setDraftFrom] = useState("");
	const [draftTo, setDraftTo] = useState("");
	const [dateOpen, setDateOpen] = useState(false);

	const filters = useMemo(
		() => [
			{ id: "all", label: t("commonAll") },
			{ id: BOOKING_STATUS.pending, label: t("statusPending") },
			{ id: BOOKING_STATUS.accepted, label: t("statusAccepted") },
			{ id: BOOKING_STATUS.inProgress, label: t("statusInProgress") },
			{ id: BOOKING_STATUS.completed, label: t("statusCompleted") },
			{ id: BOOKING_STATUS.rejected, label: t("statusRejected") },
		],
		[t],
	);

	useEffect(() => {
		if (!nearest || origin) return;
		if (!navigator.geolocation) return;
		navigator.geolocation.getCurrentPosition(
			(pos) =>
				setOrigin({
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
				}),
			() => setNearest(false),
			{ enableHighAccuracy: false, timeout: 8000 },
		);
	}, [nearest, origin]);

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
				const service = (b.service?.serviceName ?? "").toLowerCase();
				const description = (b.description ?? "").toLowerCase();
				const status = (b.status ?? "").toLowerCase();
				const id = b.id.toLowerCase();
				const address = (b.bookingAddress?.address ?? "").toLowerCase();
				return (
					service.includes(q) ||
					description.includes(q) ||
					status.includes(q) ||
					id.includes(q) ||
					address.includes(q)
				);
			});
		}
		if (dateFrom && dateTo) {
			const start = dayStart(dateFrom);
			const end = dayEnd(dateTo);
			list = list.filter((b) => {
				const time = bookingTime(b);
				if (!time) return false;
				return time >= start && time <= end;
			});
		}
		const sorted = [...list];
		if (nearest && origin) {
			sorted.sort((a, b) => {
				const da = distanceMeters(origin, a);
				const db = distanceMeters(origin, b);
				if (da == null && db == null) return 0;
				if (da == null) return 1;
				if (db == null) return -1;
				return da - db;
			});
		} else {
			sorted.sort((a, b) => bookingTime(b) - bookingTime(a));
		}
		return sorted;
	}, [bookings, filter, query, dateFrom, dateTo, nearest, origin]);

	const hasActiveFilters =
		filter !== "all" ||
		query.trim().length > 0 ||
		Boolean(dateFrom && dateTo) ||
		nearest;

	function clearAll() {
		setFilter("all");
		setQuery("");
		setDateFrom("");
		setDateTo("");
		setDraftFrom("");
		setDraftTo("");
		setNearest(false);
		setDateOpen(false);
	}

	function applyDateFilter() {
		if (!draftFrom || !draftTo) return;
		const from = draftFrom <= draftTo ? draftFrom : draftTo;
		const to = draftFrom <= draftTo ? draftTo : draftFrom;
		setDateFrom(from);
		setDateTo(to);
		setDateOpen(false);
	}

	const dateLabel =
		dateFrom && dateTo
			? formatRangeLabel(dateFrom, dateTo)
			: t("providerFilterByDate");

	return (
		<div className="mx-auto max-w-5xl">
			<ProviderMobileTabBar title={t("bookingTitle")} />

			<div className="hidden lg:block">
				<p className="admin-eyebrow">{t("provider")}</p>
				<h1 className="admin-page-title mt-1">{t("bookingsTitle")}</h1>
			</div>

			<div className="px-4 pt-2 lg:px-0 lg:pt-5">
				<div className="relative">
					<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={t("providerSearchBookings")}
						className="h-11 rounded-xl border-0 bg-white pl-9 shadow-none ring-0"
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

				<div className="-mx-4 mt-3 flex h-9.5 gap-2 overflow-x-auto px-4 scrollbar-none">
					{filters.map((f) => {
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

				<div className="mt-2.5 flex gap-2">
					<button
						type="button"
						onClick={() => setNearest((v) => !v)}
						className={cn(
							"flex flex-1 items-center gap-1.5 rounded-[10px] border bg-white px-2.5 py-2.5 text-left text-xs font-medium",
							nearest
								? "border-primary/45 text-primary"
								: "border-black/10 text-[#525252]",
						)}
					>
						<NavigationIcon className="size-4 shrink-0" />
						<span className="truncate">{t("providerNearest")}</span>
					</button>
					<button
						type="button"
						onClick={() => {
							setDraftFrom(dateFrom);
							setDraftTo(dateTo);
							setDateOpen((v) => !v);
						}}
						className={cn(
							"flex flex-2 items-center gap-1.5 rounded-[10px] border bg-white px-2.5 py-2.5 text-left text-xs font-medium",
							dateFrom && dateTo
								? "border-primary/45 text-primary"
								: "border-black/10 text-[#525252]",
						)}
					>
						<CalendarIcon className="size-4 shrink-0" />
						<span className="truncate">{dateLabel}</span>
					</button>
				</div>

				{dateOpen ? (
					<div className="mt-2 space-y-3 rounded-[12px] bg-white p-3 ring-1 ring-black/5">
						<div className="grid grid-cols-2 gap-2">
							<label className="space-y-1 text-xs text-muted-foreground">
								<span>{t("providerDateFrom")}</span>
								<input
									type="date"
									value={draftFrom}
									max={draftTo || undefined}
									onChange={(e) => setDraftFrom(e.target.value)}
									className="h-10 w-full rounded-md border border-black/10 bg-white px-2 text-sm text-foreground"
								/>
							</label>
							<label className="space-y-1 text-xs text-muted-foreground">
								<span>{t("providerDateTo")}</span>
								<input
									type="date"
									value={draftTo}
									min={draftFrom || undefined}
									onChange={(e) => setDraftTo(e.target.value)}
									className="h-10 w-full rounded-md border border-black/10 bg-white px-2 text-sm text-foreground"
								/>
							</label>
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => {
									setDraftFrom("");
									setDraftTo("");
									setDateFrom("");
									setDateTo("");
									setDateOpen(false);
								}}
								className="h-10 flex-1 rounded-xl border border-black/10 text-sm font-medium"
							>
								{t("commonClear")}
							</button>
							<button
								type="button"
								onClick={applyDateFilter}
								disabled={!draftFrom || !draftTo}
								className="h-10 flex-1 rounded-xl bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
							>
								{t("commonApply")}
							</button>
						</div>
					</div>
				) : null}

				{hasActiveFilters ? (
					<div className="mt-2 flex justify-end">
						<button
							type="button"
							onClick={clearAll}
							className="text-xs font-medium text-primary"
						>
							{t("providerClearAll")}
						</button>
					</div>
				) : null}

				{error ? (
					<p className="mt-4 text-sm text-destructive">{error}</p>
				) : null}

				<div className="mt-4">
					{loading ? (
						<AppLoading compact />
					) : filtered.length === 0 ? (
						<button
							type="button"
							onClick={() => void refresh()}
							className="w-full py-12 text-center text-sm text-muted-foreground"
						>
							{t("providerNoActiveBooking")}
						</button>
					) : (
						<div className="grid grid-cols-2 gap-3 pb-4 lg:grid-cols-3 xl:grid-cols-4">
							{filtered.map((b) => (
								<BookingGridCard key={b.id} booking={b} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
