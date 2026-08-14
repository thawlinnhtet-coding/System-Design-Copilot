import { expect, test } from "@playwright/test";

test.describe("Ticket 10 and 20 entry journeys", () => {
  test("keeps portable data behind the authenticated application boundary", async ({ page }) => {
    await page.goto("/data");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Design systems. Explain your decisions. Improve with evidence." })).toBeVisible();
  });

  test("keeps custom Workspace creation behind the authenticated practice boundary on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/practice");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Design systems. Explain your decisions. Improve with evidence." })).toBeVisible();
  });
});
