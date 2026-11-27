import { describe, expect, it } from "vitest";
import { mapServiceRow } from "@/services/services/types";

describe("mapServiceRow provider fields", () => {
	it("reads top-level providerName from ServiceOut", () => {
		const service = mapServiceRow({
			id: "e7065342-0467-4493-badd-1604e16f2469",
			providerId: "2e59797a-db9b-4485-afa8-69a54c9bd42f",
			serviceName: "Testing Catering service",
			providerName: "Fozia Kassa",
			price: 10,
		});
		expect(service.providerName).toBe("Fozia Kassa");
	});

	it("falls back to nested providerModel name parts", () => {
		const service = mapServiceRow({
			id: "1",
			providerId: "2",
			serviceName: "X",
			price: 1,
			providerModel: { firstName: "Fozia", lastName: "Kassa" },
		});
		expect(service.providerName).toBe("Fozia Kassa");
	});
});
