import { applyNodeChanges, type Edge, type Node, type NodeChange } from "@xyflow/react";
import { create } from "zustand";
import type { ArchitectureDocument, ArchitectureComponentCategory, ArchitectureComponentType } from "@/lib/api/authenticated-client";

export type CanvasNodeData = { label: string; category: ArchitectureComponentCategory; type: ArchitectureComponentType; properties: Record<string, string | number | boolean> };
export type CanvasNode = Node<CanvasNodeData, "component">;

type EditorState = {
  workspaceId: string | null;
  version: number;
  document: ArchitectureDocument | null;
  nodes: CanvasNode[];
  edges: Edge[];
  dirty: boolean;
  selectedNodeId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  initialize: (workspaceId: string, version: number, document: ArchitectureDocument) => void;
  applyNodes: (changes: NodeChange<CanvasNode>[]) => void;
  setNodes: (nodes: CanvasNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateComponent: (id: string, patch: Partial<CanvasNodeData>) => void;
  addComponent: (category: ArchitectureComponentCategory, type: ArchitectureComponentType) => void;
  deleteSelected: () => void;
  selectNode: (id: string | null) => void;
  replaceFromServer: (version: number, document: ArchitectureDocument) => void;
  markSaved: (version: number, document: ArchitectureDocument) => void;
  markDirty: () => void;
  undo: () => void;
  redo: () => void;
};

type Snapshot = Pick<EditorState, "version" | "document" | "nodes" | "edges" | "dirty" | "selectedNodeId">;
const snapshot = (state: EditorState): Snapshot => ({ version: state.version, document: state.document, nodes: state.nodes, edges: state.edges, dirty: state.dirty, selectedNodeId: state.selectedNodeId });

const emptyDocument = (): ArchitectureDocument => ({ schemaVersion: 1, components: [], connections: [], boundaries: [] });
export const componentDefaults: Record<ArchitectureComponentCategory, Record<string, string>> = {
  COMPUTE: { runtime: "OTHER" },
  DATA_STORE: { consistency: "EVENTUAL" },
  MESSAGING: { deliveryGuarantee: "AT_LEAST_ONCE" },
  EDGE_SECURITY: { exposure: "INTERNAL" },
  IDENTITY_SECRETS: { responsibility: "IDENTITY" },
  OBSERVABILITY: { signal: "METRICS" },
};

function toNodes(document: ArchitectureDocument): CanvasNode[] {
  return document.components.map((component, index) => ({
    id: component.id,
    type: "component",
    position: component.position ?? { x: 80 + (index % 3) * 230, y: 80 + Math.floor(index / 3) * 150 },
    data: { label: component.label, category: component.category, type: component.type, properties: component.properties },
  }));
}

function toEdges(document: ArchitectureDocument): Edge[] {
  return document.connections.map((connection) => ({ id: connection.id, source: connection.fromComponentId, target: connection.toComponentId, label: connection.intent.replaceAll("_", " "), animated: connection.intent.includes("EVENT") || connection.intent === "STREAM" }));
}

function toDocument(nodes: CanvasNode[], edges: Edge[], previous: ArchitectureDocument): ArchitectureDocument {
  const components = nodes.map((node) => {
    const existing = previous.components.find((component) => component.id === node.id);
    return { ...(existing ?? { id: node.id, category: node.data.category, type: node.data.type, label: node.data.label, properties: componentDefaults[node.data.category] }), category: node.data.category, type: node.data.type, label: node.data.label, properties: node.data.properties, position: { x: Math.round(node.position.x), y: Math.round(node.position.y) } };
  });
  const connections = edges.map((edge) => {
    const existing = previous.connections.find((connection) => connection.id === edge.id);
    return { ...(existing ?? { id: edge.id, intent: "REQUEST_RESPONSE" }), fromComponentId: edge.source, toComponentId: edge.target };
  });
  return { ...previous, components, connections };
}

function nextId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

export const useArchitectureEditorStore = create<EditorState>((set) => ({
  workspaceId: null,
  version: 0,
  document: null,
  nodes: [],
  edges: [],
  dirty: false,
  selectedNodeId: null,
  past: [],
  future: [],
  initialize: (workspaceId, version, document) => set({ workspaceId, version, document, nodes: toNodes(document), edges: toEdges(document), dirty: false, selectedNodeId: null, past: [], future: [] }),
  applyNodes: (changes) => set((state) => {
    const nodes = applyNodeChanges(changes, state.nodes) as CanvasNode[];
    const meaningful = changes.some((change) => change.type !== "select");
    if (!meaningful) return { nodes };
    return state.document ? { nodes, document: toDocument(nodes, state.edges, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  setNodes: (nodes) => set((state) => state.document ? { nodes, document: toDocument(nodes, state.edges, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, dirty: true, past: [...state.past, snapshot(state)], future: [] }),
  setEdges: (edges) => set((state) => state.document ? { edges, document: toDocument(state.nodes, edges, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { edges, dirty: true, past: [...state.past, snapshot(state)], future: [] }),
  updateComponent: (id, patch) => set((state) => {
    const nodes = state.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, ...patch } } : node);
    return state.document ? { nodes, document: toDocument(nodes, state.edges, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  addComponent: (category, type) => set((state) => {
    const id = nextId("component");
    const node: CanvasNode = { id, type: "component", position: { x: 100 + (state.nodes.length % 3) * 230, y: 100 + Math.floor(state.nodes.length / 3) * 150 }, data: { label: humanize(type), category, type, properties: componentDefaults[category] } };
    const nodes = [...state.nodes, node];
    return state.document ? { nodes, selectedNodeId: id, document: toDocument(nodes, state.edges, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, selectedNodeId: id, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  deleteSelected: () => set((state) => {
    if (!state.selectedNodeId) return state;
    const id = state.selectedNodeId;
    const nodes = state.nodes.filter((node) => node.id !== id);
    const edges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);
    return state.document ? { nodes, edges, selectedNodeId: null, document: toDocument(nodes, edges, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, edges, selectedNodeId: null, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  replaceFromServer: (version, document) => set((state) => ({ version, document, nodes: toNodes(document), edges: toEdges(document), dirty: false, selectedNodeId: state.selectedNodeId, past: [], future: [] })),
  markSaved: (version, document) => set({ version, document, dirty: false, nodes: toNodes(document), edges: toEdges(document) }),
  markDirty: () => set({ dirty: true }),
  undo: () => set((state) => {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return { ...previous, workspaceId: state.workspaceId, past: state.past.slice(0, -1), future: [snapshot(state), ...state.future] };
  }),
  redo: () => set((state) => {
    const next = state.future[0];
    if (!next) return state;
    return { ...next, workspaceId: state.workspaceId, past: [...state.past, snapshot(state)], future: state.future.slice(1) };
  }),
}));

export { emptyDocument };
