import { test as base, expect, type Page } from "@playwright/test";

export async function useEnglish(page: Page) {
	await page.addInitScript(() => {
		window.localStorage.setItem("zemen.locale", "en");
	});
}

export async function ensureEnglish(page: Page) {
	const en = page.getByRole("button", { name: /^EN$/i });
	if (await en.count()) {
		await en.click();
	}
	// Locale hydrates from localStorage after first paint
	await expect
		.poll(async () => page.locator("html").getAttribute("lang"), {
			timeout: 10_000,
		})
		.toBe("en");
}

export const test = base.extend({
	page: async ({ page }, use) => {
		await useEnglish(page);
		await use(page);
	},
});

export { expect };
