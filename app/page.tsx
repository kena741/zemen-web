"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { ServiceAppLayout } from "@/components/service/service-app-layout";
import { ServiceHomePage } from "@/components/service/service-home-page";
import { AppLoading } from "@/components/ui/app-loading";
import { homePathForMode } from "@/lib/brand";
import { enableGuestBrowse, isGuestBrowse } from "@/lib/guest";
import { isTelebirrMiniApp } from "@/lib/telebirr-miniapp";
import { selectAuthSessionPending } from "@/store/authSlice";
import { useAppSelector } from "@/store/hooks";
import { useAuth } from "@/store/useAuth";

function subscribeToMiniAppDetection() {
	return () => {};
}

/** Customer home (guest or signed-in). Marketing is at `/home`. */
export default function RootCustomerHome() {
	const router = useRouter();
	const isMiniApp = useSyncExternalStore(
		subscribeToMiniAppDetection,
		isTelebirrMiniApp,
		() => false,
	);
	const { user } = useAuth();
	const sessionPending = useAppSelector(selectAuthSessionPending);
	// Miniapp, signed-in customer, or guest browse → app. Else marketing.
	const allowApp =
		isMiniApp || Boolean(user && user.mode !== "provider") || isGuestBrowse();

	useEffect(() => {
		if (sessionPending) return;
		if (user?.mode === "provider") {
			router.replace(homePathForMode("provider"));
			return;
		}
		// ponytail: avoid / ↔ /home loop when landing redirects signed-in users to `/`
		if (!allowApp) router.replace("/home");
	}, [allowApp, user, router, sessionPending]);

	// Sync before ServiceAppLayout auth gate so `/` does not bounce to login.
	if (allowApp && !user && !sessionPending) enableGuestBrowse();

	if (!allowApp || sessionPending || user?.mode === "provider") {
		return (
			<div className="flex min-h-svh items-center justify-center">
				<AppLoading />
			</div>
		);
	}

	return (
		<ServiceAppLayout>
			<ServiceHomePage />
		</ServiceAppLayout>
	);
}
