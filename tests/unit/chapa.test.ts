import { describe, expect, it } from "vitest";

import {
	isChapaPendingStatus,
	isChapaSuccessStatus,
} from "@/lib/chapa";

describe("Chapa transaction status", () => {
	it("recognizes pending and indeterminate statuses", () => {
		expect(isChapaPendingStatus(undefined)).toBe(true);
		expect(isChapaPendingStatus("unknown")).toBe(true);
		expect(isChapaPendingStatus("processing")).toBe(true);
	});

	it("distinguishes a failed payment from a pending payment", () => {
		expect(isChapaPendingStatus("failed")).toBe(false);
		expect(isChapaPendingStatus("cancelled")).toBe(false);
		expect(isChapaSuccessStatus("success")).toBe(true);
	});
});
