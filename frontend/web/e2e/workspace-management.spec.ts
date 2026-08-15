import { expect, test } from "@playwright/test";

test.describe("Workspace management", () => {
  test("archives, restores, and requires the Workspace name before permanent deletion", async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_AUTH_STATE, "Set PLAYWRIGHT_AUTH_STATE to run authenticated journeys.");

    let workspaces = [
      { id: "workspace-active", name: "Notifications", status: "ACTIVE", progressPercent: 38, saveState: "SAVED", type: "CUSTOM_DESIGN", source: "CUSTOM" },
      { id: "workspace-archived", name: "Image pipeline", status: "ARCHIVED", progressPercent: 61, saveState: "SAVED", type: "CUSTOM_DESIGN", source: "CUSTOM" },
    ];

    await page.route("**/api/v1/workspaces", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ contentType: "application/json", body: JSON.stringify(workspaces) });
        return;
      }
      await route.fallback();
    });
    await page.route("**/api/v1/workspaces/workspace-active/archive", async (route) => {
      workspaces = workspaces.map((workspace) => workspace.id === "workspace-active" ? { ...workspace, status: "ARCHIVED" } : workspace);
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(workspaces[0]) });
    });
    await page.route("**/api/v1/workspaces/workspace-archived/restore", async (route) => {
      workspaces = workspaces.map((workspace) => workspace.id === "workspace-archived" ? { ...workspace, status: "ACTIVE" } : workspace);
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(workspaces[1]) });
    });
    await page.route("**/api/v1/workspaces/workspace-active", async (route) => {
      expect(route.request().method()).toBe("DELETE");
      expect(route.request().postDataJSON()).toEqual({ confirmationName: "Notifications" });
      workspaces = workspaces.filter((workspace) => workspace.id !== "workspace-active");
      await route.fulfill({ status: 204 });
    });

    await page.goto("/practice/workspaces");
    await page.getByRole("button", { name: "Archive" }).click();
    await expect(page.getByRole("dialog")).toContainText("become read-only and stop using an active-Workspace allowance");
    await page.getByRole("button", { name: "Archive Workspace" }).click();
    await expect(page.getByRole("status")).toContainText("Notifications is archived");

    await page.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByRole("status")).toContainText("Image pipeline is active again");

    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("button", { name: "Delete Workspace" })).toBeDisabled();
    await page.getByLabel("Type Notifications to confirm.").fill("Notifications");
    await page.getByRole("button", { name: "Delete Workspace" }).click();
    await expect(page.getByText("Notifications")).not.toBeVisible();
  });
});
