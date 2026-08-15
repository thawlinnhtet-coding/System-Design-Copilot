import { expect, test } from "@playwright/test";

test.describe("Review Experience shell", () => {
  test("keeps review processing explicit until the authoritative Review API is available", async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_AUTH_STATE, "Set PLAYWRIGHT_AUTH_STATE to run authenticated journeys.");
    const workspace = { id: "review-workspace", name: "Ticket booking", description: "Keep inventory durable.", status: "ACTIVE", focusStage: "DESIGN", focusPanel: "CANVAS", saveState: "SAVED", canvasViewport: { x: 0, y: 0, zoom: 1 } };
    await page.route("**/api/v1/workspaces/review-workspace/focus", async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(workspace) }));
    await page.route("**/api/v1/workspaces/review-workspace", async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(workspace) }));

    await page.goto("/workspace/review-workspace");
    await page.getByRole("button", { name: /Review/ }).click();

    await expect(page.getByLabel("Review processing unavailable")).toBeVisible();
    await expect(page.getByText("no Review has been requested from this screen")).toBeVisible();
    await expect(page.getByRole("button", { name: "Review processing is being connected" })).toBeDisabled();
  });
});
