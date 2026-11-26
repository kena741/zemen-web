export interface InboxThread {
	id: string;
	lastMessage: string | null;
	mediaUrl: string | null;
	senderId: string | null;
	receiverId: string | null;
	seen: boolean;
	type: string | null;
	timestamp: string | null;
	peerId: string;
	peerName: string;
	peerImage: string | null;
}

export interface ChatMessage {
	chatID: string;
	type: string | null;
	senderId: string | null;
	receiverId: string | null;
	message: string | null;
	mediaUrl: string | null;
	seen: boolean;
	timestamp: string | null;
}

export interface AppNotification {
	id: string;
	type: string | null;
	title: string | null;
	description: string | null;
	bookingId: string | null;
	customerId: string | null;
	handymanId: string | null;
	providerId: string | null;
	senderId: string | null;
	isRead: boolean;
	createdAt: string | null;
}

function asString(value: unknown): string | null {
	if (value == null) return null;
	const s = String(value).trim();
	return s.length ? s : null;
}

function pick(
	row: Record<string, unknown>,
	...keys: string[]
): string | null {
	for (const key of keys) {
		const v = asString(row[key]);
		if (v) return v;
	}
	return null;
}

export function mapInboxRow(
	row: Record<string, unknown>,
	currentUserId: string,
): Omit<InboxThread, "peerName" | "peerImage"> {
	const senderId = pick(row, "senderId", "sender_id");
	const receiverId = pick(row, "receiverId", "receiver_id");
	const peerId =
		senderId === currentUserId
			? (receiverId ?? "")
			: (senderId ?? "");
	return {
		id: String(row.id ?? `${senderId}_${receiverId}`),
		lastMessage: pick(row, "lastMessage", "last_message"),
		mediaUrl: pick(row, "mediaUrl", "media_url"),
		senderId,
		receiverId,
		seen: Boolean(row.seen),
		type: pick(row, "type"),
		timestamp: pick(row, "timestamp"),
		peerId,
	};
}

export function mapChatRow(row: Record<string, unknown>): ChatMessage {
	return {
		chatID: pick(row, "chatID", "chat_id", "id") ?? "",
		type: pick(row, "type"),
		senderId: pick(row, "senderId", "sender_id"),
		receiverId: pick(row, "receiverId", "receiver_id"),
		message: pick(row, "message"),
		mediaUrl: pick(row, "mediaUrl", "media_url"),
		seen: Boolean(row.seen),
		timestamp: pick(row, "timestamp"),
	};
}

export function mapNotificationRow(
	row: Record<string, unknown>,
): AppNotification {
	return {
		id: String(row.id ?? ""),
		type: asString(row.type),
		title: asString(row.title),
		description: asString(row.description),
		bookingId: asString(row.booking_id ?? row.bookingId),
		customerId: asString(row.customer_id ?? row.customerId),
		handymanId: asString(row.handyman_id ?? row.handymanId),
		providerId: asString(row.provider_id ?? row.providerId),
		senderId: asString(row.sender_id ?? row.senderId),
		isRead: Boolean(row.is_read ?? row.isRead),
		createdAt: asString(row.created_at ?? row.createdAt),
	};
}
