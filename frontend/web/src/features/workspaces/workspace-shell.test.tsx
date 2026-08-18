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
vi.mock("./copilot-panel", () => ({ CopilotPanel: () => <div aria-label="Copilot guidance">Copilot</div> }));

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

  it("keeps the workspace hierarchy visible and toggles the contextual panel", async () => {
    renderWithProviders(<WorkspaceShell workspaceId="archived-1" />);

    expect(await screen.findByText("PRACTICE LOOP")).toBeVisible();
    expect(screen.getByText("From question to evidence")).toBeVisible();
    expect(screen.getByText("CLARIFY / WORKSPACE DOCUMENT")).toBeVisible();
    expect(screen.getByText("Next action: Add your first Requirement.")).toBeVisible();
    expect(screen.getByText("SYSTEM IDEA")).toBeVisible();
    expect(screen.getByRole("link", { name: "Start your checklist" })).toHaveAttribute("href", "#requirements");
    expect(screen.getByRole("button", { name: "Continue to Design" })).toBeVisible();
    expect(screen.queryByText("You can skip the first Requirement.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Workspace context panel")).toBeVisible();
    expect(screen.getByRole("tab", { name: "Inspector" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "Open Copilot" }));
    expect(screen.getByRole("tab", { name: "Copilot" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Copilot guidance")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Close contextual rail" }));
    expect(screen.queryByLabelText("Workspace context panel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open contextual rail" }));
    expect(screen.getByLabelText("Workspace context panel")).toBeVisible();
  });

  it("guides curated challenges toward a distilled checklist", async () => {
    api.getWorkspace.mockResolvedValue({
      id: "curated-1", name: "Notification delivery", description: "Deliver time-sensitive notifications.", source: "CURATED_CHALLENGE", status: "ACTIVE",
      focusStage: "CLARIFY", focusPanel: "REASONING", saveState: "SAVED", canvasViewport: { x: 0, y: 0, zoom: 1 },
    });
    renderWithProviders(<WorkspaceShell workspaceId="curated-1" />);

    expect(await screen.findByText("CHALLENGE BRIEF")).toBeVisible();
    expect(screen.getByText("Next action: Make one important design requirement explicit.")).toBeVisible();
    expect(screen.getByText("Turn the challenge brief into a short design checklist. Capture only the requirements that will guide your design.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Start your checklist" })).toHaveAttribute("href", "#requirements");
    expect(screen.queryByText("Next action: Add your first Requirement.")).not.toBeInTheDocument();
  });
});
