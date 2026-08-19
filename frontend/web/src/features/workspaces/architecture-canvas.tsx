"use client";

import "@xyflow/react/dist/style.css";
import { Background, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, useReactFlow, useViewport, type Connection, type Edge, type NodeChange, type NodeProps, type Viewport } from "@xyflow/react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Boxes, Copy, Database, GitBranch, Globe, Hand, HardDrive, KeyRound, Layers3, Lock, Maximize2, Minimize2, MousePointer2, Network, Plus, Radio, Redo2, Route, Scale, Scan, ScrollText, Server, ShieldCheck, SquareDashed, Trash2, Undo2, Waypoints, Workflow, Zap } from "lucide-react";
import { createElement, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { ApiRequestError, type ArchitectureComponentCategory, type ArchitectureComponentType, type ArchitectureDocument } from "@/lib/api/authenticated-client";
import { useAuthenticatedApiClient } from "@/lib/api/authenticated-client";
import { buildFlowLayout, componentDefaults, useArchitectureEditorStore, type BoundaryFlowNode, type CanvasBoundary, type CanvasEdge, type CanvasEdgeData, type CanvasNode, type CanvasNodeData } from "./architecture-editor-store";

type PaletteItem = { label: string; category: ArchitectureComponentCategory; type: ArchitectureComponentType; icon: typeof Server };
type PaletteGroup = { label: string; items: PaletteItem[] };
type CanvasTool = "select" | "pan" | "component" | "connection" | "boundary";

const paletteGroups: PaletteGroup[] = [
  { label: "Compute & runtime", items: [
    { label: "Service", category: "COMPUTE", type: "SERVICE", icon: Server },
    { label: "Function", category: "COMPUTE", type: "FUNCTION", icon: Boxes },
    { label: "Batch job", category: "COMPUTE", type: "BATCH_JOB", icon: Workflow },
  ] },
  { label: "Data stores", items: [
    { label: "Relational database", category: "DATA_STORE", type: "RELATIONAL_DATABASE", icon: Database },
    { label: "Document database", category: "DATA_STORE", type: "DOCUMENT_DATABASE", icon: Database },
    { label: "Cache", category: "DATA_STORE", type: "CACHE", icon: Zap },
    { label: "Object store", category: "DATA_STORE", type: "OBJECT_STORE", icon: HardDrive },
  ] },
  { label: "Messaging & streaming", items: [
    { label: "Queue", category: "MESSAGING", type: "QUEUE", icon: Waypoints },
    { label: "Stream", category: "MESSAGING", type: "STREAM", icon: Radio },
  ] },
  { label: "Edge & security", items: [
    { label: "API gateway", category: "EDGE_SECURITY", type: "GATEWAY", icon: Network },
    { label: "Load balancer", category: "EDGE_SECURITY", type: "LOAD_BALANCER", icon: Scale },
    { label: "WAF", category: "EDGE_SECURITY", type: "WAF", icon: ShieldCheck },
    { label: "External API", category: "EDGE_SECURITY", type: "EXTERNAL_API", icon: Globe },
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

const canvasTools: Array<{ id: CanvasTool; label: string; icon: typeof MousePointer2 }> = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "pan", label: "Pan", icon: Hand },
  { id: "component", label: "Component", icon: Plus },
  { id: "connection", label: "Connection", icon: GitBranch },
  { id: "boundary", label: "Boundary", icon: SquareDashed },
];

function iconForType(type: ArchitectureComponentType) {
  for (const group of paletteGroups) {
    const item = group.items.find((candidate) => candidate.type === type);
    if (item) return item.icon;
  }
  return Layers3;
}

const semanticIconOptions = ["component", "service", "database", "cache", "queue", "gateway", "storage", "identity", "external"];

function iconForSemantic(value: string | undefined) {
  switch (value) {
    case "service": return Server;
    case "database": return Database;
    case "cache": return Zap;
    case "queue": return Waypoints;
    case "gateway": return Network;
    case "storage": return HardDrive;
    case "identity": return KeyRound;
    case "external": return Globe;
    default: return Layers3;
  }
}

function nodeMeta(data: CanvasNodeData): string {
  const key = { COMPUTE: "runtime", DATA_STORE: "consistency", MESSAGING: "deliveryGuarantee", EDGE_SECURITY: "exposure", IDENTITY_SECRETS: "responsibility", OBSERVABILITY: "signal", CUSTOM: "provider" }[data.category];
  const value = key ? String(data.properties[key] ?? "") : "";
  return value ? value.replaceAll("_", " ").toLowerCase() : "";
}

const connectionIntents = ["REQUEST_RESPONSE", "DNS_RESOLUTION", "DATA_READ_WRITE", "EVENT_PUBLISH", "EVENT_CONSUME", "QUEUE_DELIVERY", "STREAM", "REPLICATION", "AUTHENTICATION", "FILE_OBJECT_TRANSFER"];
const protocols = ["", "HTTP", "HTTPS", "GRPC", "TCP", "UDP", "AMQP", "KAFKA", "SQL", "REDIS", "DNS", "S3"];
const guarantees = ["", "BEST_EFFORT", "AT_MOST_ONCE", "AT_LEAST_ONCE", "EXACTLY_ONCE", "STRONG", "EVENTUAL"];
const boundaryTypes: CanvasBoundary["type"][] = ["DEPLOYMENT", "NETWORK", "REGION", "AVAILABILITY", "TRUST"];

const nodeTypes = { component: ArchitectureNode, boundary: BoundaryNode };

const componentDragMime = "application/sdc-component";

function dragComponentData(event: React.DragEvent<HTMLElement>, item: PaletteItem) {
  event.dataTransfer.setData(componentDragMime, JSON.stringify({ category: item.category, type: item.type, label: item.label }));
  event.dataTransfer.effectAllowed = "move";
}

export function ArchitectureCanvas({ workspaceId, readOnly = false, viewport, onViewportChange, onFullScreenChange }: { workspaceId: string; readOnly?: boolean; viewport?: Viewport; onViewportChange?: (viewport: Viewport) => void; onFullScreenChange?: (fullScreen: boolean) => void }) {
  return <ReactFlowProvider><ArchitectureCanvasInner onFullScreenChange={onFullScreenChange} onViewportChange={onViewportChange} readOnly={readOnly} viewport={viewport} workspaceId={workspaceId} /></ReactFlowProvider>;
}

function ArchitectureCanvasInner({ workspaceId, readOnly, viewport, onViewportChange, onFullScreenChange }: { workspaceId: string; readOnly: boolean; viewport?: Viewport; onViewportChange?: (viewport: Viewport) => void; onFullScreenChange?: (fullScreen: boolean) => void }) {
  const api = useAuthenticatedApiClient();
  const { screenToFlowPosition, fitView } = useReactFlow();
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
  const initialize = useArchitectureEditorStore((state) => state.initialize);
  const applyNodes = useArchitectureEditorStore((state) => state.applyNodes);
  const setEdges = useArchitectureEditorStore((state) => state.setEdges);
  const addConnection = useArchitectureEditorStore((state) => state.addConnection);
  const addBoundary = useArchitectureEditorStore((state) => state.addBoundary);
  const updateBoundary = useArchitectureEditorStore((state) => state.updateBoundary);
  const deleteBoundary = useArchitectureEditorStore((state) => state.deleteBoundary);
  const addComponent = useArchitectureEditorStore((state) => state.addComponent);
  const deleteSelected = useArchitectureEditorStore((state) => state.deleteSelected);
  const selectNode = useArchitectureEditorStore((state) => state.selectNode);
  const selectEdge = useArchitectureEditorStore((state) => state.selectEdge);
  const selectedEdgeId = useArchitectureEditorStore((state) => state.selectedEdgeId);
  const deleteConnection = useArchitectureEditorStore((state) => state.deleteConnection);
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
  const [activeTool, setActiveTool] = useState<CanvasTool>("select");
  const [dragDepth, setDragDepth] = useState(0);
  const [customForm, setCustomForm] = useState<{ label: string; semanticIcon: string; provider: string }>({ label: "", semanticIcon: "component", provider: "" });
  const [connectionForm, setConnectionForm] = useState({ source: "", target: "", intent: "REQUEST_RESPONSE", protocol: "", guarantee: "", notes: "" });
  const [boundaryForm, setBoundaryForm] = useState<{ label: string; type: CanvasBoundary["type"]; parentBoundaryId: string }>({ label: "", type: "DEPLOYMENT", parentBoundaryId: "" });
  const [fullScreen, setFullScreen] = useState(false);
  const flowRef = useRef<HTMLDivElement | null>(null);
  const connectionsFormRef = useRef<HTMLDetailsElement | null>(null);
  const boundariesFormRef = useRef<HTMLDetailsElement | null>(null);
  const connectionSourceRef = useRef<HTMLSelectElement | null>(null);
  const boundaryLabelRef = useRef<HTMLInputElement | null>(null);
  const online = useSyncExternalStore((onChange) => { window.addEventListener("online", onChange); window.addEventListener("offline", onChange); return () => { window.removeEventListener("online", onChange); window.removeEventListener("offline", onChange); }; }, () => navigator.onLine, () => true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);

  const setFullScreenMode = useCallback((next: boolean) => {
    setFullScreen(next);
    onFullScreenChange?.(next);
  }, [onFullScreenChange]);

  useEffect(() => {
    if (!fullScreen) return;
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setFullScreenMode(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [fullScreen, setFullScreenMode]);

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
      markSaved(response.version, response.document);
      setSaveState("saved");
      setConflictSnapshot(null);
      return true;
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        setSaveState("conflict");
        setSaveError("This document changed in another session. Your local draft is preserved.");
        const nextVersion = error.details?.currentVersion;
        const nextDocument = error.details?.currentDocument;
        if (typeof nextVersion === "number" && nextDocument && typeof nextDocument === "object") setConflictSnapshot({ version: nextVersion, document: nextDocument as ArchitectureDocument });
      } else {
        setSaveState("error");
        setSaveError("We could not save the canvas. Your local draft is preserved.");
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

  function connect(connection: Connection) {
    if (readOnly) return;
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    const edge: Edge = { id: `connection-${typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`}`, source: connection.source, target: connection.target, label: "REQUEST RESPONSE", markerEnd: { type: MarkerType.ArrowClosed }, data: { intent: "REQUEST_RESPONSE" } };
    setEdges([...useArchitectureEditorStore.getState().edges, edge]);
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
      const payload = JSON.parse(raw) as { category: ArchitectureComponentCategory; type: ArchitectureComponentType; label: string };
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addComponent(payload.category, payload.type, { label: payload.label, position });
    } catch {
      return;
    }
  }

  function selectTool(tool: CanvasTool) {
    if (readOnly && tool !== "select" && tool !== "pan") return;
    setActiveTool(tool);
    if (tool === "connection") {
      connectionsFormRef.current?.setAttribute("open", "");
      requestAnimationFrame(() => connectionSourceRef.current?.focus());
    } else if (tool === "boundary") {
      boundariesFormRef.current?.setAttribute("open", "");
      requestAnimationFrame(() => boundaryLabelRef.current?.focus());
    }
  }

  function handlePaneClick(event: React.MouseEvent) {
    if (activeTool === "component" && !readOnly) {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addComponent("COMPUTE", "SERVICE", { label: "Service", position });
      return;
    }
    if (activeTool === "connection" && !readOnly) {
      connectionsFormRef.current?.setAttribute("open", "");
    } else if (activeTool === "boundary" && !readOnly) {
      boundariesFormRef.current?.setAttribute("open", "");
    }
    selectNode(null);
  }

  function submitConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = addConnection(connectionForm);
    if (!result.ok) {
      setConnectionMessage(result.message);
      return;
    }
    setConnectionMessage("Connection added. It will autosave with the document.");
    setConnectionForm((current) => ({ ...current, notes: "" }));
  }

  function submitBoundary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!boundaryForm.label.trim()) return;
    addBoundary({ label: boundaryForm.label.trim(), type: boundaryForm.type, parentBoundaryId: boundaryForm.parentBoundaryId || undefined, componentIds: [] });
    setBoundaryForm((current) => ({ ...current, label: "" }));
  }

  function submitCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customForm.label.trim()) return;
    const properties: Record<string, string> = { semanticIcon: customForm.semanticIcon };
    if (customForm.provider.trim()) properties.provider = customForm.provider.trim();
    addComponent("CUSTOM", "CUSTOM_COMPONENT", { label: customForm.label.trim(), properties, position: canvasCenterPosition() });
    setCustomForm({ label: "", semanticIcon: "component", provider: "" });
  }

  const filteredGroups = paletteSearch.trim()
    ? paletteGroups.map((group) => ({ ...group, items: group.items.filter((item) => `${item.label} ${item.type}`.toLowerCase().includes(paletteSearch.trim().toLowerCase())) })).filter((group) => group.items.length > 0)
    : paletteGroups;
  const layout = useMemo(() => buildFlowLayout(nodes, boundaries), [nodes, boundaries]);
  function handleNodesChange(changes: NodeChange<CanvasNode>[]) {
    if (readOnly) return;
    const converted = changes.map((change) => change.type === "position" && change.position ? { ...change, position: { x: change.position.x + (layout.parentOrigins.get(change.id)?.x ?? 0), y: change.position.y + (layout.parentOrigins.get(change.id)?.y ?? 0) } } : change);
    applyNodes(converted);
  }
  const visibleSaveState = !online ? "offline" : initializedWorkspace === workspaceId && saveState === "loading" ? "saved" : saveState;
  const statusLabel = { loading: "Loading", saved: "Saved", unsaved: "Unsaved changes", saving: "Saving…", conflict: "Conflict", error: "Save failed", offline: "Offline" }[visibleSaveState];
  const isDraggingOver = dragDepth > 0;
  const legendHint = isDraggingOver
    ? "DRAGGING · DROP ON CANVAS TO PLACE"
    : activeTool === "connection"
      ? "CLICK A SOURCE HANDLE · THEN A TARGET HANDLE TO CONNECT"
      : activeTool === "component"
        ? "CLICK THE CANVAS TO PLACE A SERVICE"
        : activeTool === "boundary"
          ? "ADD A BOUNDARY FROM THE PALETTE"
          : "SELECT A COMPONENT OR CONNECTION TO INSPECT IT";

  if (query.isLoading) return <section aria-label="Architecture canvas" className="border border-[#2b3337] bg-[#0d1211] p-8 text-sm text-[#a7aeb3]">Loading Architecture Document…</section>;
  if (query.isError || !document) return <section aria-label="Architecture canvas" className="border border-[#2b3337] bg-[#0d1211] p-8 text-sm text-[#ff9a8b]" role="alert">We could not load the Architecture Canvas. Try again.</section>;

  return <section aria-label="Architecture canvas" className={`${fullScreen ? "flex h-full flex-col bg-[#101316] text-[#f2f3f3]" : "overflow-hidden border border-[#2b3337] bg-[#101316] text-[#f2f3f3]"}`} onKeyDown={(event) => { if (event.key === "Delete" || event.key === "Backspace") { if (selectedNodeId) { event.preventDefault(); deleteSelected(); } else if (selectedEdgeId) { event.preventDefault(); deleteConnection(selectedEdgeId); } } }} tabIndex={0}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2b3337] bg-[#151c1a] px-3 py-2">
      <div aria-label="Canvas tools" className="flex flex-wrap items-center gap-0.5" role="toolbar">{canvasTools.map(({ id, label, icon: Icon }) => <button aria-pressed={activeTool === id} className={`inline-flex min-h-8 items-center gap-1.5 border px-2.5 text-[10px] font-medium ${activeTool === id ? "border-[#29413c] bg-[#29413c] text-[#f0f3f1]" : "border-transparent text-[#a7aeb3] hover:text-[#f0f3f1]"} disabled:cursor-not-allowed disabled:opacity-40`} disabled={readOnly && id !== "select" && id !== "pan"} key={id} onClick={() => selectTool(id)} type="button"><Icon aria-hidden="true" size={13} />{label}</button>)}</div>
      <div aria-label="Canvas view controls" className="flex items-center gap-0.5">{[
        { key: "undo", label: "Undo", disabled: !canUndo, onClick: () => undo(), icon: Undo2 },
        { key: "redo", label: "Redo", disabled: !canRedo, onClick: () => redo(), icon: Redo2 },
        { key: "fit", label: "Fit view", disabled: false, onClick: () => fitView({ padding: 0.15, duration: 200 }), icon: Scan },
        { key: "fullscreen", label: fullScreen ? "Exit full screen" : "Expand canvas", disabled: false, onClick: () => setFullScreenMode(!fullScreen), icon: fullScreen ? Minimize2 : Maximize2 },
      ].map(({ key, label, disabled, onClick, icon: Icon }) => <button aria-label={label} className="inline-flex size-8 items-center justify-center text-[#a7aeb3] hover:bg-[#202624] hover:text-[#f0f3f1] disabled:cursor-not-allowed disabled:opacity-40" disabled={disabled} key={key} onClick={onClick} title={label} type="button"><Icon aria-hidden="true" size={14} /></button>)}<span aria-label="Canvas zoom" className="ml-1 min-w-10 text-right font-mono text-[9px] text-[#a7aeb3]">{Math.round(viewportState.zoom * 100)}%</span></div>
    </div>
    {saveError ? <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#6d3d37] bg-[#321d1a] px-4 py-3 text-xs text-[#ffb4a8]" role="alert"><span>{saveError}</span><button className="border border-[#ff9a8b] px-2 py-1 font-semibold text-[#ffb4a8]" onClick={() => { const current = useArchitectureEditorStore.getState(); const serverVersion = conflictSnapshot?.version ?? query.data?.version ?? current.version; const serverDocument = conflictSnapshot?.document ?? query.data?.document ?? current.document; replaceFromServer(serverVersion, serverDocument as ArchitectureDocument); setSaveState("saved"); setSaveError(null); setConflictSnapshot(null); }} type="button">Use server version</button></div> : null}
    {revisionMessage ? <p className="border-b border-[#2b3337] px-4 py-2 text-xs text-[#a9e5d8]" role="status">{revisionMessage}</p> : null}
    <div className={fullScreen ? "flex min-h-0 flex-1 flex-col lg:flex-row" : "grid min-h-[560px] lg:grid-cols-[156px_minmax(0,1fr)]"}>
      <aside aria-label="Component palette" className={fullScreen ? "w-full shrink-0 overflow-y-auto border-b border-[#2b3337] bg-[#151b1d] p-3 lg:w-[180px] lg:border-b-0 lg:border-r" : "border-b border-[#2b3337] bg-[#151b1d] p-3 lg:border-b-0 lg:border-r"}><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#a7aeb3]">Components</p><input aria-label="Search components" className="mt-2.5 min-h-9 w-full border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3] outline-none focus:border-[#a9e5d8]" disabled={readOnly} onChange={(event) => setPaletteSearch(event.target.value)} placeholder="Search components…" value={paletteSearch} /><div className="mt-3 max-h-[340px] space-y-4 overflow-y-auto pr-1">{filteredGroups.map((group) => <div key={group.label}><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#a7aeb3]">{group.label}</p><div className="mt-1.5 grid gap-1.5">{group.items.map(({ category, icon: Icon, label, type }) => <button className="flex min-h-9 items-center gap-2 border border-[#344047] px-2 text-left text-xs text-[#f2f3f3] hover:border-[#a9e5d8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9e5d8] disabled:cursor-not-allowed disabled:opacity-50" disabled={readOnly} draggable={!readOnly} key={type} onDragStart={(event) => dragComponentData(event, { category, icon: Icon, label, type })} onClick={() => addComponent(category, type, { label, position: canvasCenterPosition() })} type="button"><Icon aria-hidden="true" size={14} /><span className="truncate">{label}</span><Plus aria-hidden="true" className="ml-auto shrink-0 text-[#a7aeb3]" size={13} /></button>)}</div></div>)}{filteredGroups.length === 0 ? <p className="text-[11px] text-[#a7aeb3]">No components match “{paletteSearch}”.</p> : null}</div><details className="mt-4 border-t border-[#2b3337] pt-3"><summary className="cursor-pointer text-xs font-semibold text-[#f2f3f3]">Add Custom Component</summary><form className="mt-3 grid gap-2" onSubmit={submitCustom}><label className="text-[11px] text-[#a7aeb3]" htmlFor="custom-label">Label</label><input className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="custom-label" onChange={(event) => setCustomForm((current) => ({ ...current, label: event.target.value }))} placeholder="e.g. Payment provider" required value={customForm.label} /><label className="text-[11px] text-[#a7aeb3]" htmlFor="custom-icon">Semantic icon</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="custom-icon" onChange={(event) => setCustomForm((current) => ({ ...current, semanticIcon: event.target.value }))} value={customForm.semanticIcon}>{semanticIconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select><label className="text-[11px] text-[#a7aeb3]" htmlFor="custom-provider">Provider (optional)</label><input className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="custom-provider" onChange={(event) => setCustomForm((current) => ({ ...current, provider: event.target.value }))} placeholder="e.g. AWS, Stripe" value={customForm.provider} /><button className="min-h-9 border border-[#a9e5d8] text-xs font-semibold text-[#a9e5d8] disabled:cursor-not-allowed disabled:opacity-50" disabled={readOnly} type="submit">Add Custom Component</button></form></details><p className="mt-5 text-[11px] leading-5 text-[#a7aeb3]">{readOnly ? "This Workspace is archived. Restore it before editing." : "Search or click a type to place a node. Drag a Component to the Canvas. Select a node or connection to inspect it."}</p><details className="mt-6 border-t border-[#2b3337] pt-4" ref={connectionsFormRef}><summary className="cursor-pointer text-xs font-semibold text-[#f2f3f3]">Add Connection without dragging</summary><form className="mt-3 grid gap-2" onSubmit={submitConnection}><label className="text-[11px] text-[#a7aeb3]" htmlFor="connection-source">Source</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-source" onChange={(event) => setConnectionForm((current) => ({ ...current, source: event.target.value }))} ref={connectionSourceRef} required value={connectionForm.source}><option value="">Choose Component</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select><label className="text-[11px] text-[#a7aeb3]" htmlFor="connection-target">Target</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-target" onChange={(event) => setConnectionForm((current) => ({ ...current, target: event.target.value }))} required value={connectionForm.target}><option value="">Choose Component</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select><label className="text-[11px] text-[#a7aeb3]" htmlFor="connection-intent">Intent</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-intent" onChange={(event) => setConnectionForm((current) => ({ ...current, intent: event.target.value }))} value={connectionForm.intent}>{connectionIntents.map((intent) => <option key={intent} value={intent}>{intent.replaceAll("_", " ")}</option>)}</select><label className="text-[11px] text-[#a7aeb3]" htmlFor="connection-protocol">Protocol</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-protocol" onChange={(event) => setConnectionForm((current) => ({ ...current, protocol: event.target.value }))} value={connectionForm.protocol}>{protocols.map((protocol) => <option key={protocol} value={protocol}>{protocol || "Not specified"}</option>)}</select><label className="text-[11px] text-[#a7aeb3]" htmlFor="connection-guarantee">Guarantee</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-guarantee" onChange={(event) => setConnectionForm((current) => ({ ...current, guarantee: event.target.value }))} value={connectionForm.guarantee}>{guarantees.map((guarantee) => <option key={guarantee} value={guarantee}>{guarantee || "Not specified"}</option>)}</select><label className="text-[11px] text-[#a7aeb3]" htmlFor="connection-notes">Notes</label><textarea className="min-h-16 border border-[#3c4542] bg-[#101316] px-2 py-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-notes" maxLength={1000} onChange={(event) => setConnectionForm((current) => ({ ...current, notes: event.target.value }))} value={connectionForm.notes} /><button className="min-h-9 border border-[#a9e5d8] text-xs font-semibold text-[#a9e5d8] disabled:cursor-not-allowed disabled:opacity-50" disabled={readOnly || nodes.length < 2} type="submit">Add Connection</button>{connectionMessage ? <p className="text-[11px] leading-4 text-[#a9e5d8]" role="status">{connectionMessage}</p> : null}</form></details><details className="mt-5 border-t border-[#2b3337] pt-4" ref={boundariesFormRef}><summary className="cursor-pointer text-xs font-semibold text-[#f2f3f3]">Boundaries</summary><form className="mt-3 grid gap-2" onSubmit={submitBoundary}><label className="text-[11px] text-[#a7aeb3]" htmlFor="boundary-label">Label</label><input className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="boundary-label" onChange={(event) => setBoundaryForm((current) => ({ ...current, label: event.target.value }))} placeholder="e.g. Primary region" ref={boundaryLabelRef} required value={boundaryForm.label} /><label className="text-[11px] text-[#a7aeb3]" htmlFor="boundary-type">Type</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="boundary-type" onChange={(event) => setBoundaryForm((current) => ({ ...current, type: event.target.value as CanvasBoundary["type"] }))} value={boundaryForm.type}>{boundaryTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><label className="text-[11px] text-[#a7aeb3]" htmlFor="boundary-parent">Parent boundary</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="boundary-parent" onChange={(event) => setBoundaryForm((current) => ({ ...current, parentBoundaryId: event.target.value }))} value={boundaryForm.parentBoundaryId}><option value="">No parent</option>{boundaries.map((boundary) => <option key={boundary.id} value={boundary.id}>{boundary.label}</option>)}</select><button className="min-h-9 border border-[#a9e5d8] text-xs font-semibold text-[#a9e5d8] disabled:cursor-not-allowed disabled:opacity-50" disabled={readOnly} type="submit">Add Boundary</button></form><div className="mt-3 grid gap-2">{boundaries.map((boundary) => <BoundaryRow boundary={boundary} boundaries={boundaries} disabled={readOnly} key={boundary.id} nodes={nodes} onDelete={() => deleteBoundary(boundary.id)} onUpdate={(patch) => updateBoundary(boundary.id, patch)} />)}</div></details></aside>
      <div className={fullScreen ? "relative min-h-0 flex-1 bg-[#101316]" : "relative h-[570px] bg-[#101316]"} data-testid="architecture-flow" onDragEnter={(event) => { if (!readOnly && Array.from(event.dataTransfer.types).includes(componentDragMime)) setDragDepth((depth) => depth + 1); }} onDragLeave={() => setDragDepth((depth) => Math.max(0, depth - 1))} onDragOver={onFlowDragOver} onDrop={onFlowDrop} ref={flowRef}><ReactFlow connectOnClick={!readOnly && activeTool === "connection"} defaultViewport={viewport} fitView={!viewport} nodeTypes={nodeTypes} nodes={layout.flowNodes as unknown as CanvasNode[]} edges={edges.map((edge) => ({ ...edge, selected: edge.id === selectedEdgeId }))} nodesConnectable={!readOnly} nodesDraggable={!readOnly && activeTool === "select"} onConnect={connect} onEdgeClick={(_, edge) => selectEdge(edge.id)} onMoveEnd={(_, nextViewport) => onViewportChange?.(nextViewport)} onNodeClick={(_, node) => { if (node.type === "component") selectNode(node.id); }} onNodesChange={readOnly ? undefined : handleNodesChange} onPaneClick={handlePaneClick} panOnDrag={activeTool === "select" || activeTool === "pan"} proOptions={{ hideAttribution: true }}><Background color="#202a2d" gap={28} size={1} /></ReactFlow>
        {nodes.length === 0 ? <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4"><div className="pointer-events-auto w-[520px] max-w-full border border-[#2b3337] bg-[#151c1a] p-7 text-center"><div aria-hidden="true" className="mx-auto flex size-[46px] items-center justify-center bg-[#203633]"><Network className="text-[#0f766e]" size={22} /></div><p className="mt-4 font-display text-[22px] font-normal text-[#f0f3f1]">No architecture Components yet.</p><p className="mt-2 text-[13px] leading-5 text-[#a7aeb3]">Drag a Component from the palette, press Enter on a palette item, or use the Component tool to start describing the system.</p><button className="mt-5 inline-flex min-h-10 items-center gap-2 border border-[#a9e5d8] bg-[#0f766e] px-4 text-xs font-semibold text-[#f0f3f1]" onClick={() => addComponent("COMPUTE", "SERVICE", { label: "Service", position: canvasCenterPosition() })} type="button"><Plus aria-hidden="true" size={14} />Add Component</button></div></div> : null}
        <div className="absolute inset-x-0 bottom-0 z-10 flex h-8 items-center justify-between border-t border-[#2b3337] bg-[#151c1a] px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#a7aeb3]" aria-label="Canvas interaction legend"><span>{legendHint}</span><span className="hidden sm:inline">ESC · DELETE · ENTER TO PLACE</span></div>
      </div>
    </div>
    <div className="flex min-h-9 flex-wrap items-center justify-between gap-3 border-t border-[#2b3337] bg-[#101316] px-4 py-2 font-mono text-[10px] text-[#a7aeb3]"><span>{nodes.length} COMPONENT{nodes.length === 1 ? "" : "S"} · {edges.length} CONNECTION{edges.length === 1 ? "" : "S"} · {boundaries.length} BOUNDARY{boundaries.length === 1 ? "" : "IES"} · VIEW {Math.round(viewportState.zoom * 100)}%</span><div className="flex items-center gap-3"><span aria-live="polite" className={`flex items-center gap-1.5 ${visibleSaveState === "conflict" || visibleSaveState === "error" ? "text-[#ff9a8b]" : visibleSaveState === "saved" || visibleSaveState === "loading" ? "text-[#a9aeb3]" : "text-[#a9e5d8]"}`} role="status">{statusLabel}</span><button className="border border-[#3c4542] px-2.5 py-1 text-[10px] font-semibold text-[#f2f3f3] hover:border-[#a9e5d8]" onClick={() => void createRevision()} type="button">Checkpoint Revision</button></div></div>
  </section>;
}

function ArchitectureNode({ data, selected }: NodeProps<CanvasNode>) {
  const icon = data.type === "CUSTOM_COMPONENT" ? iconForSemantic(String(data.properties.semanticIcon)) : iconForType(data.type);
  const meta = nodeMeta(data);
  return <div className={`min-w-[150px] border bg-[#1b2421] px-3 py-2.5 shadow-none ${selected ? "border-[#a9e5d8]" : "border-[#3c4542]"}`}><Handle className="!h-2 !w-2 !border-0 !bg-[#0d1211]" position={Position.Left} type="target" /><div className="flex items-center gap-2"><span aria-hidden="true" className="flex size-[26px] shrink-0 items-center justify-center bg-[#242e2b]">{createElement(icon, { className: "text-[#a9e5d8]", size: 14 })}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#f2f3f3]">{data.label}</p>{meta ? <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#a7aeb3]">{meta}</p> : null}</div></div><Handle className="!h-2 !w-2 !border-0 !bg-[#0d1211]" position={Position.Right} type="source" /></div>;
}

function BoundaryNode({ data }: NodeProps<BoundaryFlowNode>) {
  return <div className="relative h-full w-full rounded-[4px] border border-dashed border-[#3f5a55] bg-[#12211f]/40"><span className="absolute left-2.5 top-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#7fb8ab]">{data.boundaryType.replaceAll("_", " ")} · {data.label}</span></div>;
}

function BoundaryRow({ boundary, boundaries, disabled, nodes, onDelete, onUpdate }: { boundary: CanvasBoundary; boundaries: CanvasBoundary[]; disabled: boolean; nodes: CanvasNode[]; onDelete: () => void; onUpdate: (patch: Partial<Omit<CanvasBoundary, "id">>) => void }) {
  return <div className="border border-[#344047] p-2"><input aria-label={`Boundary label ${boundary.id}`} className="min-h-8 w-full border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={disabled} onChange={(event) => onUpdate({ label: event.target.value })} value={boundary.label} /><select aria-label={`Parent boundary ${boundary.id}`} className="mt-2 min-h-8 w-full border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={disabled} onChange={(event) => onUpdate({ parentBoundaryId: event.target.value || undefined })} value={boundary.parentBoundaryId ?? ""}><option value="">No parent</option>{boundaries.filter((candidate) => candidate.id !== boundary.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}</select><label className="mt-2 block text-[10px] text-[#a7aeb3]" htmlFor={`boundary-components-${boundary.id}`}>Components in boundary</label><select aria-label={`Components in boundary ${boundary.id}`} className="mt-1 min-h-16 w-full border border-[#3c4542] bg-[#101316] px-2 py-1 text-xs text-[#f2f3f3]" disabled={disabled} id={`boundary-components-${boundary.id}`} multiple onChange={(event) => onUpdate({ componentIds: Array.from(event.target.selectedOptions, (option) => option.value) })} value={boundary.componentIds}>{nodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select><button className="mt-2 text-[11px] text-[#ffb4a8] hover:underline disabled:opacity-50" disabled={disabled} onClick={onDelete} type="button">Delete boundary</button></div>;
}

const propertyFields: Record<ArchitectureComponentCategory, string[]> = {
  COMPUTE: ["responsibility", "stateModel", "scalingSignal", "concurrencyNotes", "capacityNotes"],
  DATA_STORE: ["dataModel", "accessPatterns", "partitioning", "replication", "retention", "recoveryNotes"],
  MESSAGING: ["ordering", "retryPolicy", "deadLetterPolicy", "retention", "consumerBehavior", "replayNotes"],
  EDGE_SECURITY: ["routing", "tlsNotes", "caching", "rateLimitIntent", "authBoundary", "trustScope"],
  IDENTITY_SECRETS: ["authorizationModel", "trustLifecycle", "redactionNotes"],
  OBSERVABILITY: ["slo", "alerting", "retention", "redactionNotes"],
  CUSTOM: ["provider", "metadataNotes"],
};

export function ArchitectureInspector({ disabled, node, onChange, onDelete, onDuplicate }: { disabled: boolean; node: CanvasNode; onChange: (patch: Partial<CanvasNodeData>) => void; onDelete: () => void; onDuplicate: () => void }) {
  const propertyKey = { COMPUTE: "runtime", DATA_STORE: "consistency", MESSAGING: "deliveryGuarantee", EDGE_SECURITY: "exposure", IDENTITY_SECRETS: "responsibility", OBSERVABILITY: "signal", CUSTOM: "semanticIcon" }[node.data.category];
  const propertyOptions = { runtime: ["JAVA", "NODE_JS", "PYTHON", "GO", "OTHER"], consistency: ["STRONG", "EVENTUAL", "CAUSAL"], deliveryGuarantee: ["AT_MOST_ONCE", "AT_LEAST_ONCE", "EXACTLY_ONCE"], exposure: ["PUBLIC", "PRIVATE", "INTERNAL"], responsibility: ["IDENTITY", "SECRETS"], signal: ["LOGS", "METRICS", "TRACES"], semanticIcon: ["component", "service", "database", "queue", "gateway"] }[propertyKey];
  const options = propertyOptions ?? [];
  return <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a7aeb3]">Component Inspector</p><label className="mt-5 block text-xs text-[#a7aeb3]" htmlFor="component-label">Label</label><input className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-label" onChange={(event) => onChange({ label: event.target.value })} value={node.data.label} /><label className="mt-4 block text-xs text-[#a7aeb3]" htmlFor="component-category">Category</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-category" onChange={(event) => { const category = event.target.value as ArchitectureComponentCategory; onChange({ category, properties: componentDefaults[category] }); }} value={node.data.category}><option value="COMPUTE">Compute</option><option value="DATA_STORE">Data store</option><option value="MESSAGING">Messaging</option><option value="EDGE_SECURITY">Edge / security</option><option value="IDENTITY_SECRETS">Identity / secrets</option><option value="OBSERVABILITY">Observability</option><option value="CUSTOM">Custom</option></select><label className="mt-4 block text-xs text-[#a7aeb3]" htmlFor="component-type">Type</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-type" onChange={(event) => onChange({ type: event.target.value as ArchitectureComponentType })} value={node.data.type}><option value="SERVICE">Service</option><option value="FUNCTION">Function</option><option value="BATCH_JOB">Batch job</option><option value="RELATIONAL_DATABASE">Relational database</option><option value="DOCUMENT_DATABASE">Document database</option><option value="CACHE">Cache</option><option value="OBJECT_STORE">Object store</option><option value="QUEUE">Queue</option><option value="STREAM">Stream</option><option value="GATEWAY">API gateway</option><option value="LOAD_BALANCER">Load balancer</option><option value="WAF">WAF</option><option value="IDENTITY_PROVIDER">Identity provider</option><option value="SECRETS_MANAGER">Secrets manager</option><option value="LOGGING">Logging</option><option value="METRICS">Metrics</option><option value="TRACING">Tracing</option><option value="EXTERNAL_API">External API</option><option value="CUSTOM_COMPONENT">Custom Component</option></select><label className="mt-4 block text-xs text-[#a7aeb3]" htmlFor="component-property">{propertyKey.replace(/([A-Z])/g, " $1")}</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-property" onChange={(event) => onChange({ properties: { ...node.data.properties, [propertyKey]: event.target.value } })} value={String(node.data.properties[propertyKey] ?? options[0])}>{options.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select>{propertyFields[node.data.category].map((field) => <label className="mt-4 block text-xs text-[#a7aeb3]" key={field}>{field.replace(/([A-Z])/g, " $1")}<textarea className="mt-2 min-h-14 w-full border border-[#3c4542] bg-[#101316] px-2 py-2 text-xs text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} maxLength={500} onChange={(event) => onChange({ properties: { ...node.data.properties, [field]: event.target.value } })} value={String(node.data.properties[field] ?? "")} /></label>)}    <div className="mt-7 flex flex-wrap gap-2"><button className="inline-flex min-h-9 items-center gap-2 border border-[#3c4542] px-3 text-xs font-semibold text-[#f2f3f3] hover:border-[#a9e5d8] disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onDuplicate} type="button"><Copy aria-hidden="true" size={14} />Duplicate</button><button className="inline-flex min-h-9 items-center gap-2 border border-[#ff9a8b] px-3 text-xs font-semibold text-[#ffb4a8] hover:bg-[#321d1a] disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onDelete} type="button"><Trash2 aria-hidden="true" size={14} />Delete Component</button></div></div>;
}

export function ConnectionInspector({ disabled, edge, sourceLabel, targetLabel, onChange, onDelete }: { disabled: boolean; edge: CanvasEdge; sourceLabel: string; targetLabel: string; onChange: (patch: Partial<CanvasEdgeData>) => void; onDelete: () => void }) {
  const data = edge.data ?? { intent: "REQUEST_RESPONSE" };
  return <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a7aeb3]">Connection Inspector</p><dl className="mt-5 grid gap-2 border-y border-line py-3 text-[12px]"><div className="flex justify-between gap-3"><dt className="text-text-muted">From</dt><dd className="text-right text-foreground">{sourceLabel}</dd></div><div className="flex justify-between gap-3"><dt className="text-text-muted">To</dt><dd className="text-right text-foreground">{targetLabel}</dd></div></dl><label className="mt-4 block text-xs text-text-muted" htmlFor="connection-intent">Intent</label><select className="mt-2 min-h-10 w-full border border-line bg-background px-2 text-sm text-foreground outline-none focus:border-signal disabled:opacity-50" disabled={disabled} id="connection-intent" onChange={(event) => onChange({ intent: event.target.value })} value={data.intent}>{connectionIntents.map((intent) => <option key={intent} value={intent}>{intent.replaceAll("_", " ")}</option>)}</select><label className="mt-4 block text-xs text-text-muted" htmlFor="connection-protocol">Protocol</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="connection-protocol" onChange={(event) => onChange({ protocol: event.target.value })} value={data.protocol ?? ""}>{protocols.map((protocol) => <option key={protocol} value={protocol}>{protocol || "Not specified"}</option>)}</select><label className="mt-4 block text-xs text-text-muted" htmlFor="connection-guarantee">Guarantee</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="connection-guarantee" onChange={(event) => onChange({ guarantee: event.target.value })} value={data.guarantee ?? ""}>{guarantees.map((guarantee) => <option key={guarantee} value={guarantee}>{guarantee || "Not specified"}</option>)}</select><label className="mt-4 block text-xs text-text-muted" htmlFor="connection-notes">Notes</label><textarea className="mt-2 min-h-20 w-full border border-line bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-signal disabled:opacity-50" disabled={disabled} id="connection-notes" maxLength={1000} onChange={(event) => onChange({ notes: event.target.value })} value={data.notes ?? ""} /><button className="mt-6 inline-flex min-h-9 items-center gap-2 border border-danger/50 px-3 text-xs font-semibold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onDelete} type="button"><Trash2 aria-hidden="true" size={14} />Delete Connection</button></div>;
}
