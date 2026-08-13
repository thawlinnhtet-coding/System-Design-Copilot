import { expect, test } from "@playwright/test";

test.describe("public practice surfaces", () => {
  test("landing page presents the approved practice loop", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Design systems. Explain your decisions. Improve with evidence." })).toBeVisible();
    await expect(page.getByRole("link", { name: "System Design Copilot home" }).locator("img")).toHaveAttribute("src", "/brand/Structural%20Four-Stage%20Mark.png");
    await expect(page.getByRole("link", { name: "System Design Copilot home" }).locator("img")).toHaveCSS("width", "24px");
    await expect(page.getByRole("link", { name: "System Design Copilot home" })).toBeVisible();
    await expect(page.getByLabel("Public navigation").getByRole("link", { name: "Explore Challenges" })).toHaveAttribute("href", "/challenges");
    await expect(page.getByRole("button", { name: "Make an architecture decision" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Respond to a Scenario" }).click();
    await expect(page.getByRole("button", { name: "Respond to a Scenario" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("DECISION 03")).toBeVisible();
  });

  test("challenge and progress routes expose their public page context", async ({ page }) => {
    await page.goto("/challenges");
    await expect(page.getByRole("heading", { name: "Choose a problem." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to Practice" })).toHaveAttribute("href", "/practice");

    await page.goto("/progress");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Design systems. Explain your decisions. Improve with evidence." })).toBeVisible();
  });

  test("branded Clerk routes preserve the practice context", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "Sign in to begin your Workspace" })).toBeVisible();
    await expect(page.getByText("Your Challenge context will be waiting after authentication.")).toBeVisible();

    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: "Create your practice account" })).toBeVisible();
    await expect(page.getByText("Save private Workspaces, decisions, and evidence-backed Reviews.")).toBeVisible();
  });
});
