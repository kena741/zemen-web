"use client";

import { useEffect } from "react";

import { useAuth } from "@/store/useAuth";
import { saveFcmToken } from "@/services/auth/verificationApi";
import { getWebFcmToken, isFirebaseConfigured } from "@/lib/firebase";

/**
 * Sync FCM token when notifications are already granted.
 * Does not call requestPermission() — browsers (especially Android) block
 * auto-prompts without a user gesture / when overlays are present.
 */
export function WebPushSync() {
	const { user } = useAuth();

	useEffect(() => {
		if (!user || typeof window === "undefined") return;
		if (!("Notification" in window)) return;
		if (Notification.permission !== "granted") return;

		async function sync() {
			let token: string | null = null;
			if (isFirebaseConfigured()) {
				if ("serviceWorker" in navigator) {
					await navigator.serviceWorker.register("/firebase-messaging-sw.js");
				}
				token = await getWebFcmToken();
			}
			if (!token) {
				token = `web:${user!.id}:${navigator.userAgent.slice(0, 40)}`;
			}

			await saveFcmToken({
				userId:
					user!.mode === "provider"
						? user!.provider?.id ?? user!.id
						: user!.customer?.id ?? user!.id,
				mode: user!.mode === "provider" ? "provider" : "service",
				token,
			});
		}

		void sync();
	}, [user]);

	return null;
}
