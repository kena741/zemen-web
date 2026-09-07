"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { saveFcmToken } from "@/services/auth/verificationApi";
import { getWebFcmToken, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";

export function NotificationPermissionControl() {
	const { t } = useLocale();
	const { user } = useAuth();
	const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
		"default",
	);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !("Notification" in window)) {
			setPermission("unsupported");
			return;
		}
		setPermission(Notification.permission);
	}, []);

	async function enable() {
		if (!user || !("Notification" in window)) return;
		setBusy(true);
		const next = await Notification.requestPermission();
		setPermission(next);
		if (next === "granted") {
			let token: string | null = null;
			if (isFirebaseConfigured()) {
				if ("serviceWorker" in navigator) {
					await navigator.serviceWorker.register("/firebase-messaging-sw.js");
				}
				token = await getWebFcmToken();
			}
			if (!token) {
				token = `web:${user.id}:${navigator.userAgent.slice(0, 40)}`;
			}
			await saveFcmToken({
				userId:
					user.mode === "provider"
						? user.provider?.id ?? user.id
						: user.customer?.id ?? user.id,
				mode: user.mode === "provider" ? "provider" : "service",
				token,
			});
		}
		setBusy(false);
	}

	const label =
		permission === "unsupported"
			? t("notificationsUnsupported")
			: permission === "granted"
				? t("notificationsEnabled")
				: permission === "denied"
					? t("notificationsBlocked")
					: t("notificationsEnable");

	return (
		<div className="flex items-center justify-between gap-3 px-4 py-3.5">
			<div className="min-w-0">
				<p className="text-sm">{t("notificationsPermission")}</p>
				<p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
			</div>
			{permission === "default" ? (
				<Button size="sm" variant="outline" disabled={busy} onClick={() => void enable()}>
					{t("commonEnable")}
				</Button>
			) : null}
		</div>
	);
}
