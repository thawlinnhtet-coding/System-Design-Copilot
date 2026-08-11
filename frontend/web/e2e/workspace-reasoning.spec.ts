import { expect, test } from "@playwright/test";

test.describe("Workspace reasoning route", () => {
  test("protects private reasoning behind Clerk sign-in", async ({ page }) => {
    await page.goto("/workspace/00000000-0000-0000-0000-000000000006");

    await expect(page.getByRole("heading", { name: "Sign in to continue." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});
