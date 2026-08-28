"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, SendIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceLoading } from "@/components/service/service-loading";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/services/bookings/types";
import {
	fetchChatMessages,
	markChatSeen,
	resolveChatPeer,
	sendChatMessage,
} from "@/services/chat/chatApi";
import type { ChatMessage } from "@/services/chat/types";
import { useAuth } from "@/store/useAuth";

export default function CustomerChatPage() {
	const { t } = useLocale();
	const params = useParams<{ peerId: string }>();
	const peerId = params?.peerId ?? "";
	const router = useRouter();
	const { user } = useAuth();
	const userId = user?.id ?? "";
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [peerName, setPeerName] = useState(t("chatDefault"));
	const [text, setText] = useState("");
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	const load = useCallback(async () => {
		if (!userId || !peerId) return;
		setLoading(true);
		const [chat, peer] = await Promise.all([
			fetchChatMessages({ currentUserId: userId, peerId }),
			resolveChatPeer(peerId),
		]);
		setMessages(chat.messages);
		setPeerName(peer.name);
		setError(chat.error);
		setLoading(false);
		await markChatSeen({ currentUserId: userId, peerId });
	}, [userId, peerId]);

	useEffect(() => {
		void load();
		const timer = window.setInterval(() => {
			void fetchChatMessages({ currentUserId: userId, peerId }).then(
				(res) => {
					if (!res.error) setMessages(res.messages);
				},
			);
		}, 8000);
		return () => window.clearInterval(timer);
	}, [load, userId, peerId]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]);

	async function handleSend(e: React.FormEvent) {
		e.preventDefault();
		if (!text.trim() || !userId || !peerId) return;
		setBusy(true);
		setError(null);
		const res = await sendChatMessage({
			senderId: userId,
			receiverId: peerId,
			message: text,
		});
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		setText("");
		await load();
	}

	return (
		<div
			className="mx-auto flex max-w-2xl flex-col px-4 pt-4 md:px-6 md:pt-8"
			style={{ minHeight: "70vh" }}
		>
			<div className="flex items-center gap-2 border-b border-border pb-3">
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => router.push("/service/inbox")}
				>
					<ArrowLeftIcon className="size-4" />
				</Button>
				<div>
					<p className="text-sm font-semibold">{peerName}</p>
					<p className="text-xs text-muted-foreground">{t("chatConversation")}</p>
				</div>
			</div>

			{error ? (
				<Alert variant="destructive" className="mt-3">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<div className="mt-4 flex-1 space-y-2 overflow-y-auto rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
				{loading ? (
					<ServiceLoading compact />
				) : messages.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						{t("chatEmpty")}
					</p>
				) : (
					messages.map((m) => {
						const mine = m.senderId === userId;
						return (
							<div
								key={m.chatID}
								className={cn("flex", mine ? "justify-end" : "justify-start")}
							>
								<div
									className={cn(
										"max-w-[80%] rounded-2xl px-3 py-2 text-sm",
										mine
											? "bg-primary text-primary-foreground"
											: "bg-muted text-foreground",
									)}
								>
									<p className="whitespace-pre-wrap break-words">
										{m.message}
									</p>
									<p
										className={cn(
											"mt-1 text-[10px]",
											mine
												? "text-primary-foreground/70"
												: "text-muted-foreground",
										)}
									>
										{formatDateTime(m.timestamp)}
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
				className="mt-3 flex gap-2 pb-[env(safe-area-inset-bottom)]"
			>
				<Input
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder={t("chatPlaceholder")}
					className="flex-1 bg-white"
				/>
				<Button type="submit" disabled={busy || !text.trim()} size="icon">
					<SendIcon className="size-4" />
				</Button>
			</form>
		</div>
	);
}
