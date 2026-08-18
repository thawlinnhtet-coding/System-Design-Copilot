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
    expect(screen.getByRole("navigation", { name: "Reasoning actions" })).toBeVisible();
    expect(screen.getByText("HOW TO USE CLARIFY")).toBeVisible();
    expect(screen.getByText("You do not need to know the architecture yet. Plain language is enough.")).toBeVisible();
    expect(screen.getByRole("link", { name: "+ Requirement" })).toHaveAttribute("href", "#requirements");
    expect(screen.getByRole("textbox", { name: "Requirement statement" })).toHaveAttribute("placeholder", "e.g. Users can disable promotional notifications.");
    expect(screen.getAllByText("Optional context")).toHaveLength(2);
    expect(screen.getByText("Optional")).toBeVisible();
    expect(screen.getByText("Assumptions and estimates · optional")).toBeVisible();
    expect(screen.getByText("Decision log opens in Design, after you compare architecture options and trade-offs.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Add decision" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Review Brief" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Reasoning save status")).toHaveTextContent("0 unresolved questions / 0 validation errors");
    fireEvent.change(screen.getByRole("textbox", { name: "Requirement statement" }), { target: { value: "Keep reads fast" } });
    fireEvent.click(screen.getByRole("button", { name: "Add requirement" }));

    await waitFor(() => expect(api.createRequirement).toHaveBeenCalledWith("workspace-1", expect.objectContaining({ statement: "Keep reads fast", kind: "FUNCTIONAL", priority: "MUST", status: "OPEN" })));
  });

  it("explains that curated requirements are a distilled checklist", async () => {
    render(<WorkspaceReasoning curatedChallenge workspaceId="workspace-1" />);

    expect(await screen.findByText("Your design checklist")).toBeVisible();
    expect(screen.getByText("Capture the important functional and quality needs you derive from the challenge brief. You do not need to repeat every detail.")).toBeVisible();
    expect(screen.getByText("No requirements yet. Start with the most important promise in the challenge brief.")).toBeVisible();
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
