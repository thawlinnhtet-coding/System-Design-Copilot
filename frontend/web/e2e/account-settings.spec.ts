import { expect, test } from "@playwright/test";

test.describe("Account settings", () => {
  test("exposes the account overview and keeps it behind authentication", async ({ page }) => {
    await page.goto("/account");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Design systems. Explain your decisions. Improve with evidence." })).toBeVisible();
  });

  test("keeps detailed profile and security as a separate destination", async ({ page }) => {
    await page.goto("/account/profile");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Design systems. Explain your decisions. Improve with evidence." })).toBeVisible();
  });
});
