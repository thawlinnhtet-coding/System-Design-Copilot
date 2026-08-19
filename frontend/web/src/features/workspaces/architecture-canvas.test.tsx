import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { ArchitectureCanvas } from "./architecture-canvas";
import { useArchitectureEditorStore } from "./architecture-editor-store";

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
    useArchitectureEditorStore.getState().initialize("", 0, { schemaVersion: 1, components: [], connections: [], boundaries: [] });
    api.getArchitectureDocument.mockResolvedValue({ workspaceId: "workspace-1", version: 0, document: { schemaVersion: 1, components: [], connections: [], boundaries: [] } });
    api.saveArchitectureDocument.mockImplementation(async (workspaceId: string, version: number, document: unknown) => ({ workspaceId, version: version + 1, document }));
  });

  it("loads the document and exposes keyboard-accessible component insertion", async () => {
    renderWithProviders(<ArchitectureCanvas workspaceId="workspace-1" />);

    expect(await screen.findByRole("toolbar", { name: "Canvas tools" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Service" }));

    await waitFor(() => expect(useArchitectureEditorStore.getState().nodes).toHaveLength(1));
    expect(useArchitectureEditorStore.getState().nodes[0]?.data).toMatchObject({ category: "COMPUTE", type: "SERVICE", label: "Service" });
    expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
  });

  it("shows the archived read-only state", async () => {
    renderWithProviders(<ArchitectureCanvas readOnly workspaceId="workspace-1" />);

    expect(await screen.findByRole("toolbar", { name: "Canvas tools" })).toBeVisible();
    expect(screen.getByText("This Workspace is archived. Restore it before editing.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Service" })).toBeDisabled();
    await waitFor(() => expect(api.getArchitectureDocument).toHaveBeenCalledWith("workspace-1"));
  });

  it("places a component when dragged from the palette and dropped on the flow surface", async () => {
    renderWithProviders(<ArchitectureCanvas workspaceId="workspace-1" />);

    await screen.findByRole("toolbar", { name: "Canvas tools" });
    const stored: Record<string, string> = {};
    const dataTransfer = { setData: (type: string, value: string) => { stored[type] = value; }, getData: (type: string) => stored[type] ?? "", types: [] as string[], effectAllowed: "", dropEffect: "" };
    fireEvent.dragStart(screen.getByRole("button", { name: "Service" }), { dataTransfer });
    expect(stored["application/sdc-component"]).toContain('"type":"SERVICE"');

    fireEvent.drop(screen.getByTestId("architecture-flow"), { dataTransfer, clientX: 250, clientY: 180 });

    await waitFor(() => expect(useArchitectureEditorStore.getState().nodes).toHaveLength(1));
    expect(useArchitectureEditorStore.getState().nodes[0]?.data).toMatchObject({ category: "COMPUTE", type: "SERVICE", label: "Service" });
  });

  it("loads pre-populated components into the editor without dropping them", async () => {
    api.getArchitectureDocument.mockResolvedValue({ workspaceId: "workspace-1", version: 0, document: { schemaVersion: 1, components: [{ id: "component-1", category: "COMPUTE", type: "SERVICE", label: "API", properties: { runtime: "OTHER" }, position: { x: 100, y: 100 } }], connections: [], boundaries: [] } });
    renderWithProviders(<ArchitectureCanvas workspaceId="workspace-1" />);

    await screen.findByRole("toolbar", { name: "Canvas tools" });
    await waitFor(() => expect(useArchitectureEditorStore.getState().nodes).toHaveLength(1));
    expect(useArchitectureEditorStore.getState().nodes[0]?.data.label).toBe("API");
    expect(useArchitectureEditorStore.getState().document?.components[0]?.label).toBe("API");
  });
});
