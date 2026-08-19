import { applyNodeChanges, MarkerType, type Edge, type Node, type NodeChange } from "@xyflow/react";
import { create } from "zustand";
import type { ArchitectureDocument, ArchitectureComponentCategory, ArchitectureComponentType } from "@/lib/api/authenticated-client";

export type CanvasNodeData = { label: string; category: ArchitectureComponentCategory; type: ArchitectureComponentType; properties: Record<string, string | number | boolean> };
export type CanvasNode = Node<CanvasNodeData>;
export type BoundaryNodeData = { label: string; boundaryType: string };
export type BoundaryFlowNode = Node<BoundaryNodeData, "boundary">;
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
  selectedEdgeId: string | null;
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
  addComponent: (category: ArchitectureComponentCategory, type: ArchitectureComponentType, overrides?: Partial<CanvasNodeData> & { position?: { x: number; y: number } }) => void;
  duplicateComponent: (id: string) => void;
  deleteSelected: () => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  updateConnection: (id: string, patch: Partial<CanvasEdgeData>) => void;
  deleteConnection: (id: string) => void;
  replaceFromServer: (version: number, document: ArchitectureDocument) => void;
  markSaved: (version: number, document: ArchitectureDocument) => void;
  markDirty: () => void;
  undo: () => void;
  redo: () => void;
};

type Snapshot = Pick<EditorState, "version" | "document" | "nodes" | "edges" | "boundaries" | "dirty" | "selectedNodeId" | "selectedEdgeId">;
const snapshot = (state: EditorState): Snapshot => ({ version: state.version, document: state.document, nodes: state.nodes, edges: state.edges, boundaries: state.boundaries, dirty: state.dirty, selectedNodeId: state.selectedNodeId, selectedEdgeId: state.selectedEdgeId });

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

function toNodes(document: ArchitectureDocument, existingNodes: CanvasNode[] = []): CanvasNode[] {
  return document.components.map((component, index) => {
    const existing = existingNodes.find((node) => node.id === component.id);
    return {
      id: component.id,
      type: "component",
      position: component.position ?? { x: 80 + (index % 3) * 230, y: 80 + Math.floor(index / 3) * 150 },
      measured: existing?.measured,
      data: { label: component.label, category: component.category, type: component.type, properties: component.properties },
    };
  });
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

function randomSuffix() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextId(prefix: string) {
  return `${prefix}-${randomSuffix()}`;
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
  selectedEdgeId: null,
  past: [],
  future: [],
  boundaries: [],
  initialize: (workspaceId, version, document) => set({ workspaceId, version, document, nodes: toNodes(document), edges: toEdges(document), boundaries: (document.boundaries ?? []) as CanvasBoundary[], dirty: false, selectedNodeId: null, selectedEdgeId: null, past: [], future: [] }),
  applyNodes: (changes) => set((state) => {
    const nodes = applyNodeChanges(changes, state.nodes) as CanvasNode[];
    const meaningful = changes.some((change) => change.type !== "select" && change.type !== "dimensions");
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
  addComponent: (category, type, overrides) => set((state) => {
    const id = nextId("component");
    const droppedPosition = overrides?.position && Number.isFinite(overrides.position.x) && Number.isFinite(overrides.position.y) ? overrides.position : null;
    const node: CanvasNode = { id, type: "component", position: droppedPosition ?? { x: 100 + (state.nodes.length % 3) * 230, y: 100 + Math.floor(state.nodes.length / 3) * 150 }, data: { label: overrides?.label ?? humanize(type), category, type, properties: overrides?.properties ?? componentDefaults[category] } };
    const nodes = [...state.nodes, node];
    return state.document ? { nodes, selectedNodeId: id, document: toDocument(nodes, state.edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, selectedNodeId: id, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  duplicateComponent: (id) => set((state) => {
    const source = state.nodes.find((node) => node.id === id);
    if (!source) return state;
    const newId = nextId("component");
    const copy: CanvasNode = { ...source, id: newId, position: { x: source.position.x + 24, y: source.position.y + 24 }, data: { ...source.data, properties: { ...source.data.properties } } };
    const nodes = [...state.nodes, copy];
    return state.document ? { nodes, selectedNodeId: newId, document: toDocument(nodes, state.edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, selectedNodeId: newId, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  deleteSelected: () => set((state) => {
    if (!state.selectedNodeId) return state;
    const id = state.selectedNodeId;
    const nodes = state.nodes.filter((node) => node.id !== id);
    const edges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);
    return state.document ? { nodes, edges, selectedNodeId: null, document: toDocument(nodes, edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, edges, selectedNodeId: null, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  selectNode: (selectedNodeId) => set({ selectedNodeId, selectedEdgeId: null }),
  selectEdge: (selectedEdgeId) => set({ selectedEdgeId, selectedNodeId: null }),
  updateConnection: (id, patch) => set((state) => {
    const edges = state.edges.map((edge) => {
      if (edge.id !== id) return edge;
      const data = { ...(edge.data ?? { intent: "REQUEST_RESPONSE" }), ...patch };
      return { ...edge, label: String(data.intent ?? "").replaceAll("_", " "), data };
    });
    return state.document ? { edges, document: toDocument(state.nodes, edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { edges, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  deleteConnection: (id) => set((state) => {
    const edges = state.edges.filter((edge) => edge.id !== id);
    return state.document ? { edges, selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId, document: toDocument(state.nodes, edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { edges, selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  replaceFromServer: (version, document) => set((state) => ({ version, document, nodes: toNodes(document, state.nodes), edges: toEdges(document), boundaries: (document.boundaries ?? []) as CanvasBoundary[], dirty: false, selectedNodeId: state.selectedNodeId, selectedEdgeId: null, past: [], future: [] })),
  markSaved: (version, document) => set((state) => ({ version, document, dirty: false, nodes: toNodes(document, state.nodes), edges: toEdges(document), boundaries: (document.boundaries ?? []) as CanvasBoundary[], past: [], future: [] })),
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

const NODE_WIDTH = 168;
const NODE_HEIGHT = 76;
const GROUP_PADDING = 30;

export type FlowLayout = { flowNodes: Array<CanvasNode | BoundaryFlowNode>; parentOrigins: Map<string, { x: number; y: number }> };

/**
 * Derives a React Flow layout that renders Architecture Boundaries as visual containers.
 * Component positions remain absolute in the editor state; this helper converts them to
 * parent-relative positions for React Flow and reports each node's parent origin so that
 * drag events can be converted back to absolute coordinates.
 */
export function buildFlowLayout(nodes: CanvasNode[], boundaries: CanvasBoundary[]): FlowLayout {
  if (boundaries.length === 0) return { flowNodes: nodes, parentOrigins: new Map() };
  const byId = new Map(boundaries.map((boundary) => [boundary.id, boundary]));
  const nodeParent = new Map<string, string>();
  for (const boundary of boundaries) for (const componentId of boundary.componentIds) nodeParent.set(componentId, boundary.id);

  const childrenOf = new Map<string, string[]>();
  for (const boundary of boundaries) childrenOf.set(boundary.id, []);
  for (const boundary of boundaries) if (boundary.parentBoundaryId && byId.has(boundary.parentBoundaryId)) childrenOf.get(boundary.parentBoundaryId)!.push(boundary.id);
  const roots = boundaries.filter((boundary) => !boundary.parentBoundaryId || !byId.has(boundary.parentBoundaryId));

  const nodePos = new Map(nodes.map((node) => [node.id, node.position]));
  const geom = new Map<string, { x: number; y: number; w: number; h: number }>();
  const visiting = new Set<string>();
  function compute(boundaryId: string): { x: number; y: number; w: number; h: number } {
    const cached = geom.get(boundaryId);
    if (cached) return cached;
    const boundary = byId.get(boundaryId)!;
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const componentId of boundary.componentIds) {
      const position = nodePos.get(componentId);
      if (!position) continue;
      minX = Math.min(minX, position.x); minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + NODE_WIDTH); maxY = Math.max(maxY, position.y + NODE_HEIGHT);
    }
    for (const childId of childrenOf.get(boundaryId) ?? []) {
      if (visiting.has(childId)) continue;
      visiting.add(childId);
      const child = compute(childId);
      visiting.delete(childId);
      minX = Math.min(minX, child.x); minY = Math.min(minY, child.y);
      maxX = Math.max(maxX, child.x + child.w); maxY = Math.max(maxY, child.y + child.h);
    }
    if (!Number.isFinite(minX)) { minX = 0; minY = 0; maxX = NODE_WIDTH; maxY = NODE_HEIGHT; }
    const result = { x: minX - GROUP_PADDING, y: minY - GROUP_PADDING, w: maxX - minX + GROUP_PADDING * 2, h: maxY - minY + GROUP_PADDING * 2 };
    geom.set(boundaryId, result);
    return result;
  }
  roots.forEach((root) => compute(root.id));
  for (const boundary of boundaries) if (!geom.has(boundary.id)) compute(boundary.id);

  const parentOrigins = new Map<string, { x: number; y: number }>();
  const flowNodes: Array<CanvasNode | BoundaryFlowNode> = [];

  for (const boundary of boundaries) {
    const origin = geom.get(boundary.id)!;
    const parentId = boundary.parentBoundaryId && byId.has(boundary.parentBoundaryId) ? boundary.parentBoundaryId : undefined;
    const parentOrigin = parentId ? geom.get(parentId)! : { x: 0, y: 0 };
    parentOrigins.set(boundary.id, parentOrigin);
    flowNodes.push({ id: boundary.id, type: "boundary", position: { x: origin.x - parentOrigin.x, y: origin.y - parentOrigin.y }, parentId, draggable: false, selectable: true, style: { width: origin.w, height: origin.h }, data: { label: boundary.label, boundaryType: boundary.type } });
  }

  for (const node of nodes) {
    const parentId = nodeParent.get(node.id);
    const parentOrigin = parentId && geom.has(parentId) ? geom.get(parentId)! : { x: 0, y: 0 };
    parentOrigins.set(node.id, parentOrigin);
    if (parentId) flowNodes.push({ ...node, parentId, position: { x: node.position.x - parentOrigin.x, y: node.position.y - parentOrigin.y } });
    else flowNodes.push({ ...node, parentId: undefined });
  }

  return { flowNodes, parentOrigins };
}
