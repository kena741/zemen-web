"use client";

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
				"inline-flex items-center rounded-full bg-black/4 p-0.5",
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
	tone = "default",
}: {
	selected: boolean;
	onClick: () => void;
	ariaLabel: string;
	children: React.ReactNode;
	className?: string;
	tone?: "default" | "onDark";
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
					? "bg-white text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
					: tone === "onDark"
						? "text-white/80 hover:text-white"
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
	/** Profile rows can show only language. Theme switching is disabled. */
	mode?: "both" | "locale" | "theme";
}) {
	const { locale, setLocale, t } = useLocale();

	/** Light mode only — never show the dark/light toggle. */
	if (mode === "theme") return null;

	return (
		<div
			className={cn(
				"flex items-center gap-1.5",
				variant === "auth" &&
					"rounded-full border border-white/25 bg-black/25 p-1 text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] backdrop-blur-md",
				className,
			)}
		>
			<SegmentedControl ariaLabel={t("language")}>
				<SegmentButton
					selected={locale === "am"}
					onClick={() => setLocale("am")}
					ariaLabel="አማርኛ"
					className="min-w-10"
					tone={variant === "auth" ? "onDark" : "default"}
				>
					አማ
				</SegmentButton>
				<SegmentButton
					selected={locale === "en"}
					onClick={() => setLocale("en")}
					ariaLabel="English"
					className="min-w-10"
					tone={variant === "auth" ? "onDark" : "default"}
				>
					EN
				</SegmentButton>
			</SegmentedControl>
		</div>
	);
}
