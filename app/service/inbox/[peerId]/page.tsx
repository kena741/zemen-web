"use client";

import { useParams } from "next/navigation";

import { ChatThread } from "@/components/chat/chat-thread";
import { useLocale } from "@/lib/i18n";
import { useAppDispatch } from "@/store/hooks";
import { invalidateInbox } from "@/store/customerCacheSlice";
import { useAuth } from "@/store/useAuth";

export default function CustomerChatPage() {
	const { t } = useLocale();
	const params = useParams<{ peerId: string }>();
	const peerId = params?.peerId ?? "";
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const userId = user?.id ?? "";

	return (
		<ChatThread
			peerId={peerId}
			userId={userId}
			backHref="/service/inbox"
			defaultPeerName={t("chatDefault")}
			placeholder={t("chatPlaceholder")}
			emptyLabel={t("chatEmpty")}
			subtitle={t("chatConversation")}
			onSent={() => dispatch(invalidateInbox())}
		/>
	);
}
