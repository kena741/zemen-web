"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppLoading } from "@/components/ui/app-loading";
import { fetchWebAppConfig } from "@/services/config/appConfigApi";

/** Auth/utility routes that skip config checks entirely. */
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

/** Public marketing/SEO routes: render immediately for crawlers and users. */
const PUBLIC_SEO = ["/", "/about", "/services", "/locations", "/legal"];

function isBypass(pathname: string | null): boolean {
	if (!pathname) return false;
	return BYPASS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPublicSeo(pathname: string | null): boolean {
	if (!pathname) return false;
	return PUBLIC_SEO.some((p) =>
		p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`),
	);
}

export function AppGate({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const publicSeo = isPublicSeo(pathname);
	const bypass = isBypass(pathname);
	const [ready, setReady] = useState(publicSeo || bypass);

	useEffect(() => {
		let cancelled = false;

		async function run() {
			if (bypass) {
				if (!cancelled) setReady(true);
				return;
			}

			// Public SEO pages render immediately; still honor maintenance mode.
			if (publicSeo) {
				if (!cancelled) setReady(true);
				const config = await fetchWebAppConfig();
				if (cancelled) return;
				if (config.maintenanceMode) {
					router.replace("/maintenance");
				}
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
	}, [pathname, router, publicSeo, bypass]);

	if (!ready) {
		return (
			<div className="flex min-h-svh items-center justify-center">
				<AppLoading />
			</div>
		);
	}
	return children;
}
