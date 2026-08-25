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
} as const;

export type BookingStatus =
	(typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

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
};

export function formatBookingStatus(status: string | null | undefined): string {
	if (!status) return "Unknown";
	return BOOKING_STATUS_LABEL[status] ?? status.replaceAll("_", " ");
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
