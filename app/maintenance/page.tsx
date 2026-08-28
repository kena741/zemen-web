"use client";

import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { useLocale } from "@/lib/i18n";
import { fetchWebAppConfig } from "@/services/config/appConfigApi";

export default function MaintenancePage() {
	const { t } = useLocale();
	const [message, setMessage] = useState(t("maintenanceDefaultBody"));

	useEffect(() => {
		void fetchWebAppConfig().then((c) => {
			if (c.maintenanceMessage) setMessage(c.maintenanceMessage);
		});
	}, []);

	return (
		<AuthShell title={t("maintenanceTitle")}>
			<p className="mt-6 text-center text-sm text-muted-foreground">{message}</p>
		</AuthShell>
	);
}
