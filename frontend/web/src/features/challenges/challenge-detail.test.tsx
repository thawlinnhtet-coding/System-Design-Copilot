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
    expect(screen.getByText("OBJECTIVE")).toBeVisible();
    expect(screen.getByText("REASONING AREAS")).toBeVisible();
    expect(screen.getByText("FOCUS AREAS")).toBeVisible();
    expect(screen.getByText("SKILLS PRACTICED")).toBeVisible();
    expect(screen.getByText("100M redirects per day")).toBeVisible();
    expect(screen.getByText("Estimated time")).toBeVisible();
    expect(screen.getByText("SCENARIO PREVIEW")).toBeVisible();
    expect(screen.queryByText("A regional cache is degraded.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start practice" }));
    await waitFor(() => expect(api.startChallenge).toHaveBeenCalledWith("url-shortener"));
    expect(router.push).toHaveBeenCalledWith("/workspace/workspace-1");
  });

  it("shows safe detail to signed-out visitors and asks them to sign in before practice", async () => {
    session.isSignedIn = false;
    renderWithProviders(<ChallengeDetail slug="url-shortener" />);
    expect(await screen.findByRole("heading", { name: "Design a reliable URL shortener" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign in to start practice" })).toBeVisible();
    expect(api.getChallenge).toHaveBeenCalledWith("url-shortener");
  });

  it("continues the latest attempt without creating another Workspace", async () => {
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
      topicPacks: ["request paths"],
      initialConstraints: ["100M redirects per day"],
      skillCoverage: [{ name: "request shaping", level: "introduce" }],
      scenarioPreview: ["A regional cache is degraded."],
      attempts: [{ id: "attempt-1", name: "Latest attempt", status: "ACTIVE" }],
    });

    renderWithProviders(<ChallengeDetail slug="url-shortener" />);

    expect(await screen.findByRole("link", { name: "Continue practice" })).toHaveAttribute("href", "/workspace/attempt-1");
    expect(screen.getByRole("button", { name: "Start new attempt" })).toBeVisible();
    expect(screen.getByText("No other attempts yet.")).toBeVisible();
    expect(screen.queryByText("Latest attempt")).not.toBeInTheDocument();
    expect(api.startChallenge).not.toHaveBeenCalled();
  });
});
