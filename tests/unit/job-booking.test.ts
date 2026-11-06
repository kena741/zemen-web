import { describe, expect, it } from "vitest";

import { serviceFromJobRow } from "@/services/jobs/jobsApi";

describe("serviceFromJobRow", () => {
	it("builds a bookable service from embedded job serviceModelList", () => {
		const service = serviceFromJobRow(
			{
				id: "job-1",
				serviceModelList: [
					{
						id: "snapshot-not-in-catalog",
						serviceName: "Catering",
						description: "Event catering",
						price: "500",
						categoryName: "Domestic Help",
						subCategoryName: "Catering",
						categoryId: "cat-1",
						subCategoryId: "sub-1",
						serviceImage: ["https://example.com/a.jpg"],
						providerId: null,
					},
				],
			},
			{ providerId: "provider-9", bidPrice: "2" },
		);

		expect(service).not.toBeNull();
		expect(service!.serviceName).toBe("Catering");
		expect(service!.providerId).toBe("provider-9");
		expect(service!.price).toBe("2");
		expect(service!.categoryName).toBe("Domestic Help");
		expect(service!.allowsCustomOffer).toBe(false);
		expect(service!.serviceImage).toEqual(["https://example.com/a.jpg"]);
	});

	it("returns null when job has no service snapshot", () => {
		expect(serviceFromJobRow({ id: "job-2", serviceModelList: [] })).toBeNull();
		expect(serviceFromJobRow({ id: "job-3" })).toBeNull();
	});
});
