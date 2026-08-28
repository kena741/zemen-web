"use client";

import { MessageCircleIcon } from "lucide-react";

import { useLocale } from "@/lib/i18n";

const TELEGRAM_URL = "https://t.me/zemenservicediscussion";

export function TelegramLink({ className }: { className?: string }) {
	const { t } = useLocale();

	return (
		<a
			href={TELEGRAM_URL}
			target="_blank"
			rel="noopener noreferrer"
			className={
				className ??
				"inline-flex h-10 items-center gap-2 rounded-md border border-subtle px-3 text-sm font-medium text-primary hover:bg-bg-subtle"
			}
		>
			<MessageCircleIcon className="size-4" />
			{t("telegramCommunity")}
		</a>
	);
}
