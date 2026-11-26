"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, SendIcon } from "lucide-react";

import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import {
	fetchChatMessages,
	markChatSeen,
	resolveChatPeer,
	sendChatMessage,
} from "@/services/chat/chatApi";
import type { ChatMessage } from "@/services/chat/types";

function formatBubbleTime(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});
}

export function ChatThread({
	peerId,
	userId,
	backHref,
	defaultPeerName,
	placeholder,
	emptyLabel,
	subtitle,
	onSent,
}: {
	peerId: string;
	userId: string;
	backHref: string;
	defaultPeerName: string;
	placeholder: string;
	emptyLabel: string;
	subtitle: string;
	onSent?: () => void;
}) {
	const router = useRouter();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [peerName, setPeerName] = useState(defaultPeerName);
	const [peerImage, setPeerImage] = useState<string | null>(null);
	const [text, setText] = useState("");
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const load = useCallback(
		async (opts?: { quiet?: boolean }) => {
			if (!userId || !peerId) return;
			if (!opts?.quiet) setLoading(true);
			const [chat, peer] = await Promise.all([
				fetchChatMessages({ currentUserId: userId, peerId }),
				resolveChatPeer(peerId),
			]);
			setMessages(chat.messages);
			setPeerName(peer.name || defaultPeerName);
			setPeerImage(peer.image);
			if (chat.error) setError(chat.error);
			else if (!opts?.quiet) setError(null);
			setLoading(false);
			await markChatSeen({ currentUserId: userId, peerId });
		},
		[userId, peerId, defaultPeerName],
	);

	useEffect(() => {
		void load();
		const timer = window.setInterval(() => {
			void load({ quiet: true });
		}, 8000);
		return () => window.clearInterval(timer);
	}, [load]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]);

	async function handleSend(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = text.trim();
		if (!trimmed || !userId || !peerId || busy) return;
		setBusy(true);
		setError(null);

		const optimistic: ChatMessage = {
			chatID: `local-${Date.now()}`,
			type: "text",
			senderId: userId,
			receiverId: peerId,
			message: trimmed,
			mediaUrl: null,
			seen: true,
			timestamp: new Date().toISOString(),
		};
		setMessages((prev) => [...prev, optimistic]);
		setText("");

		const res = await sendChatMessage({
			senderId: userId,
			receiverId: peerId,
			message: trimmed,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			setMessages((prev) =>
				prev.filter((m) => m.chatID !== optimistic.chatID),
			);
			setText(trimmed);
			inputRef.current?.focus();
			return;
		}
		onSent?.();
		await load({ quiet: true });
	}

	return (
		<div className="relative mx-auto flex h-[calc(100svh-1rem)] w-full max-w-2xl flex-col overflow-hidden bg-[#f3f7f1] md:h-[calc(100svh-2rem)] md:rounded-[1.25rem] md:shadow-[0_12px_40px_rgba(14,38,4,0.08)] md:ring-1 md:ring-black/[0.04]">
			<header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-black/[0.06] bg-white/90 px-2 py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 pt-[max(0.5rem,env(safe-area-inset-top))]">
				<button
					type="button"
					onClick={() => router.push(backHref)}
					className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174309]/40"
					aria-label="Back"
				>
					<ArrowLeftIcon className="size-5" />
				</button>
				<UserAvatar src={peerImage} name={peerName} size="sm" />
				<div className="min-w-0 flex-1 pr-2">
					<p className="truncate text-[15px] font-semibold leading-tight">
						{peerName}
					</p>
					<p className="text-[11px] font-medium text-muted-foreground">
						{subtitle}
					</p>
				</div>
			</header>

			{error ? (
				<div
					role="alert"
					className="mx-3 mt-2 shrink-0 rounded-xl bg-destructive/10 px-3 py-2 text-[13px] font-medium text-destructive"
				>
					{error}
				</div>
			) : null}

			<div
				ref={listRef}
				className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4"
			>
				{loading && messages.length === 0 ? (
					<div className="space-y-3 pt-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className={cn(
									"flex",
									i % 2 === 0 ? "justify-start" : "justify-end",
								)}
							>
								<div
									className={cn(
										"h-10 animate-pulse rounded-2xl bg-black/[0.06]",
										i % 2 === 0 ? "w-2/5" : "w-1/3",
									)}
								/>
							</div>
						))}
					</div>
				) : messages.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center px-6 text-center">
						<p className="text-[14px] font-medium text-muted-foreground">
							{emptyLabel}
						</p>
					</div>
				) : (
					messages.map((m) => {
						const mine = m.senderId === userId;
						return (
							<div
								key={m.chatID}
								className={cn(
									"flex",
									mine ? "justify-end" : "justify-start",
								)}
							>
								<div
									className={cn(
										"max-w-[78%] rounded-[1.15rem] px-3.5 py-2 text-[14px] leading-snug shadow-sm",
										mine
											? "rounded-br-md bg-[#174309] text-[#f4faf0]"
											: "rounded-bl-md bg-white text-foreground ring-1 ring-black/[0.04]",
									)}
								>
									<p className="whitespace-pre-wrap break-words">
										{m.message}
									</p>
									<p
										className={cn(
											"mt-1 text-right text-[10px] font-medium tabular-nums",
											mine
												? "text-[#f4faf0]/65"
												: "text-muted-foreground",
										)}
									>
										{formatBubbleTime(m.timestamp)}
									</p>
								</div>
							</div>
						);
					})
				)}
				<div ref={bottomRef} />
			</div>

			<form
				onSubmit={handleSend}
				className="shrink-0 border-t border-black/[0.06] bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-sm"
			>
				<div className="flex items-center gap-2">
					<input
						ref={inputRef}
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder={placeholder}
						autoComplete="off"
						className={cn(
							"h-12 min-w-0 flex-1 rounded-full border-0 bg-muted/80 px-4 text-[14px] shadow-none",
							"placeholder:text-muted-foreground",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174309]/25",
						)}
					/>
					<button
						type="submit"
						disabled={busy || !text.trim()}
						aria-label="Send"
						className={cn(
							"inline-flex size-12 shrink-0 items-center justify-center rounded-full",
							"bg-[#174309] text-[#f4faf0] shadow-[0_4px_14px_rgba(23,67,9,0.28)]",
							"transition-all duration-150 hover:bg-[#1f5a0b]",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174309]/40 focus-visible:ring-offset-2",
							"disabled:pointer-events-none disabled:opacity-40",
						)}
					>
						<SendIcon className="size-5 translate-x-px" />
					</button>
				</div>
			</form>
		</div>
	);
}
