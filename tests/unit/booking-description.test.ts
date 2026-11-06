import { describe, expect, it } from "vitest";
import {
	filterBookingDescriptionInput,
	isPastTimeOnDate,
	validateBookingDescription,
} from "@/lib/booking-description";

describe("booking description", () => {
	it("rejects empty, short, long, and forbidden chars", () => {
		expect(validateBookingDescription("")).toBe("empty");
		expect(validateBookingDescription("too short")).toBe("tooShort");
		expect(validateBookingDescription("x".repeat(1001))).toBe("tooLong");
		expect(validateBookingDescription("Need help with #tag")).toBe(
			"invalidChars",
		);
		expect(validateBookingDescription("Need deep cleaning tomorrow")).toBe(
			null,
		);
	});

	it("strips forbidden characters while typing", () => {
		expect(filterBookingDescriptionInput("clean <home> #1")).toBe("clean home 1");
	});

	it("flags past times only for today", () => {
		const now = new Date("2026-11-06T15:30:00");
		expect(isPastTimeOnDate("2026-11-06", "14:00", now)).toBe(true);
		expect(isPastTimeOnDate("2026-11-06", "16:00", now)).toBe(false);
		expect(isPastTimeOnDate("2026-11-07", "08:00", now)).toBe(false);
	});
});
