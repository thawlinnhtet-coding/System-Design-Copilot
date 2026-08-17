import { fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { ChallengeCatalog } from "./challenge-catalog";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
const api = vi.hoisted(() => ({ getWorkspaces: vi.fn(), startChallenge: vi.fn() }));
const publicApi = vi.hoisted(() => ({ getChallenges: vi.fn() }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => session }));
vi.mock("@/lib/api/authenticated-client", () => ({
  ApiRequestError: class ApiRequestError extends Error {
    constructor(public status: number) { super(); }
  },
  useAuthenticatedApiClient: () => api,
}));
vi.mock("@/lib/api/public-client", () => publicApi);

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

  it("opens the public Challenge Detail page without starting a Workspace", async () => {
    api.getWorkspaces.mockResolvedValue([]);

    renderWithProviders(<ChallengeCatalog />);

    expect(await screen.findByRole("link", { name: "Open Design a reliable URL shortener" })).toHaveAttribute("href", "/challenges/url-shortener");
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    expect(api.startChallenge).not.toHaveBeenCalled();
  });

  it("marks a Challenge with an existing attempt as in progress", async () => {
    api.getWorkspaces.mockResolvedValue([
      { id: "attempt-1", name: "Design a reliable URL shortener", type: "CHALLENGE", source: "CURATED_CHALLENGE", challengeVersionId: "url-v1" },
    ]);

    renderWithProviders(<ChallengeCatalog />);

    expect(await screen.findByText("IN PROGRESS · FOUNDATION")).toBeInTheDocument();
  });

  it("keeps the public Challenge Detail page available to signed-out visitors", async () => {
    session.isSignedIn = false;

    renderWithProviders(<ChallengeCatalog />);

    expect(await screen.findByRole("link", { name: "Open Design a reliable URL shortener" })).toHaveAttribute("href", "/challenges/url-shortener");
  });

  it("announces filtered results and resets an empty result set", async () => {
    api.getWorkspaces.mockResolvedValue([]);

    renderWithProviders(<ChallengeCatalog />);

    fireEvent.change(await screen.findByRole("combobox", { name: "Filter by difficulty" }), { target: { value: "ADVANCED" } });
    expect(await screen.findByText("Showing 1 of 3 challenges")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Search challenges" }), { target: { value: "does-not-exist" } });
    expect(await screen.findByText("No Challenges match these filters.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset challenge filters" }));

    expect(await screen.findByText("Showing 3 of 3 challenges")).toBeInTheDocument();
  });
});
