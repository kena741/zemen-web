"use client";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { formatDateTime } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";
import { useCachedNotifications } from "@/store/useCustomerCache";

export default function CustomerNotificationsPage() {
	const { user } = useAuth();
	const customerId = user?.id ?? "";
	const { data: items, loading, error, refresh, refreshing } =
		useCachedNotifications(customerId);

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<div className="flex items-center justify-between gap-2">
				<ProfileBackLink href="/service" label="Home" />
				<button
					type="button"
					onClick={refresh}
					className="mb-3 text-xs font-medium text-primary"
				>
					{refreshing ? "Refreshing…" : "Refresh"}
				</button>
			</div>
			<h1 className="admin-page-title">Notifications</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{loading
					? "Loading…"
					: `${items.length} notification${items.length === 1 ? "" : "s"}`}
			</p>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 rounded-xl bg-white px-4 shadow-sm ring-1 ring-black/5">
				{loading ? (
					<ServiceLoading compact />
				) : items.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						No notifications yet.
					</p>
				) : (
					items.map((n) => (
						<div
							key={n.id}
							className="border-b border-border py-3 last:border-b-0"
						>
							<div className="flex items-start justify-between gap-3">
								<p className="text-sm font-semibold">
									{n.title || "Notification"}
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
