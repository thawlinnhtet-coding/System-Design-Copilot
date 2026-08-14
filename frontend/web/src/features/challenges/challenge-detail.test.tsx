import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { ChallengeDetail } from "./challenge-detail";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
const api = vi.hoisted(() => ({ getChallenge: vi.fn(), startChallenge: vi.fn() }));
const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => session }));
vi.mock("@/lib/api/authenticated-client", () => ({
  ApiRequestError: class ApiRequestError extends Error {
    constructor(public status: number) { super(); }
  },
  useAuthenticatedApiClient: () => api,
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("ChallengeDetail", () => {
  beforeEach(() => {
    session.isLoaded = true;
    session.isSignedIn = true;
    api.getChallenge.mockReset();
    api.startChallenge.mockReset();
    router.push.mockReset();
    api.getChallenge.mockResolvedValue({
      slug: "url-shortener",
      topic: "URL shortener",
      versionId: "url-v1",
      version: 1,
      title: "Design a reliable URL shortener",
      description: "Keep redirects fast and durable.",
      problemStatement: "Build a service that creates short links and redirects users reliably.",
      difficulty: "FOUNDATION",
      estimatedMinutes: 30,
      topicPacks: ["request paths", "data/read scaling"],
      initialConstraints: ["100M redirects per day"],
      skillCoverage: [{ name: "request shaping", level: "introduce" }],
      scenarioPreview: ["A regional cache is degraded."],
      attempts: [],
    });
  });

  it("shows entitled prompt details without a reference architecture and starts a workspace", async () => {
    api.startChallenge.mockResolvedValue({ id: "workspace-1" });
    renderWithProviders(<ChallengeDetail slug="url-shortener" />);

    expect(await screen.findByRole("heading", { name: "Design a reliable URL shortener" })).toBeVisible();
    expect(screen.getByText("Build a service that creates short links and redirects users reliably.")).toBeVisible();
    expect(screen.getByText("100M redirects per day")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Start practice" }));
    await waitFor(() => expect(api.startChallenge).toHaveBeenCalledWith("url-shortener"));
    expect(router.push).toHaveBeenCalledWith("/workspace/workspace-1");
  });

  it("asks signed-out visitors to sign in before showing protected detail", () => {
    session.isSignedIn = false;
    renderWithProviders(<ChallengeDetail slug="url-shortener" />);
    expect(screen.getByRole("heading", { name: "Sign in to inspect this Challenge." })).toBeVisible();
    expect(api.getChallenge).not.toHaveBeenCalled();
  });
});
