import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { ChallengeCatalog } from "./challenge-catalog";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
const api = vi.hoisted(() => ({ getWorkspaces: vi.fn(), startChallenge: vi.fn() }));
const publicApi = vi.hoisted(() => ({ getChallenges: vi.fn() }));
const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => session }));
vi.mock("@/lib/api/authenticated-client", () => ({
  ApiRequestError: class ApiRequestError extends Error {
    constructor(public status: number) { super(); }
  },
  useAuthenticatedApiClient: () => api,
}));
vi.mock("@/lib/api/public-client", () => publicApi);
vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("ChallengeCatalog", () => {
  beforeEach(() => {
    session.isLoaded = true;
    session.isSignedIn = true;
    api.getWorkspaces.mockReset();
    api.startChallenge.mockReset();
    publicApi.getChallenges.mockReset();
    publicApi.getChallenges.mockResolvedValue([
      { slug: "url-shortener", versionId: "url-v1", topic: "URL shortener", title: "Design a reliable URL shortener", description: "Handle redirects while keeping reads fast and links durable.", difficulty: "FOUNDATION", estimatedMinutes: 30, skillFocus: "request paths" },
      { slug: "news-feed", versionId: "news-v1", topic: "News feed", title: "Design a resilient news feed", description: "Serve a personalized, read-heavy feed.", difficulty: "INTERMEDIATE", estimatedMinutes: 60, skillFocus: "read/write scaling" },
      { slug: "ticket-booking", versionId: "ticket-v1", topic: "Ticket booking", title: "Design a safe ticket-booking system", description: "Protect scarce inventory during demand spikes.", difficulty: "ADVANCED", estimatedMinutes: 90, skillFocus: "contention control" },
    ]);
  });

  it("starts a curated Challenge as a typed independent Workspace", async () => {
    api.getWorkspaces.mockResolvedValue([]);
    api.startChallenge.mockResolvedValue({ id: "challenge-workspace-1" });

    renderWithProviders(<ChallengeCatalog />);

    const start = (await screen.findAllByRole("button", { name: "Start Challenge" }))[0];
    fireEvent.click(start);

    await waitFor(() => expect(api.startChallenge).toHaveBeenCalledWith("url-shortener"));
  });

  it("keeps the latest attempt resumable and offers a separate new attempt", async () => {
    api.getWorkspaces.mockResolvedValue([
      { id: "attempt-1", name: "Design a reliable URL shortener", type: "CHALLENGE", source: "CURATED_CHALLENGE", challengeVersionId: "url-v1" },
    ]);
    api.startChallenge.mockResolvedValue({ id: "attempt-2" });

    renderWithProviders(<ChallengeCatalog />);

    expect(await screen.findByRole("link", { name: "Resume latest" })).toHaveAttribute("href", "/workspace/attempt-1");
    fireEvent.click(screen.getByRole("button", { name: "Start new attempt" }));
    await waitFor(() => expect(api.startChallenge).toHaveBeenCalledTimes(1));
  });

  it("preserves the Challenge destination for signed-out visitors", async () => {
    session.isSignedIn = false;

    renderWithProviders(<ChallengeCatalog />);

    expect((await screen.findAllByRole("link", { name: "Sign in to start" }))[0]).toHaveAttribute(
      "href",
      "/sign-in?returnTo=%2Fchallenges%2Furl-shortener",
    );
  });
});
