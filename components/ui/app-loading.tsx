import { cn } from "@/lib/utils";

/** Lightweight centered loader shared by customer & provider apps. */
export function AppLoading({
	label = "Loading…",
	className,
	compact = false,
}: {
	label?: string;
	className?: string;
	compact?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-2",
				compact ? "py-10" : "min-h-[40vh]",
				className,
			)}
			role="status"
			aria-live="polite"
		>
			<span className="service-spinner" aria-hidden />
			<p className="text-sm text-muted-foreground">{label}</p>
		</div>
	);
}
