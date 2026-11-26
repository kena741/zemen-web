"use client";

import { useParams } from "next/navigation";

import { ChatThread } from "@/components/chat/chat-thread";
import { useLocale } from "@/lib/i18n";
import { useAppDispatch } from "@/store/hooks";
import { invalidateProviderInbox } from "@/store/providerCacheSlice";
import { useAuth } from "@/store/useAuth";

export default function ChatThreadPage() {
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
			backHref="/provider/inbox"
			defaultPeerName={t("providerChatDefault")}
			placeholder={t("providerMessagePlaceholder")}
			emptyLabel={t("providerNoMessages")}
			subtitle={t("commonConversation")}
			onSent={() => dispatch(invalidateProviderInbox())}
		/>
	);
}
