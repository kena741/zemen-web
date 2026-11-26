"use client";

import { ChatInboxList } from "@/components/chat/chat-inbox-list";
import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/store/useAuth";
import { useCachedProviderInbox } from "@/store/useProviderCache";

export default function InboxPage() {
	const { t } = useLocale();
	const { user } = useAuth();
	const userId = user?.id ?? "";
	const { data: threads, loading, error } =
		useCachedProviderInbox(userId);

	const countLabel =
		threads.length === 1
			? t("providerInboxCountOne")
			: t("providerInboxCount", { count: threads.length });

	return (
		<ChatInboxList
			threads={threads}
			userId={userId}
			hrefForPeer={(peerId) => `/provider/inbox/${peerId}`}
			loading={loading}
			error={error}
			title={t("inboxTitle")}
			countLabel={countLabel}
			emptyTitle={t("providerNoConversations")}
			emptyHint={t("providerInboxEmptyHint")}
			mediaLabel={t("commonMedia")}
			backSlot={
				<ProfileBackLink href="/provider" label={t("navDashboard")} />
			}
		/>
	);
}
