import { expect, test } from "@playwright/test";

test.describe("Architecture Review entry", () => {
  test("keeps manual recreation and import entry behind authentication", async ({ page }) => {
    await page.goto("/practice/review");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Design systems. Explain your decisions. Improve with evidence." })).toBeVisible();
  });

  test("creates a manual Review Workspace from the persisted Review Brief flow", async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_AUTH_STATE, "Set PLAYWRIGHT_AUTH_STATE to run authenticated journeys.");
    await page.route("**/api/v1/architecture-review-workspaces/manual-recreation", async (route) => route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ id: "workspace-manual", type: "ARCHITECTURE_REVIEW", source: "MANUAL_RECREATION" }),
    }));

    await page.goto("/practice/review");
    await page.getByLabel("Workspace name").fill("Ticket booking");
    await page.getByLabel("System description").fill("A ticket booking system");
    await page.getByLabel("Review goal").fill("Check overselling");
    await page.getByLabel("Known requirements").fill("Never oversell a seat");
    await page.getByLabel("Known assumptions").fill("Inventory is partitioned by venue");
    await page.getByRole("button", { name: "Create Review Workspace" }).click();

    await expect(page).toHaveURL(/\/workspace\/workspace-manual$/);
  });
});
