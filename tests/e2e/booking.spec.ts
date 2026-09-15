import { ensureEnglish, expect, test } from "./fixtures";

test.describe("booking access", () => {
	test("customer bookings redirects unauthenticated users to login", async ({
		page,
	}) => {
		await page.goto("/service/bookings");
		await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
	});

	test("provider bookings redirects unauthenticated users to login", async ({
		page,
	}) => {
		await page.goto("/provider/bookings");
		await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
	});

	test("guest can open service catalog without login", async ({ page }) => {
		await page.goto("/login");
		await ensureEnglish(page);
		const browse = page.getByRole("button", {
			name: /continue as guest/i,
		});
		if (await browse.count()) {
			await browse.first().click();
			await expect(page).toHaveURL(/\/service/, { timeout: 15_000 });
			return;
		}
		await page.evaluate(() => localStorage.setItem("zemen_guest_browse", "1"));
		await page.goto("/service");
		await expect(page).toHaveURL(/\/service/);
	});
});
