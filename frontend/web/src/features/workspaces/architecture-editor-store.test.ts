import { act } from "@testing-library/react";
import { useArchitectureEditorStore } from "./architecture-editor-store";

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
});
