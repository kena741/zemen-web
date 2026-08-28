"use client";

import { useLocale } from "@/lib/i18n";
import { useTheme } from "@/components/providers/theme-provider";

export function LocaleThemeToggle({ className }: { className?: string }) {
	const { locale, setLocale, t } = useLocale();
	const { theme, setTheme } = useTheme();

	return (
		<div className={className ?? "flex items-center gap-2"}>
			<select
				aria-label={t("language")}
				value={locale}
				onChange={(e) => setLocale(e.target.value as "en" | "am")}
				className="h-8 rounded-md border border-border bg-white px-2 text-xs dark:bg-card"
			>
				<option value="am">አማ</option>
				<option value="en">EN</option>
			</select>
			<select
				aria-label={t("theme")}
				value={theme}
				onChange={(e) => setTheme(e.target.value as "light" | "dark")}
				className="h-8 rounded-md border border-border bg-white px-2 text-xs dark:bg-card"
			>
				<option value="light">{t("light")}</option>
				<option value="dark">{t("dark")}</option>
			</select>
		</div>
	);
}
