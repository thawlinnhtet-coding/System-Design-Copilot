import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { CopilotPanel } from "./copilot-panel";

const api = vi.hoisted(() => ({ getAiConsent: vi.fn(), streamCopilot: vi.fn(), createRequirement: vi.fn(), createAssumption: vi.fn(), createQuestion: vi.fn() }));
vi.mock("@/lib/api/authenticated-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/authenticated-client")>("@/lib/api/authenticated-client");
  return { ...actual, useAuthenticatedApiClient: () => api };
});

describe("CopilotPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAiConsent.mockResolvedValue({ granted: true, policy: { currentVersion: "2026-08-01" } });
    api.createRequirement.mockResolvedValue({ id: "requirement-1" });
    api.createAssumption.mockResolvedValue({ id: "assumption-1" });
    api.createQuestion.mockResolvedValue({ id: "question-1" });
  });

  it("shows privacy exclusions before sending an advisory turn", async () => {
    api.streamCopilot.mockResolvedValue({ id: "turn-1", content: "Inspect cache invalidation and recovery paths.", model: "copilot-model", replayed: false });
    renderWithProviders(<CopilotPanel readOnly={false} workspaceId="workspace-1" />);
    expect(await screen.findByText(/Excluded: credentials, tokens, passwords/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Ask Copilot" }), { target: { value: "Should I use a cache?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask Copilot" }));
    await waitFor(() => expect(api.streamCopilot).toHaveBeenCalledWith("workspace-1", expect.objectContaining({ question: "Should I use a cache?" }), expect.any(Function)));
    expect(await screen.findByLabelText("Copilot response")).toHaveTextContent("Inspect cache invalidation");
    expect(screen.queryByText("TRY ASKING")).not.toBeInTheDocument();
  });

  it("explains that archived Workspaces cannot use Copilot", async () => {
    renderWithProviders(<CopilotPanel readOnly workspaceId="workspace-1" />);
    expect(await screen.findByText("Restore this Workspace to use Copilot.")).toBeInTheDocument();
  });

  it("lets the user review and save Copilot guidance as a requirement", async () => {
    api.streamCopilot.mockResolvedValue({ id: "turn-1", content: "Use bounded retries.", model: "copilot-model", replayed: false });
    renderWithProviders(<CopilotPanel readOnly={false} workspaceId="workspace-1" />);
    expect(await screen.findByText(/Excluded: credentials, tokens, passwords/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Ask Copilot" }), { target: { value: "How should retries behave?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask Copilot" }));
    expect(await screen.findByText("Use bounded retries.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add as requirement" }));
    const draft = screen.getByRole("textbox", { name: "Requirement statement" });
    fireEvent.change(draft, { target: { value: "The system retries temporary provider failures with a bounded backoff." } });
    fireEvent.change(screen.getByRole("textbox", { name: "Why does it matter?" }), { target: { value: "It improves delivery without overwhelming providers." } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm and save" }));

    await waitFor(() => expect(api.createRequirement).toHaveBeenCalledWith("workspace-1", expect.objectContaining({
      statement: "The system retries temporary provider failures with a bounded backoff.",
      source: "COPILOT",
    })));
    expect(await screen.findByText("Requirement added to your design checklist.")).toBeInTheDocument();
  });
});
