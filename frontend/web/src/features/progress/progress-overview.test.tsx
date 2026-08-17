import { renderWithProviders } from "@/test/setup";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProgressOverview } from "./progress-overview";

const session = { isLoaded: true, isSignedIn: true };
const api = {
  getProgress: vi.fn(),
};

vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => session,
}));

vi.mock("@/lib/api/authenticated-client", () => ({
  useAuthenticatedApiClient: () => api,
}));

describe("ProgressOverview", () => {
  it("renders the learning report from practice and review evidence", async () => {
    api.getProgress.mockResolvedValue({
      practiceVolume: {
        ownedWorkspaceCount: 2,
        activeWorkspaceCount: 1,
        completedScenarioCount: 3,
        completedReviewCount: 4,
      },
      recentActivity: [{
        type: "REVIEW_COMPLETED",
        workspaceId: "workspace-1",
        workspaceName: "URL shortener",
        occurredAt: "2026-08-08T10:00:00Z",
      }],
      qualifiedReviewTrends: [{
        workspaceId: "workspace-1",
        workspaceName: "URL shortener",
        dimension: "reliabilityAndFailureHandling",
        baselineScore: 3,
        comparisonScore: 4,
        change: 1,
        baselineReviewRequestId: "review-1",
        comparisonReviewRequestId: "review-2",
      }],
    });

    renderWithProviders(<ProgressOverview />);

    expect(await screen.findByRole("heading", { name: "Evidence from repeated practice." })).toBeInTheDocument();
    expect(screen.getByText("RECENT PRACTICE ACTIVITY")).toBeInTheDocument();
    expect(screen.getByText("4 completed Reviews")).toBeInTheDocument();
    expect(screen.getByText("Reliability reasoning")).toBeInTheDocument();
    expect(screen.getByText("INTERPRETATION")).toBeInTheDocument();
    expect(api.getProgress).toHaveBeenCalledTimes(1);
  });

  it("keeps learning patterns neutral until comparable evidence exists", async () => {
    api.getProgress.mockResolvedValue({
      practiceVolume: { ownedWorkspaceCount: 1, activeWorkspaceCount: 1, completedScenarioCount: 0, completedReviewCount: 1 },
      recentActivity: [],
      qualifiedReviewTrends: [],
    });

    renderWithProviders(<ProgressOverview />);

    expect(await screen.findByText("LEARNING PATTERNS")).toBeInTheDocument();
    expect(screen.queryByText("RECURRING STRENGTH")).not.toBeInTheDocument();
    expect(screen.queryByText("RECURRING RISK")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse Challenges →" })).toHaveAttribute("href", "/challenges");
  });
});
