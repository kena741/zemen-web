"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppLoading } from "@/components/ui/app-loading";
import { fetchWebAppConfig } from "@/services/config/appConfigApi";

const BYPASS = [
	"/login",
	"/signup",
	"/forgot-password",
	"/reset-password",
	"/verify-email",
	"/verify-phone",
	"/pay",
	"/maintenance",
	"/force-update",
];

export function AppGate({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function run() {
			if (BYPASS.some((p) => pathname === p || pathname?.startsWith(`${p}/`))) {
				if (!cancelled) setReady(true);
				return;
			}

			const config = await fetchWebAppConfig();
			if (cancelled) return;

			if (config.maintenanceMode) {
				router.replace("/maintenance");
				return;
			}
			setReady(true);
		}

		void run();
		return () => {
			cancelled = true;
		};
	}, [pathname, router]);

	if (!ready) {
		return (
			<div className="flex min-h-svh items-center justify-center">
				<AppLoading />
			</div>
		);
	}
	return children;
}
