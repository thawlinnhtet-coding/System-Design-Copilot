import { applyNodeChanges, MarkerType, type Edge, type Node, type NodeChange } from "@xyflow/react";
import { create } from "zustand";
import type { ArchitectureDocument, ArchitectureComponentCategory, ArchitectureComponentType } from "@/lib/api/authenticated-client";

export type CanvasNodeData = { label: string; category: ArchitectureComponentCategory; type: ArchitectureComponentType; properties: Record<string, string | number | boolean> };
export type CanvasNode = Node<CanvasNodeData, "component">;
export type CanvasEdgeData = { intent: string; protocol?: string; guarantee?: string; notes?: string };
export type CanvasEdge = Edge<CanvasEdgeData>;
export type CanvasBoundary = { id: string; label: string; type: "DEPLOYMENT" | "NETWORK" | "REGION" | "AVAILABILITY" | "TRUST"; parentBoundaryId?: string; componentIds: string[]; metadata?: Record<string, string | number | boolean> };

type EditorState = {
  workspaceId: string | null;
  version: number;
  document: ArchitectureDocument | null;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  boundaries: CanvasBoundary[];
  dirty: boolean;
  selectedNodeId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  initialize: (workspaceId: string, version: number, document: ArchitectureDocument) => void;
  applyNodes: (changes: NodeChange<CanvasNode>[]) => void;
  setNodes: (nodes: CanvasNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addConnection: (connection: Omit<CanvasEdgeData, "intent"> & { intent: string; source: string; target: string }) => { ok: true } | { ok: false; message: string };
  addBoundary: (boundary: Omit<CanvasBoundary, "id">) => void;
  updateBoundary: (id: string, patch: Partial<Omit<CanvasBoundary, "id">>) => void;
  deleteBoundary: (id: string) => void;
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

type Snapshot = Pick<EditorState, "version" | "document" | "nodes" | "edges" | "boundaries" | "dirty" | "selectedNodeId">;
const snapshot = (state: EditorState): Snapshot => ({ version: state.version, document: state.document, nodes: state.nodes, edges: state.edges, boundaries: state.boundaries, dirty: state.dirty, selectedNodeId: state.selectedNodeId });

const emptyDocument = (): ArchitectureDocument => ({ schemaVersion: 1, components: [], connections: [], boundaries: [] });
export const componentDefaults: Record<ArchitectureComponentCategory, Record<string, string>> = {
  COMPUTE: { runtime: "OTHER" },
  DATA_STORE: { consistency: "EVENTUAL" },
  MESSAGING: { deliveryGuarantee: "AT_LEAST_ONCE" },
  EDGE_SECURITY: { exposure: "INTERNAL" },
  IDENTITY_SECRETS: { responsibility: "IDENTITY" },
  OBSERVABILITY: { signal: "METRICS" },
  CUSTOM: { semanticIcon: "component" },
};

function toNodes(document: ArchitectureDocument): CanvasNode[] {
  return document.components.map((component, index) => ({
    id: component.id,
    type: "component",
    position: component.position ?? { x: 80 + (index % 3) * 230, y: 80 + Math.floor(index / 3) * 150 },
    data: { label: component.label, category: component.category, type: component.type, properties: component.properties },
  }));
}

function toEdges(document: ArchitectureDocument): CanvasEdge[] {
  return document.connections.map((connection) => ({ id: connection.id, source: connection.fromComponentId, target: connection.toComponentId, label: connection.intent.replaceAll("_", " "), animated: connection.intent.includes("EVENT") || connection.intent === "STREAM", data: { intent: connection.intent, protocol: connection.protocol, guarantee: connection.guarantee, notes: connection.notes } }));
}

function toDocument(nodes: CanvasNode[], edges: CanvasEdge[], boundaries: CanvasBoundary[], previous: ArchitectureDocument): ArchitectureDocument {
  const components = nodes.map((node) => {
    const existing = previous.components.find((component) => component.id === node.id);
    return { ...(existing ?? { id: node.id, category: node.data.category, type: node.data.type, label: node.data.label, properties: componentDefaults[node.data.category] }), category: node.data.category, type: node.data.type, label: node.data.label, properties: node.data.properties, position: { x: Math.round(node.position.x), y: Math.round(node.position.y) } };
  });
  const connections = edges.map((edge) => {
    const existing = previous.connections.find((connection) => connection.id === edge.id);
    return { ...(existing ?? { id: edge.id, intent: edge.data?.intent ?? "REQUEST_RESPONSE" }), fromComponentId: edge.source, toComponentId: edge.target, intent: edge.data?.intent ?? existing?.intent ?? "REQUEST_RESPONSE", protocol: edge.data?.protocol ?? existing?.protocol, guarantee: edge.data?.guarantee ?? existing?.guarantee, notes: edge.data?.notes ?? existing?.notes };
  });
  return { ...previous, components, connections, boundaries };
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
  boundaries: [],
  initialize: (workspaceId, version, document) => set({ workspaceId, version, document, nodes: toNodes(document), edges: toEdges(document), boundaries: (document.boundaries ?? []) as CanvasBoundary[], dirty: false, selectedNodeId: null, past: [], future: [] }),
  applyNodes: (changes) => set((state) => {
    const nodes = applyNodeChanges(changes, state.nodes) as CanvasNode[];
    const meaningful = changes.some((change) => change.type !== "select");
    if (!meaningful) return { nodes };
    return state.document ? { nodes, document: toDocument(nodes, state.edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  setNodes: (nodes) => set((state) => state.document ? { nodes, document: toDocument(nodes, state.edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, dirty: true, past: [...state.past, snapshot(state)], future: [] }),
  setEdges: (edges) => set((state) => state.document ? { edges: edges as CanvasEdge[], document: toDocument(state.nodes, edges as CanvasEdge[], state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { edges: edges as CanvasEdge[], dirty: true, past: [...state.past, snapshot(state)], future: [] }),
  addConnection: (connection) => {
    let result: { ok: true } | { ok: false; message: string } = { ok: true };
    set((state) => {
      if (connection.source === connection.target) { result = { ok: false, message: "A Connection needs two different Components." }; return state; }
      const duplicate = state.edges.some((edge) => edge.source === connection.source && edge.target === connection.target && edge.data?.intent === connection.intent);
      if (duplicate) { result = { ok: false, message: "That exact directed Connection already exists." }; return state; }
      const edge: CanvasEdge = { id: nextId("connection"), source: connection.source, target: connection.target, label: connection.intent.replaceAll("_", " "), markerEnd: { type: MarkerType.ArrowClosed }, data: { intent: connection.intent, protocol: connection.protocol, guarantee: connection.guarantee, notes: connection.notes } };
      const edges = [...state.edges, edge];
      return state.document ? { edges, document: toDocument(state.nodes, edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { edges, dirty: true, past: [...state.past, snapshot(state)], future: [] };
    });
    return result;
  },
  addBoundary: (boundary) => set((state) => { const boundaries = [...state.boundaries, { ...boundary, id: nextId("boundary") }]; return state.document ? { boundaries, document: toDocument(state.nodes, state.edges, boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { boundaries, dirty: true, past: [...state.past, snapshot(state)], future: [] }; }),
  updateBoundary: (id, patch) => set((state) => { const boundaries = state.boundaries.map((boundary) => boundary.id === id ? { ...boundary, ...patch } : boundary); return state.document ? { boundaries, document: toDocument(state.nodes, state.edges, boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { boundaries, dirty: true, past: [...state.past, snapshot(state)], future: [] }; }),
  deleteBoundary: (id) => set((state) => { const boundaries = state.boundaries.filter((boundary) => boundary.id !== id).map((boundary) => boundary.parentBoundaryId === id ? { ...boundary, parentBoundaryId: undefined } : boundary); return state.document ? { boundaries, document: toDocument(state.nodes, state.edges, boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { boundaries, dirty: true, past: [...state.past, snapshot(state)], future: [] }; }),
  updateComponent: (id, patch) => set((state) => {
    const nodes = state.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, ...patch } } : node);
    return state.document ? { nodes, document: toDocument(nodes, state.edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  addComponent: (category, type) => set((state) => {
    const id = nextId("component");
    const node: CanvasNode = { id, type: "component", position: { x: 100 + (state.nodes.length % 3) * 230, y: 100 + Math.floor(state.nodes.length / 3) * 150 }, data: { label: humanize(type), category, type, properties: componentDefaults[category] } };
    const nodes = [...state.nodes, node];
    return state.document ? { nodes, selectedNodeId: id, document: toDocument(nodes, state.edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, selectedNodeId: id, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  deleteSelected: () => set((state) => {
    if (!state.selectedNodeId) return state;
    const id = state.selectedNodeId;
    const nodes = state.nodes.filter((node) => node.id !== id);
    const edges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);
    return state.document ? { nodes, edges, selectedNodeId: null, document: toDocument(nodes, edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, edges, selectedNodeId: null, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  replaceFromServer: (version, document) => set((state) => ({ version, document, nodes: toNodes(document), edges: toEdges(document), boundaries: (document.boundaries ?? []) as CanvasBoundary[], dirty: false, selectedNodeId: state.selectedNodeId, past: [], future: [] })),
  markSaved: (version, document) => set({ version, document, dirty: false, nodes: toNodes(document), edges: toEdges(document), boundaries: (document.boundaries ?? []) as CanvasBoundary[], past: [], future: [] }),
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
