import { expect, test } from "@playwright/test";

test.describe("Contextual Copilot", () => {
  test("keeps the Copilot route behind Clerk authentication", async ({ page }) => {
    await page.goto("/workspace/00000000-0000-0000-0000-000000000012/copilot");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Design systems. Explain your decisions. Improve with evidence." })).toBeVisible();
  });

  test("shows the bounded context before accepting an advisory turn", async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_AUTH_STATE, "Set PLAYWRIGHT_AUTH_STATE to run authenticated journeys.");
    await page.route("**/api/v1/me/ai-consent", async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ granted: true, policy: { currentVersion: "2026-08-01" } }) }));
    await page.route("**/api/v1/workspaces/copilot-workspace/copilot/turns", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ id: "turn-1", content: "Compare cache invalidation failure modes with the latency target before choosing a cache.", model: "copilot-model", replayed: false }) });
    });

    await page.goto("/workspace/copilot-workspace/copilot");
    await expect(page.getByText(/Excluded: credentials, tokens, passwords/)).toBeVisible();
    await page.getByLabel("What decision are you evaluating?").fill("Should this design add a cache?");
    await page.getByRole("button", { name: "Ask Copilot" }).click();
    await expect(page.getByLabel("Copilot response")).toContainText("Compare cache invalidation failure modes");
  });
});
