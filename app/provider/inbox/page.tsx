"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRightIcon } from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDateTime } from "@/services/bookings/types";
import { fetchInbox } from "@/services/chat/chatApi";
import type { InboxThread } from "@/services/chat/types";
import { useAuth } from "@/store/useAuth";

export default function InboxPage() {
	const { user } = useAuth();
	const userId = user?.id ?? "";
	const [threads, setThreads] = useState<InboxThread[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;
		(async () => {
			setLoading(true);
			const res = await fetchInbox(userId);
			if (cancelled) return;
			setThreads(res.threads);
			setError(res.error);
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [userId]);

	return (
		<div className="mx-auto max-w-3xl">
			<ProfileBackLink />
			<p className="admin-eyebrow">Messages</p>
			<h1 className="admin-page-title mt-1">Inbox</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{loading
					? "Loading…"
					: `${threads.length} conversation${threads.length === 1 ? "" : "s"}`}
			</p>

			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
			) : null}

			<div className="mt-5 rounded-xl border border-border bg-white px-2 shadow-xs">
				{loading ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						Loading inbox…
					</p>
				) : threads.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						No conversations yet.
					</p>
				) : (
					threads.map((t) => (
						<Link
							key={t.id}
							href={`/provider/inbox/${t.peerId}`}
							className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40"
						>
							<UserAvatar src={t.peerImage} name={t.peerName} size="md" />
							<div className="min-w-0 flex-1">
								<div className="flex items-center justify-between gap-2">
									<p className="truncate text-sm font-semibold">
										{t.peerName}
									</p>
									{!t.seen && t.receiverId === userId ? (
										<span className="size-2 shrink-0 rounded-full bg-primary" />
									) : null}
								</div>
								<p className="mt-0.5 truncate text-xs text-muted-foreground">
									{t.lastMessage || (t.mediaUrl ? "Media" : "—")}
								</p>
								<p className="mt-0.5 text-[11px] text-muted-foreground">
									{formatDateTime(t.timestamp)}
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
