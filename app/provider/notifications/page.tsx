"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { formatDateTime } from "@/services/bookings/types";
import { fetchNotifications } from "@/services/chat/chatApi";
import type { AppNotification } from "@/services/chat/types";
import { useAuth } from "@/store/useAuth";

export default function NotificationsPage() {
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";
	const [items, setItems] = useState<AppNotification[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!providerId) return;
		let cancelled = false;
		(async () => {
			setLoading(true);
			const res = await fetchNotifications(providerId);
			if (cancelled) return;
			setItems(res.notifications);
			setError(res.error);
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [providerId]);

	return (
		<div className="mx-auto max-w-3xl">
			<ProfileBackLink />
			<p className="admin-eyebrow">Alerts</p>
			<h1 className="admin-page-title mt-1">Notifications</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{loading
					? "Loading…"
					: `${items.length} notification${items.length === 1 ? "" : "s"}`}
			</p>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 rounded-xl border border-border bg-white px-4 shadow-xs">
				{loading ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						Loading…
					</p>
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
							{n.bookingId ? (
								<p className="mt-1.5 text-xs">
									<Link
										href={`/provider/bookings/${n.bookingId}`}
										className="text-brand-ink underline-offset-4 hover:underline"
									>
										Open booking
									</Link>
								</p>
							) : null}
						</div>
					))
				)}
			</div>
		</div>
	);
}
