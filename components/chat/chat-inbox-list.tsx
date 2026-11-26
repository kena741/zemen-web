"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MessagesSquareIcon } from "lucide-react";

import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import type { InboxThread } from "@/services/chat/types";

function formatThreadTime(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const now = new Date();
	const sameDay =
		d.getFullYear() === now.getFullYear() &&
		d.getMonth() === now.getMonth() &&
		d.getDate() === now.getDate();
	if (sameDay) {
		return d.toLocaleTimeString(undefined, {
			hour: "numeric",
			minute: "2-digit",
		});
	}
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	const isYesterday =
		d.getFullYear() === yesterday.getFullYear() &&
		d.getMonth() === yesterday.getMonth() &&
		d.getDate() === yesterday.getDate();
	if (isYesterday) return "Yesterday";
	return d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

export function ChatInboxList({
	threads,
	userId,
	hrefForPeer,
	loading,
	error,
	emptyTitle,
	emptyHint,
	mediaLabel,
	countLabel,
	title,
	backSlot,
}: {
	threads: InboxThread[];
	userId: string;
	hrefForPeer: (peerId: string) => string;
	loading: boolean;
	error: string | null;
	emptyTitle: string;
	emptyHint: string;
	mediaLabel: string;
	countLabel: string;
	title: string;
	backSlot?: ReactNode;
}) {
	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-4 md:px-6 md:pt-6">
			{backSlot}
			<header className="mb-4">
				<h1 className="text-[28px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[32px]">
					{title}
				</h1>
				<p className="mt-1 text-[14px] font-medium text-muted-foreground">
					{loading ? "…" : countLabel}
				</p>
			</header>

			{error ? (
				<p className="mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-[13px] font-medium text-destructive">
					{error}
				</p>
			) : null}

			<div className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_8px_28px_rgba(14,38,4,0.06)] ring-1 ring-black/[0.04]">
				{loading ? (
					<ul className="divide-y divide-border/60" aria-busy>
						{Array.from({ length: 5 }).map((_, i) => (
							<li key={i} className="flex items-center gap-3 px-4 py-3.5">
								<div className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />
								<div className="min-w-0 flex-1 space-y-2">
									<div className="h-3.5 w-1/3 animate-pulse rounded bg-muted" />
									<div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
								</div>
							</li>
						))}
					</ul>
				) : threads.length === 0 ? (
					<div className="flex flex-col items-center px-6 py-16 text-center">
						<span className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#174309]/10 text-[#174309]">
							<MessagesSquareIcon className="size-7" aria-hidden />
						</span>
						<p className="text-[15px] font-semibold text-foreground">
							{emptyTitle}
						</p>
						<p className="mt-1 max-w-[18rem] text-[13px] leading-snug text-muted-foreground">
							{emptyHint}
						</p>
					</div>
				) : (
					<ul className="divide-y divide-border/60">
						{threads.map((thread, index) => {
							const unread =
								!thread.seen && thread.receiverId === userId;
							const preview =
								thread.lastMessage ||
								(thread.mediaUrl ? mediaLabel : "—");
							return (
								<li key={thread.id || thread.peerId}>
									<Link
										href={hrefForPeer(thread.peerId)}
										className={cn(
											"flex items-center gap-3 px-4 py-3.5 transition-colors duration-150",
											"hover:bg-[#174309]/[0.04] focus-visible:bg-[#174309]/[0.06]",
											"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#174309]/30",
											unread && "bg-[#174309]/[0.03]",
										)}
										style={{
											animationDelay: `${Math.min(index, 8) * 40}ms`,
										}}
									>
										<UserAvatar
											src={thread.peerImage}
											name={thread.peerName}
											size="md"
										/>
										<div className="min-w-0 flex-1">
											<div className="flex items-baseline justify-between gap-2">
												<p
													className={cn(
														"truncate text-[15px] leading-tight",
														unread
															? "font-bold text-foreground"
															: "font-semibold text-foreground",
													)}
												>
													{thread.peerName}
												</p>
												<span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
													{formatThreadTime(thread.timestamp)}
												</span>
											</div>
											<div className="mt-0.5 flex items-center gap-2">
												<p
													className={cn(
														"min-w-0 flex-1 truncate text-[13px] leading-snug",
														unread
															? "font-medium text-foreground/80"
															: "text-muted-foreground",
													)}
												>
													{preview}
												</p>
												{unread ? (
													<span
														className="size-2 shrink-0 rounded-full bg-[#174309]"
														aria-label="Unread"
													/>
												) : null}
											</div>
										</div>
									</Link>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
