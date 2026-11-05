import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "../..");

function read(rel: string): string {
	return readFileSync(join(root, rel), "utf8");
}

describe("customer PostgREST column safety", () => {
	it("does not select camelCase walletAmount on customer table", () => {
		const pay = read("services/customer/bookingsApi.ts");
		const cancel = read("app/api/bookings/cancel/route.ts");
		expect(pay).toMatch(/\.select\("id, wallet_amount"\)/);
		expect(pay).not.toMatch(/select\("id, wallet_amount, walletAmount"\)/);
		expect(cancel).toMatch(/\.select\("id, user_id, wallet_amount"\)/);
		expect(cancel).not.toMatch(/wallet_amount, walletAmount/);
	});

	it("updates customer wallet with snake_case only", () => {
		const pay = read("services/customer/bookingsApi.ts");
		const cancel = read("app/api/bookings/cancel/route.ts");
		expect(pay).toMatch(/wallet_amount:\s*String\(newBalance\)/);
		expect(pay).not.toMatch(/walletAmount:\s*String\(newBalance\)/);
		expect(cancel).toMatch(/wallet_amount:\s*newBalance\.toFixed\(2\)/);
		expect(cancel).not.toMatch(/walletAmount:\s*newBalance\.toFixed\(2\)/);
	});

	it("selects allows_custom_offer without camelCase twin", () => {
		const offers = read("services/customer/offersApi.ts");
		expect(offers).toMatch(/\.select\("allows_custom_offer"\)/);
		expect(offers).not.toMatch(/allows_custom_offer,\s*allowsCustomOffer/);
	});

	it("loads addresses from customer_addresses", () => {
		const addresses = read("services/customer/addressesApi.ts");
		const cache = read("store/customerCacheSlice.ts");
		expect(addresses).toMatch(/customer_addresses/);
		expect(addresses).not.toMatch(/\.select\("add_addresses"\)/);
		expect(cache).toMatch(/customer_addresses/);
	});

	it("complete booking accepts pending_extra_payment", () => {
		const complete = read("app/api/bookings/complete/route.ts");
		expect(complete).toMatch(/pending_extra_payment/);
		expect(complete).toMatch(
			/\.in\("status",\s*\["pending_approval",\s*"pending_extra_payment"\]\)/,
		);
	});

	it("redirects short marketing service URLs to nested catalog paths", () => {
		const config = read("next.config.ts");
		expect(config).toContain(
			'["/services/cleaning", "/services/domestic-help/cleaning-service"]',
		);
		expect(config).toContain(
			'["/services/plumbing", "/services/maintenance/plumber"]',
		);
		expect(config).toContain(
			'["/services/moving", "/services/logistics/furniture-moving"]',
		);
	});
});
