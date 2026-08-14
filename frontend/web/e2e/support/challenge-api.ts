import type { Page } from "@playwright/test";

export async function mockPublicChallengeCatalog(page: Page) {
  await page.route("**/api/v1/challenges", async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([
      {
        slug: "url-shortener",
        versionId: "url-v1",
        topic: "URL shortener",
        title: "Design a reliable URL shortener",
        description: "Keep redirects fast and durable.",
        difficulty: "FOUNDATION",
        estimatedMinutes: 30,
        skillFocus: "request-path decomposition",
      },
    ]),
  }));
}
