import { expect, test } from "@playwright/test";

test.describe("Progress and history", () => {
  test("shows private activity, practice volume, and Workspace-scoped qualified score changes", async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_AUTH_STATE, "Set PLAYWRIGHT_AUTH_STATE to run authenticated journeys.");
    await page.route("**/api/v1/me/progress", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ practiceVolume: { ownedWorkspaceCount: 2, activeWorkspaceCount: 1, completedScenarioCount: 3, completedReviewCount: 2 }, recentActivity: [{ type: "REVIEW_COMPLETED", workspaceId: "workspace-1", workspaceName: "Ticket booking", occurredAt: "2026-08-16T00:00:00Z" }], qualifiedReviewTrends: [{ workspaceId: "workspace-1", workspaceName: "Ticket booking", dimension: "reliabilityAndFailureHandling", baselineScore: 2, comparisonScore: 4, change: 2, baselineReviewRequestId: "review-1", comparisonReviewRequestId: "review-2", baselineCompletedAt: "2026-08-14T00:00:00Z", comparisonCompletedAt: "2026-08-16T00:00:00Z" }] }) }));
    await page.route("**/api/v1/me/usage", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ reviews: { used: 2, limit: 5 } }) }));
    await page.goto("/progress");
    await expect(page.getByText("Completed a Review")).toBeVisible();
    await expect(page.getByText("Reliability and failure handling")).toBeVisible();
    await expect(page.getByText("They are evidence to inspect, not proof of improvement.")).toBeVisible();
  });
});
