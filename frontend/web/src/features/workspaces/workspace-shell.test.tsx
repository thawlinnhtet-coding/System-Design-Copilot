import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { WorkspaceShell } from "./workspace-shell";

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
const api = vi.hoisted(() => ({ getWorkspace: vi.fn(), restoreWorkspace: vi.fn(), updateWorkspaceFocus: vi.fn(), exportWorkspace: vi.fn() }));

vi.mock("@clerk/nextjs", () => ({ SignInButton: ({ children }: { children: React.ReactNode }) => children, useAuth: () => session }));
vi.mock("@/lib/api/authenticated-client", () => ({ useAuthenticatedApiClient: () => api }));
vi.mock("./workspace-reasoning", () => ({ WorkspaceReasoning: () => <div>Reasoning</div> }));
vi.mock("./architecture-canvas", () => ({ ArchitectureCanvas: () => <div>Canvas</div> }));

describe("WorkspaceShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getWorkspace.mockResolvedValue({
      id: "archived-1", name: "Image pipeline", description: "Process images", status: "ARCHIVED",
      focusStage: "CLARIFY", focusPanel: "REASONING", saveState: "SAVED", canvasViewport: { x: 0, y: 0, zoom: 1 },
    });
  });

  it("explains the archived read-only state and restores when capacity is available", async () => {
    api.restoreWorkspace.mockResolvedValue({ id: "archived-1", name: "Image pipeline", description: "Process images", status: "ACTIVE", focusStage: "CLARIFY", focusPanel: "REASONING", saveState: "SAVED", canvasViewport: { x: 0, y: 0, zoom: 1 } });
    renderWithProviders(<WorkspaceShell workspaceId="archived-1" />);

    expect(await screen.findByLabelText("Archived Workspace status")).toHaveTextContent("Editing, Copilot use, and Review submission are unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Restore Workspace" }));

    await waitFor(() => expect(api.restoreWorkspace).toHaveBeenCalledWith("archived-1"));
    await waitFor(() => expect(screen.queryByLabelText("Archived Workspace status")).not.toBeInTheDocument());
  });
});
