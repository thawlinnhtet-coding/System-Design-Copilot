import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { WorkspaceReasoning } from "./workspace-reasoning";

const api = vi.hoisted(() => ({
  getReasoning: vi.fn(),
  createRequirement: vi.fn(),
  updateRequirement: vi.fn(),
  deleteRequirement: vi.fn(),
  createAssumption: vi.fn(),
  updateAssumption: vi.fn(),
  deleteAssumption: vi.fn(),
  createQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
  createDecision: vi.fn(),
  deleteDecision: vi.fn(),
  saveReviewBrief: vi.fn(),
}));

vi.mock("@/lib/api/authenticated-client", () => ({
  useAuthenticatedApiClient: () => api,
}));

describe("WorkspaceReasoning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getReasoning.mockResolvedValue({ requirements: [], assumptions: [], questions: [], decisions: [], reviewBrief: null });
    api.createRequirement.mockResolvedValue({ id: "req-1", statement: "Keep reads fast", kind: "FUNCTIONAL", priority: "MUST", status: "OPEN" });
  });

  it("restores an empty reasoning document and creates a Requirement", async () => {
    render(<WorkspaceReasoning workspaceId="workspace-1" />);

    expect(await screen.findByRole("heading", { name: "What must this system do?" })).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Requirement statement" }), { target: { value: "Keep reads fast" } });
    fireEvent.click(screen.getByRole("button", { name: "Add requirement" }));

    await waitFor(() => expect(api.createRequirement).toHaveBeenCalledWith("workspace-1", expect.objectContaining({ statement: "Keep reads fast", kind: "FUNCTIONAL", priority: "MUST", status: "OPEN" })));
  });

  it("requires and saves an editable Review Brief for an Architecture Review Workspace", async () => {
    api.getReasoning.mockResolvedValue({
      requirements: [], assumptions: [], questions: [], decisions: [],
      reviewBrief: { systemDescription: "Existing checkout platform", reviewGoal: "Find payment failure risks" },
    });
    api.saveReviewBrief.mockResolvedValue({});

    render(<WorkspaceReasoning reviewBriefRequired workspaceId="workspace-1" />);

    expect(await screen.findByText(/Required before you can begin an Architecture Review Workspace/)).toBeVisible();
    const description = screen.getByRole("textbox", { name: "System Description" });
    const goal = screen.getByRole("textbox", { name: "Review Goal" });
    expect(description).toHaveAttribute("required");
    expect(goal).toHaveAttribute("required");

    fireEvent.change(goal, { target: { value: "Evaluate payment failure recovery" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Review Brief" }));

    await waitFor(() => expect(api.saveReviewBrief).toHaveBeenCalledWith("workspace-1", {
      systemDescription: "Existing checkout platform",
      reviewGoal: "Evaluate payment failure recovery",
    }));
  });

  it("requires a Review Brief before exposing Architecture Review Workspace reasoning", async () => {
    api.getReasoning
      .mockResolvedValueOnce({ requirements: [], assumptions: [], questions: [], decisions: [], reviewBrief: null })
      .mockResolvedValueOnce({ requirements: [], assumptions: [], questions: [], decisions: [], reviewBrief: { systemDescription: "Existing catalog", reviewGoal: "Check peak-load resilience" } });
    api.saveReviewBrief.mockResolvedValue({});

    render(<WorkspaceReasoning reviewBriefRequired workspaceId="workspace-1" />);

    expect(await screen.findByText(/Required before you can begin an Architecture Review Workspace/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Add requirement" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "System Description" }), { target: { value: "Existing catalog" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Review Goal" }), { target: { value: "Check peak-load resilience" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Review Brief" }));

    expect(await screen.findByRole("button", { name: "Add requirement" })).toBeVisible();
  });
});
