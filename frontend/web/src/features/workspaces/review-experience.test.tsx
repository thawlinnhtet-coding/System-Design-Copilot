import { fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { ReviewExperience, type ReviewExperienceView } from "./review-experience";

const api = vi.hoisted(() => ({ getReviews: vi.fn() }));
vi.mock("@/lib/api/authenticated-client", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/api/authenticated-client")>()), useAuthenticatedApiClient: () => api }));

const completed: ReviewExperienceView = {
  id: "review-2", state: "COMPLETED", revision: { id: "revision-2", documentVersion: 4 },
  interpretation: "The request path is clear, but its single-region data store is a material availability risk.",
  strengths: ["The write path names a durable owner."], risks: ["A regional outage removes all durable state."],
  findings: [{ id: "finding-1", severity: "high", title: "Single-region persistence", impact: "A regional outage interrupts all writes.", recommendation: "Define recovery and replication boundaries.", evidenceLabel: "data-store-1" }],
  uncertainty: ["Recovery objectives are not recorded."], nextActions: ["Record a recovery objective before choosing replication."],
  dimensions: [{ label: "Reliability and failure handling", score: 2, evidence: "The datastore has no recovery path." }],
};

describe("ReviewExperience", () => {
  it("keeps the Review request unavailable until the processing adapter exists", () => {
    renderWithProviders(<ReviewExperience />);
    expect(screen.getByLabelText("Review processing unavailable")).toBeVisible();
    expect(screen.getByRole("button", { name: "Open a Workspace to request Review" })).toBeDisabled();
  });

  it("renders evidence-grounded completed feedback without a composite score", () => {
    const inspect = vi.fn();
    const carry = vi.fn();
    renderWithProviders(<ReviewExperience adapter={{ current: completed, onInspectEvidence: inspect, onCarryFinding: carry }} />);
    expect(screen.getByText("Single-region persistence")).toBeVisible();
    expect(screen.getByText("Seven supporting dimensions")).toBeVisible();
    expect(screen.queryByText(/overall score/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Inspect data-store-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy to carry into reasoning" }));
    expect(inspect).toHaveBeenCalledWith(completed.findings?.[0]);
    expect(carry).toHaveBeenCalledWith(completed.findings?.[0]);
  });

  it("presents retry as a same-revision action and prepares a history comparison", () => {
    const retry = vi.fn();
    const retryable = { ...completed, id: "review-3", state: "FAILED_RETRYABLE" as const };
    renderWithProviders(<ReviewExperience adapter={{ current: retryable, history: [completed], onRetry: retry }} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry this revision" }));
    expect(retry).toHaveBeenCalledWith("review-3");
    fireEvent.click(screen.getByRole("button", { name: "Compare" }));
    expect(screen.getByText(/Comparison selected. The API adapter will load both immutable Review records/)).toBeVisible();
  });
});
