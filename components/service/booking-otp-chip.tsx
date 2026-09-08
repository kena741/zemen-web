"use client";

import { useState } from "react";
import { CopyIcon } from "lucide-react";

import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function shouldShowCustomerBookingOtp(
	otp: string | null | undefined,
	status: string | null | undefined,
): boolean {
	if (!otp?.trim()) return false;
	const key = (status ?? "")
		.trim()
		.toLowerCase()
		.replace(/[\s_-]+/g, "");
	return key === "ontheway";
}

export function BookingOtpChip({
	otp,
	className,
}: {
	otp: string;
	className?: string;
}) {
	const { t } = useLocale();
	const [copied, setCopied] = useState(false);
	const code = otp.trim();
	if (!code) return null;

	async function onCopy() {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {
			/* ignore */
		}
	}

	return (
		<button
			type="button"
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				void onCopy();
			}}
			className={cn(
				"inline-flex max-w-full items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-primary-foreground",
				className,
			)}
			title={copied ? t("bookingOtpCopied") : t("bookingCopyOtp")}
		>
			<span className="text-[11px] font-extrabold">{t("bookingOtpLabel")}</span>
			<span className="h-3.5 w-px bg-white/45" />
			<span className="font-extrabold tracking-[0.14em] tabular-nums">
				{code}
			</span>
			<CopyIcon className="size-3.5 opacity-80" />
		</button>
	);
}
