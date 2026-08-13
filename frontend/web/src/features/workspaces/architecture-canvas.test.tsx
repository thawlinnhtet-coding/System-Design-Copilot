import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { ArchitectureCanvas } from "./architecture-canvas";

const api = vi.hoisted(() => ({
  getArchitectureDocument: vi.fn(),
  saveArchitectureDocument: vi.fn(),
  createArchitectureRevision: vi.fn(),
}));

vi.mock("@/lib/api/authenticated-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/authenticated-client")>("@/lib/api/authenticated-client");
  return { ...actual, useAuthenticatedApiClient: () => api };
});

describe("ArchitectureCanvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getArchitectureDocument.mockResolvedValue({ workspaceId: "workspace-1", version: 0, document: { schemaVersion: 1, components: [], connections: [], boundaries: [] } });
    api.saveArchitectureDocument.mockResolvedValue({ workspaceId: "workspace-1", version: 1, document: { schemaVersion: 1, components: [], connections: [], boundaries: [] } });
  });

  it("loads the document and exposes keyboard-accessible component insertion", async () => {
    renderWithProviders(<ArchitectureCanvas workspaceId="workspace-1" />);

    expect(await screen.findByText("Architecture Document")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Service" }));

    expect(await screen.findByRole("textbox", { name: "Label" })).toHaveValue("Service");
    expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
  });

  it("shows the archived read-only state", async () => {
    renderWithProviders(<ArchitectureCanvas readOnly workspaceId="workspace-1" />);

    expect(await screen.findByText("Architecture Document")).toBeVisible();
    expect(screen.getByText("This Workspace is archived. Restore it before editing.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Service" })).toBeDisabled();
    await waitFor(() => expect(api.getArchitectureDocument).toHaveBeenCalledWith("workspace-1"));
  });
});
