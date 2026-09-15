import { ensureEnglish, expect, test } from "./fixtures";

test.describe("auth pages", () => {
	test("login shows customer/provider toggle and form", async ({ page }) => {
		await page.goto("/login");
		await ensureEnglish(page);
		await expect(page.getByRole("tab", { name: /^customer$/i })).toBeVisible();
		await expect(page.getByRole("tab", { name: /^provider$/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /sign in as/i })).toBeVisible();
		await expect(
			page.getByRole("link", { name: /forgot password/i }),
		).toBeVisible();
	});

	test("forgot password supports email and phone", async ({ page }) => {
		await page.goto("/forgot-password");
		await ensureEnglish(page);
		await expect(page.getByRole("button", { name: /send code/i })).toBeVisible();

		await page.getByRole("button", { name: /^phone$/i }).click();
		await expect(page.getByPlaceholder("+251…")).toBeVisible();

		await page.getByRole("button", { name: /^email$/i }).click();
		await expect(page.locator('input[type="email"]')).toBeVisible();
	});

	test("signup page loads", async ({ page }) => {
		await page.goto("/signup");
		await ensureEnglish(page);
		await expect(
			page.getByRole("button", { name: /create account|sign up/i }).first(),
		).toBeVisible();
	});

	test("login empty submit stays on login", async ({ page }) => {
		await page.goto("/login");
		await ensureEnglish(page);
		await page.getByRole("button", { name: /sign in as/i }).click();
		await expect(page).toHaveURL(/\/login/);
	});
});
