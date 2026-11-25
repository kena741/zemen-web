"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ServiceAppLayout } from "@/components/service/service-app-layout";
import { ServiceHomePage } from "@/components/service/service-home-page";
import { AppLoading } from "@/components/ui/app-loading";
import { homePathForMode } from "@/lib/brand";
import { enableGuestBrowse } from "@/lib/guest";
import { selectAuthSessionPending } from "@/store/authSlice";
import { useAppSelector } from "@/store/hooks";
import { useAuth } from "@/store/useAuth";

/** Customer home (guest or signed-in). Marketing is at `/home`. */
export default function RootCustomerHome() {
	const router = useRouter();
	const { user } = useAuth();
	const sessionPending = useAppSelector(selectAuthSessionPending);

	useEffect(() => {
		if (sessionPending) return;
		if (user?.mode === "provider") {
			router.replace(homePathForMode("provider"));
		}
	}, [user, router, sessionPending]);

	// Sync before ServiceAppLayout auth gate so `/` does not bounce to login.
	if (!user && !sessionPending) enableGuestBrowse();

	if (sessionPending || user?.mode === "provider") {
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
