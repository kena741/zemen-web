import { apiFetch } from "@/lib/backend/client";
import { isBackendMode } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";
import { sanitizeImageUrl } from "@/lib/media";
import {
	mapChatRow,
	mapInboxRow,
	mapNotificationRow,
	type AppNotification,
	type ChatMessage,
	type InboxThread,
} from "./types";

async function resolvePeer(
	peerId: string,
): Promise<{ name: string; image: string | null }> {
	const supabase = getSupabase();

	const tryTables: Array<{
		table: string;
		idCols: string[];
		name: (r: Record<string, unknown>) => string;
		image: (r: Record<string, unknown>) => string | null;
	}> = [
		{
			table: "customer",
			idCols: ["id", "user_id"],
			name: (r) =>
				[r.firstName ?? r.first_name, r.lastName ?? r.last_name]
					.filter(Boolean)
					.join(" ")
					.trim() ||
				String(r.email ?? "Customer"),
			image: (r) =>
				sanitizeImageUrl(r.profileImage ?? r.profile_pic),
		},
		{
			table: "handyman",
			idCols: ["id", "user_id"],
			name: (r) =>
				[r.firstName, r.lastName].filter(Boolean).join(" ").trim() ||
				String(r.email ?? "Handyman"),
			image: (r) => sanitizeImageUrl(r.profileImage),
		},
		{
			table: "provider",
			idCols: ["id", "user_id"],
			name: (r) =>
				[r.firstName, r.lastName].filter(Boolean).join(" ").trim() ||
				String(r.email ?? "User"),
			image: (r) => sanitizeImageUrl(r.profileImage),
		},
	];

	for (const t of tryTables) {
		for (const col of t.idCols) {
			const { data } = await supabase
				.from(t.table)
				.select("*")
				.eq(col, peerId)
				.maybeSingle();
			if (data) {
				const row = data as Record<string, unknown>;
				return { name: t.name(row) || "User", image: t.image(row) };
			}
		}
	}
	return { name: "User", image: null };
}

export async function fetchInbox(
	currentUserId: string,
): Promise<{ threads: InboxThread[]; error: string | null }> {
	if (!currentUserId) return { threads: [], error: "Missing user id" };

	if (isBackendMode()) {
		try {
			const page = await apiFetch<
				{ items?: Record<string, unknown>[] } | Record<string, unknown>[]
			>("/chats/inbox", { auth: true });
			const rows = Array.isArray(page) ? page : (page.items ?? []);
			const threads = rows.map((row) => {
				const base = mapInboxRow(row, currentUserId);
				return {
					...base,
					peerName:
						row.peerName != null
							? String(row.peerName)
							: row.peer_name != null
								? String(row.peer_name)
								: "User",
					peerImage:
						row.peerImage != null
							? String(row.peerImage)
							: row.peer_image != null
								? String(row.peer_image)
								: null,
				};
			});
			return { threads, error: null };
		} catch (e) {
			return {
				threads: [],
				error: e instanceof Error ? e.message : "Failed to load inbox",
			};
		}
	}

	const { data, error } = await getSupabase()
		.from("chat_inbox")
		.select("*")
		.or(`senderId.eq.${currentUserId},receiverId.eq.${currentUserId}`)
		.order("timestamp", { ascending: false });

	if (error) {
		console.error("fetchInbox", error);
		return { threads: [], error: error.message };
	}

	const base = (data ?? []).map((row) =>
		mapInboxRow(row as Record<string, unknown>, currentUserId),
	);

	const peers = await Promise.all(
		base.map(async (t) => {
			const peer = t.peerId
				? await resolvePeer(t.peerId)
				: { name: "User", image: null };
			return {
				...t,
				peerName: peer.name,
				peerImage: peer.image,
			} satisfies InboxThread;
		}),
	);

	return { threads: peers, error: null };
}

export async function fetchChatMessages(params: {
	currentUserId: string;
	peerId: string;
}): Promise<{ messages: ChatMessage[]; error: string | null }> {
	const { currentUserId, peerId } = params;

	if (isBackendMode()) {
		try {
			const page = await apiFetch<
				{ items?: Record<string, unknown>[] } | Record<string, unknown>[]
			>(`/chats/${peerId}/messages`, { auth: true });
			const rows = Array.isArray(page) ? page : (page.items ?? []);
			return {
				messages: rows.map((row) => mapChatRow(row)),
				error: null,
			};
		} catch (e) {
			return {
				messages: [],
				error: e instanceof Error ? e.message : "Failed to load messages",
			};
		}
	}

	const { data, error } = await getSupabase()
		.from("chat")
		.select("*")
		.or(
			`senderId.eq.${currentUserId},receiverId.eq.${currentUserId}`,
		)
		.order("timestamp", { ascending: true });

	if (error) {
		console.error("fetchChatMessages", error);
		return { messages: [], error: error.message };
	}

	const messages = (data ?? [])
		.map((row) => mapChatRow(row as Record<string, unknown>))
		.filter(
			(m) =>
				(m.senderId === currentUserId && m.receiverId === peerId) ||
				(m.senderId === peerId && m.receiverId === currentUserId),
		);

	return { messages, error: null };
}

export async function resolveChatPeer(peerId: string) {
	return resolvePeer(peerId);
}

export async function sendChatMessage(params: {
	senderId: string;
	receiverId: string;
	message: string;
}): Promise<{ ok: boolean; error: string | null }> {
	const text = params.message.trim();
	if (!text) return { ok: false, error: "Message is empty" };

	if (isBackendMode()) {
		try {
			await apiFetch("/chats/send", {
				method: "POST",
				auth: true,
				body: {
					receiver_id: params.receiverId,
					message: text,
					type: "text",
				},
			});
			return { ok: true, error: null };
		} catch (e) {
			return {
				ok: false,
				error: e instanceof Error ? e.message : "Send failed",
			};
		}
	}

	const supabase = getSupabase();
	const now = new Date().toISOString();
	const chatID = crypto.randomUUID();

	const { error } = await supabase.from("chat").insert({
		chatID,
		type: "text",
		senderId: params.senderId,
		receiverId: params.receiverId,
		message: text,
		mediaUrl: "",
		seen: false,
		timestamp: now,
	});

	if (error) return { ok: false, error: error.message };

	const inboxId = `${params.senderId}_${params.receiverId}`;
	await supabase.from("chat_inbox").upsert({
		id: inboxId,
		lastMessage: text,
		mediaUrl: "",
		senderId: params.senderId,
		receiverId: params.receiverId,
		seen: false,
		type: "text",
		timestamp: now,
		updated_at: now,
	});

	return { ok: true, error: null };
}

export async function markChatSeen(params: {
	currentUserId: string;
	peerId: string;
}): Promise<void> {
	if (isBackendMode()) {
		try {
			await apiFetch(`/chats/${params.peerId}/seen`, {
				method: "POST",
				auth: true,
			});
		} catch (e) {
			console.error("markChatSeen backend", e);
		}
		return;
	}

	await getSupabase()
		.from("chat")
		.update({ seen: true })
		.eq("senderId", params.peerId)
		.eq("receiverId", params.currentUserId)
		.eq("seen", false);
}

export async function fetchNotifications(
	providerId: string,
): Promise<{ notifications: AppNotification[]; error: string | null }> {
	if (!providerId) return { notifications: [], error: "Missing provider id" };

	if (isBackendMode()) {
		try {
			const page = await apiFetch<
				{ items?: Record<string, unknown>[] } | Record<string, unknown>[]
			>("/notifications", { auth: true });
			const rows = Array.isArray(page) ? page : (page.items ?? []);
			return {
				notifications: rows.map((row) => mapNotificationRow(row)),
				error: null,
			};
		} catch (e) {
			return {
				notifications: [],
				error:
					e instanceof Error ? e.message : "Failed to load notifications",
			};
		}
	}

	const { data, error } = await getSupabase()
		.from("notification")
		.select("*")
		.eq("provider_id", providerId)
		.order("created_at", { ascending: false })
		.limit(100);

	if (error) {
		console.error("fetchNotifications", error);
		return { notifications: [], error: error.message };
	}

	return {
		notifications: (data ?? []).map((row) =>
			mapNotificationRow(row as Record<string, unknown>),
		),
		error: null,
	};
}

export async function fetchCustomerNotifications(
	customerId: string,
): Promise<{ notifications: AppNotification[]; error: string | null }> {
	if (!customerId) {
		return { notifications: [], error: "Missing customer id" };
	}

	if (isBackendMode()) {
		try {
			const page = await apiFetch<
				{ items?: Record<string, unknown>[] } | Record<string, unknown>[]
			>("/notifications", { auth: true });
			const rows = Array.isArray(page) ? page : (page.items ?? []);
			return {
				notifications: rows.map((row) => mapNotificationRow(row)),
				error: null,
			};
		} catch (e) {
			return {
				notifications: [],
				error:
					e instanceof Error ? e.message : "Failed to load notifications",
			};
		}
	}

	const { data, error } = await getSupabase()
		.from("notification")
		.select("*")
		.eq("customer_id", customerId)
		.order("created_at", { ascending: false })
		.limit(100);

	if (error) {
		console.error("fetchCustomerNotifications", error);
		return { notifications: [], error: error.message };
	}

	return {
		notifications: (data ?? []).map((row) =>
			mapNotificationRow(row as Record<string, unknown>),
		),
		error: null,
	};
}
