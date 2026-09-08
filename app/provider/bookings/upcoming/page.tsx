"use client";

import { UpcomingListCard } from "@/components/provider/booking-grid-card";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { AppLoading } from "@/components/ui/app-loading";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderDashboard } from "@/store/useProviderCache";

export default function ProviderUpcomingBookingsPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const year = new Date().getFullYear();
	const { data, loading, error } = useCachedProviderDashboard(providerId, year);
	const upcoming = data.upcoming;
	const providerName =
		user?.provider?.firstName ?? user?.provider?.fullName ?? user?.name;
	const providerImage = user?.provider?.profileImage;

	return (
		<div className="mx-auto max-w-lg">
			<div className="px-4 pt-2 lg:px-0">
				<ProfileBackLink
					href="/provider"
					label={t("providerUpcomingService")}
				/>
			</div>

			<div className="px-2 pb-8 lg:px-0">
				{error ? (
					<p className="px-2 text-sm text-destructive">{error}</p>
				) : null}
				{loading ? (
					<div className="px-2 py-8">
						<AppLoading compact />
					</div>
				) : upcoming.length === 0 ? (
					<p className="px-2 py-16 text-center text-sm text-muted-foreground">
						{t("providerNoUpcomingService")}
					</p>
				) : (
					<ul className="space-y-4">
						{upcoming.map((booking) => (
							<li key={booking.id} className="px-2">
								<UpcomingListCard
									booking={booking}
									providerName={providerName}
									providerImage={providerImage}
								/>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
