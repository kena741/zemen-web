/** Booking status values used by zemen_provider / booked_service. */
export const BOOKING_STATUS = {
	pending: "pending",
	accepted: "accepted",
	rejected: "rejected",
	onTheWay: "on_the_way",
	inProgress: "in_progress",
	hold: "hold",
	completed: "completed",
	pendingExtraPayment: "pending_extra_payment",
	pendingApproval: "pending_approval",
	cancelled: "cancelled",
} as const;

export type BookingStatus =
	(typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

/** Provider filter chips — mirrors mobile Constant.statusModel fallback (+ all DB statuses). */
export const PROVIDER_BOOKING_STATUS_FILTERS: BookingStatus[] = [
	BOOKING_STATUS.pending,
	BOOKING_STATUS.accepted,
	BOOKING_STATUS.onTheWay,
	BOOKING_STATUS.inProgress,
	BOOKING_STATUS.hold,
	BOOKING_STATUS.completed,
	BOOKING_STATUS.pendingApproval,
	BOOKING_STATUS.pendingExtraPayment,
	BOOKING_STATUS.rejected,
	BOOKING_STATUS.cancelled,
];

export const BOOKING_STATUS_LABEL: Record<string, string> = {
	pending: "Pending",
	accepted: "Accepted",
	rejected: "Rejected",
	on_the_way: "On the way",
	in_progress: "In progress",
	hold: "On hold",
	completed: "Completed",
	pending_extra_payment: "Extra payment",
	pending_approval: "Pending approval",
	cancelled: "Cancelled",
	canceled: "Cancelled",
};

export function formatBookingStatus(status: string | null | undefined): string {
	if (!status) return "Unknown";
	return BOOKING_STATUS_LABEL[status] ?? status.replaceAll("_", " ");
}

/** Pending bookings for today or later (mobile upcoming + today's pending). */
export function isUpcomingBooking(params: {
	status: string | null | undefined;
	bookingDate?: string | null;
	startTime?: string | null;
	nowMs?: number;
}): boolean {
	if (params.status !== BOOKING_STATUS.pending) return false;
	const raw = params.bookingDate ?? params.startTime;
	if (!raw) return false;
	const when = new Date(raw);
	if (Number.isNaN(when.getTime())) return false;
	const now = new Date(params.nowMs ?? Date.now());
	const startOfToday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	).getTime();
	return when.getTime() >= startOfToday;
}

export function statusTone(
	status: string | null | undefined,
): "neutral" | "warning" | "success" | "danger" | "info" {
	switch (status) {
		case BOOKING_STATUS.pending:
			return "warning";
		case BOOKING_STATUS.accepted:
		case BOOKING_STATUS.onTheWay:
		case BOOKING_STATUS.inProgress:
		case BOOKING_STATUS.hold:
			return "info";
		case BOOKING_STATUS.completed:
		case BOOKING_STATUS.pendingApproval:
			return "success";
		case BOOKING_STATUS.rejected:
			return "danger";
		default:
			return "neutral";
	}
}

/** Flutter `bookingListStatusColor` — text color for list/grid status labels. */
export function bookingListStatusClass(
	status: string | null | undefined,
): string {
	const key = (status ?? "")
		.trim()
		.toLowerCase()
		.replace(/[\s_-]+/g, "");
	switch (key) {
		case "pending":
		case "pendingapproval":
		case "pendingextrapayment":
		case "hold":
			return "text-[#B45309]";
		case "accepted":
			return "text-[#15803D]";
		case "rejected":
		case "cancelled":
			return "text-destructive";
		case "ongoing":
		case "inprogress":
		case "ontheway":
		case "completed":
			return "text-primary";
		default:
			return "text-muted-foreground";
	}
}
