import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { CopilotPanel } from "./copilot-panel";

const api = vi.hoisted(() => ({ getAiConsent: vi.fn(), askCopilot: vi.fn() }));
vi.mock("@/lib/api/authenticated-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/authenticated-client")>("@/lib/api/authenticated-client");
  return { ...actual, useAuthenticatedApiClient: () => api };
});

describe("CopilotPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAiConsent.mockResolvedValue({ granted: true, policy: { currentVersion: "2026-08-01" } });
  });

  it("shows privacy exclusions before sending an advisory turn", async () => {
    api.askCopilot.mockResolvedValue({ id: "turn-1", content: "Inspect cache invalidation and recovery paths.", model: "copilot-model", replayed: false });
    renderWithProviders(<CopilotPanel readOnly={false} workspaceId="workspace-1" />);
    expect(await screen.findByText(/Excluded: credentials, tokens, passwords/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("What decision are you evaluating?"), { target: { value: "Should I use a cache?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask Copilot" }));
    await waitFor(() => expect(api.askCopilot).toHaveBeenCalledWith("workspace-1", expect.objectContaining({ question: "Should I use a cache?" })));
    expect(await screen.findByLabelText("Copilot response")).toHaveTextContent("Inspect cache invalidation");
  });

  it("explains that archived Workspaces cannot use Copilot", async () => {
    renderWithProviders(<CopilotPanel readOnly workspaceId="workspace-1" />);
    expect(await screen.findByText("Restore this Workspace to use Copilot.")).toBeInTheDocument();
  });
});
