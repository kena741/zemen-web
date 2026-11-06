import { describe, expect, it } from "vitest";

import { jobMatchesProviderCategories } from "@/services/jobs/jobsApi";

describe("jobMatchesProviderCategories", () => {
	it("rejects same parent category with different subcategory", () => {
		expect(
			jobMatchesProviderCategories(
				{ categoryIds: ["domestic"], subCategoryIds: ["catering"] },
				{
					categoryIds: new Set(["domestic"]),
					subCategoryIds: new Set(["cleaning"]),
				},
			),
		).toBe(false);
	});

	it("matches on shared subcategory id", () => {
		expect(
			jobMatchesProviderCategories(
				{ categoryIds: ["other"], subCategoryIds: ["plumber"] },
				{
					categoryIds: new Set(["maintenance"]),
					subCategoryIds: new Set(["plumber"]),
				},
			),
		).toBe(true);
	});

	it("rejects unrelated categories", () => {
		expect(
			jobMatchesProviderCategories(
				{ categoryIds: ["domestic"], subCategoryIds: ["catering"] },
				{
					categoryIds: new Set(["technical"]),
					subCategoryIds: new Set(["cctv"]),
				},
			),
		).toBe(false);
	});

	it("falls back to category when job has no subcategory", () => {
		expect(
			jobMatchesProviderCategories(
				{ categoryIds: ["domestic"], subCategoryIds: [] },
				{
					categoryIds: new Set(["domestic"]),
					subCategoryIds: new Set(["cleaning"]),
				},
			),
		).toBe(true);
	});

	it("matches category when provider has no subcategories", () => {
		expect(
			jobMatchesProviderCategories(
				{ categoryIds: ["domestic"], subCategoryIds: ["catering"] },
				{
					categoryIds: new Set(["domestic"]),
					subCategoryIds: new Set(),
				},
			),
		).toBe(true);
	});
});
