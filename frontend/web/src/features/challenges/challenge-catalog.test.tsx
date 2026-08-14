import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { ChallengeCatalog } from "./challenge-catalog";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
const api = vi.hoisted(() => ({ getWorkspaces: vi.fn(), createWorkspace: vi.fn() }));
const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => session }));
vi.mock("@/lib/api/authenticated-client", () => ({
  ApiRequestError: class ApiRequestError extends Error {
    constructor(public status: number) { super(); }
  },
  useAuthenticatedApiClient: () => api,
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

describe("ChallengeCatalog", () => {
  beforeEach(() => {
    session.isLoaded = true;
    session.isSignedIn = true;
    api.getWorkspaces.mockReset();
    api.createWorkspace.mockReset();
  });

  it("starts a curated Challenge as a typed independent Workspace", async () => {
    api.getWorkspaces.mockResolvedValue([]);
    api.createWorkspace.mockResolvedValue({ id: "challenge-workspace-1" });

    renderWithProviders(<ChallengeCatalog />);

    const start = (await screen.findAllByRole("button", { name: "Start Challenge" }))[0];
    fireEvent.click(start);

    await waitFor(() => expect(api.createWorkspace).toHaveBeenCalledWith(
      "Design a reliable URL shortener",
      "Handle 100M redirects per day while keeping reads fast and links durable.",
      "CHALLENGE",
      "CURATED_CHALLENGE",
    ));
  });

  it("keeps the latest attempt resumable and offers a separate new attempt", async () => {
    api.getWorkspaces.mockResolvedValue([
      { id: "attempt-1", name: "Design a reliable URL shortener", type: "CHALLENGE", source: "CURATED_CHALLENGE" },
    ]);
    api.createWorkspace.mockResolvedValue({ id: "attempt-2" });

    renderWithProviders(<ChallengeCatalog />);

    expect(await screen.findByRole("link", { name: "Resume latest" })).toHaveAttribute("href", "/workspace/attempt-1");
    fireEvent.click(screen.getByRole("button", { name: "Start new attempt" }));
    await waitFor(() => expect(api.createWorkspace).toHaveBeenCalledTimes(1));
  });

  it("preserves the Challenge destination for signed-out visitors", () => {
    session.isSignedIn = false;

    renderWithProviders(<ChallengeCatalog />);

    expect(screen.getAllByRole("link", { name: "Sign in to start" })[0]).toHaveAttribute(
      "href",
      "/sign-in?returnTo=%2Fchallenges%3Fchallenge%3Durl-shortener",
    );
  });
});
