"use client";

import { ChatInboxList } from "@/components/chat/chat-inbox-list";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { useLocale } from "@/lib/i18n";
import { chatActorId } from "@/services/chat/chatApi";
import { useAuth } from "@/store/useAuth";
import { useCachedInbox } from "@/store/useCustomerCache";

export default function CustomerInboxPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const userId = chatActorId(user);
	const { data: threads, loading, error } = useCachedInbox(userId);

	const countLabel =
		threads.length === 1
			? t("inboxCountOne")
			: t("inboxCount", { count: threads.length });

	return (
		<ChatInboxList
			threads={threads}
			userId={userId}
			hrefForPeer={(peerId) => `/service/inbox/${peerId}`}
			loading={loading}
			error={error}
			title={t("inboxTitle")}
			countLabel={countLabel}
			emptyTitle={t("inboxEmpty")}
			emptyHint={t("inboxEmptyHint")}
			mediaLabel={t("inboxMedia")}
			backSlot={<ProfileBackLink href="/" label={t("navHome")} />}
		/>
	);
}
