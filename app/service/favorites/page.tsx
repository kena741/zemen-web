"use client";

import { ServiceCard } from "@/components/provider/service-card";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/store/useAuth";
import { useCachedFavorites } from "@/store/useCustomerCache";

export default function FavoritesPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const userId = user?.id ?? "";
	const { data: services, loading, error, refresh, refreshing } =
		useCachedFavorites(userId);

	const countLabel =
		services.length === 1
			? t("favoritesCountOne")
			: t("favoritesCount", { count: services.length });

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<div className="flex items-center justify-between gap-2">
				<ProfileBackLink href="/service/profile" label={t("profileTitle")} />
				<button
					type="button"
					onClick={refresh}
					className="mb-3 text-xs font-medium text-primary"
				>
					{refreshing ? t("commonRefreshing") : t("commonRefresh")}
				</button>
			</div>
			<h1 className="admin-page-title">{t("profileFavorites")}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{loading ? t("commonLoading") : countLabel}
			</p>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			{loading ? (
				<ServiceLoading compact />
			) : services.length === 0 ? (
				<p className="mt-10 text-center text-sm text-muted-foreground">
					{t("favoritesEmpty")}
				</p>
			) : (
				<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
					{services.map((s) => (
						<ServiceCard
							key={s.id}
							service={s}
							compact
							href={`/service/services/${s.id}`}
							showFeaturedPending={false}
						/>
					))}
				</div>
			)}
		</div>
	);
}
