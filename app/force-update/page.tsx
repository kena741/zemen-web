"use client";

import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { useLocale } from "@/lib/i18n";

export default function ForceUpdatePage() {
	const { t } = useLocale();
	const [message, setMessage] = useState(t("forceUpdateDefaultBody"));

	useEffect(() => {
		import("@/services/config/appConfigApi").then(({ fetchWebAppConfig }) => {
			void fetchWebAppConfig().then((c) => {
				if (c.updateMessage) setMessage(c.updateMessage);
			});
		});
	}, []);

	return (
		<AuthShell title={t("forceUpdateTitle")}>
			<p className="mt-6 text-center text-sm text-muted-foreground">{message}</p>
		</AuthShell>
	);
}
