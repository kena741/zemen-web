"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { ServiceAppLayout } from "@/components/service/service-app-layout";
import { ServiceHomePage } from "@/components/service/service-home-page";
import { AppLoading } from "@/components/ui/app-loading";
import { homePathForMode } from "@/lib/brand";
import { enableGuestBrowse } from "@/lib/guest";
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

	useEffect(() => {
		if (!isTelebirrMiniApp()) {
			router.replace("/home");
			return;
		}
	}, [router]);

	useEffect(() => {
		if (!isMiniApp) return;
		if (sessionPending) return;
		if (user?.mode === "provider") {
			router.replace(homePathForMode("provider"));
		}
	}, [isMiniApp, user, router, sessionPending]);

	// Sync before ServiceAppLayout auth gate so `/` does not bounce to login.
	if (isMiniApp && !user && !sessionPending) enableGuestBrowse();

	if (!isMiniApp || sessionPending || user?.mode === "provider") {
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
