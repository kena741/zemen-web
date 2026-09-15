import { ensureEnglish, expect, test } from "./fixtures";

test.describe("forgot password phone validation", () => {
	test("blocks empty phone before navigate", async ({ page }) => {
		await page.goto("/forgot-password");
		await ensureEnglish(page);
		await page.getByRole("button", { name: /^phone$/i }).click();
		await page.getByRole("button", { name: /send code/i }).click();
		await expect(page).toHaveURL(/\/forgot-password/);
		await expect(page.getByText(/phone number is required/i)).toBeVisible();
	});
});
