import { expect, test } from "@playwright/test";

test.describe("public Free beta access", () => {
	test("offers Clerk-managed registration methods and a verification step without an access-code gate", async ({ page }) => {
		await page.goto("/sign-up");

		await expect(page.getByRole("heading", { name: "Create your practice account" })).toBeVisible();
		await expect(page.getByLabel("Email address")).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
		await expect(page.getByRole("button", { name: "Google" })).toBeVisible();
		await expect(page.getByRole("button", { name: "GitHub" })).toBeVisible();
		await expect(page.getByText(/invitation|access code/i)).toHaveCount(0);

		await page.goto("/verify-email");
		await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
		await expect(page.getByLabel("Verification code")).toBeVisible();
	});
});
