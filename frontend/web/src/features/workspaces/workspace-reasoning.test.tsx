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
});
