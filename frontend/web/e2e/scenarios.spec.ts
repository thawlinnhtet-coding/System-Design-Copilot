import { expect, test } from "@playwright/test";

test.describe("Workspace Scenarios", () => {
  test("reveals, saves, and completes a progressive Scenario", async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_AUTH_STATE, "Set PLAYWRIGHT_AUTH_STATE to run authenticated journeys.");
    const workspace = { id: "scenario-workspace", name: "URL Shortener", description: "Keep redirects durable.", status: "ACTIVE", focusStage: "CLARIFY", focusPanel: "REASONING", saveState: "SAVED", canvasViewport: { x: 0, y: 0, zoom: 1 } };
    let scenario = { id: "scenario-1", source: "CURATED", orderIndex: 0, title: "Viral redirect traffic", changedCondition: "Redirect traffic rises 20x.", details: "What changes first?", category: "GROWTH_SCALE", status: "AVAILABLE" };

    await page.route("**/api/v1/workspaces/scenario-workspace/focus", async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(workspace) }));
    await page.route("**/api/v1/workspaces/scenario-workspace", async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(workspace) }));
    await page.route("**/api/v1/workspaces/scenario-workspace/scenarios", async (route) => {
      if (route.request().method() === "GET") return route.fulfill({ contentType: "application/json", body: JSON.stringify([scenario]) });
      return route.fallback();
    });
    await page.route("**/api/v1/workspaces/scenario-workspace/scenarios/scenario-1/start", async (route) => {
      scenario = { ...scenario, status: "REVEALED" };
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(scenario) });
    });
    await page.route("**/api/v1/workspaces/scenario-workspace/scenarios/scenario-1", async (route) => {
      scenario = { ...scenario, status: "DRAFT", ...route.request().postDataJSON() };
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(scenario) });
    });
    await page.route("**/api/v1/workspaces/scenario-workspace/scenarios/scenario-1/complete", async (route) => {
      scenario = { ...scenario, status: "COMPLETED", ...route.request().postDataJSON() };
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(scenario) });
    });

    await page.goto("/workspace/scenario-workspace");
    await page.getByRole("button", { name: /Stress-test/ }).click();
    await page.getByRole("button", { name: "Start Scenario →" }).click();
    await page.getByLabel("What changes, and why?").fill("Separate hot reads from durable writes and rate-limit abuse.");
    await page.getByRole("button", { name: "Save response" }).click();
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByText("Response included in later Review context.")).toBeVisible();
  });
});
