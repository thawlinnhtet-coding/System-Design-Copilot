import { expect, test } from "@playwright/test";

test.describe("billing boundary", () => {
  test("explains the Free beta boundary before authentication", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByRole("heading", { name: "Practice freely. Upgrade when the limits matter." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Free", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro", exact: true })).toBeVisible();
    await expect(page.getByText("Stripe Checkout is test-mode only during the Free personal beta")).toBeVisible();
		await expect(page.getByText("Ordinary beta participants remain on Free")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in to upgrade" })).toHaveAttribute("href", "/sign-in");
  });
});
