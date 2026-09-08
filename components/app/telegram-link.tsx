"use client";

import { MessageCircleIcon } from "lucide-react";

import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TELEGRAM_URL = "https://t.me/zemenservicediscussion";

export function TelegramLink({ className }: { className?: string }) {
	const { t } = useLocale();

	return (
		<a
			href={TELEGRAM_URL}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				"inline-flex h-10 flex-row items-center gap-2 rounded-md border border-subtle px-3 text-sm font-medium text-primary hover:bg-bg-subtle",
				className,
			)}
		>
			<MessageCircleIcon className="size-4 shrink-0" />
			{t("telegramCommunity")}
		</a>
	);
}
