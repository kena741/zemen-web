"use client";

import type { ReactNode } from "react";

import { AppGate } from "@/components/app/app-gate";
import { LocaleProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { WebPushSync } from "@/components/push/web-push-sync";
import { RecurringCycleScan } from "@/components/recurring/recurring-cycle-scan";

export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider>
			<LocaleProvider>
				<AppGate>
					<RecurringCycleScan />
					<WebPushSync />
					{children}
				</AppGate>
			</LocaleProvider>
		</ThemeProvider>
	);
}
