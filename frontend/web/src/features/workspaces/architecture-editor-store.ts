import { applyNodeChanges, MarkerType, type Edge, type Node, type NodeChange } from "@xyflow/react";
import { create } from "zustand";
import type { ArchitectureDocument, ArchitectureComponentCategory, ArchitectureComponentType } from "@/lib/api/authenticated-client";

export type CanvasNodeData = { label: string; category: ArchitectureComponentCategory; type: ArchitectureComponentType; properties: Record<string, string | number | boolean> };
export type CanvasNode = Node<CanvasNodeData>;
export type BoundaryNodeData = { label: string; boundaryType: string };
export type BoundaryFlowNode = Node<BoundaryNodeData, "boundary">;
export type CanvasEdgeData = { label?: string; intent: string; protocol?: string; guarantee?: string; notes?: string };
export type CanvasEdge = Edge<CanvasEdgeData>;
export type CanvasBoundary = { id: string; label: string; type: "DEPLOYMENT" | "NETWORK" | "REGION" | "AVAILABILITY" | "TRUST"; parentBoundaryId?: string; componentIds: string[]; metadata?: Record<string, string | number | boolean> };

export type PendingDelete = { kind: "nodes"; ids: string[]; label: string; connectionCount: number } | { kind: "edge"; id: string; label: string } | { kind: "boundary"; id: string; label: string };

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
  selectedNodeIds: string[];
  pendingDelete: PendingDelete | null;
  past: Snapshot[];
  future: Snapshot[];
  initialize: (workspaceId: string, version: number, document: ArchitectureDocument) => void;
  applyNodes: (changes: NodeChange<CanvasNode>[]) => void;
  setNodes: (nodes: CanvasNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addConnection: (connection: Omit<CanvasEdgeData, "intent"> & { intent: string; source: string; target: string }) => { ok: true } | { ok: false; message: string };
  addBoundary: (boundary: Omit<CanvasBoundary, "id">) => string;
  updateBoundary: (id: string, patch: Partial<Omit<CanvasBoundary, "id">>) => void;
  deleteBoundary: (id: string) => void;
  updateComponent: (id: string, patch: Partial<CanvasNodeData>) => void;
  addComponent: (category: ArchitectureComponentCategory, type: ArchitectureComponentType, overrides?: Partial<CanvasNodeData> & { position?: { x: number; y: number } }) => void;
  duplicateComponent: (id: string) => void;
  deleteSelected: () => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  setSelection: (ids: string[]) => void;
  deleteNodes: (ids: string[]) => void;
  duplicateNodes: (ids: string[]) => void;
  distributeSelection: (ids: string[]) => void;
  groupSelection: (ids: string[]) => void;
  requestDelete: (pending: PendingDelete) => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
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
  CLIENT: { platform: "WEB" },
  COMPUTE: { runtime: "OTHER" },
  // The API requires this schema field for every data store. It stays internal and is not shown in the canvas.
  DATA_STORE: { consistency: "EVENTUAL" },
  MESSAGING: { deliveryGuarantee: "AT_LEAST_ONCE" },
  EDGE_SECURITY: {},
  COORDINATION_CONFIG: { consistency: "EVENTUAL" },
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
  return document.connections.map((connection) => buildEdge(connection.id, connection.fromComponentId, connection.toComponentId, connection.intent, connection.protocol, connection.guarantee, connection.notes, connection.label));
}

function shortIntentLabel(intent: string, protocol?: string, label?: string) {
  if (label?.trim()) return label.trim();
  if (protocol) return protocol;
  switch (intent) {
    case "REQUEST_RESPONSE": return "HTTP";
    case "DNS_RESOLUTION": return "DNS";
    case "DATA_READ_WRITE": return "READ";
    case "EVENT_PUBLISH":
    case "EVENT_CONSUME": return "EVENT";
    case "QUEUE_DELIVERY": return "QUEUE";
    case "STREAM": return "STREAM";
    case "REPLICATION": return "REPLICATE";
    case "AUTHENTICATION": return "AUTH";
    case "FILE_OBJECT_TRANSFER": return "TRANSFER";
    default: return intent.replaceAll("_", " ").toUpperCase();
  }
}

function buildEdge(id: string, source: string, target: string, intent: string, protocol?: string, guarantee?: string, notes?: string, label?: string): CanvasEdge {
  const async = intent.includes("EVENT") || intent === "QUEUE_DELIVERY" || intent === "STREAM";
  const dashed = async || intent === "REPLICATION";
  return {
    id,
    source,
    target,
    label: shortIntentLabel(intent, protocol, label),
    markerEnd: { type: MarkerType.ArrowClosed, color: "#0f766e" },
    animated: async,
    style: { stroke: "#0f766e", strokeWidth: 1.5, ...(dashed ? { strokeDasharray: "6 4" } : {}) },
    labelStyle: { fill: "#a7b0ac", fontSize: 9, fontWeight: 600 },
    labelBgStyle: { fill: "#101316", fillOpacity: 0.85 },
    labelBgPadding: [4, 2] as [number, number],
    data: { label, intent, protocol, guarantee, notes },
  };
}

function toDocument(nodes: CanvasNode[], edges: CanvasEdge[], boundaries: CanvasBoundary[], previous: ArchitectureDocument): ArchitectureDocument {
  const components = nodes.map((node) => {
    const existing = previous.components.find((component) => component.id === node.id);
    return { ...(existing ?? { id: node.id, category: node.data.category, type: node.data.type, label: node.data.label, properties: componentDefaults[node.data.category] }), category: node.data.category, type: node.data.type, label: node.data.label, properties: node.data.properties, position: { x: Math.round(node.position.x), y: Math.round(node.position.y) } };
  });
  const connections = edges.map((edge) => {
    const existing = previous.connections.find((connection) => connection.id === edge.id);
    return { ...(existing ?? { id: edge.id, intent: edge.data?.intent ?? "REQUEST_RESPONSE" }), fromComponentId: edge.source, toComponentId: edge.target, intent: edge.data?.intent ?? existing?.intent ?? "REQUEST_RESPONSE", protocol: edge.data?.protocol ?? existing?.protocol, guarantee: edge.data?.guarantee ?? existing?.guarantee, notes: edge.data?.notes ?? existing?.notes, label: edge.data?.label ?? existing?.label };
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
  selectedNodeIds: [],
  pendingDelete: null,
  past: [],
  future: [],
  boundaries: [],
  initialize: (workspaceId, version, document) => set({ workspaceId, version, document, nodes: toNodes(document), edges: toEdges(document), boundaries: (document.boundaries ?? []) as CanvasBoundary[], dirty: false, selectedNodeId: null, selectedEdgeId: null, selectedNodeIds: [], pendingDelete: null, past: [], future: [] }),
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
      const edge: CanvasEdge = buildEdge(nextId("connection"), connection.source, connection.target, connection.intent, connection.protocol, connection.guarantee, connection.notes);
      const edges = [...state.edges, edge];
      return state.document ? { edges, document: toDocument(state.nodes, edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { edges, dirty: true, past: [...state.past, snapshot(state)], future: [] };
    });
    return result;
  },
  addBoundary: (boundary) => {
    const id = nextId("boundary");
    set((state) => {
      const boundaries = [...state.boundaries, { ...boundary, id }];
      return state.document ? { boundaries, selectedNodeId: id, selectedNodeIds: [], selectedEdgeId: null, document: toDocument(state.nodes, state.edges, boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { boundaries, selectedNodeId: id, selectedNodeIds: [], selectedEdgeId: null, dirty: true, past: [...state.past, snapshot(state)], future: [] };
    });
    return id;
  },
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
  selectNode: (selectedNodeId) => set({ selectedNodeId, selectedEdgeId: null, selectedNodeIds: selectedNodeId ? [selectedNodeId] : [] }),
  selectEdge: (selectedEdgeId) => set({ selectedEdgeId, selectedNodeId: null, selectedNodeIds: [] }),
  setSelection: (ids) => set({ selectedNodeIds: ids, selectedNodeId: ids.length === 1 ? ids[0] : null, selectedEdgeId: null }),
  deleteNodes: (ids) => set((state) => {
    const nodeIds = new Set(ids);
    if (nodeIds.size === 0) return state;
    const nodes = state.nodes.filter((node) => !nodeIds.has(node.id));
    const edges = state.edges.filter((edge) => !nodeIds.has(edge.source) && !nodeIds.has(edge.target));
    const boundaries = state.boundaries.map((boundary) => ({ ...boundary, componentIds: boundary.componentIds.filter((id) => !nodeIds.has(id)) }));
    return state.document ? { nodes, edges, boundaries, selectedNodeIds: [], selectedNodeId: null, document: toDocument(nodes, edges, boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, edges, boundaries, selectedNodeIds: [], selectedNodeId: null, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  duplicateNodes: (ids) => set((state) => {
    const nodes = [...state.nodes];
    const newIds: string[] = [];
    for (const id of ids) {
      const source = state.nodes.find((node) => node.id === id);
      if (!source) continue;
      const newId = nextId("component");
      newIds.push(newId);
      nodes.push({ ...source, id: newId, position: { x: source.position.x + 24, y: source.position.y + 24 }, data: { ...source.data, properties: { ...source.data.properties } } });
    }
    if (newIds.length === 0) return state;
    return state.document ? { nodes, selectedNodeIds: newIds, selectedNodeId: null, document: toDocument(nodes, state.edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, selectedNodeIds: newIds, selectedNodeId: null, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  distributeSelection: (ids) => set((state) => {
    const selected = state.nodes.filter((node) => ids.includes(node.id)).sort((a, b) => a.position.x - b.position.x);
    if (selected.length < 3) return state;
    const minX = selected[0].position.x;
    const maxX = selected[selected.length - 1].position.x;
    if (maxX === minX) return state;
    const nodes = state.nodes.map((node) => {
      const index = selected.findIndex((candidate) => candidate.id === node.id);
      if (index < 0) return node;
      return { ...node, position: { x: Math.round(minX + ((maxX - minX) * index) / (selected.length - 1)), y: node.position.y } };
    });
    return state.document ? { nodes, document: toDocument(nodes, state.edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  groupSelection: (ids) => set((state) => {
    if (ids.length < 2) return state;
    const boundaries = [...state.boundaries, { id: nextId("boundary"), label: "Group", type: "DEPLOYMENT" as CanvasBoundary["type"], componentIds: ids }];
    return state.document ? { boundaries, selectedNodeIds: [], selectedNodeId: null, document: toDocument(state.nodes, state.edges, boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { boundaries, selectedNodeIds: [], selectedNodeId: null, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  requestDelete: (pending) => set({ pendingDelete: pending }),
  cancelDelete: () => set({ pendingDelete: null }),
  confirmDelete: () => set((state) => {
    const pending = state.pendingDelete;
    if (!pending) return state;
    if (pending.kind === "nodes") {
      const nodeIds = new Set(pending.ids);
      const nodes = state.nodes.filter((node) => !nodeIds.has(node.id));
      const edges = state.edges.filter((edge) => !nodeIds.has(edge.source) && !nodeIds.has(edge.target));
      const boundaries = state.boundaries.map((boundary) => ({ ...boundary, componentIds: boundary.componentIds.filter((id) => !nodeIds.has(id)) }));
      return state.document ? { nodes, edges, boundaries, selectedNodeIds: [], selectedNodeId: null, pendingDelete: null, document: toDocument(nodes, edges, boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { nodes, edges, boundaries, selectedNodeIds: [], selectedNodeId: null, pendingDelete: null, dirty: true, past: [...state.past, snapshot(state)], future: [] };
    }
    if (pending.kind === "edge") {
      const edges = state.edges.filter((edge) => edge.id !== pending.id);
      return state.document ? { edges, selectedEdgeId: null, pendingDelete: null, document: toDocument(state.nodes, edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { edges, selectedEdgeId: null, pendingDelete: null, dirty: true, past: [...state.past, snapshot(state)], future: [] };
    }
    const boundaries = state.boundaries.filter((boundary) => boundary.id !== pending.id).map((boundary) => boundary.parentBoundaryId === pending.id ? { ...boundary, parentBoundaryId: undefined } : boundary);
    return state.document ? { boundaries, selectedNodeIds: [], selectedNodeId: null, pendingDelete: null, document: toDocument(state.nodes, state.edges, boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { boundaries, selectedNodeIds: [], selectedNodeId: null, pendingDelete: null, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  updateConnection: (id, patch) => set((state) => {
    const edges = state.edges.map((edge) => {
      if (edge.id !== id) return edge;
      const data = { ...(edge.data ?? { intent: "REQUEST_RESPONSE" }), ...patch };
      return { ...edge, label: shortIntentLabel(String(data.intent ?? ""), data.protocol, data.label), data };
    });
    return state.document ? { edges, document: toDocument(state.nodes, edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { edges, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  deleteConnection: (id) => set((state) => {
    const edges = state.edges.filter((edge) => edge.id !== id);
    return state.document ? { edges, selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId, document: toDocument(state.nodes, edges, state.boundaries, state.document), dirty: true, past: [...state.past, snapshot(state)], future: [] } : { edges, selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId, dirty: true, past: [...state.past, snapshot(state)], future: [] };
  }),
  replaceFromServer: (version, document) => set((state) => ({ version, document, nodes: toNodes(document, state.nodes), edges: toEdges(document), boundaries: (document.boundaries ?? []) as CanvasBoundary[], dirty: false, selectedNodeId: state.selectedNodeId, selectedEdgeId: null, past: [], future: [] })),
  // The local document is already the payload that was saved. Keep the live
  // React Flow objects so selection, input focus, and the inspector do not
  // remount when the debounced save completes.
  markSaved: (version, document) => set(() => ({ version, document, dirty: false, past: [], future: [] })),
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
const EMPTY_BOUNDARY_WIDTH = 420;
const EMPTY_BOUNDARY_HEIGHT = 240;
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
    let hasContent = false;
    for (const componentId of boundary.componentIds) {
      const position = nodePos.get(componentId);
      if (!position) continue;
      hasContent = true;
      minX = Math.min(minX, position.x); minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + NODE_WIDTH); maxY = Math.max(maxY, position.y + NODE_HEIGHT);
    }
    for (const childId of childrenOf.get(boundaryId) ?? []) {
      if (visiting.has(childId)) continue;
      visiting.add(childId);
      const child = compute(childId);
      visiting.delete(childId);
      hasContent = true;
      minX = Math.min(minX, child.x); minY = Math.min(minY, child.y);
      maxX = Math.max(maxX, child.x + child.w); maxY = Math.max(maxY, child.y + child.h);
    }
    const storedX = boundary.metadata?.x;
    const storedY = boundary.metadata?.y;
    const storedWidth = boundary.metadata?.width;
    const storedHeight = boundary.metadata?.height;
    if (typeof storedX === "number" && Number.isFinite(storedX) && typeof storedY === "number" && Number.isFinite(storedY) && typeof storedWidth === "number" && Number.isFinite(storedWidth) && typeof storedHeight === "number" && Number.isFinite(storedHeight)) {
      minX = Number.isFinite(minX) ? Math.min(minX, storedX) : storedX;
      minY = Number.isFinite(minY) ? Math.min(minY, storedY) : storedY;
      maxX = Number.isFinite(maxX) ? Math.max(maxX, storedX + Math.max(24, storedWidth)) : storedX + Math.max(24, storedWidth);
      maxY = Number.isFinite(maxY) ? Math.max(maxY, storedY + Math.max(24, storedHeight)) : storedY + Math.max(24, storedHeight);
    }
    if (!Number.isFinite(minX)) {
      const metadataX = boundary.metadata?.x;
      const metadataY = boundary.metadata?.y;
      const metadataWidth = boundary.metadata?.width;
      const metadataHeight = boundary.metadata?.height;
      minX = typeof metadataX === "number" && Number.isFinite(metadataX) ? metadataX : 0;
      minY = typeof metadataY === "number" && Number.isFinite(metadataY) ? metadataY : 0;
      const width = typeof metadataWidth === "number" && Number.isFinite(metadataWidth) ? Math.max(24, metadataWidth) : EMPTY_BOUNDARY_WIDTH;
      const height = typeof metadataHeight === "number" && Number.isFinite(metadataHeight) ? Math.max(24, metadataHeight) : EMPTY_BOUNDARY_HEIGHT;
      maxX = minX + width;
      maxY = minY + height;
    }
    const padding = hasContent && !(typeof storedX === "number" && typeof storedY === "number" && typeof storedWidth === "number" && typeof storedHeight === "number") ? GROUP_PADDING : 0;
    const result = { x: minX - padding, y: minY - padding, w: maxX - minX + padding * 2, h: maxY - minY + padding * 2 };
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
    flowNodes.push({ id: boundary.id, type: "boundary", position: { x: origin.x - parentOrigin.x, y: origin.y - parentOrigin.y }, parentId, draggable: false, selectable: true, zIndex: 0, style: { width: origin.w, height: origin.h }, data: { label: boundary.label, boundaryType: boundary.type } });
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
