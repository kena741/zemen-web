"use client";

import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function ForceUpdatePage() {
	const { t } = useLocale();

	return (
		<AuthShell title={t("forceUpdateTitle")}>
			<p className="mt-6 text-center text-sm text-muted-foreground">
				{t("forceUpdateDefaultBody")}
			</p>
			<Link
				href="/login"
				className={cn(buttonVariants(), "mt-8 w-full")}
			>
				{t("signIn")}
			</Link>
		</AuthShell>
	);
}
