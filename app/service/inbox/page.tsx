"use client";

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { ServiceLoading } from "@/components/service/service-loading";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLocale } from "@/lib/i18n";
import { formatDateTime } from "@/services/bookings/types";
import { useAuth } from "@/store/useAuth";
import { useCachedInbox } from "@/store/useCustomerCache";

export default function CustomerInboxPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const userId = user?.id ?? "";
	const { data: threads, loading, error, refresh, refreshing } =
		useCachedInbox(userId);

	const countLabel =
		threads.length === 1
			? t("inboxCountOne")
			: t("inboxCount", { count: threads.length });

	return (
		<div className="px-4 pt-4 md:px-6 md:pt-8">
			<div className="flex items-center justify-between gap-2">
				<ProfileBackLink href="/service" label={t("navHome")} />
				<button
					type="button"
					onClick={refresh}
					className="mb-3 text-xs font-medium text-primary"
				>
					{refreshing ? t("commonRefreshing") : t("commonRefresh")}
				</button>
			</div>
			<h1 className="admin-page-title">{t("inboxTitle")}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{loading ? t("commonLoading") : countLabel}
			</p>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 rounded-xl bg-white px-2 shadow-sm ring-1 ring-black/5">
				{loading ? (
					<ServiceLoading compact />
				) : threads.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						{t("inboxEmpty")}
					</p>
				) : (
					threads.map((thread) => (
						<Link
							key={thread.id}
							href={`/service/inbox/${thread.peerId}`}
							className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40"
						>
							<UserAvatar src={thread.peerImage} name={thread.peerName} size="md" />
							<div className="min-w-0 flex-1">
								<div className="flex items-center justify-between gap-2">
									<p className="truncate text-sm font-semibold">
										{thread.peerName}
									</p>
									{!thread.seen && thread.receiverId === userId ? (
										<span className="size-2 shrink-0 rounded-full bg-primary" />
									) : null}
								</div>
								<p className="mt-0.5 truncate text-xs text-muted-foreground">
									{thread.lastMessage || (thread.mediaUrl ? t("inboxMedia") : "—")}
								</p>
								<p className="mt-0.5 text-[10px] text-muted-foreground">
									{formatDateTime(thread.timestamp)}
								</p>
							</div>
							<ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
						</Link>
					))
				)}
			</div>
		</div>
	);
}
