import { expect, test } from "@playwright/test";

test.describe("Practice Home", () => {
  test("uses the Practice route and preserves the private boundary", async ({ page }) => {
    await page.goto("/practice");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Design systems. Explain your decisions. Improve with evidence." })).toBeVisible();
  });

  test("redirects the former dashboard entry to Practice Home", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Design systems. Explain your decisions. Improve with evidence." })).toBeVisible();
  });

  test("reflows the shell and exposes mobile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/practice");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Design systems. Explain your decisions. Improve with evidence." })).toBeVisible();
  });
});
