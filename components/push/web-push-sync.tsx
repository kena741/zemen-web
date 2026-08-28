"use client";

import { useEffect } from "react";

import { useAuth } from "@/store/useAuth";
import { saveFcmToken } from "@/services/auth/verificationApi";
import { getWebFcmToken, isFirebaseConfigured } from "@/lib/firebase";

export function WebPushSync() {
	const { user } = useAuth();

	useEffect(() => {
		if (!user || typeof window === "undefined") return;
		if (!("Notification" in window)) return;

		async function sync() {
			if (Notification.permission === "denied") return;
			let permission: NotificationPermission = Notification.permission;
			if (permission === "default") {
				permission = await Notification.requestPermission();
			}
			if (permission !== "granted") return;

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
