import { describe, expect, it } from "vitest";
import {
	canCreateService,
	canCreateServiceListing,
	countPlanUsageServices,
	isFreeServiceCategory,
	serviceCreateLimit,
	type FreeServiceCategories,
} from "@/services/provider/tiersApi";
import { stampRecurringPeriod } from "@/lib/recurring";

const free: FreeServiceCategories = {
	ids: ["cat-clean-id"],
	names: ["cleaning", "chef", "cook"],
};

describe("free service categories", () => {
	it("matches by id or name fragment", () => {
		expect(isFreeServiceCategory("cat-clean-id", "Anything", free)).toBe(true);
		expect(isFreeServiceCategory("other", "Home Cleaning", free)).toBe(true);
		expect(isFreeServiceCategory("other", "Private Chef", free)).toBe(true);
		expect(isFreeServiceCategory("other", "Plumbing", free)).toBe(false);
	});

	it("excludes free categories from plan usage", () => {
		expect(
			countPlanUsageServices(
				[
					{ archived: false, categoryId: "cat-clean-id", categoryName: "Cleaning" },
					{ archived: false, categoryId: "x", categoryName: "Plumbing" },
					{ archived: true, categoryId: "y", categoryName: "Plumbing" },
				],
				free,
			),
		).toBe(1);
	});

	it("allows free listings without a paid tier", () => {
		expect(
			canCreateServiceListing({
				tierMax: 0,
				planUsageCount: 0,
				categoryIsFree: true,
			}),
		).toBe(true);
		expect(
			canCreateServiceListing({
				tierMax: 0,
				planUsageCount: 0,
				categoryIsFree: false,
			}),
		).toBe(false);
		expect(serviceCreateLimit(0)).toBe(0);
		expect(canCreateService(2, 1)).toBe(true);
		expect(canCreateService(2, 2)).toBe(false);
	});
});

describe("recurring stamp", () => {
	it("seeds first period at book time", () => {
		const from = new Date("2026-01-01T00:00:00.000Z");
		const period = stampRecurringPeriod({
			billingInterval: "MONTH",
			billingIntervalCount: 1,
			from,
		});
		expect(period.nextCycleDue).toBe(false);
		expect(period.currentPeriodStart).toBe(from.toISOString());
		expect(new Date(period.currentPeriodEnd).getUTCMonth()).toBe(1);
	});
});
