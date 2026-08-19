import { act } from "@testing-library/react";
import { buildFlowLayout, useArchitectureEditorStore } from "./architecture-editor-store";

const document = { schemaVersion: 1 as const, components: [], connections: [], boundaries: [] };

describe("architecture editor draft", () => {
  beforeEach(() => {
    useArchitectureEditorStore.getState().initialize("workspace-1", 0, document);
  });

  it("adds a semantic component to the local draft and selects it", () => {
    act(() => useArchitectureEditorStore.getState().addComponent("COMPUTE", "SERVICE"));

    const state = useArchitectureEditorStore.getState();
    expect(state.dirty).toBe(true);
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0]?.data).toMatchObject({ category: "COMPUTE", type: "SERVICE" });
    expect(state.selectedNodeId).toBe(state.nodes[0]?.id);
    expect(state.document?.components[0]).toMatchObject({ category: "COMPUTE", type: "SERVICE" });
  });

  it("removes connected edges when a selected component is deleted", () => {
    act(() => {
      const editor = useArchitectureEditorStore.getState();
      editor.addComponent("COMPUTE", "SERVICE");
      editor.addComponent("DATA_STORE", "RELATIONAL_DATABASE");
      const current = useArchitectureEditorStore.getState();
      const [first, second] = current.nodes;
      current.setEdges([{ id: "connection-1", source: first!.id, target: second!.id }]);
      current.selectNode(first!.id);
      current.deleteSelected();
    });

    const state = useArchitectureEditorStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.edges).toHaveLength(0);
    expect(state.document?.connections).toHaveLength(0);
  });

  it("supports session undo and redo without changing the server version", () => {
    act(() => {
      const editor = useArchitectureEditorStore.getState();
      editor.addComponent("COMPUTE", "SERVICE");
      editor.undo();
    });
    expect(useArchitectureEditorStore.getState().nodes).toHaveLength(0);
    expect(useArchitectureEditorStore.getState().version).toBe(0);

    act(() => useArchitectureEditorStore.getState().redo());
    expect(useArchitectureEditorStore.getState().nodes).toHaveLength(1);
  });

  it("creates typed connections without dragging and rejects self loops or exact duplicates", () => {
    let result: { ok: boolean };
    act(() => {
      const editor = useArchitectureEditorStore.getState();
      editor.addComponent("COMPUTE", "SERVICE");
      editor.addComponent("DATA_STORE", "RELATIONAL_DATABASE");
      const [source, target] = useArchitectureEditorStore.getState().nodes;
      result = editor.addConnection({ source: source!.id, target: target!.id, intent: "DATA_READ_WRITE", protocol: "SQL", guarantee: "STRONG", notes: "Reads the primary record." });
    });
    expect(result!.ok).toBe(true);
    expect(useArchitectureEditorStore.getState().document?.connections[0]).toMatchObject({ intent: "DATA_READ_WRITE", protocol: "SQL", guarantee: "STRONG" });
    const [source, target] = useArchitectureEditorStore.getState().nodes;
    expect(useArchitectureEditorStore.getState().addConnection({ source: source!.id, target: source!.id, intent: "STREAM" }).ok).toBe(false);
    expect(useArchitectureEditorStore.getState().addConnection({ source: source!.id, target: target!.id, intent: "DATA_READ_WRITE" }).ok).toBe(false);
  });

  it("supports nested boundaries and component membership", () => {
    act(() => {
      const editor = useArchitectureEditorStore.getState();
      editor.addComponent("CUSTOM", "CUSTOM_COMPONENT");
      editor.addBoundary({ label: "Primary region", type: "REGION", componentIds: [] });
    });
    const editor = useArchitectureEditorStore.getState();
    const boundary = editor.boundaries[0]!;
    const component = editor.nodes[0]!;
    act(() => editor.updateBoundary(boundary.id, { componentIds: [component.id] }));
    expect(useArchitectureEditorStore.getState().document?.boundaries[0]).toMatchObject({ label: "Primary region", componentIds: [component.id] });
  });

  it("duplicates a component with a fresh id and offset position", () => {
    act(() => {
      const editor = useArchitectureEditorStore.getState();
      editor.addComponent("COMPUTE", "SERVICE");
      editor.updateComponent(useArchitectureEditorStore.getState().nodes[0]!.id, { label: "Orders API", properties: { runtime: "GO" } });
      editor.duplicateComponent(useArchitectureEditorStore.getState().nodes[0]!.id);
    });
    const state = useArchitectureEditorStore.getState();
    expect(state.nodes).toHaveLength(2);
    const [original, copy] = state.nodes;
    expect(copy!.id).not.toBe(original!.id);
    expect(copy!.data).toMatchObject({ label: "Orders API", category: "COMPUTE", type: "SERVICE" });
    expect(copy!.data.properties).toEqual({ runtime: "GO" });
    expect(copy!.position.x).toBeGreaterThan(original!.position.x);
    expect(state.selectedNodeId).toBe(copy!.id);
    expect(state.document?.components).toHaveLength(2);
  });

  it("edits and deletes a selected connection", () => {
    act(() => {
      const editor = useArchitectureEditorStore.getState();
      editor.addComponent("COMPUTE", "SERVICE");
      editor.addComponent("DATA_STORE", "RELATIONAL_DATABASE");
      const [source, target] = useArchitectureEditorStore.getState().nodes;
      editor.addConnection({ source: source!.id, target: target!.id, intent: "REQUEST_RESPONSE" });
    });
    const edge = useArchitectureEditorStore.getState().edges[0]!;
    act(() => useArchitectureEditorStore.getState().updateConnection(edge.id, { intent: "DATA_READ_WRITE", protocol: "SQL", guarantee: "STRONG" }));
    expect(useArchitectureEditorStore.getState().edges[0]).toMatchObject({ data: { intent: "DATA_READ_WRITE", protocol: "SQL", guarantee: "STRONG" } });
    expect(useArchitectureEditorStore.getState().document?.connections[0]).toMatchObject({ intent: "DATA_READ_WRITE", protocol: "SQL", guarantee: "STRONG" });

    act(() => useArchitectureEditorStore.getState().selectEdge(edge.id));
    expect(useArchitectureEditorStore.getState().selectedEdgeId).toBe(edge.id);
    act(() => useArchitectureEditorStore.getState().deleteConnection(edge.id));
    expect(useArchitectureEditorStore.getState().edges).toHaveLength(0);
    expect(useArchitectureEditorStore.getState().selectedEdgeId).toBeNull();
  });

  it("derives visual boundary containers that hold member components", () => {
    act(() => {
      const editor = useArchitectureEditorStore.getState();
      editor.addComponent("COMPUTE", "SERVICE");
      editor.addComponent("DATA_STORE", "RELATIONAL_DATABASE");
      const [service, database] = useArchitectureEditorStore.getState().nodes;
      editor.addBoundary({ label: "Primary region", type: "REGION", componentIds: [service!.id, database!.id] });
    });
    const state = useArchitectureEditorStore.getState();
    const { flowNodes, parentOrigins } = buildFlowLayout(state.nodes, state.boundaries);

    const boundaryNode = flowNodes.find((node) => node.type === "boundary");
    expect(boundaryNode).toBeDefined();
    const memberIds = flowNodes.filter((node) => node.type === "component" && node.parentId === boundaryNode!.id).map((node) => node.id);
    expect(memberIds).toHaveLength(2);
    expect(parentOrigins.get(state.nodes[0]!.id)).toBeDefined();
    expect(state.nodes.every((node) => node.parentId === undefined)).toBe(true);
  });
});
