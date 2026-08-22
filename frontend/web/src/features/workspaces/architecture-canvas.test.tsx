import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test/setup";
import { ArchitectureCanvas, ArchitectureInspector } from "./architecture-canvas";
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

  it("exposes the expanded PRD taxonomy in the component palette", async () => {
    renderWithProviders(<ArchitectureCanvas workspaceId="workspace-1" />);

    await screen.findByRole("toolbar", { name: "Canvas tools" });
    fireEvent.click(screen.getByRole("button", { name: "Clients" }));
    fireEvent.click(screen.getByRole("button", { name: "Client" }));
    fireEvent.click(screen.getByRole("button", { name: "Messaging & streaming" }));
    fireEvent.click(screen.getByRole("button", { name: "Event bus" }));

    await waitFor(() => expect(useArchitectureEditorStore.getState().nodes).toHaveLength(2));
    expect(useArchitectureEditorStore.getState().nodes[0]?.data).toMatchObject({ category: "CLIENT", type: "CLIENT", label: "Client" });
    expect(useArchitectureEditorStore.getState().nodes[1]?.data).toMatchObject({ category: "MESSAGING", type: "EVENT_BUS", label: "Event bus" });
  });

  it("shows the empty canvas onboarding and confirms deletions before removing", async () => {
    renderWithProviders(<ArchitectureCanvas workspaceId="workspace-1" />);

    await screen.findByRole("toolbar", { name: "Canvas tools" });
    expect(screen.getByText("No architecture Components yet.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Service" }));
    await waitFor(() => expect(useArchitectureEditorStore.getState().nodes).toHaveLength(1));

    fireEvent.keyDown(screen.getByLabelText("Architecture canvas"), { key: "Delete" });
    expect(screen.getByRole("dialog", { name: /Delete Service/ })).toBeInTheDocument();
    expect(screen.getByText("Delete Service?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete Component" }));
    await waitFor(() => expect(useArchitectureEditorStore.getState().nodes).toHaveLength(0));
    expect(screen.getByText("No architecture Components yet.")).toBeVisible();
  });

  it("opens boundary details after drawing a rectangle on the canvas", async () => {
    renderWithProviders(<ArchitectureCanvas workspaceId="workspace-1" />);

    await screen.findByRole("toolbar", { name: "Canvas tools" });
    fireEvent.click(screen.getByRole("button", { name: "Boundary" }));
    const canvas = screen.getByTestId("architecture-flow");
    fireEvent.mouseDown(canvas, { button: 0, clientX: 120, clientY: 120 });
    fireEvent.mouseMove(canvas, { clientX: 520, clientY: 360 });
    expect(screen.getByTestId("boundary-preview")).toBeVisible();
    fireEvent.mouseUp(canvas, { button: 0, clientX: 520, clientY: 360 });

    expect(await screen.findByRole("dialog", { name: "Add boundary" })).toBeVisible();
    expect(screen.getByTestId("boundary-preview")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Primary region" } });
    fireEvent.click(screen.getByRole("button", { name: "Boundary type" }));
    expect(screen.getByRole("listbox", { name: "Boundary type options" })).toBeVisible();
    fireEvent.click(screen.getByRole("option", { name: "Cloud region" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Boundary" }));
    await waitFor(() => expect(useArchitectureEditorStore.getState().boundaries).toHaveLength(1));
    expect(useArchitectureEditorStore.getState().boundaries[0]?.type).toBe("REGION");
    expect(screen.queryByTestId("boundary-preview")).not.toBeInTheDocument();
    expect(screen.getByTestId("persisted-boundary-visual")).toBeVisible();
    expect(screen.getByText("Primary region / CLOUD REGION BOUNDARY")).toBeInTheDocument();
    expect(screen.getByTestId("persisted-boundary-label")).toHaveTextContent("Primary region / CLOUD REGION BOUNDARY");
    expect(screen.queryByText("No architecture Components yet.")).not.toBeInTheDocument();
  });

  it("loads pre-populated components into the editor without dropping them", async () => {
    api.getArchitectureDocument.mockResolvedValue({ workspaceId: "workspace-1", version: 0, document: { schemaVersion: 1, components: [{ id: "component-1", category: "COMPUTE", type: "SERVICE", label: "API", properties: { runtime: "OTHER" }, position: { x: 100, y: 100 } }], connections: [], boundaries: [] } });
    renderWithProviders(<ArchitectureCanvas workspaceId="workspace-1" />);

    await screen.findByRole("toolbar", { name: "Canvas tools" });
    await waitFor(() => expect(useArchitectureEditorStore.getState().nodes).toHaveLength(1));
    expect(useArchitectureEditorStore.getState().nodes[0]?.data.label).toBe("API");
    expect(useArchitectureEditorStore.getState().document?.components[0]?.label).toBe("API");
  });

  it("offers generic data-store components without vendor duplicates", async () => {
    renderWithProviders(<ArchitectureCanvas workspaceId="workspace-1" />);

    await screen.findByRole("toolbar", { name: "Canvas tools" });
    fireEvent.click(screen.getByRole("button", { name: "Data stores" }));
    expect(screen.getByRole("button", { name: "Cache" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Redis cache" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Document database" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "NoSQL database" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PostgreSQL" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Vector database" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cache" }));

    await waitFor(() => expect(useArchitectureEditorStore.getState().nodes).toHaveLength(1));
    expect(useArchitectureEditorStore.getState().nodes[0]?.data).toMatchObject({ label: "Cache", type: "CACHE" });
    const node = useArchitectureEditorStore.getState().nodes[0];
    if (!node) throw new Error("Expected Cache component");
    render(<ArchitectureInspector disabled={false} node={node} onChange={(patch) => useArchitectureEditorStore.getState().updateComponent(node.id, patch)} onDelete={() => undefined} onDuplicate={() => undefined} />);
    const provider = screen.getByRole("combobox", { name: "provider" });
    expect(provider).toHaveValue("");
    expect(screen.getByRole("option", { name: "REDIS" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "POSTGRESQL" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "MONGODB" })).not.toBeInTheDocument();
    fireEvent.change(provider, { target: { value: "REDIS" } });
    expect(useArchitectureEditorStore.getState().nodes[0]?.data.properties).toMatchObject({ provider: "REDIS" });
    expect(useArchitectureEditorStore.getState().nodes[0]?.data.properties).toMatchObject({ consistency: "EVENTUAL" });
  });

  it("does not assume an API gateway exposure", async () => {
    renderWithProviders(<ArchitectureCanvas workspaceId="workspace-1" />);

    await screen.findByRole("toolbar", { name: "Canvas tools" });
    fireEvent.click(screen.getByRole("button", { name: "DNS & edge" }));
    fireEvent.click(screen.getByRole("button", { name: "API gateway" }));

    await waitFor(() => expect(useArchitectureEditorStore.getState().nodes).toHaveLength(1));
    expect(useArchitectureEditorStore.getState().nodes[0]?.data.properties).not.toHaveProperty("exposure");
  });
});
