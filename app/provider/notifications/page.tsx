"use client";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { AppLoading } from "@/components/ui/app-loading";
import { useLocale } from "@/lib/i18n";
import { formatDateTime } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderNotifications } from "@/store/useProviderCache";

export default function NotificationsPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const { data: items, loading, error } =
		useCachedProviderNotifications(providerId);

	const countLabel =
		items.length === 1
			? t("providerNotificationsCountOne")
			: t("providerNotificationsCount", { count: items.length });

	return (
		<div className="mx-auto max-w-3xl">
			<ProfileBackLink href="/provider" label={t("navDashboard")} />
			<p className="admin-eyebrow">{t("commonAlerts")}</p>
			<h1 className="admin-page-title mt-1">{t("notificationsTitle")}</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{loading ? t("commonLoading") : countLabel}
			</p>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 rounded-xl border border-border bg-white px-4 shadow-xs">
				{loading ? (
					<AppLoading compact />
				) : items.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						{t("providerNoNotifications")}
					</p>
				) : (
					items.map((n) => (
						<div
							key={n.id}
							className="border-b border-border py-3 last:border-b-0"
						>
							<div className="flex items-start justify-between gap-3">
								<p className="text-sm font-semibold">
									{n.title || t("providerNotificationDefault")}
								</p>
								{!n.isRead ? (
									<span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
								) : null}
							</div>
							{n.description ? (
								<p className="mt-1 text-sm text-muted-foreground">
									{n.description}
								</p>
							) : null}
							<p className="mt-1 text-xs text-muted-foreground">
								{formatDateTime(n.createdAt)}
							</p>
						</div>
					))
				)}
			</div>
		</div>
	);
}
