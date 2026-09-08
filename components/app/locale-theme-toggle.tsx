"use client";

import { MoonIcon, SunIcon } from "lucide-react";

import { useTheme } from "@/components/providers/theme-provider";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function SegmentedControl({
	ariaLabel,
	className,
	children,
}: {
	ariaLabel: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			role="group"
			aria-label={ariaLabel}
			className={cn(
				"inline-flex items-center rounded-full bg-black/[0.04] p-0.5 dark:bg-white/10",
				className,
			)}
		>
			{children}
		</div>
	);
}

function SegmentButton({
	selected,
	onClick,
	ariaLabel,
	children,
	className,
}: {
	selected: boolean;
	onClick: () => void;
	ariaLabel: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<button
			type="button"
			aria-label={ariaLabel}
			aria-pressed={selected}
			onClick={onClick}
			className={cn(
				"inline-flex h-8 items-center justify-center gap-1 rounded-full px-2.5 text-[12px] font-semibold transition-all duration-150",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
				selected
					? "bg-white text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:bg-card dark:text-foreground"
					: "text-muted-foreground hover:text-foreground",
				className,
			)}
		>
			{children}
		</button>
	);
}

export function LocaleThemeToggle({
	className,
	variant = "default",
	mode = "both",
}: {
	className?: string;
	/** Auth header: frosted glass cluster. */
	variant?: "default" | "auth";
	/** Profile rows can show only language or only theme. */
	mode?: "both" | "locale" | "theme";
}) {
	const { locale, setLocale, t } = useLocale();
	const { theme, setTheme } = useTheme();

	const showLocale = mode === "both" || mode === "locale";
	const showTheme = mode === "both" || mode === "theme";

	return (
		<div
			className={cn(
				"flex items-center gap-1.5",
				variant === "auth" &&
					"rounded-full border border-black/5 bg-white/70 p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-md dark:border-white/10 dark:bg-card/80",
				className,
			)}
		>
			{showLocale ? (
				<SegmentedControl ariaLabel={t("language")}>
					<SegmentButton
						selected={locale === "am"}
						onClick={() => setLocale("am")}
						ariaLabel="አማርኛ"
						className="min-w-[2.5rem]"
					>
						አማ
					</SegmentButton>
					<SegmentButton
						selected={locale === "en"}
						onClick={() => setLocale("en")}
						ariaLabel="English"
						className="min-w-[2.5rem]"
					>
						EN
					</SegmentButton>
				</SegmentedControl>
			) : null}

			{showLocale && showTheme ? (
				<span
					aria-hidden
					className={cn(
						"h-4 w-px bg-black/10 dark:bg-white/15",
						variant === "default" && "mx-0.5",
					)}
				/>
			) : null}

			{showTheme ? (
				<SegmentedControl ariaLabel={t("theme")}>
					<SegmentButton
						selected={theme === "light"}
						onClick={() => setTheme("light")}
						ariaLabel={t("light")}
						className="w-8 px-0"
					>
						<SunIcon className="size-3.5" strokeWidth={2.25} />
					</SegmentButton>
					<SegmentButton
						selected={theme === "dark"}
						onClick={() => setTheme("dark")}
						ariaLabel={t("dark")}
						className="w-8 px-0"
					>
						<MoonIcon className="size-3.5" strokeWidth={2.25} />
					</SegmentButton>
				</SegmentedControl>
			) : null}
		</div>
	);
}
