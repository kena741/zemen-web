"use client";

import Link from "next/link";
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
import { AppLoading } from "@/components/ui/app-loading";
import { useLocale } from "@/lib/i18n";
import { formatAmount } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderDashboard } from "@/store/useProviderCache";

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
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const year = new Date().getFullYear();
	const { data, loading, error } =
		useCachedProviderDashboard(providerId, year);

	const wallet = user?.provider?.walletAmount ?? "0";
	const totalBookings = loading ? "—" : String(data.totalBookings);

	return (
		<div className="mx-auto w-full max-w-4xl">
			<ProviderHomeHeader
				name={user?.provider?.fullName ?? user?.name ?? t("provider")}
				image={user?.provider?.profileImage}
			/>

			<div className="hidden px-0 pt-0 lg:block">
				<p className="admin-eyebrow">{t("provider")}</p>
				<h1 className="admin-page-title mt-1">{t("navDashboard")}</h1>
				<p className="mt-2 max-w-xl text-sm text-muted-foreground">
					{t("providerDashboardSubtitle")}
				</p>
			</div>

			<div className="px-4 pt-4 lg:px-0 lg:pt-6">
				{error ? (
					<p className="mb-3 text-sm text-destructive">{error}</p>
				) : null}

				{loading ? (
					<AppLoading compact />
				) : (
					<>
						<div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-3">
							<StatBox
								label={t("providerTotalBooking")}
								value={totalBookings}
								icon={ClipboardListIcon}
								href="/provider/bookings"
							/>
							<StatBox
								label={t("providerTotalService")}
								value={String(data.activeServices)}
								icon={WrenchIcon}
								href="/provider/services"
							/>
							<StatBox
								label={t("providerMonthlyEarning")}
								value={formatAmount(String(data.revenueThisMonth))}
								icon={CircleDollarSignIcon}
							/>
							<StatBox
								label={t("providerWalletBalance")}
								value={formatAmount(wallet)}
								icon={WalletIcon}
								href="/provider/wallet"
							/>
						</div>

						{data.upcoming.length > 0 ? (
							<section className="mt-5">
								<div className="mb-3 flex items-center justify-between">
									<h2 className="text-lg font-bold text-[#464646]">
										{t("providerUpcomingBookings")}
									</h2>
									<Link
										href="/provider/bookings"
										className="text-sm font-semibold text-primary"
									>
										{t("commonViewAll")}
									</Link>
								</div>
								<div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 xl:grid-cols-3">
									{data.upcoming.map((b) => (
										<div key={b.id} className="lg:hidden">
											<UpcomingBookingCard booking={b} />
										</div>
									))}
									<div className="hidden w-full lg:col-span-full lg:block">
										<div className="rounded-xl bg-white px-2">
											{data.upcoming.map((b) => (
												<BookingRow key={b.id} booking={b} />
											))}
										</div>
									</div>
								</div>
							</section>
						) : null}

						<section className="mt-5 lg:mt-8">
							<RevenueChart
								points={data.chartPoints}
								loading={false}
								year={data.year}
								currentMonthRevenue={data.chartMonthRevenue}
							/>
						</section>

						<div className="mt-6 hidden gap-3 lg:grid lg:grid-cols-2">
							<div className="rounded-xl bg-white px-4 py-4">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<CalendarClockIcon className="size-4" />
									{t("providerCompletedThisMonth")}
								</div>
								<p className="mt-1 text-2xl font-semibold tabular-nums">
									{data.completedThisMonth}
								</p>
							</div>
							<div className="rounded-xl bg-white px-4 py-4">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<ClipboardListIcon className="size-4" />
									{t("statusPending")}
								</div>
								<p className="mt-1 text-2xl font-semibold tabular-nums">
									{data.pending}
								</p>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
