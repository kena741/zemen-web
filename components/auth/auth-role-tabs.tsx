"use client";

import { HammerIcon, UserIcon } from "lucide-react";

import type { AppMode } from "@/lib/brand";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AuthRoleTabs({
	value,
	onChange,
	ariaLabel,
}: {
	value: AppMode;
	onChange: (mode: AppMode) => void;
	ariaLabel?: string;
}) {
	const { t } = useLocale();
	const options = [
		{
			mode: "provider" as const,
			label: t("provider"),
			Icon: HammerIcon,
		},
		{
			mode: "service" as const,
			label: t("customer"),
			Icon: UserIcon,
		},
	];

	return (
		<div
			className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
			role="tablist"
			aria-label={ariaLabel ?? t("signInAsRole")}
		>
			{options.map(({ mode, label, Icon }) => {
				const selected = value === mode;
				return (
					<button
						key={mode}
						type="button"
						role="tab"
						aria-selected={selected}
						onClick={() => onChange(mode)}
						className={cn(
							"inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-colors",
							selected
								? "bg-white text-[#0f1a0c] shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<Icon className="size-4" aria-hidden />
						{label}
					</button>
				);
			})}
		</div>
	);
}
