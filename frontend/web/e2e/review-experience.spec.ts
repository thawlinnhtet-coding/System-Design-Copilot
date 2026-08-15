import { expect, test } from "@playwright/test";

test.describe("Review Experience", () => {
  test("creates an immutable checkpoint and shows its queued status", async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_AUTH_STATE, "Set PLAYWRIGHT_AUTH_STATE to run authenticated journeys.");
    const workspace = { id: "review-workspace", name: "Ticket booking", description: "Keep inventory durable.", status: "ACTIVE", focusStage: "DESIGN", focusPanel: "CANVAS", saveState: "SAVED", canvasViewport: { x: 0, y: 0, zoom: 1 } };
    await page.route("**/api/v1/workspaces/review-workspace/focus", async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(workspace) }));
    await page.route("**/api/v1/workspaces/review-workspace", async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(workspace) }));
    await page.route("**/api/v1/workspaces/review-workspace/reviews", async (route) => {
      if (route.request().method() === "GET") return route.fulfill({ contentType: "application/json", body: "[]" });
      return route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ id: "review-1", workspaceId: workspace.id, revisionId: "revision-1", status: "QUEUED", createdAt: "2026-08-16T00:00:00Z" }) });
    });

    await page.goto("/workspace/review-workspace");
    await page.getByRole("button", { name: /Review/ }).click();

    await expect(page.getByRole("button", { name: "Request Review" })).toBeVisible();
    await page.getByRole("button", { name: "Request Review" }).click();
    await expect(page.getByRole("heading", { name: "Review queued." })).toBeVisible();
    await expect(page.getByText(/immutable checkpoint is recorded/i)).toBeVisible();
  });
});
