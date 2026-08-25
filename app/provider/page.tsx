"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
	CalendarClockIcon,
	CircleDollarSignIcon,
	ClipboardListIcon,
	WalletIcon,
	WrenchIcon,
} from "lucide-react";

import { BookingRow } from "@/components/provider/booking-row";
import { UpcomingBookingCard } from "@/components/provider/booking-grid-card";
import { ProviderHomeHeader } from "@/components/provider/mobile-chrome";
import { RevenueChart } from "@/components/provider/revenue-chart";
import {
	fetchDashboardSnapshot,
	fetchYearlyRevenueChart,
	type RevenueChartPoint,
} from "@/services/bookings/bookingsApi";
import type { Booking } from "@/services/bookings/types";
import { formatAmount } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";

function StatBox({
	label,
	value,
	icon: Icon,
	href,
}: {
	label: string;
	value: string;
	icon: React.ComponentType<{ className?: string }>;
	href?: string;
}) {
	const inner = (
		<>
			<div className="flex size-10 items-center justify-center rounded-xl bg-[#e8f5e3] text-primary">
				<Icon className="size-5" />
			</div>
			<div className="mt-3">
				<p className="text-sm text-[#525252]">{label}</p>
				<p className="mt-1 text-xl font-bold tabular-nums text-primary">
					{value}
				</p>
			</div>
		</>
	);

	const className =
		"rounded-xl bg-white p-5 transition active:scale-[0.99]";

	if (href) {
		return (
			<Link href={href} className={className}>
				{inner}
			</Link>
		);
	}
	return <div className={className}>{inner}</div>;
}

export default function ProviderDashboardPage() {
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const year = new Date().getFullYear();
	const [pending, setPending] = useState(0);
	const [activeServices, setActiveServices] = useState(0);
	const [completedThisMonth, setCompletedThisMonth] = useState(0);
	const [revenueThisMonth, setRevenueThisMonth] = useState(0);
	const [upcoming, setUpcoming] = useState<Booking[]>([]);
	const [chartPoints, setChartPoints] = useState<RevenueChartPoint[]>([]);
	const [chartMonthRevenue, setChartMonthRevenue] = useState(0);
	const [loading, setLoading] = useState(true);
	const [chartLoading, setChartLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!providerId) return;
		let cancelled = false;
		(async () => {
			setLoading(true);
			setChartLoading(true);
			const [snap, chart] = await Promise.all([
				fetchDashboardSnapshot(providerId),
				fetchYearlyRevenueChart(providerId, year),
			]);
			if (cancelled) return;
			setPending(snap.pending);
			setActiveServices(snap.activeServices);
			setCompletedThisMonth(snap.completedThisMonth);
			setRevenueThisMonth(
				chart.currentMonthRevenue || snap.revenueThisMonth,
			);
			setUpcoming(snap.upcoming);
			setChartPoints(chart.points);
			setChartMonthRevenue(chart.currentMonthRevenue);
			setError(snap.error || chart.error);
			setLoading(false);
			setChartLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [providerId, year]);

	const wallet = user?.provider?.walletAmount ?? "0";
	const totalBookings = loading
		? "—"
		: String(pending + completedThisMonth + upcoming.length);

	return (
		<div className="mx-auto w-full max-w-4xl">
			<ProviderHomeHeader
				name={user?.provider?.fullName ?? user?.name ?? "Provider"}
				image={user?.provider?.profileImage}
			/>

			{/* Desktop title */}
			<div className="hidden px-0 pt-0 lg:block">
				<p className="admin-eyebrow">Provider</p>
				<h1 className="admin-page-title mt-1">Dashboard</h1>
				<p className="mt-2 max-w-xl text-sm text-muted-foreground">
					Overview of your bookings, services, and earnings.
				</p>
			</div>

			<div className="px-4 pt-4 lg:px-0 lg:pt-6">
				{error ? (
					<p className="mb-3 text-sm text-destructive">{error}</p>
				) : null}

				{/* Flutter 2×2 stats */}
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-3">
					<StatBox
						label="Total Booking"
						value={loading ? "—" : totalBookings}
						icon={ClipboardListIcon}
						href="/provider/bookings"
					/>
					<StatBox
						label="Total Service"
						value={loading ? "—" : String(activeServices)}
						icon={WrenchIcon}
						href="/provider/services"
					/>
					<StatBox
						label="Monthly Earning"
						value={
							loading ? "—" : formatAmount(String(revenueThisMonth))
						}
						icon={CircleDollarSignIcon}
					/>
					<StatBox
						label="Wallet Balance"
						value={formatAmount(wallet)}
						icon={WalletIcon}
						href="/provider/wallet"
					/>
				</div>

				{/* Upcoming — horizontal on mobile like Flutter */}
				{!loading && upcoming.length > 0 ? (
					<section className="mt-5">
						<div className="mb-3 flex items-center justify-between">
							<h2 className="text-lg font-bold text-[#464646]">
								Upcoming bookings
							</h2>
							<Link
								href="/provider/bookings"
								className="text-sm font-semibold text-primary"
							>
								View all
							</Link>
						</div>
						<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 xl:grid-cols-3">
							{upcoming.map((b) => (
								<div key={b.id} className="lg:hidden">
									<UpcomingBookingCard booking={b} />
								</div>
							))}
							{/* Desktop list */}
							<div className="hidden w-full lg:col-span-full lg:block">
								<div className="rounded-xl bg-white px-2">
									{upcoming.map((b) => (
										<BookingRow key={b.id} booking={b} />
									))}
								</div>
							</div>
						</div>
					</section>
				) : null}

				{loading ? (
					<section className="mt-5">
						<div className="-mx-4 flex gap-3 overflow-hidden px-4">
							{Array.from({ length: 2 }).map((_, i) => (
								<div
									key={i}
									className="h-[240px] w-[280px] shrink-0 animate-pulse rounded-xl bg-muted"
								/>
							))}
						</div>
					</section>
				) : null}

				<section className="mt-5 lg:mt-8">
					<RevenueChart
						points={chartPoints}
						loading={chartLoading}
						year={year}
						currentMonthRevenue={chartMonthRevenue}
					/>
				</section>

				{/* Extra desktop stats */}
				<div className="mt-6 hidden gap-3 lg:grid lg:grid-cols-2">
					<div className="rounded-xl bg-white px-4 py-4">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<CalendarClockIcon className="size-4" />
							Completed this month
						</div>
						<p className="mt-1 text-2xl font-semibold tabular-nums">
							{loading ? "—" : completedThisMonth}
						</p>
					</div>
					<div className="rounded-xl bg-white px-4 py-4">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<ClipboardListIcon className="size-4" />
							Pending
						</div>
						<p className="mt-1 text-2xl font-semibold tabular-nums">
							{loading ? "—" : pending}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
