import { describe, expect, it } from "vitest";

import {
	BOOKING_STATUS,
	PROVIDER_BOOKING_STATUS_FILTERS,
	formatBookingStatus,
	isUpcomingBooking,
	statusTone,
} from "@/lib/booking-status";
import { formatAmount, formatDateTime } from "@/services/bookings/types";
import { isGuestAllowedPath, loginPathForGuest } from "@/lib/guest";

describe("booking status", () => {
	it("labels known statuses", () => {
		expect(formatBookingStatus(BOOKING_STATUS.pending)).toBe("Pending");
		expect(formatBookingStatus(BOOKING_STATUS.onTheWay)).toBe("On the way");
		expect(formatBookingStatus(BOOKING_STATUS.pendingExtraPayment)).toBe(
			"Extra payment",
		);
		expect(formatBookingStatus(null)).toBe("Unknown");
		expect(formatBookingStatus("custom_status")).toBe("custom status");
	});

	it("maps tones for chips", () => {
		expect(statusTone(BOOKING_STATUS.pending)).toBe("warning");
		expect(statusTone(BOOKING_STATUS.completed)).toBe("success");
		expect(statusTone(BOOKING_STATUS.rejected)).toBe("danger");
		expect(statusTone(BOOKING_STATUS.accepted)).toBe("info");
	});

	it("exposes provider filter list", () => {
		expect(PROVIDER_BOOKING_STATUS_FILTERS).toContain(BOOKING_STATUS.pending);
		expect(PROVIDER_BOOKING_STATUS_FILTERS).toContain(BOOKING_STATUS.completed);
	});

	it("upcoming is pending for today or later", () => {
		const nowMs = Date.parse("2026-06-01T12:00:00.000Z");
		expect(
			isUpcomingBooking({
				status: "pending",
				bookingDate: "2026-06-02T10:00:00.000Z",
				nowMs,
			}),
		).toBe(true);
		expect(
			isUpcomingBooking({
				status: "pending",
				bookingDate: "2026-06-01T08:00:00.000Z",
				nowMs,
			}),
		).toBe(true);
		expect(
			isUpcomingBooking({
				status: "accepted",
				bookingDate: "2026-06-02T10:00:00.000Z",
				nowMs,
			}),
		).toBe(false);
		expect(
			isUpcomingBooking({
				status: "pending",
				bookingDate: "2026-05-01T10:00:00.000Z",
				nowMs,
			}),
		).toBe(false);
	});
});

describe("booking display helpers", () => {
	it("formats amounts", () => {
		expect(formatAmount(null)).toBe("—");
		expect(formatAmount("")).toBe("—");
		expect(formatAmount(1000)).toMatch(/^ETB /);
		expect(formatAmount("abc")).toBe("abc");
	});

	it("formats datetimes", () => {
		expect(formatDateTime(null)).toBe("—");
		expect(formatDateTime("not-a-date")).toBe("not-a-date");
		expect(formatDateTime("2024-01-15T10:30:00.000Z")).toMatch(/2024/);
	});
});

describe("guest browse paths", () => {
	it("allows catalog paths only", () => {
		expect(isGuestAllowedPath("/service")).toBe(true);
		expect(isGuestAllowedPath("/service/services/abc")).toBe(true);
		expect(isGuestAllowedPath("/service/bookings")).toBe(false);
		expect(isGuestAllowedPath("/provider/bookings")).toBe(false);
	});

	it("builds login next URL", () => {
		expect(loginPathForGuest("/service/bookings")).toBe(
			"/login?next=%2Fservice%2Fbookings",
		);
		expect(loginPathForGuest()).toBe("/login");
	});
});
