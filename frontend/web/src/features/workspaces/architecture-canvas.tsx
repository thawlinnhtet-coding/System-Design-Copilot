"use client";

import "@xyflow/react/dist/style.css";
import { Background, Handle, NodeToolbar, Position, ReactFlow, ReactFlowProvider, useReactFlow, useViewport, type Connection, type EdgeChange, type NodeChange, type NodeProps, type Viewport } from "@xyflow/react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlignHorizontalSpaceAround, AlertTriangle, Boxes, ChevronDown, CloudOff, Cog, Copy, Database, GitBranch, GitMerge, Globe, Group, Hand, HardDrive, KeyRound, Layers3, Link, ListTree, Lock, Maximize2, Minimize2, MonitorSmartphone, MousePointer2, Network, Plus, Radio, Redo2, Route, Scale, Scan, ScrollText, Search, Server, ShieldCheck, SlidersHorizontal, SquareDashed, Trash2, Undo2, Waypoints, Wifi, Workflow, Zap } from "lucide-react";
import { createElement, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ApiRequestError, type ArchitectureComponentCategory, type ArchitectureComponentType, type ArchitectureDocument } from "@/lib/api/authenticated-client";
import { useAuthenticatedApiClient } from "@/lib/api/authenticated-client";
import { buildFlowLayout, componentDefaults, useArchitectureEditorStore, type BoundaryFlowNode, type CanvasBoundary, type CanvasEdge, type CanvasEdgeData, type CanvasNode, type CanvasNodeData, type PendingDelete } from "./architecture-editor-store";

type PaletteItem = { label: string; category: ArchitectureComponentCategory; type: ArchitectureComponentType; icon: typeof Server; properties?: Record<string, string> };
type PaletteGroup = { label: string; items: PaletteItem[] };
type CanvasTool = "select" | "pan" | "component" | "connection" | "boundary";
type BoundaryResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
type BoundaryResizeState = { id: string; direction: BoundaryResizeDirection; startClient: { x: number; y: number }; initial: { x: number; y: number; width: number; height: number } };

const paletteGroups: PaletteGroup[] = [
  { label: "Clients", items: [
    { label: "Client", category: "CLIENT", type: "CLIENT", icon: MonitorSmartphone },
  ] },
  { label: "Compute & runtime", items: [
    { label: "Service", category: "COMPUTE", type: "SERVICE", icon: Server },
    { label: "Function", category: "COMPUTE", type: "FUNCTION", icon: Boxes },
    { label: "Worker", category: "COMPUTE", type: "WORKER", icon: Cog },
    { label: "Batch job", category: "COMPUTE", type: "BATCH_JOB", icon: Workflow },
  ] },
  { label: "Data stores", items: [
    { label: "Document database", category: "DATA_STORE", type: "DOCUMENT_DATABASE", icon: Database },
    { label: "Relational database", category: "DATA_STORE", type: "RELATIONAL_DATABASE", icon: Database },
    { label: "Cache", category: "DATA_STORE", type: "CACHE", icon: Zap },
    { label: "Object store", category: "DATA_STORE", type: "OBJECT_STORE", icon: HardDrive },
  ] },
  { label: "Messaging & streaming", items: [
    { label: "Queue", category: "MESSAGING", type: "QUEUE", icon: Waypoints },
    { label: "Event bus", category: "MESSAGING", type: "EVENT_BUS", icon: GitMerge },
    { label: "Stream", category: "MESSAGING", type: "STREAM", icon: Radio },
  ] },
  { label: "DNS & edge", items: [
    { label: "DNS", category: "EDGE_SECURITY", type: "DNS", icon: Wifi },
    { label: "CDN", category: "EDGE_SECURITY", type: "CDN", icon: Globe },
    { label: "API gateway", category: "EDGE_SECURITY", type: "GATEWAY", icon: Network },
    { label: "Load balancer", category: "EDGE_SECURITY", type: "LOAD_BALANCER", icon: Scale },
    { label: "WAF", category: "EDGE_SECURITY", type: "WAF", icon: ShieldCheck },
    { label: "External API", category: "EDGE_SECURITY", type: "EXTERNAL_API", icon: Globe },
  ] },
  { label: "Coordination & config", items: [
    { label: "Config service", category: "COORDINATION_CONFIG", type: "CONFIG_SERVICE", icon: SlidersHorizontal },
    { label: "Service registry", category: "COORDINATION_CONFIG", type: "SERVICE_REGISTRY", icon: ListTree },
  ] },
  { label: "Identity & secrets", items: [
    { label: "Identity provider", category: "IDENTITY_SECRETS", type: "IDENTITY_PROVIDER", icon: KeyRound },
    { label: "Secrets manager", category: "IDENTITY_SECRETS", type: "SECRETS_MANAGER", icon: Lock },
  ] },
  { label: "Observability", items: [
    { label: "Logging", category: "OBSERVABILITY", type: "LOGGING", icon: ScrollText },
    { label: "Metrics", category: "OBSERVABILITY", type: "METRICS", icon: Activity },
    { label: "Tracing", category: "OBSERVABILITY", type: "TRACING", icon: Route },
  ] },
  { label: "Custom", items: [
    { label: "Custom component", category: "CUSTOM", type: "CUSTOM_COMPONENT", icon: Layers3 },
  ] },
];

const canvasTools: Array<{ id: CanvasTool; label: string; icon: typeof MousePointer2; width: string }> = [
  { id: "select", label: "Select", icon: MousePointer2, width: "w-[66px]" },
  { id: "pan", label: "Pan", icon: Hand, width: "w-[54px]" },
  { id: "component", label: "Component", icon: Plus, width: "w-[90px]" },
  { id: "connection", label: "Connection", icon: GitBranch, width: "w-[88px]" },
  { id: "boundary", label: "Boundary", icon: SquareDashed, width: "w-[81px]" },
];

function iconForType(type: ArchitectureComponentType) {
  for (const group of paletteGroups) {
    const item = group.items.find((candidate) => candidate.type === type);
    if (item) return item.icon;
  }
  return Layers3;
}

function iconForSemantic(value: string | undefined) {
  switch (value) {
    case "service": return Server;
    case "worker": return Cog;
    case "database": return Database;
    case "cache": return Zap;
    case "queue": return Waypoints;
    case "event-bus": return GitMerge;
    case "gateway": return Network;
    case "dns": return Wifi;
    case "cdn": return Globe;
    case "config": return SlidersHorizontal;
    case "registry": return ListTree;
    case "storage": return HardDrive;
    case "identity": return KeyRound;
    case "external": return Globe;
    default: return Layers3;
  }
}

function nodeTypeLabel(type: ArchitectureComponentType): string {
  const labels: Partial<Record<ArchitectureComponentType, string>> = {
    CLIENT: "Client",
    SERVICE: "Service",
    FUNCTION: "Function",
    WORKER: "Worker",
    BATCH_JOB: "Batch job",
    RELATIONAL_DATABASE: "Relational database",
    DOCUMENT_DATABASE: "Document database",
    CACHE: "Cache",
    OBJECT_STORE: "Object store",
    QUEUE: "Queue",
    EVENT_BUS: "Event bus",
    STREAM: "Stream",
    DNS: "DNS",
    CDN: "CDN",
    GATEWAY: "Gateway",
    LOAD_BALANCER: "Load balancer",
    WAF: "WAF",
    CONFIG_SERVICE: "Config service",
    SERVICE_REGISTRY: "Service registry",
    IDENTITY_PROVIDER: "Identity provider",
    SECRETS_MANAGER: "Secrets manager",
    LOGGING: "Logging",
    METRICS: "Metrics",
    TRACING: "Tracing",
    EXTERNAL_API: "External API",
    CUSTOM_COMPONENT: "Custom component",
  };
  return labels[type] ?? "Component";
}

const typeAliases: Partial<Record<ArchitectureComponentType, string[]>> = {
  CACHE: ["cache", "redis cache", "memcached"],
  RELATIONAL_DATABASE: ["relational database", "postgresql", "mysql"],
  DOCUMENT_DATABASE: ["document database", "nosql database", "mongodb"],
};

function nodeMeta(data: CanvasNodeData): string {
  const key = data.category === "DATA_STORE" ? undefined : { CLIENT: "platform", COMPUTE: "runtime", MESSAGING: "deliveryGuarantee", EDGE_SECURITY: "exposure", COORDINATION_CONFIG: "consistency", IDENTITY_SECRETS: "responsibility", OBSERVABILITY: "signal", CUSTOM: "provider" }[data.category];
  const value = key ? String(data.properties[key] ?? "") : "";
  return value && value !== "OTHER" ? value.replaceAll("_", " ").toLowerCase() : "";
}

const connectionIntents = ["REQUEST_RESPONSE", "DNS_RESOLUTION", "DATA_READ_WRITE", "EVENT_PUBLISH", "EVENT_CONSUME", "QUEUE_DELIVERY", "STREAM", "REPLICATION", "AUTHENTICATION", "FILE_OBJECT_TRANSFER"];
const protocols = ["", "HTTP", "HTTPS", "GRPC", "TCP", "UDP", "AMQP", "KAFKA", "SQL", "REDIS", "DNS", "S3"];
const guarantees = ["", "BEST_EFFORT", "AT_MOST_ONCE", "AT_LEAST_ONCE", "EXACTLY_ONCE", "STRONG", "EVENTUAL"];
const boundaryTypeOptions: Array<{ value: CanvasBoundary["type"]; label: string }> = [
  { value: "DEPLOYMENT", label: "Deployment scope" },
  { value: "NETWORK", label: "Network / VPC" },
  { value: "REGION", label: "Cloud region" },
  { value: "AVAILABILITY", label: "Availability zone" },
  { value: "TRUST", label: "Trust / security" },
];
function boundaryTypeLabel(type: string) {
  return boundaryTypeOptions.find((option) => option.value === type)?.label ?? type.replaceAll("_", " ");
}

const connectionQuickIntents: Array<{ intent: string; label: string; detail: string }> = [
  { intent: "REQUEST_RESPONSE", label: "request / response", detail: "Solid arrow · synchronous" },
  { intent: "EVENT_PUBLISH", label: "event publish / consume", detail: "Labeled arrow · asynchronous" },
  { intent: "DATA_READ_WRITE", label: "data read / write", detail: "Data-path arrow" },
  { intent: "REPLICATION", label: "replication", detail: "Dashed arrow · state copy" },
];

const nodeTypes = { component: ArchitectureNode, boundary: BoundaryNode };

const componentDragMime = "application/sdc-component";
const pencilBoundarySizes = {
  normal: { width: 646, height: 450 },
  fullScreen: { width: 1060, height: 520 },
} as const;
// Keep the editable world larger than the visible Pencil canvas frame while
// preventing the viewport from drifting into an effectively infinite plane.
const canvasWorldExtent = [[-320, -240], [1920, 1440]] as [[number, number], [number, number]];
const boundaryNodeSize = { width: 168, height: 76 } as const;

function dragComponentData(event: React.DragEvent<HTMLElement>, item: PaletteItem) {
  event.dataTransfer.setData(componentDragMime, JSON.stringify({ category: item.category, type: item.type, label: item.label, properties: item.properties }));
  event.dataTransfer.effectAllowed = "move";
}

export type CanvasSaveState = "loading" | "saved" | "unsaved" | "saving" | "conflict" | "error" | "offline";

export function ArchitectureCanvas({ workspaceId, readOnly = false, viewport, onViewportChange, onFullScreenChange, onRequestInspector, onCloseInspector, onConnectionDraftChange, onSaveStateChange, fullScreen }: { workspaceId: string; readOnly?: boolean; viewport?: Viewport; onViewportChange?: (viewport: Viewport) => void; onFullScreenChange?: (fullScreen: boolean) => void; onRequestInspector?: () => void; onCloseInspector?: () => void; onConnectionDraftChange?: (draft: { sourceId: string; targetId?: string } | null) => void; onSaveStateChange?: (state: CanvasSaveState) => void; fullScreen?: boolean }) {
  return <ReactFlowProvider><ArchitectureCanvasInner controlledFullScreen={fullScreen} onCloseInspector={onCloseInspector} onConnectionDraftChange={onConnectionDraftChange} onFullScreenChange={onFullScreenChange} onRequestInspector={onRequestInspector} onSaveStateChange={onSaveStateChange} onViewportChange={onViewportChange} readOnly={readOnly} viewport={viewport} workspaceId={workspaceId} /></ReactFlowProvider>;
}

function ArchitectureCanvasInner({ workspaceId, readOnly, viewport, onViewportChange, onFullScreenChange, onRequestInspector, onCloseInspector, onConnectionDraftChange, onSaveStateChange, controlledFullScreen }: { workspaceId: string; readOnly: boolean; viewport?: Viewport; onViewportChange?: (viewport: Viewport) => void; onFullScreenChange?: (fullScreen: boolean) => void; onRequestInspector?: () => void; onCloseInspector?: () => void; onConnectionDraftChange?: (draft: { sourceId: string; targetId?: string } | null) => void; onSaveStateChange?: (state: CanvasSaveState) => void; controlledFullScreen?: boolean }) {
  const api = useAuthenticatedApiClient();
  const { screenToFlowPosition, flowToScreenPosition, fitView } = useReactFlow();
  const viewportState = useViewport();
  const query = useQuery({ queryKey: ["architecture-document", workspaceId], queryFn: () => api.getArchitectureDocument(workspaceId), enabled: Boolean(workspaceId), retry: false });
  const initializedWorkspace = useArchitectureEditorStore((state) => state.workspaceId);
  const document = useArchitectureEditorStore((state) => state.document);
  const version = useArchitectureEditorStore((state) => state.version);
  const nodes = useArchitectureEditorStore((state) => state.nodes);
  const edges = useArchitectureEditorStore((state) => state.edges);
  const boundaries = useArchitectureEditorStore((state) => state.boundaries);
  const dirty = useArchitectureEditorStore((state) => state.dirty);
  const selectedNodeId = useArchitectureEditorStore((state) => state.selectedNodeId);
  const selectedNodeIds = useArchitectureEditorStore((state) => state.selectedNodeIds);
  const selectedEdgeId = useArchitectureEditorStore((state) => state.selectedEdgeId);
  const pendingDelete = useArchitectureEditorStore((state) => state.pendingDelete);
  const initialize = useArchitectureEditorStore((state) => state.initialize);
  const applyNodes = useArchitectureEditorStore((state) => state.applyNodes);
  const addConnection = useArchitectureEditorStore((state) => state.addConnection);
  const addBoundary = useArchitectureEditorStore((state) => state.addBoundary);
  const updateBoundary = useArchitectureEditorStore((state) => state.updateBoundary);
  const addComponent = useArchitectureEditorStore((state) => state.addComponent);
  const addComponentAndFocus = useCallback((category: ArchitectureComponentCategory, type: ArchitectureComponentType, overrides?: Parameters<typeof addComponent>[2]) => {
    addComponent(category, type, overrides);
    globalThis.setTimeout(() => globalThis.document.getElementById("component-label")?.focus(), 0);
  }, [addComponent]);
  const selectNode = useArchitectureEditorStore((state) => state.selectNode);
  const selectEdge = useArchitectureEditorStore((state) => state.selectEdge);
  const setSelection = useArchitectureEditorStore((state) => state.setSelection);
  const duplicateNodes = useArchitectureEditorStore((state) => state.duplicateNodes);
  const distributeSelection = useArchitectureEditorStore((state) => state.distributeSelection);
  const groupSelection = useArchitectureEditorStore((state) => state.groupSelection);
  const requestDelete = useArchitectureEditorStore((state) => state.requestDelete);
  const cancelDelete = useArchitectureEditorStore((state) => state.cancelDelete);
  const confirmDelete = useArchitectureEditorStore((state) => state.confirmDelete);
  const replaceFromServer = useArchitectureEditorStore((state) => state.replaceFromServer);
  const markSaved = useArchitectureEditorStore((state) => state.markSaved);
  const undo = useArchitectureEditorStore((state) => state.undo);
  const redo = useArchitectureEditorStore((state) => state.redo);
  const canUndo = useArchitectureEditorStore((state) => state.workspaceId === workspaceId && state.past.length > 0);
  const canRedo = useArchitectureEditorStore((state) => state.workspaceId === workspaceId && state.future.length > 0);
  const [saveState, setSaveState] = useState<"loading" | "saved" | "unsaved" | "saving" | "conflict" | "error" | "offline">("loading");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflictSnapshot, setConflictSnapshot] = useState<{ version: number; document: ArchitectureDocument } | null>(null);
  const [revisionMessage, setRevisionMessage] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [paletteSearch, setPaletteSearch] = useState("");
  const [openGroup, setOpenGroup] = useState<string>("Compute & runtime");
  const [activeTool, setActiveTool] = useState<CanvasTool>("select");
  const [dragDepth, setDragDepth] = useState(0);
  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string; position: { x: number; y: number } } | null>(null);
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [boundaryDraft, setBoundaryDraft] = useState<{ position: { x: number; y: number }; flowPosition: { x: number; y: number }; size: { width: number; height: number }; label: string; type: CanvasBoundary["type"] } | null>(null);
  const [boundaryTypeMenuOpen, setBoundaryTypeMenuOpen] = useState(false);
  const [boundaryPreview, setBoundaryPreview] = useState<{ start: { x: number; y: number }; current: { x: number; y: number } } | null>(null);
  const boundaryDrag = useRef<{ start: { x: number; y: number } } | null>(null);
  const [boundaryResize, setBoundaryResize] = useState<BoundaryResizeState | null>(null);
  const [boundaryResizePreview, setBoundaryResizePreview] = useState<{ id: string; left: number; top: number; width: number; height: number } | null>(null);
  const [internalFullScreen, setInternalFullScreen] = useState(controlledFullScreen ?? false);
  const fullScreen = controlledFullScreen ?? internalFullScreen;
  const flowRef = useRef<HTMLDivElement | null>(null);
  const online = useSyncExternalStore((onChange) => { window.addEventListener("online", onChange); window.addEventListener("offline", onChange); return () => { window.removeEventListener("online", onChange); window.removeEventListener("offline", onChange); }; }, () => navigator.onLine, () => true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);
  const lastSelection = useRef("");

  const flowEdges = useMemo(() => edges.map((edge) => ({ ...edge, selected: edge.id === selectedEdgeId })), [edges, selectedEdgeId]);

  function handleEdgesChange(changes: EdgeChange[]) {
    const change = changes.find((item) => item.type === "select");
    if (change && "selected" in change && change.selected) {
      selectEdge(change.id);
      onRequestInspector?.();
    }
  }

  function handleSelectionChange(selection: { nodes: Array<{ id: string }>; edges: Array<{ id: string }> }) {
    const key = selection.edges.length > 0 ? `e:${selection.edges[0].id}` : `n:${selection.nodes.map((node) => node.id).sort().join(",")}`;
    if (lastSelection.current === key) return;
    lastSelection.current = key;
    if (selection.edges.length > 0) {
      selectEdge(selection.edges[0].id);
      onRequestInspector?.();
    } else {
      setSelection(selection.nodes.map((node) => node.id));
      if (selection.nodes.length > 0) onRequestInspector?.();
    }
  }

  const setFullScreenMode = useCallback((next: boolean) => {
    setInternalFullScreen(next);
    onFullScreenChange?.(next);
  }, [onFullScreenChange]);

  useEffect(() => {
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (pendingDelete) cancelDelete();
      else if (pendingConnection) { setPendingConnection(null); onConnectionDraftChange?.(null); }
      else if (connectionSourceId) { setConnectionSourceId(null); onConnectionDraftChange?.(null); setActiveTool("select"); }
      else if (boundaryTypeMenuOpen) setBoundaryTypeMenuOpen(false);
      else if (boundaryDraft) { setBoundaryDraft(null); setBoundaryPreview(null); }
      else if (boundaryPreview) { boundaryDrag.current = null; setBoundaryPreview(null); }
      else if (fullScreen) setFullScreenMode(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [boundaryDraft, boundaryPreview, boundaryTypeMenuOpen, cancelDelete, connectionSourceId, fullScreen, onConnectionDraftChange, pendingConnection, pendingDelete, setFullScreenMode]);

  useEffect(() => {
    if (query.data && initializedWorkspace !== workspaceId) {
      initialize(workspaceId, query.data.version, query.data.document);
    }
  }, [initializedWorkspace, initialize, query.data, workspaceId]);

  useEffect(() => {
    if (readOnly || !document || !dirty || saving.current || !online) return;
    setSaveState("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveDocument(), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // saveDocument intentionally reads the current editor snapshot when the debounce fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, document, online, readOnly, version]);

  async function saveDocument(): Promise<boolean> {
    const current = useArchitectureEditorStore.getState();
    if (!current.document || !current.dirty || saving.current) return Boolean(current.document && !current.dirty);
    if (!online) {
      setSaveState("offline");
      setSaveError("You are offline. Your local draft will stay here until the connection returns.");
      return false;
    }
    saving.current = true;
    setSaveState("saving");
    setSaveError(null);
    try {
      const response = await api.saveArchitectureDocument(workspaceId, current.version, current.document);
      if (useArchitectureEditorStore.getState().workspaceId !== workspaceId) return false;
      const latest = useArchitectureEditorStore.getState();
      if (latest.document !== current.document) {
        // A newer local edit happened while this request was in flight. The
        // response only acknowledges the older snapshot; keep the newer draft
        // dirty and let the debounced save persist it next.
        setSaveState("unsaved");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => void saveDocument(), 700);
        return true;
      }
      markSaved(response.version, response.document);
      setSaveState("saved");
      setConflictSnapshot(null);
      return true;
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        setSaveState("conflict");
        setSaveError("This Workspace changed elsewhere.");
        const nextVersion = error.details?.currentVersion;
        const nextDocument = error.details?.currentDocument;
        if (typeof nextVersion === "number" && nextDocument && typeof nextDocument === "object") setConflictSnapshot({ version: nextVersion, document: nextDocument as ArchitectureDocument });
      } else {
        setSaveState("error");
        const detail = error instanceof ApiRequestError && typeof error.details?.detail === "string" ? ` ${error.details.detail}` : "";
        setSaveError(`We could not save the canvas. Your local draft is preserved.${detail}`);
      }
      return false;
    } finally {
      saving.current = false;
    }
  }

  async function createRevision() {
    setRevisionMessage(null);
    try {
      if (!(await saveDocument())) {
        setRevisionMessage("Resolve the canvas save state before creating a revision.");
        return;
      }
      await api.createArchitectureRevision(workspaceId);
      setRevisionMessage("Revision checkpoint created.");
    } catch {
      setRevisionMessage("Save the current canvas before creating a revision.");
    }
  }

  function screenPoint(flowPoint: { x: number; y: number }): { x: number; y: number } | null {
    const rect = flowRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const screen = flowToScreenPosition(flowPoint);
    return { x: screen.x - rect.left, y: screen.y - rect.top };
  }

  function openConnectionPicker(source: string, target: string) {
    onConnectionDraftChange?.({ sourceId: source, targetId: target });
    const targetNode = useArchitectureEditorStore.getState().nodes.find((node) => node.id === target);
    const rect = flowRef.current?.getBoundingClientRect();
    if (!targetNode || !rect) {
      setPendingConnection({ source, target, position: { x: 16, y: 16 } });
      return;
    }
    const screen = flowToScreenPosition({ x: targetNode.position.x + 60, y: targetNode.position.y });
    const x = Math.min(Math.max(screen.x - rect.left, 8), Math.max(8, rect.width - 308));
    const y = Math.min(Math.max(screen.y - rect.top, 8), Math.max(8, rect.height - 300));
    setPendingConnection({ source, target, position: { x, y } });
  }

  function connect(connection: Connection) {
    if (readOnly) return;
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    openConnectionPicker(connection.source, connection.target);
  }

  function pickConnection(intent: string) {
    if (!pendingConnection) return;
    const result = addConnection({ source: pendingConnection.source, target: pendingConnection.target, intent, protocol: "", guarantee: "", notes: "" });
    setConnectionMessage(result.ok ? "Connection added. It will autosave with the document." : result.message);
    if (result.ok) {
      const created = useArchitectureEditorStore.getState().edges.find((edge) => edge.source === pendingConnection.source && edge.target === pendingConnection.target && edge.data?.intent === intent);
      if (created) {
        selectEdge(created.id);
        onRequestInspector?.();
      }
    }
    setPendingConnection(null);
    setConnectionSourceId(null);
    onConnectionDraftChange?.(null);
    setActiveTool("select");
  }

  function canvasCenterPosition(): { x: number; y: number } | undefined {
    const container = flowRef.current;
    if (!container) return undefined;
    const rect = container.getBoundingClientRect();
    const position = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    return Number.isFinite(position.x) && Number.isFinite(position.y) ? position : undefined;
  }

  function onFlowDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (readOnly) return;
    if (Array.from(event.dataTransfer.types).includes(componentDragMime)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }
  }

  function onFlowDrop(event: React.DragEvent<HTMLDivElement>) {
    if (readOnly) return;
    setDragDepth(0);
    const raw = event.dataTransfer.getData(componentDragMime);
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as { category: ArchitectureComponentCategory; type: ArchitectureComponentType; label: string; properties?: Record<string, string> };
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addComponentAndFocus(payload.category, payload.type, { label: payload.label, position, properties: payload.properties ? { ...componentDefaults[payload.category], ...payload.properties } : undefined });
    } catch {
      return;
    }
  }

  function selectTool(tool: CanvasTool) {
    if (readOnly && tool !== "select" && tool !== "pan") return;
    if (tool !== "connection") {
      setConnectionSourceId(null);
      onConnectionDraftChange?.(null);
    }
    setActiveTool(tool);
  }

  function beginConnectionFromSelection() {
    const source = selectedNodes.length === 1 ? selectedNodes[0]?.id : null;
    if (!source) return;
    setConnectionSourceId(source);
    onConnectionDraftChange?.({ sourceId: source });
    setActiveTool("connection");
    setConnectionMessage(`Source selected: ${nodes.find((node) => node.id === source)?.data.label ?? "Component"}. Select a target Component.`);
  }

  function handleNodeClick(_: React.MouseEvent, node: CanvasNode | BoundaryFlowNode) {
    if (node.type === "component" && activeTool === "connection" && !readOnly) {
      if (connectionSourceId && connectionSourceId !== node.id) {
        openConnectionPicker(connectionSourceId, node.id);
        return;
      }
      if (!connectionSourceId) {
        setConnectionSourceId(node.id);
        onConnectionDraftChange?.({ sourceId: node.id });
        selectNode(node.id);
        onRequestInspector?.();
        setConnectionMessage(`Source selected: ${node.data.label}. Select a target Component.`);
        return;
      }
    }
    if (node.type === "component" || node.type === "boundary") {
      selectNode(node.id);
      onRequestInspector?.();
    }
  }

  function handlePaneClick(event: React.MouseEvent) {
    if (activeTool === "component" && !readOnly) {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addComponentAndFocus("COMPUTE", "SERVICE", { label: "Service", position });
      return;
    }
    if (activeTool === "boundary" && !readOnly) return;
    setPendingConnection(null);
    setConnectionSourceId(null);
    onConnectionDraftChange?.(null);
    if (activeTool === "connection") setActiveTool("select");
    selectNode(null);
    onCloseInspector?.();
  }

  function handleBoundaryMouseDown(event: MouseEvent) {
    if (readOnly || activeTool !== "boundary" || event.button !== 0) return;
    if (event.target instanceof HTMLElement && event.target.closest('[role="dialog"]')) return;
    const start = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    boundaryDrag.current = { start };
    setBoundaryPreview({ start, current: start });
    event.preventDefault();
  }

  function handleBoundaryMouseMove(event: MouseEvent) {
    const start = boundaryDrag.current?.start;
    if (!start) return;
    setBoundaryPreview({ start, current: screenToFlowPosition({ x: event.clientX, y: event.clientY }) });
  }

  function handleBoundaryMouseUp(event: MouseEvent) {
    const start = boundaryDrag.current?.start;
    if (!start) return;
    boundaryDrag.current = null;
    const current = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const position = { x: Math.min(start.x, current.x), y: Math.min(start.y, current.y) };
    const size = { width: Math.abs(current.x - start.x), height: Math.abs(current.y - start.y) };
    if (size.width < 24 || size.height < 24) { setBoundaryPreview(null); return; }
    const rect = flowRef.current?.getBoundingClientRect();
    if (rect) { setBoundaryDraft({ position: { x: event.clientX - rect.left, y: event.clientY - rect.top }, flowPosition: position, size, label: "", type: "DEPLOYMENT" }); setBoundaryTypeMenuOpen(false); }
  }

  function beginBoundaryResize(event: React.MouseEvent, boundary: CanvasBoundary, direction: BoundaryResizeDirection, rect: { left: number; top: number; width: number; height: number }) {
    if (readOnly || activeTool !== "select" || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    selectNode(boundary.id);
    const canvasRect = flowRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const start = screenToFlowPosition({ x: canvasRect.left + rect.left, y: canvasRect.top + rect.top });
    const end = screenToFlowPosition({ x: canvasRect.left + rect.left + rect.width, y: canvasRect.top + rect.top + rect.height });
    const initial = {
      x: typeof boundary.metadata?.x === "number" ? boundary.metadata.x : start.x,
      y: typeof boundary.metadata?.y === "number" ? boundary.metadata.y : start.y,
      width: typeof boundary.metadata?.width === "number" ? Math.max(24, boundary.metadata.width) : Math.abs(end.x - start.x),
      height: typeof boundary.metadata?.height === "number" ? Math.max(24, boundary.metadata.height) : Math.abs(end.y - start.y),
    };
    setBoundaryResize({ id: boundary.id, direction, startClient: { x: event.clientX, y: event.clientY }, initial });
    setBoundaryResizePreview({ id: boundary.id, ...rect });
    onRequestInspector?.();
  }

  useEffect(() => {
    if (!boundaryResize) return;
    const handleMove = (event: MouseEvent) => {
      const deltaX = (event.clientX - boundaryResize.startClient.x) / viewportState.zoom;
      const deltaY = (event.clientY - boundaryResize.startClient.y) / viewportState.zoom;
      const direction = boundaryResize.direction;
      let left = boundaryResize.initial.x + (direction.includes("w") ? deltaX : 0);
      let top = boundaryResize.initial.y + (direction.includes("n") ? deltaY : 0);
      let right = boundaryResize.initial.x + boundaryResize.initial.width + (direction.includes("e") ? deltaX : 0);
      let bottom = boundaryResize.initial.y + boundaryResize.initial.height + (direction.includes("s") ? deltaY : 0);
      const minWidth = 120;
      const minHeight = 80;
      if (right - left < minWidth) { if (direction.includes("w")) left = right - minWidth; else right = left + minWidth; }
      if (bottom - top < minHeight) { if (direction.includes("n")) top = bottom - minHeight; else bottom = top + minHeight; }
      const canvasRect = flowRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      const screenStart = flowToScreenPosition({ x: left, y: top });
      const screenEnd = flowToScreenPosition({ x: right, y: bottom });
      setBoundaryResizePreview({ id: boundaryResize.id, left: Math.min(screenStart.x, screenEnd.x) - canvasRect.left, top: Math.min(screenStart.y, screenEnd.y) - canvasRect.top, width: Math.abs(screenEnd.x - screenStart.x), height: Math.abs(screenEnd.y - screenStart.y) });
    };
    const handleUp = (event: MouseEvent) => {
      const deltaX = (event.clientX - boundaryResize.startClient.x) / viewportState.zoom;
      const deltaY = (event.clientY - boundaryResize.startClient.y) / viewportState.zoom;
      const direction = boundaryResize.direction;
      let left = boundaryResize.initial.x + (direction.includes("w") ? deltaX : 0);
      let top = boundaryResize.initial.y + (direction.includes("n") ? deltaY : 0);
      let right = boundaryResize.initial.x + boundaryResize.initial.width + (direction.includes("e") ? deltaX : 0);
      let bottom = boundaryResize.initial.y + boundaryResize.initial.height + (direction.includes("s") ? deltaY : 0);
      if (right - left < 120) { if (direction.includes("w")) left = right - 120; else right = left + 120; }
      if (bottom - top < 80) { if (direction.includes("n")) top = bottom - 80; else bottom = top + 80; }
      const current = useArchitectureEditorStore.getState().boundaries.find((item) => item.id === boundaryResize.id);
      if (current) updateBoundary(current.id, { metadata: { ...(current.metadata ?? {}), x: Math.round(left), y: Math.round(top), width: Math.round(right - left), height: Math.round(bottom - top) } });
      setBoundaryResize(null);
      setBoundaryResizePreview(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp, { once: true });
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [boundaryResize, flowToScreenPosition, screenToFlowPosition, selectNode, updateBoundary, viewportState.zoom]);

  useEffect(() => {
    const element = flowRef.current;
    if (!element || readOnly || activeTool !== "boundary") return;
    element.addEventListener("mousedown", handleBoundaryMouseDown);
    window.addEventListener("mousemove", handleBoundaryMouseMove);
    window.addEventListener("mouseup", handleBoundaryMouseUp);
    return () => {
      element.removeEventListener("mousedown", handleBoundaryMouseDown);
      window.removeEventListener("mousemove", handleBoundaryMouseMove);
      window.removeEventListener("mouseup", handleBoundaryMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, readOnly]);

  function submitBoundaryDraft() {
    if (!boundaryDraft || !boundaryDraft.label.trim()) return;
    const { x, y } = boundaryDraft.flowPosition;
    const right = x + boundaryDraft.size.width;
    const bottom = y + boundaryDraft.size.height;
    const componentIds = nodes.filter((node) => {
      const centerX = node.position.x + boundaryNodeSize.width / 2;
      const centerY = node.position.y + boundaryNodeSize.height / 2;
      return centerX >= x && centerX <= right && centerY >= y && centerY <= bottom;
    }).map((node) => node.id);
    const boundaryId = addBoundary({ label: boundaryDraft.label.trim(), type: boundaryDraft.type, parentBoundaryId: undefined, componentIds, metadata: { x: Math.round(x), y: Math.round(y), width: Math.round(boundaryDraft.size.width), height: Math.round(boundaryDraft.size.height) } });
    setBoundaryDraft(null);
    setBoundaryPreview(null);
    globalThis.setTimeout(() => void fitView({ nodes: [{ id: boundaryId }], padding: 0.1, duration: 0 }), 0);
  }

  function requestDeleteSelection() {
    const state = useArchitectureEditorStore.getState();
    if (state.selectedEdgeId) {
      const edge = state.edges.find((item) => item.id === state.selectedEdgeId);
      if (edge) {
        const sourceLabel = state.nodes.find((item) => item.id === edge.source)?.data.label ?? "?";
        const targetLabel = state.nodes.find((item) => item.id === edge.target)?.data.label ?? "?";
        requestDelete({ kind: "edge", id: edge.id, label: `${sourceLabel} → ${targetLabel}` });
      }
      return;
    }
    if (state.selectedNodeId && state.boundaries.some((item) => item.id === state.selectedNodeId)) {
      const boundary = state.boundaries.find((item) => item.id === state.selectedNodeId);
      if (boundary) requestDelete({ kind: "boundary", id: boundary.id, label: boundary.label });
      return;
    }
    const ids = state.selectedNodeIds.length > 0 ? state.selectedNodeIds : state.selectedNodeId ? [state.selectedNodeId] : [];
    if (ids.length > 0) {
      const selected = state.nodes.filter((item) => ids.includes(item.id));
      const connectionCount = state.edges.filter((edge) => ids.includes(edge.source) || ids.includes(edge.target)).length;
      requestDelete({ kind: "nodes", ids, label: selected.length === 1 ? selected[0]?.data.label ?? "Component" : `${selected.length} Components`, connectionCount });
    }
  }

  const filteredGroups = paletteSearch.trim()
    ? paletteGroups.map((group) => ({ ...group, items: group.items.filter((item) => `${item.label} ${item.type}`.toLowerCase().includes(paletteSearch.trim().toLowerCase())) })).filter((group) => group.items.length > 0)
    : paletteGroups;
  const renderPaletteItem = ({ category, icon: Icon, label, type, properties }: PaletteItem) => (
    <button className="flex min-h-9 w-full min-w-0 items-center gap-2.5 rounded-[3px] border border-[#344047] px-2.5 py-1 text-left text-[13px] text-[#f2f3f3] hover:border-[#a9e5d8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9e5d8] disabled:cursor-not-allowed disabled:opacity-50" disabled={readOnly} draggable={!readOnly} key={`${category}:${type}:${label}`} onDragStart={(event) => dragComponentData(event, { category, icon: Icon, label, type, properties })} onClick={() => addComponentAndFocus(category, type, { label, position: canvasCenterPosition(), properties: properties ? { ...componentDefaults[category], ...properties } : undefined })} title={label} type="button"><Icon aria-hidden="true" className="shrink-0 text-[#a7aeb3]" size={16} /><span className="min-w-0 whitespace-normal break-words leading-4">{label}</span><Plus aria-hidden="true" className="ml-auto shrink-0 text-[#a7aeb3]" size={14} /></button>
  );
  const layout = useMemo(() => buildFlowLayout(nodes, boundaries), [nodes, boundaries]);
  const renderedFlowNodes = useMemo(() => {
    if (nodes.length === 0 || boundaries.length > 0) return layout.flowNodes;
    const guideSize = fullScreen ? pencilBoundarySizes.fullScreen : pencilBoundarySizes.normal;
    const guide = {
      id: "__pencil-boundary-guide",
      type: "boundary" as const,
      position: { x: fullScreen ? 30 : 22, y: fullScreen ? 60 : 54 },
      draggable: false,
      selectable: false,
      zIndex: 0,
      style: { width: guideSize.width, height: guideSize.height },
      data: { label: "Primary region", boundaryType: "TRUST" },
    } satisfies BoundaryFlowNode;
    return [guide, ...layout.flowNodes];
  }, [boundaries.length, fullScreen, layout.flowNodes, nodes.length]);
  const boundaryPreviewRect = (() => {
    const preview = boundaryDraft
      ? { start: boundaryDraft.flowPosition, current: { x: boundaryDraft.flowPosition.x + boundaryDraft.size.width, y: boundaryDraft.flowPosition.y + boundaryDraft.size.height } }
      : boundaryPreview;
    if (!preview || !flowRef.current) return null;
    const start = flowToScreenPosition(preview.start);
    const current = flowToScreenPosition(preview.current);
    const rect = flowRef.current.getBoundingClientRect();
    return {
      left: Math.min(start.x, current.x) - rect.left,
      top: Math.min(start.y, current.y) - rect.top,
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    };
  })();
  const persistedBoundaryRects = (() => {
    const rect = flowRef.current?.getBoundingClientRect();
    if (!rect) return [];
    return layout.flowNodes
      .filter((node): node is BoundaryFlowNode => node.type === "boundary" && node.id !== "__pencil-boundary-guide")
      .map((node) => {
        const origin = layout.parentOrigins.get(node.id) ?? { x: 0, y: 0 };
        const absolute = { x: node.position.x + origin.x, y: node.position.y + origin.y };
        const start = flowToScreenPosition(absolute);
        const end = flowToScreenPosition({ x: absolute.x + Number(node.style?.width ?? 0), y: absolute.y + Number(node.style?.height ?? 0) });
        return {
          id: node.id,
          left: Math.min(start.x, end.x) - rect.left,
          top: Math.min(start.y, end.y) - rect.top,
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
        };
      });
  })();
  function handleNodesChange(changes: NodeChange<CanvasNode>[]) {
    if (readOnly) return;
    const converted = changes.map((change) => change.type === "position" && change.position ? { ...change, position: { x: change.position.x + (layout.parentOrigins.get(change.id)?.x ?? 0), y: change.position.y + (layout.parentOrigins.get(change.id)?.y ?? 0) } } : change);
    applyNodes(converted);
  }
  const visibleSaveState = !online ? "offline" : initializedWorkspace === workspaceId && saveState === "loading" ? "saved" : saveState;
  useEffect(() => {
    onSaveStateChange?.(visibleSaveState);
    window.dispatchEvent(new CustomEvent("architecture-save-state", { detail: { workspaceId, state: visibleSaveState } }));
  }, [onSaveStateChange, visibleSaveState, workspaceId]);
  const statusLabel = { loading: "Loading", saved: "Saved", unsaved: "Unsaved changes", saving: "Saving…", conflict: "Conflict", error: "Save failed", offline: "Offline" }[visibleSaveState];
  const isDraggingOver = dragDepth > 0;
  const legendHint = isDraggingOver
    ? "DRAGGING · DROP ON CANVAS TO PLACE"
    : activeTool === "connection"
      ? connectionSourceId
        ? "SOURCE SELECTED · CLICK A TARGET COMPONENT TO CONNECT"
        : "SELECT A SOURCE COMPONENT · THEN A TARGET COMPONENT"
      : activeTool === "component"
        ? "CLICK THE CANVAS TO PLACE A SERVICE"
        : activeTool === "boundary"
          ? "DRAG TO DRAW A BOUNDARY"
          : "DRAG TO PAN THE CANVAS";
  const selectedNodes = nodes.filter((node) => selectedNodeIds.includes(node.id));
  const selectedBoundary = boundaries.find((boundary) => boundary.id === selectedNodeId);
  const selectedConnection = edges.find((edge) => edge.id === selectedEdgeId);
  const selectionToolbar = useMemo(() => {
    if (selectedNodes.length === 0) return null;
    const minX = Math.min(...selectedNodes.map((node) => node.position.x));
    const minY = Math.min(...selectedNodes.map((node) => node.position.y));
    const maxX = Math.max(...selectedNodes.map((node) => node.position.x + 150));
    const center = screenPoint({ x: (minX + maxX) / 2, y: minY });
    if (!center) return null;
    return { x: Math.min(Math.max(center.x - 120, 8), Math.max(8, (flowRef.current?.clientWidth ?? 400) - 260)), y: Math.max(8, center.y - 44) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodes, viewportState]);
  const objectToolbar = useMemo(() => {
    if (selectedNodes.length > 0) return null;
    if (selectedBoundary) {
      const x = typeof selectedBoundary.metadata?.x === "number" ? selectedBoundary.metadata.x : 0;
      const y = typeof selectedBoundary.metadata?.y === "number" ? selectedBoundary.metadata.y : 0;
      const point = screenPoint({ x, y });
      return point ? { x: Math.min(Math.max(point.x, 8), Math.max(8, (flowRef.current?.clientWidth ?? 400) - 120)), y: Math.max(8, point.y - 44) } : null;
    }
    if (selectedConnection) {
      const source = nodes.find((node) => node.id === selectedConnection.source);
      const point = source ? screenPoint({ x: source.position.x + 75, y: source.position.y }) : null;
      return point ? { x: Math.min(Math.max(point.x, 8), Math.max(8, (flowRef.current?.clientWidth ?? 400) - 120)), y: Math.max(8, point.y - 44) } : null;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, selectedBoundary, selectedConnection, selectedNodes, viewportState]);
  const pendingDeleteCopy = pendingDelete ? deleteCopy(pendingDelete) : { title: "", copy: "", confirm: "" };
  useEffect(() => {
    function focusRenameField(event: KeyboardEvent) {
      if (event.key !== "F2" || readOnly || pendingDelete) return;
      const state = useArchitectureEditorStore.getState();
      const fieldId = state.selectedEdgeId ? "connection-label" : state.selectedNodeId && state.boundaries.some((boundary) => boundary.id === state.selectedNodeId) ? "boundary-label" : state.selectedNodeId ? "component-label" : null;
      if (!fieldId) return;
      event.preventDefault();
      window.setTimeout(() => globalThis.document.getElementById(fieldId)?.focus(), 0);
    }
    window.addEventListener("keydown", focusRenameField);
    return () => window.removeEventListener("keydown", focusRenameField);
  }, [pendingDelete, readOnly]);

  if (query.isLoading) return <section aria-label="Architecture canvas" className="border border-[#2b3337] bg-[#0d1211] p-8 text-sm text-[#a7aeb3]">Loading Architecture Document…</section>;
  if (query.isError || !document) return <section aria-label="Architecture canvas" className="border border-[#2b3337] bg-[#0d1211] p-8 text-sm text-[#ff9a8b]" role="alert">We could not load the Architecture Canvas. Try again.</section>;

  return <section aria-label="Architecture canvas" className={`${fullScreen ? "flex h-full flex-col bg-[#101316] text-[#f2f3f3]" : "overflow-hidden border border-[#2b3337] bg-[#101316] text-[#f2f3f3]"} outline-none`} onKeyDown={(event) => { if ((event.key === "Delete" || event.key === "Backspace") && !pendingDelete) { if (selectedNodeId || selectedEdgeId || selectedNodeIds.length > 0) { event.preventDefault(); requestDeleteSelection(); } } }} tabIndex={0}>
    <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-[#2b3337] bg-[#151c1a] px-3 py-1.5">
      <div aria-label="Canvas tools" className="flex items-center gap-0.5" role="toolbar">{canvasTools.map(({ id, label, icon: Icon, width }) => <button aria-pressed={activeTool === id} className={`inline-flex h-8 items-center gap-1.5 rounded-[3px] border px-[9px] text-[10px] font-medium ${width} ${activeTool === id ? "border-[#0f766e] bg-[#29413c] text-[#f0f3f1]" : "border-[#35413d] bg-[#151c1a] text-[#a7aeb3] hover:bg-[#29413c] hover:text-[#f0f3f1]"} disabled:cursor-not-allowed disabled:opacity-40`} disabled={readOnly && id !== "select" && id !== "pan"} key={id} onClick={() => selectTool(id)} type="button"><Icon aria-hidden="true" className={activeTool === id ? "text-[#0f766e]" : ""} size={13} />{label}</button>)}</div>
      <div aria-label="Canvas view controls" className="flex shrink-0 items-center gap-0.5">{[
        { key: "undo", label: "Undo", disabled: !canUndo, onClick: () => undo(), icon: Undo2 },
        { key: "redo", label: "Redo", disabled: !canRedo, onClick: () => redo(), icon: Redo2 },
        { key: "fit", label: "Fit view", disabled: false, onClick: () => fitView({ padding: 0.15, duration: 200 }), icon: Scan },
        { key: "fullscreen", label: fullScreen ? "Exit focus canvas" : "Enter focus canvas", disabled: false, onClick: () => setFullScreenMode(!fullScreen), icon: fullScreen ? Minimize2 : Maximize2 },
      ].map(({ key, label, disabled, onClick, icon: Icon }) => <button aria-label={label} className="inline-flex size-7 items-center justify-center rounded-[3px] text-[#a7aeb3] hover:bg-[#202624] hover:text-[#f0f3f1] disabled:cursor-not-allowed disabled:opacity-40" disabled={disabled} key={key} onClick={onClick} title={label} type="button"><Icon aria-hidden="true" size={14} /></button>)}<span aria-label="Canvas zoom" className="ml-1.5 min-w-10 text-right font-mono text-[9px] text-[#a7aeb3]">{Math.round(viewportState.zoom * 100)}%</span></div>
    </div>
    {readOnly ? <div className="flex min-h-9 items-center gap-2 border-b border-[#2b3337] bg-[#151c1a] px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#a9e5d8]" role="status">This Workspace is archived. Restore it before editing.</div> : null}
    {saveError ? <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6c98f] bg-[#f5e8d8] px-4 py-3" role="alert"><div className="flex items-center gap-2.5"><AlertTriangle aria-hidden="true" className="shrink-0 text-[#9a5310]" size={18} /><div><p className="text-[13px] font-semibold text-[#18201e]">{saveError}</p><p className="mt-0.5 text-[11px] text-[#626a66]">Your local edits are safe. Compare versions before choosing.</p></div></div><button className="min-h-8 bg-[#9a5310] px-3 text-[11px] font-semibold text-[#f0f3f1]" onClick={() => { const current = useArchitectureEditorStore.getState(); const serverVersion = conflictSnapshot?.version ?? query.data?.version ?? current.version; const serverDocument = conflictSnapshot?.document ?? query.data?.document ?? current.document; replaceFromServer(serverVersion, serverDocument as ArchitectureDocument); setSaveState("saved"); setSaveError(null); setConflictSnapshot(null); }} type="button">Compare</button></div> : null}
    {revisionMessage ? <p className="border-b border-[#2b3337] px-4 py-2 text-xs text-[#a9e5d8]" role="status">{revisionMessage}</p> : null}
    {connectionMessage ? <p className="border-b border-[#2b3337] px-4 py-2 text-xs text-[#a9e5d8]" role="status">{connectionMessage}</p> : null}
    <div className={`${fullScreen ? "flex min-h-0 flex-1 flex-col lg:flex-row" : "grid min-h-[560px] lg:grid-cols-[180px_minmax(0,1fr)]"} border border-[#35413d]`}>
      <aside aria-label="Component palette" className={fullScreen ? "flex w-full shrink-0 flex-col overflow-hidden border-b border-[#2b3337] bg-[#151b1d] p-3 lg:w-[180px] lg:border-b-0 lg:border-r" : "flex flex-col overflow-hidden border-b border-[#2b3337] bg-[#151b1d] p-3 lg:border-b-0 lg:border-r"}><p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-[#a7aeb3]">Components</p><div className="mt-2.5 flex min-h-8 shrink-0 w-full items-center gap-2 border border-[#3c4542] bg-[#202826] px-2.5"><Search aria-hidden="true" className="shrink-0 text-[#a7aeb3]" size={13} /><input aria-label="Search components" className="min-w-0 flex-1 bg-transparent text-[13px] text-[#f2f3f3] outline-none placeholder:text-[#a7aeb3]" disabled={readOnly} onChange={(event) => setPaletteSearch(event.target.value)} placeholder="Search components" value={paletteSearch} /></div><div className="mt-3 min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto pr-1" data-testid="palette-list">{paletteSearch.trim() ? filteredGroups.map((group) => <div key={group.label}><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a7aeb3]">{group.label}</p><div className="mt-1.5 grid gap-1">{group.items.map(renderPaletteItem)}</div></div>) : paletteGroups.map((group) => <div key={group.label}><button aria-expanded={openGroup === group.label} className="flex min-h-8 w-full items-center justify-between px-1 text-[11px] font-semibold text-[#a7aeb3] hover:text-[#f0f3f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9e5d8]" onClick={() => setOpenGroup((current) => current === group.label ? "" : group.label)} type="button">{group.label}<ChevronDown aria-hidden="true" className={`shrink-0 transition-transform ${openGroup === group.label ? "rotate-180 text-[#0f766e]" : "text-[#5a635f]"}`} size={14} /></button>{openGroup === group.label ? <div className="mt-1.5 grid gap-1">{group.items.map(renderPaletteItem)}</div> : null}</div>)}{paletteSearch.trim() && filteredGroups.length === 0 ? <p className="text-[13px] text-[#a7aeb3]">No components match “{paletteSearch}”.</p> : null}</div><p className="mt-3 shrink-0 font-mono text-[10px] text-[#a7aeb3]">Drag to Canvas or press Enter</p></aside>
      <div className={fullScreen ? "relative min-h-0 flex-1 overflow-hidden bg-[#101316]" : "relative h-[570px] overflow-hidden bg-[#101316]"} data-testid="architecture-flow" onDragEnter={(event) => { if (!readOnly && Array.from(event.dataTransfer.types).includes(componentDragMime)) setDragDepth((depth) => depth + 1); }} onDragLeave={() => setDragDepth((depth) => Math.max(0, depth - 1))} onDragOver={onFlowDragOver} onDrop={onFlowDrop} ref={flowRef}><ReactFlow connectionLineStyle={{ stroke: "#0f766e", strokeWidth: 1.5 }} connectOnClick={!readOnly && activeTool === "connection"} defaultViewport={viewport} edges={flowEdges} fitView={!viewport} isValidConnection={(connection) => Boolean(connection.source) && Boolean(connection.target) && connection.source !== connection.target} nodeExtent={canvasWorldExtent} nodeTypes={nodeTypes} nodes={renderedFlowNodes as unknown as CanvasNode[]} nodesConnectable={!readOnly} nodesDraggable={!readOnly && activeTool === "select"} onConnect={connect} onConnectEnd={() => setIsConnecting(false)} onConnectStart={() => setIsConnecting(true)} onEdgeClick={(_, edge) => { selectEdge(edge.id); onRequestInspector?.(); }} onEdgesChange={readOnly ? undefined : handleEdgesChange} onMoveEnd={(_, nextViewport) => onViewportChange?.(nextViewport)} onNodeClick={handleNodeClick} onNodesChange={readOnly ? undefined : handleNodesChange} onPaneClick={handlePaneClick} onSelectionChange={handleSelectionChange} panOnDrag={activeTool === "pan"} proOptions={{ hideAttribution: true }} selectionOnDrag={!readOnly && activeTool === "select"} translateExtent={canvasWorldExtent}><Background color="#202a2d" gap={28} size={1} /></ReactFlow>
        {boundaryPreviewRect ? <div aria-hidden="true" className="pointer-events-none absolute z-10 border border-dashed border-[#53615c] bg-transparent" data-testid="boundary-preview" style={boundaryPreviewRect} /> : null}
        {persistedBoundaryRects.map((boundary) => { const boundaryData = boundaries.find((item) => item.id === boundary.id); if (!boundaryData) return null; const rect = boundaryResizePreview?.id === boundary.id ? boundaryResizePreview : boundary; const selected = selectedNodeId === boundary.id; const handleDefs: Array<{ direction: BoundaryResizeDirection; className: string; cursor: string }> = [{ direction: "nw", className: "-left-1 -top-1", cursor: "nwse-resize" }, { direction: "n", className: "inset-x-1 -top-1 h-2", cursor: "ns-resize" }, { direction: "ne", className: "-right-1 -top-1", cursor: "nesw-resize" }, { direction: "e", className: "-right-1 inset-y-1", cursor: "ew-resize" }, { direction: "se", className: "-right-1 -bottom-1", cursor: "nwse-resize" }, { direction: "s", className: "inset-x-1 -bottom-1 h-2", cursor: "ns-resize" }, { direction: "sw", className: "-left-1 -bottom-1", cursor: "nesw-resize" }, { direction: "w", className: "-left-1 inset-y-1", cursor: "ew-resize" }]; return <div className="pointer-events-none absolute border border-[#71817a] bg-transparent" data-testid="persisted-boundary-visual" key={boundary.id} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height, zIndex: 10 }}><button aria-label={`Select boundary ${boundary.id}`} className="pointer-events-auto absolute inset-x-0 -top-1 h-2 cursor-pointer bg-transparent" onClick={() => { selectNode(boundary.id); onRequestInspector?.(); }} type="button" /><button aria-label={`Select boundary ${boundary.id} left edge`} className="pointer-events-auto absolute inset-y-0 -left-1 w-2 cursor-pointer bg-transparent" onClick={() => { selectNode(boundary.id); onRequestInspector?.(); }} type="button" /><button aria-label={`Select boundary ${boundary.id} right edge`} className="pointer-events-auto absolute inset-y-0 -right-1 w-2 cursor-pointer bg-transparent" onClick={() => { selectNode(boundary.id); onRequestInspector?.(); }} type="button" /><button aria-label={`Select boundary ${boundary.id} bottom edge`} className="pointer-events-auto absolute inset-x-0 -bottom-1 h-2 cursor-pointer bg-transparent" onClick={() => { selectNode(boundary.id); onRequestInspector?.(); }} type="button" />{selected && !readOnly && activeTool === "select" ? handleDefs.map(({ direction, className, cursor }) => <button aria-label={`Resize boundary ${boundary.id} ${direction}`} className={`pointer-events-auto absolute size-2 rounded-sm border border-[#a9e5d8] bg-[#0f766e] ${className}`} data-testid={`boundary-resize-handle-${boundary.id}-${direction}`} key={direction} onMouseDown={(event) => beginBoundaryResize(event, boundaryData, direction, rect)} style={{ cursor }} type="button" />) : null}</div>})}
        {nodes.length === 0 && boundaries.length === 0 ? <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4"><div className="pointer-events-auto w-[520px] max-w-full border border-[#2b3337] bg-[#151c1a] p-8 text-center"><div aria-hidden="true" className="mx-auto flex size-[46px] items-center justify-center bg-[#203633]"><Network className="text-[#0f766e]" size={22} /></div><p className="mt-4 font-display text-[22px] font-normal text-[#f0f3f1]">No architecture Components yet.</p><p className="mt-2 text-[13px] leading-5 text-[#a7aeb3]">Drag a Component from the palette, press Enter on a palette item, or use the Component tool to start describing the system.</p><button className="mt-5 inline-flex min-h-9 items-center bg-[#0f766e] px-4 text-xs font-semibold text-[#f0f3f1]" onClick={() => addComponentAndFocus("COMPUTE", "SERVICE", { label: "Service", position: canvasCenterPosition() })} type="button">Add Component</button></div></div> : null}
        {selectionToolbar && selectedNodes.length > 0 && !pendingDelete ? <div className="absolute z-20 flex items-center gap-0.5 border border-[#2b3337] bg-[#202826] px-2 py-1.5" role="toolbar" style={{ left: selectionToolbar.x, top: selectionToolbar.y }}>{selectedNodes.length > 1 ? <span className="px-1.5 font-mono text-[10px] text-[#0f766e]">{selectedNodes.length} selected</span> : null}{selectedNodes.length > 1 ? <SelectionButton ariaLabel="Distribute selection" danger={false} icon={AlignHorizontalSpaceAround} onClick={() => distributeSelection(selectedNodeIds)} title="Distribute" /> : null}{selectedNodes.length > 1 ? <SelectionButton ariaLabel="Group selection" danger={false} icon={Group} onClick={() => groupSelection(selectedNodeIds)} title="Group" /> : null}<SelectionButton ariaLabel="Duplicate selection" danger={false} icon={Copy} onClick={() => duplicateNodes(selectedNodeIds)} title="Duplicate" />{selectedNodes.length === 1 ? <SelectionButton ariaLabel="Connect selection" danger={false} icon={Link} onClick={beginConnectionFromSelection} title="Connect" /> : null}<SelectionButton ariaLabel="Delete selection" danger icon={Trash2} onClick={requestDeleteSelection} title="Delete" /></div> : null}
        {objectToolbar && selectedBoundary && !pendingDelete ? <div className="absolute z-20 flex items-center gap-0.5 border border-[#2b3337] bg-[#202826] px-2 py-1.5" role="toolbar" aria-label="Boundary actions" style={{ left: objectToolbar.x, top: objectToolbar.y }}><SelectionButton ariaLabel="Edit boundary" danger={false} icon={SlidersHorizontal} onClick={() => { onRequestInspector?.(); globalThis.setTimeout(() => globalThis.document.getElementById("boundary-label")?.focus(), 0); }} title="Edit boundary" /><SelectionButton ariaLabel="Delete boundary" danger icon={Trash2} onClick={requestDeleteSelection} title="Delete boundary" /></div> : null}
        {objectToolbar && selectedConnection && !pendingDelete ? <div className="absolute z-20 flex items-center gap-0.5 border border-[#2b3337] bg-[#202826] px-2 py-1.5" role="toolbar" aria-label="Connection actions" style={{ left: objectToolbar.x, top: objectToolbar.y }}><SelectionButton ariaLabel="Edit connection" danger={false} icon={SlidersHorizontal} onClick={() => { onRequestInspector?.(); globalThis.setTimeout(() => globalThis.document.getElementById("connection-label")?.focus(), 0); }} title="Edit connection" /><SelectionButton ariaLabel="Delete connection" danger icon={Trash2} onClick={requestDeleteSelection} title="Delete connection" /></div> : null}
        {pendingConnection ? <div className="absolute z-20 w-[300px] rounded-[5px] border border-[#0f766e] bg-[#202826] p-3.5" style={{ left: pendingConnection.position.x, top: pendingConnection.position.y }} role="dialog" aria-label="Choose connection intent"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#0f766e]">Create Connection</p><p className="mt-1.5 text-[13px] font-medium text-[#f0f3f1]">{nodes.find((node) => node.id === pendingConnection.source)?.data.label ?? "?"} → {nodes.find((node) => node.id === pendingConnection.target)?.data.label ?? "?"}</p><div className="mt-3 grid gap-2">{connectionQuickIntents.map(({ intent, label, detail }) => <button className="flex min-h-12 w-full flex-col items-start justify-center gap-[3px] rounded-[3px] border border-[#35413d] px-2.5 py-2 text-left hover:border-[#0f766e] hover:bg-[#29413c] group" key={intent} onClick={() => pickConnection(intent)} type="button"><span className="text-[12px] font-medium text-[#a7aeb3] group-hover:text-[#f0f3f1]">{label}</span><span className="font-mono text-[10px] text-[#a7aeb3]">{detail}</span></button>)}<div className="mt-2 flex min-h-12 w-full flex-col items-start justify-center gap-[3px] border-t border-[#2b3337] px-[10px] py-[9px]"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#a7aeb3]">Keyboard Alternative</p><p className="text-[11px] text-[#f0f3f1]">Choose source, target, and intent without dragging</p></div></div></div> : null}
        {boundaryDraft ? <div className="absolute z-20 w-[260px] rounded-[4px] border border-[#2b3337] bg-[#202826] p-3.5" style={{ left: Math.min(boundaryDraft.position.x, Math.max(8, (flowRef.current?.clientWidth ?? 260) - 268)), top: Math.min(boundaryDraft.position.y, Math.max(8, (flowRef.current?.clientHeight ?? 260) - 260)) }} role="dialog" aria-label="Add boundary"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#0f766e]">Add Boundary</p><label className="mt-3 block text-[11px] text-[#a7aeb3]" htmlFor="boundary-draft-label">Label</label><input autoFocus className="mt-1.5 min-h-9 w-full rounded-[3px] border border-[#3c4542] bg-[#101316] px-2 text-[13px] text-[#f2f3f3] outline-none focus:border-[#a9e5d8]" id="boundary-draft-label" onChange={(event) => setBoundaryDraft((current) => current ? { ...current, label: event.target.value } : current)} onKeyDown={(event) => { if (event.key === "Enter") submitBoundaryDraft(); }} placeholder="e.g. Primary region" value={boundaryDraft.label} /><label className="mt-3 block text-[11px] text-[#a7aeb3]" htmlFor="boundary-draft-type">Type</label><div className="relative mt-1.5"><button aria-expanded={boundaryTypeMenuOpen} aria-haspopup="listbox" aria-label="Boundary type" className="flex min-h-9 w-full items-center justify-between rounded-[3px] border border-[#3c4542] bg-[#101316] px-2 text-left text-[13px] text-[#f2f3f3]" onClick={() => setBoundaryTypeMenuOpen((open) => !open)} type="button">{boundaryTypeLabel(boundaryDraft.type)}<ChevronDown aria-hidden="true" className={boundaryTypeMenuOpen ? "rotate-180 text-[#0f766e]" : "text-[#a7aeb3]"} size={14} /></button>{boundaryTypeMenuOpen ? <div className="absolute inset-x-0 top-full z-30 mt-1 rounded-[3px] border border-[#3c4542] bg-[#101316] p-1 shadow-lg" role="listbox" aria-label="Boundary type options">{boundaryTypeOptions.map(({ value, label }) => <button aria-selected={boundaryDraft.type === value} className={`block w-full rounded-[2px] px-2 py-2 text-left text-[12px] ${boundaryDraft.type === value ? "bg-[#29413c] text-[#f0f3f1]" : "text-[#a7aeb3] hover:bg-[#202826] hover:text-[#f0f3f1]"}`} key={value} onClick={() => { setBoundaryDraft((current) => current ? { ...current, type: value } : current); setBoundaryTypeMenuOpen(false); }} role="option" type="button">{label}</button>)}</div> : null}</div><div className="mt-4 flex items-center justify-between"><button className="rounded-[3px] text-[11px] font-semibold text-[#a7aeb3] hover:text-[#f0f3f1]" onClick={() => { setBoundaryDraft(null); setBoundaryPreview(null); }} type="button">Cancel</button><button className="min-h-8 rounded-[3px] bg-[#0f766e] px-3 text-[11px] font-semibold text-[#f0f3f1]" disabled={!boundaryDraft.label.trim()} onClick={submitBoundaryDraft} type="button">Add Boundary</button></div></div> : null}
        {isDraggingOver || isConnecting || activeTool !== "select" ? <div className="absolute inset-x-0 bottom-0 z-10 flex h-8 items-center border-t border-[#2b3337] bg-[#151c1a] px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#a7aeb3]" aria-label="Canvas interaction legend">{isConnecting ? <span className="flex items-center gap-4"><span className="flex items-center gap-1.5 text-[#0f766e]"><span aria-hidden="true">●</span>Valid target</span><span className="flex items-center gap-1.5 text-[#e58a80]"><span aria-hidden="true">●</span>Invalid target</span></span> : <span>{legendHint}</span>}</div> : null}
      </div>
    </div>
    <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#2b3337] bg-[#101316] px-4 py-2 font-mono text-[10px] text-[#a7aeb3]"><span>{nodes.length} COMPONENT{nodes.length === 1 ? "" : "S"} · {edges.length} CONNECTION{edges.length === 1 ? "" : "S"} · {boundaries.length} BOUNDARY{boundaries.length === 1 ? "" : "IES"} · VIEW {Math.round(viewportState.zoom * 100)}%</span><div className="flex items-center gap-3">{visibleSaveState === "offline" ? <span className="flex items-center gap-1.5 border border-[#3c4542] bg-[#202826] px-2 py-1 text-[10px] text-[#f0f3f1]"><CloudOff aria-hidden="true" className="text-[#9a5310]" size={14} />Offline · changes queued locally</span> : <span aria-live="polite" className={`flex items-center gap-1.5 ${visibleSaveState === "conflict" || visibleSaveState === "error" ? "text-[#ff9a8b]" : visibleSaveState === "saved" || visibleSaveState === "loading" ? "text-[#a9aeb3]" : "text-[#a9e5d8]"}`} role="status">{statusLabel}</span>}<button className="border border-[#3c4542] px-2.5 py-1 text-[10px] font-semibold text-[#f2f3f3] hover:border-[#a9e5d8]" onClick={() => void createRevision()} type="button">Checkpoint Revision</button></div></div>
    {pendingDelete ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#0d1211]/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-confirmation-title"><div className="w-[440px] max-w-full rounded-[4px] bg-[#fbf9f3] p-7"><div aria-hidden="true" className="flex size-[42px] items-center justify-center rounded-[4px] bg-[#f5e3e0]"><Trash2 className="text-[#a33f34]" size={20} /></div><h2 className="mt-4 font-display text-[22px] font-medium text-[#18201e]" id="delete-confirmation-title">{pendingDeleteCopy.title}</h2><p className="mt-2 text-[13px] leading-5 text-[#626a66]">{pendingDeleteCopy.copy}</p><div className="mt-6 flex items-center justify-end gap-2"><button className="inline-flex min-h-[38px] items-center rounded-[3px] border border-[#d6d1c5] px-3 text-[12px] font-normal text-[#18201e] hover:bg-[#f4f1e8]" onClick={cancelDelete} type="button">Cancel</button><button className="inline-flex min-h-[38px] items-center rounded-[3px] bg-[#a33f34] px-4 text-[12px] font-semibold text-[#f0f3f1]" onClick={confirmDelete} type="button">{pendingDeleteCopy.confirm}</button></div></div></div> : null}
  </section>;
}

function SelectionButton({ ariaLabel, danger = false, icon: Icon, onClick, title }: { ariaLabel: string; danger?: boolean; icon: typeof Copy; onClick: () => void; title: string }) {
  return <button aria-label={ariaLabel} className={`inline-flex size-7 items-center justify-center ${danger ? "text-[#e58a80]" : "text-[#a7aeb3]"} hover:bg-[#29413c] hover:text-[#f0f3f1]`} onClick={onClick} title={title} type="button"><Icon aria-hidden="true" size={14} /></button>;
}

function deleteCopy(pending: PendingDelete) {
  if (pending.kind === "edge") {
    return { title: "Delete Connection?", copy: "Deleting removes this Connection from the Canvas. The Components remain.", confirm: "Delete Connection" };
  }
  if (pending.kind === "boundary") {
    return { title: `Delete ${pending.label}?`, copy: "Deleting removes this Boundary and its label. Components inside remain on the Canvas.", confirm: "Delete Boundary" };
  }
  const connectionCopy = pending.connectionCount === 1 ? "1 Connection references" : `${pending.connectionCount} Connections reference`;
  const copy = pending.ids.length === 1
    ? `${connectionCopy} this Component. Deleting removes the Component and its Connections.`
    : `Deleting removes these ${pending.ids.length} Components and their Connections.`;
  return { title: pending.ids.length === 1 ? `Delete ${pending.label}?` : `Delete ${pending.ids.length} Components?`, copy, confirm: pending.ids.length === 1 ? "Delete Component" : "Delete Components" };
}

function ArchitectureNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const icon = data.type === "CUSTOM_COMPONENT" ? iconForSemantic(String(data.properties.semanticIcon)) : iconForType(data.type);
  const meta = nodeMeta(data);
  const handleClass = "!h-2 !w-2 !border-2 !border-[#0f766e] !bg-[#0d1211] !shadow-none";
  const typeLabel = nodeTypeLabel(data.type);
  const normalizedLabel = data.label.trim().toLowerCase();
  const showType = normalizedLabel !== typeLabel.toLowerCase() && !(typeAliases[data.type] ?? []).includes(normalizedLabel);
  return <div aria-label={showType ? `${data.label}, ${typeLabel}` : data.label} onDoubleClick={() => { useArchitectureEditorStore.getState().selectNode(id); globalThis.setTimeout(() => globalThis.document.getElementById("component-label")?.focus(), 0); }} className={`relative flex min-h-[82px] min-w-[120px] flex-col justify-center gap-[7px] rounded-[4px] border border-[#46534e] bg-[#1b2421] px-[10px] py-[10px] ${selected ? "outline outline-2 outline-offset-[-1px] outline-[#0f766e]" : ""}`}><Handle className={handleClass} position={Position.Left} type="target" /><div className="flex w-full items-center gap-2"><span aria-hidden="true" className="flex size-[26px] shrink-0 items-center justify-center rounded-[3px] bg-[#242e2b]">{createElement(icon, { className: "text-[#a7b0ac]", size: 14 })}</span><div className="flex min-w-0 flex-1 flex-col items-start gap-0.5"><p className="w-full truncate font-sans text-[12px] font-normal leading-4 text-[#f0f3f1]">{data.label}</p>{showType ? <p className="whitespace-nowrap font-mono text-[9px] uppercase leading-3 text-[#a7b0ac]">{typeLabel}</p> : null}</div></div>{meta ? <p className="relative z-[1] whitespace-nowrap font-mono text-[9px] leading-3 text-[#a7b0ac]">{meta}</p> : null}<Handle className={handleClass} position={Position.Right} type="source" /></div>;
}

function BoundaryNode({ id, data, selected }: NodeProps<BoundaryFlowNode>) {
  const isGuide = id === "__pencil-boundary-guide";
  return <div aria-label={`${data.label} / ${boundaryTypeLabel(data.boundaryType)} boundary`} onClick={() => { if (!isGuide) useArchitectureEditorStore.getState().selectNode(id); }} onDoubleClick={() => { if (!isGuide) { useArchitectureEditorStore.getState().selectNode(id); globalThis.setTimeout(() => globalThis.document.getElementById("boundary-label")?.focus(), 0); } }} className="relative h-full w-full overflow-visible" style={{ backgroundColor: "rgba(83, 97, 92, 0.06)", border: `1px solid ${selected ? "#a9e5d8" : "#71817a"}`, boxSizing: "border-box", boxShadow: selected ? "0 0 0 1px rgba(169,229,216,0.35)" : "none", zIndex: selected ? 10 : 2 }}><NodeToolbar nodeId={id} isVisible={!isGuide} position={Position.Top} align="start" offset={6} style={{ zIndex: 1000, pointerEvents: "none" }}><span aria-hidden="true" className="block whitespace-nowrap bg-[#101316] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#a7b0ac]" data-testid="persisted-boundary-label">{data.label} / {boundaryTypeLabel(data.boundaryType).toUpperCase()} BOUNDARY</span></NodeToolbar></div>;
}

const dataStoreProviderOptions: Partial<Record<ArchitectureComponentType, string[]>> = {
  CACHE: ["REDIS", "MEMCACHED", "IN_MEMORY", "OTHER"],
  RELATIONAL_DATABASE: ["POSTGRESQL", "MYSQL", "OTHER"],
  DOCUMENT_DATABASE: ["MONGODB", "NOSQL", "OTHER"],
  OBJECT_STORE: ["S3_COMPATIBLE", "OTHER"],
};

const propertyFields: Record<ArchitectureComponentCategory, string[]> = {
  CLIENT: ["responsibility", "authBoundary", "offlineNotes"],
  COMPUTE: ["responsibility", "stateModel", "scalingSignal", "concurrencyNotes", "capacityNotes"],
  DATA_STORE: ["dataModel", "accessPatterns", "partitioning", "replication", "retention", "recoveryNotes"],
  MESSAGING: ["ordering", "retryPolicy", "deadLetterPolicy", "retention", "consumerBehavior", "replayNotes"],
  EDGE_SECURITY: ["routing", "tlsNotes", "caching", "rateLimitIntent", "authBoundary", "trustScope"],
  COORDINATION_CONFIG: ["responsibility", "failureMode", "consensusNotes", "operationalNotes"],
  IDENTITY_SECRETS: ["authorizationModel", "trustLifecycle", "redactionNotes"],
  OBSERVABILITY: ["slo", "alerting", "retention", "redactionNotes"],
  CUSTOM: ["provider", "metadataNotes"],
};

export function ArchitectureInspector({ disabled, node, onChange, onDelete, onDuplicate }: { disabled: boolean; node: CanvasNode; onChange: (patch: Partial<CanvasNodeData>) => void; onDelete: () => void; onDuplicate: () => void }) {
  const propertyKey = node.data.category === "DATA_STORE" ? "provider" : { CLIENT: "platform", COMPUTE: "runtime", MESSAGING: "deliveryGuarantee", EDGE_SECURITY: "exposure", COORDINATION_CONFIG: "consistency", IDENTITY_SECRETS: "responsibility", OBSERVABILITY: "signal", CUSTOM: "semanticIcon" }[node.data.category];
  const properties = node.data.properties ?? {};
  const propertyOptions = propertyKey === "provider" ? dataStoreProviderOptions[node.data.type] ?? ["OTHER"] : { platform: ["WEB", "MOBILE", "DESKTOP", "CLI", "IOT", "OTHER"], runtime: ["JAVA", "NODE_JS", "PYTHON", "GO", "OTHER"], consistency: ["STRONG", "EVENTUAL", "CAUSAL"], deliveryGuarantee: ["AT_MOST_ONCE", "AT_LEAST_ONCE", "EXACTLY_ONCE"], exposure: ["PUBLIC", "PRIVATE", "INTERNAL"], responsibility: ["IDENTITY", "SECRETS"], signal: ["LOGS", "METRICS", "TRACES"], semanticIcon: ["component", "service", "worker", "database", "queue", "gateway", "event-bus", "dns", "cdn", "config", "registry", "storage", "identity", "external"] }[propertyKey];
  const options = propertyOptions ?? [];
  return <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a7aeb3]">Component Inspector</p><label className="mt-5 block text-xs text-[#a7aeb3]" htmlFor="component-label">Label</label><input className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-label" onChange={(event) => onChange({ label: event.target.value })} value={node.data.label} /><label className="mt-4 block text-xs text-[#a7aeb3]" htmlFor="component-category">Category</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-category" onChange={(event) => { const category = event.target.value as ArchitectureComponentCategory; onChange({ category, properties: componentDefaults[category] }); }} value={node.data.category}><option value="CLIENT">Client</option><option value="COMPUTE">Compute</option><option value="DATA_STORE">Data store</option><option value="MESSAGING">Messaging</option><option value="EDGE_SECURITY">Edge / security</option><option value="COORDINATION_CONFIG">Coordination / config</option><option value="IDENTITY_SECRETS">Identity / secrets</option><option value="OBSERVABILITY">Observability</option><option value="CUSTOM">Custom</option></select><label className="mt-4 block text-xs text-[#a7aeb3]" htmlFor="component-type">Type</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-type" onChange={(event) => onChange({ type: event.target.value as ArchitectureComponentType })} value={node.data.type}><option value="CLIENT">Client</option><option value="SERVICE">Service</option><option value="FUNCTION">Function</option><option value="WORKER">Worker</option><option value="BATCH_JOB">Batch job</option><option value="RELATIONAL_DATABASE">Relational database</option><option value="DOCUMENT_DATABASE">Document database</option><option value="CACHE">Cache</option><option value="OBJECT_STORE">Object store</option><option value="QUEUE">Queue</option><option value="EVENT_BUS">Event bus</option><option value="STREAM">Stream</option><option value="DNS">DNS</option><option value="CDN">CDN</option><option value="GATEWAY">API gateway</option><option value="LOAD_BALANCER">Load balancer</option><option value="WAF">WAF</option><option value="CONFIG_SERVICE">Config service</option><option value="SERVICE_REGISTRY">Service registry</option><option value="IDENTITY_PROVIDER">Identity provider</option><option value="SECRETS_MANAGER">Secrets manager</option><option value="LOGGING">Logging</option><option value="METRICS">Metrics</option><option value="TRACING">Tracing</option><option value="EXTERNAL_API">External API</option><option value="CUSTOM_COMPONENT">Custom Component</option></select><label className="mt-4 block text-xs text-[#a7aeb3]" htmlFor="component-property">{propertyKey.replace(/([A-Z])/g, " $1")}</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-property" onChange={(event) => onChange({ properties: { ...properties, [propertyKey]: event.target.value } })} value={String(properties[propertyKey] ?? "")}><option value="">Not specified</option>{options.map((value) => <option key={value} value={value}>{({ IN_MEMORY: "In-memory", S3_COMPATIBLE: "S3-compatible", NOSQL: "NoSQL-compatible" } as Record<string, string>)[value] ?? value.replaceAll("_", " ")}</option>)}</select>{propertyFields[node.data.category].map((field) => <label className="mt-4 block text-xs text-[#a7aeb3]" key={field}>{field.replace(/([A-Z])/g, " $1")}<textarea className="mt-2 min-h-14 w-full border border-[#3c4542] bg-[#101316] px-2 py-2 text-xs text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} maxLength={500} onChange={(event) => onChange({ properties: { ...properties, [field]: event.target.value } })} value={String(properties[field] ?? "")} /></label>)}    <div className="mt-7 flex flex-wrap gap-2"><button className="inline-flex min-h-9 items-center gap-2 border border-[#3c4542] px-3 text-xs font-semibold text-[#f2f3f3] hover:border-[#a9e5d8] disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onDuplicate} type="button"><Copy aria-hidden="true" size={14} />Duplicate</button><button className="inline-flex min-h-9 items-center gap-2 border border-[#ff9a8b] px-3 text-xs font-semibold text-[#ffb4a8] hover:bg-[#321d1a] disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onDelete} type="button"><Trash2 aria-hidden="true" size={14} />Delete Component</button></div></div>;
}

export function ConnectionInspector({ disabled, edge, saveState, sourceLabel, targetLabel, onChange, onDelete }: { disabled: boolean; edge: CanvasEdge; saveState: CanvasSaveState; sourceLabel: string; targetLabel: string; onChange: (patch: Partial<CanvasEdgeData>) => void; onDelete: () => void }) {
  const data = edge.data ?? { intent: "REQUEST_RESPONSE" };
  const humanize = (value?: string) => value ? value.replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (character) => character.toUpperCase()) : "Not specified";
  const fieldClass = "mt-1.5 min-h-9 w-full rounded-[4px] border border-[#d6d1c5] bg-[#f4f1e8] px-3 text-[12px] text-[#18201e] outline-none focus:border-[#0f766e] disabled:opacity-50";
  const summaryRows = [
    ["From", sourceLabel],
    ["To", targetLabel],
    ["Intent", humanize(data.intent)],
    ...(data.protocol ? [["Protocol", humanize(data.protocol)]] : []),
    ...(data.guarantee ? [["Guarantee", humanize(data.guarantee)]] : []),
  ];

  return <section className="pt-5">
    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#626a66]">Selected connection</p>
    <h2 className="mt-2 font-display text-[22px] font-normal leading-[1.2] text-[#18201e]">{sourceLabel} → {targetLabel}</h2>
    <p className="mt-3 text-[13px] leading-5 text-[#626a66]">{data.label || "Describe how this Connection moves data between Components."}</p>
    <dl className="mt-5 grid gap-3 text-[12px]">
      {summaryRows.map(([label, value]) => <div className="flex items-baseline justify-between gap-4" key={label}><dt className="text-[#626a66]">{label}</dt><dd className="text-right text-[#18201e]">{value}</dd></div>)}
    </dl>
    <div className="mt-7">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#626a66]">Edit connection</p>
      <label className="mt-4 block text-[12px] text-[#626a66]" htmlFor="connection-label">Label<input className={fieldClass} disabled={disabled} id="connection-label" maxLength={120} onChange={(event) => onChange({ label: event.target.value })} placeholder="Optional label" value={data.label ?? ""} /></label>
      <label className="mt-4 block text-[12px] text-[#626a66]" htmlFor="connection-intent">Intent<select className={fieldClass} disabled={disabled} id="connection-intent" onChange={(event) => onChange({ intent: event.target.value })} value={data.intent}>{connectionIntents.map((intent) => <option key={intent} value={intent}>{humanize(intent)}</option>)}</select></label>
      <label className="mt-4 block text-[12px] text-[#626a66]" htmlFor="connection-protocol">Protocol<select className={fieldClass} disabled={disabled} id="connection-protocol" onChange={(event) => onChange({ protocol: event.target.value })} value={data.protocol ?? ""}><option value="">Not specified</option>{protocols.filter(Boolean).map((protocol) => <option key={protocol} value={protocol}>{humanize(protocol)}</option>)}</select></label>
      <label className="mt-4 block text-[12px] text-[#626a66]" htmlFor="connection-guarantee">Guarantee<select className={fieldClass} disabled={disabled} id="connection-guarantee" onChange={(event) => onChange({ guarantee: event.target.value })} value={data.guarantee ?? ""}><option value="">Not specified</option>{guarantees.filter(Boolean).map((guarantee) => <option key={guarantee} value={guarantee}>{humanize(guarantee)}</option>)}</select></label>
      <label className="mt-4 block text-[12px] text-[#626a66]" htmlFor="connection-notes">Notes<textarea className={`${fieldClass} min-h-20 py-2`} disabled={disabled} id="connection-notes" maxLength={1000} onChange={(event) => onChange({ notes: event.target.value })} placeholder="Optional notes" value={data.notes ?? ""} /></label>
    </div>
    <div className="mt-6 flex flex-wrap gap-2 border-t border-[#d6d1c5] pt-5">
      <p aria-live="polite" className={`inline-flex min-h-[38px] items-center text-[11px] ${saveState === "error" || saveState === "conflict" || saveState === "offline" ? "text-[#8d332a]" : "text-[#626a66]"}`}>{inspectorSaveStatusLabel(saveState)}</p>
      <button className="inline-flex min-h-[38px] items-center gap-2 rounded-[4px] border border-[#c7a09a] px-3 text-[12px] text-[#8d332a] hover:bg-[#f8eeeb] disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onDelete} type="button"><Trash2 aria-hidden="true" size={14} />Delete connection</button>
    </div>
  </section>;
}

function inspectorSaveStatusLabel(state: CanvasSaveState) { return { loading: "Loading…", saved: "Saved automatically", unsaved: "Unsaved changes", saving: "Saving…", conflict: "Save conflict", error: "Couldn’t save", offline: "Offline — draft kept locally" }[state]; }
