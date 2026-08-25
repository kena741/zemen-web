import { cn } from "@/lib/utils";
import { formatBookingStatus, statusTone } from "@/lib/booking-status";

const TONE_CLASS: Record<ReturnType<typeof statusTone>, string> = {
	neutral: "bg-muted text-muted-foreground",
	warning: "bg-amber-100 text-amber-900",
	success: "bg-secondary text-secondary-foreground",
	danger: "bg-destructive/15 text-destructive",
	info: "bg-[#e8f5e3] text-[#174309]",
};

export function StatusBadge({
	status,
	className,
}: {
	status: string | null | undefined;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
				TONE_CLASS[statusTone(status)],
				className,
			)}
		>
			{formatBookingStatus(status)}
		</span>
	);
}
