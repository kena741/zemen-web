import { describe, expect, it } from "vitest";

/** Mirrors provider wallet soft-hold (balance − pending). */
function availableBalance(balance: number, pendingTotal: number): number {
	return Math.round((balance - pendingTotal) * 100) / 100;
}

function isPendingStatus(status: string | null | undefined): boolean {
	const s = (status ?? "pending").trim().toLowerCase();
	return s === "pending" || s === "" || s === "hold";
}

describe("wallet soft-hold", () => {
	it("holds pending withdrawal from available", () => {
		expect(availableBalance(1000, 200)).toBe(800);
		expect(availableBalance(100.55, 0.1)).toBe(100.45);
	});

	it("treats empty/hold as pending", () => {
		expect(isPendingStatus("pending")).toBe(true);
		expect(isPendingStatus("hold")).toBe(true);
		expect(isPendingStatus("")).toBe(true);
		expect(isPendingStatus("rejected")).toBe(false);
		expect(isPendingStatus("completed")).toBe(false);
	});
});
