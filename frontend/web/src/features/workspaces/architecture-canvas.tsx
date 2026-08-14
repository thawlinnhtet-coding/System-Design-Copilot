"use client";

import "@xyflow/react/dist/style.css";
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, type Connection, type Edge, type NodeProps, type Viewport } from "@xyflow/react";
import { useQuery } from "@tanstack/react-query";
import { Database, Layers3, Network, Plus, Save, Server, Trash2, Waypoints } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { ApiRequestError, type ArchitectureComponentCategory, type ArchitectureComponentType, type ArchitectureDocument } from "@/lib/api/authenticated-client";
import { useAuthenticatedApiClient } from "@/lib/api/authenticated-client";
import { componentDefaults, useArchitectureEditorStore, type CanvasBoundary, type CanvasNode, type CanvasNodeData } from "./architecture-editor-store";

const palette: Array<{ label: string; category: ArchitectureComponentCategory; type: ArchitectureComponentType; icon: typeof Server }> = [
  { label: "Service", category: "COMPUTE", type: "SERVICE", icon: Server },
  { label: "Database", category: "DATA_STORE", type: "RELATIONAL_DATABASE", icon: Database },
  { label: "Queue", category: "MESSAGING", type: "QUEUE", icon: Waypoints },
  { label: "Gateway", category: "EDGE_SECURITY", type: "GATEWAY", icon: Network },
  { label: "Custom", category: "CUSTOM", type: "CUSTOM_COMPONENT", icon: Layers3 },
];

const connectionIntents = ["REQUEST_RESPONSE", "DNS_RESOLUTION", "DATA_READ_WRITE", "EVENT_PUBLISH", "EVENT_CONSUME", "QUEUE_DELIVERY", "STREAM", "REPLICATION", "AUTHENTICATION", "FILE_OBJECT_TRANSFER"];
const protocols = ["", "HTTP", "HTTPS", "GRPC", "TCP", "UDP", "AMQP", "KAFKA", "SQL", "REDIS", "DNS", "S3"];
const guarantees = ["", "BEST_EFFORT", "AT_MOST_ONCE", "AT_LEAST_ONCE", "EXACTLY_ONCE", "STRONG", "EVENTUAL"];
const boundaryTypes: CanvasBoundary["type"][] = ["DEPLOYMENT", "NETWORK", "REGION", "AVAILABILITY", "TRUST"];

const nodeTypes = { component: ArchitectureNode };

export function ArchitectureCanvas({ workspaceId, readOnly = false, viewport, onViewportChange }: { workspaceId: string; readOnly?: boolean; viewport?: Viewport; onViewportChange?: (viewport: Viewport) => void }) {
  return <ReactFlowProvider><ArchitectureCanvasInner onViewportChange={onViewportChange} readOnly={readOnly} viewport={viewport} workspaceId={workspaceId} /></ReactFlowProvider>;
}

function ArchitectureCanvasInner({ workspaceId, readOnly, viewport, onViewportChange }: { workspaceId: string; readOnly: boolean; viewport?: Viewport; onViewportChange?: (viewport: Viewport) => void }) {
  const api = useAuthenticatedApiClient();
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
  const updateComponent = useArchitectureEditorStore((state) => state.updateComponent);
  const addComponent = useArchitectureEditorStore((state) => state.addComponent);
  const deleteSelected = useArchitectureEditorStore((state) => state.deleteSelected);
  const selectNode = useArchitectureEditorStore((state) => state.selectNode);
  const replaceFromServer = useArchitectureEditorStore((state) => state.replaceFromServer);
  const markSaved = useArchitectureEditorStore((state) => state.markSaved);
  const [saveState, setSaveState] = useState<"loading" | "saved" | "unsaved" | "saving" | "conflict" | "error" | "offline">("loading");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflictSnapshot, setConflictSnapshot] = useState<{ version: number; document: ArchitectureDocument } | null>(null);
  const [revisionMessage, setRevisionMessage] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [connectionForm, setConnectionForm] = useState({ source: "", target: "", intent: "REQUEST_RESPONSE", protocol: "", guarantee: "", notes: "" });
  const [boundaryForm, setBoundaryForm] = useState<{ label: string; type: CanvasBoundary["type"]; parentBoundaryId: string }>({ label: "", type: "DEPLOYMENT", parentBoundaryId: "" });
  const online = useSyncExternalStore((onChange) => { window.addEventListener("online", onChange); window.addEventListener("offline", onChange); return () => { window.removeEventListener("online", onChange); window.removeEventListener("offline", onChange); }; }, () => navigator.onLine, () => true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);

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
    const edge: Edge = { id: `connection-${crypto.randomUUID()}`, source: connection.source, target: connection.target, label: "REQUEST RESPONSE", markerEnd: { type: MarkerType.ArrowClosed }, data: { intent: "REQUEST_RESPONSE" } };
    setEdges([...useArchitectureEditorStore.getState().edges, edge]);
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

  const selected = nodes.find((node) => node.id === selectedNodeId);
  const visibleSaveState = !online ? "offline" : initializedWorkspace === workspaceId && saveState === "loading" ? "saved" : saveState;
  const statusLabel = { loading: "Loading", saved: "Saved", unsaved: "Unsaved changes", saving: "Saving…", conflict: "Conflict", error: "Save failed", offline: "Offline" }[visibleSaveState];

  if (query.isLoading) return <section aria-label="Architecture canvas" className="border border-line bg-[#101316] p-8 text-sm text-text-on-dark-secondary">Loading Architecture Document…</section>;
  if (query.isError || !document) return <section aria-label="Architecture canvas" className="border border-danger/40 bg-danger/10 p-8 text-sm text-danger" role="alert">We could not load the Architecture Canvas. Try again.</section>;

  return <section aria-label="Architecture canvas" className="overflow-hidden border border-[#2b3337] bg-[#101316] text-[#f2f3f3]" onKeyDown={(event) => { if ((event.key === "Delete" || event.key === "Backspace") && selectedNodeId) { event.preventDefault(); deleteSelected(); } }} tabIndex={0}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2b3337] px-4 py-3">
      <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a9aeb3]">Architecture Document</p><p className="mt-1 text-sm text-[#f2f3f3]">Build the structure. Explain the trade-offs.</p></div>
      <div className="flex items-center gap-2"><span aria-live="polite" className={`flex items-center gap-1.5 font-mono text-[11px] ${visibleSaveState === "conflict" || visibleSaveState === "error" ? "text-[#ff9a8b]" : "text-[#a9e5d8]"}`} role="status"><Save aria-hidden="true" size={13} />{statusLabel}</span><button className="inline-flex min-h-9 items-center gap-2 border border-[#3c4542] px-3 text-xs font-semibold text-[#f2f3f3] hover:border-[#a9e5d8]" onClick={() => void createRevision()} type="button">Checkpoint Revision</button></div>
    </div>
    {saveError ? <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#6d3d37] bg-[#321d1a] px-4 py-3 text-xs text-[#ffb4a8]" role="alert"><span>{saveError}</span><button className="border border-[#ff9a8b] px-2 py-1 font-semibold text-[#ffb4a8]" onClick={() => { const current = useArchitectureEditorStore.getState(); const serverVersion = conflictSnapshot?.version ?? query.data?.version ?? current.version; const serverDocument = conflictSnapshot?.document ?? query.data?.document ?? current.document; replaceFromServer(serverVersion, serverDocument as ArchitectureDocument); setSaveState("saved"); setSaveError(null); setConflictSnapshot(null); }} type="button">Use server version</button></div> : null}
    {revisionMessage ? <p className="border-b border-[#2b3337] px-4 py-2 text-xs text-[#a9e5d8]" role="status">{revisionMessage}</p> : null}
    <div className="grid min-h-[560px] lg:grid-cols-[180px_minmax(0,1fr)_260px]">
      <aside aria-label="Component palette" className="border-b border-[#2b3337] bg-[#151b1d] p-3 lg:border-b-0 lg:border-r"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a9aeb3]">Add Component</p><div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">{palette.map(({ category, icon: Icon, label, type }) => <button className="flex min-h-11 items-center gap-2 border border-[#344047] px-2 text-left text-xs text-[#f2f3f3] hover:border-[#a9e5d8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9e5d8] disabled:cursor-not-allowed disabled:opacity-50" disabled={readOnly} key={type} onClick={() => addComponent(category, type)} type="button"><Icon aria-hidden="true" size={15} /><span>{label}</span><Plus aria-hidden="true" className="ml-auto text-[#a9aeb3]" size={13} /></button>)}</div><p className="mt-5 text-[11px] leading-5 text-[#a9aeb3]">{readOnly ? "This Workspace is archived. Restore it before editing." : "Click to place a node. Select a node to inspect it. Drag handles to connect."}</p><details className="mt-6 border-t border-[#2b3337] pt-4" open><summary className="cursor-pointer text-xs font-semibold text-[#f2f3f3]">Add Connection without dragging</summary><form className="mt-3 grid gap-2" onSubmit={submitConnection}><label className="text-[11px] text-[#a9aeb3]" htmlFor="connection-source">Source</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-source" onChange={(event) => setConnectionForm((current) => ({ ...current, source: event.target.value }))} required value={connectionForm.source}><option value="">Choose Component</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select><label className="text-[11px] text-[#a9aeb3]" htmlFor="connection-target">Target</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-target" onChange={(event) => setConnectionForm((current) => ({ ...current, target: event.target.value }))} required value={connectionForm.target}><option value="">Choose Component</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select><label className="text-[11px] text-[#a9aeb3]" htmlFor="connection-intent">Intent</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-intent" onChange={(event) => setConnectionForm((current) => ({ ...current, intent: event.target.value }))} value={connectionForm.intent}>{connectionIntents.map((intent) => <option key={intent} value={intent}>{intent.replaceAll("_", " ")}</option>)}</select><label className="text-[11px] text-[#a9aeb3]" htmlFor="connection-protocol">Protocol</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-protocol" onChange={(event) => setConnectionForm((current) => ({ ...current, protocol: event.target.value }))} value={connectionForm.protocol}>{protocols.map((protocol) => <option key={protocol} value={protocol}>{protocol || "Not specified"}</option>)}</select><label className="text-[11px] text-[#a9aeb3]" htmlFor="connection-guarantee">Guarantee</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-guarantee" onChange={(event) => setConnectionForm((current) => ({ ...current, guarantee: event.target.value }))} value={connectionForm.guarantee}>{guarantees.map((guarantee) => <option key={guarantee} value={guarantee}>{guarantee || "Not specified"}</option>)}</select><label className="text-[11px] text-[#a9aeb3]" htmlFor="connection-notes">Notes</label><textarea className="min-h-16 border border-[#3c4542] bg-[#101316] px-2 py-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="connection-notes" maxLength={1000} onChange={(event) => setConnectionForm((current) => ({ ...current, notes: event.target.value }))} value={connectionForm.notes} /><button className="min-h-9 border border-[#a9e5d8] text-xs font-semibold text-[#a9e5d8] disabled:cursor-not-allowed disabled:opacity-50" disabled={readOnly || nodes.length < 2} type="submit">Add Connection</button>{connectionMessage ? <p className="text-[11px] leading-4 text-[#a9e5d8]" role="status">{connectionMessage}</p> : null}</form></details><details className="mt-5 border-t border-[#2b3337] pt-4" open><summary className="cursor-pointer text-xs font-semibold text-[#f2f3f3]">Boundaries</summary><form className="mt-3 grid gap-2" onSubmit={submitBoundary}><label className="text-[11px] text-[#a9aeb3]" htmlFor="boundary-label">Label</label><input className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="boundary-label" onChange={(event) => setBoundaryForm((current) => ({ ...current, label: event.target.value }))} placeholder="e.g. Primary region" required value={boundaryForm.label} /><label className="text-[11px] text-[#a9aeb3]" htmlFor="boundary-type">Type</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="boundary-type" onChange={(event) => setBoundaryForm((current) => ({ ...current, type: event.target.value as CanvasBoundary["type"] }))} value={boundaryForm.type}>{boundaryTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><label className="text-[11px] text-[#a9aeb3]" htmlFor="boundary-parent">Parent boundary</label><select className="min-h-9 border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={readOnly} id="boundary-parent" onChange={(event) => setBoundaryForm((current) => ({ ...current, parentBoundaryId: event.target.value }))} value={boundaryForm.parentBoundaryId}><option value="">No parent</option>{boundaries.map((boundary) => <option key={boundary.id} value={boundary.id}>{boundary.label}</option>)}</select><button className="min-h-9 border border-[#a9e5d8] text-xs font-semibold text-[#a9e5d8] disabled:cursor-not-allowed disabled:opacity-50" disabled={readOnly} type="submit">Add Boundary</button></form><div className="mt-3 grid gap-2">{boundaries.map((boundary) => <BoundaryRow boundary={boundary} boundaries={boundaries} disabled={readOnly} key={boundary.id} nodes={nodes} onDelete={() => deleteBoundary(boundary.id)} onUpdate={(patch) => updateBoundary(boundary.id, patch)} />)}</div></details></aside>
      <div className="min-h-[460px] bg-[#101316]" data-testid="architecture-flow"><ReactFlow defaultViewport={viewport} nodes={nodes} edges={edges} nodeTypes={nodeTypes} nodesConnectable={!readOnly} nodesDraggable={!readOnly} onConnect={connect} onNodeClick={(_, node) => selectNode(node.id)} onPaneClick={() => selectNode(null)} onNodesChange={readOnly ? undefined : applyNodes} onMoveEnd={(_, nextViewport) => onViewportChange?.(nextViewport)} fitView={!viewport} proOptions={{ hideAttribution: true }}><Background color="#202a2d" gap={28} size={1} /><Controls position="bottom-left" showInteractive={false} /></ReactFlow></div>
      <aside aria-label="Component inspector" className="border-t border-[#2b3337] bg-[#151b1d] p-4 lg:border-l lg:border-t-0">{selected ? <Inspector disabled={readOnly} node={selected} onChange={(patch) => updateComponent(selected.id, patch)} onDelete={deleteSelected} /> : <div className="flex h-full min-h-40 flex-col justify-center"><Layers3 aria-hidden="true" className="text-[#a9aeb3]" size={21} /><p className="mt-3 text-sm text-[#f2f3f3]">Select a Component</p><p className="mt-1 text-xs leading-5 text-[#a9aeb3]">Inspect its semantic type and label, or use the palette to add a new one.</p></div>}</aside>
    </div>
  </section>;
}

function ArchitectureNode({ data, selected }: NodeProps<CanvasNode>) {
  return <div className={`min-w-[150px] border bg-[#1b2220] px-3 py-2.5 shadow-none ${selected ? "border-[#a9e5d8]" : "border-[#3c4542]"}`}><Handle className="!h-2 !w-2 !border-0 !bg-[#a9e5d8]" position={Position.Left} type="target" /><div className="flex items-start gap-2"><Layers3 aria-hidden="true" className="mt-0.5 shrink-0 text-[#a9e5d8]" size={16} /><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#f2f3f3]">{data.label}</p><p className="mt-1 font-mono text-[9px] uppercase text-[#a9aeb3]">{data.type.replaceAll("_", " ")}</p></div></div><Handle className="!h-2 !w-2 !border-0 !bg-[#a9e5d8]" position={Position.Right} type="source" /></div>;
}

function BoundaryRow({ boundary, boundaries, disabled, nodes, onDelete, onUpdate }: { boundary: CanvasBoundary; boundaries: CanvasBoundary[]; disabled: boolean; nodes: CanvasNode[]; onDelete: () => void; onUpdate: (patch: Partial<Omit<CanvasBoundary, "id">>) => void }) {
  return <div className="border border-[#344047] p-2"><input aria-label={`Boundary label ${boundary.id}`} className="min-h-8 w-full border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={disabled} onChange={(event) => onUpdate({ label: event.target.value })} value={boundary.label} /><select aria-label={`Parent boundary ${boundary.id}`} className="mt-2 min-h-8 w-full border border-[#3c4542] bg-[#101316] px-2 text-xs text-[#f2f3f3]" disabled={disabled} onChange={(event) => onUpdate({ parentBoundaryId: event.target.value || undefined })} value={boundary.parentBoundaryId ?? ""}><option value="">No parent</option>{boundaries.filter((candidate) => candidate.id !== boundary.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}</select><label className="mt-2 block text-[10px] text-[#a9aeb3]" htmlFor={`boundary-components-${boundary.id}`}>Components in boundary</label><select aria-label={`Components in boundary ${boundary.id}`} className="mt-1 min-h-16 w-full border border-[#3c4542] bg-[#101316] px-2 py-1 text-xs text-[#f2f3f3]" disabled={disabled} id={`boundary-components-${boundary.id}`} multiple onChange={(event) => onUpdate({ componentIds: Array.from(event.target.selectedOptions, (option) => option.value) })} value={boundary.componentIds}>{nodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select><button className="mt-2 text-[11px] text-[#ffb4a8] hover:underline disabled:opacity-50" disabled={disabled} onClick={onDelete} type="button">Delete boundary</button></div>;
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

function Inspector({ disabled, node, onChange, onDelete }: { disabled: boolean; node: CanvasNode; onChange: (patch: Partial<CanvasNodeData>) => void; onDelete: () => void }) {
  const propertyKey = { COMPUTE: "runtime", DATA_STORE: "consistency", MESSAGING: "deliveryGuarantee", EDGE_SECURITY: "exposure", IDENTITY_SECRETS: "responsibility", OBSERVABILITY: "signal", CUSTOM: "semanticIcon" }[node.data.category];
  const propertyOptions = { runtime: ["JAVA", "NODE_JS", "PYTHON", "GO", "OTHER"], consistency: ["STRONG", "EVENTUAL", "CAUSAL"], deliveryGuarantee: ["AT_MOST_ONCE", "AT_LEAST_ONCE", "EXACTLY_ONCE"], exposure: ["PUBLIC", "PRIVATE", "INTERNAL"], responsibility: ["IDENTITY", "SECRETS"], signal: ["LOGS", "METRICS", "TRACES"], semanticIcon: ["component", "service", "database", "queue", "gateway"] }[propertyKey];
  const options = propertyOptions ?? [];
  return <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a9aeb3]">Component Inspector</p><label className="mt-5 block text-xs text-[#a9aeb3]" htmlFor="component-label">Label</label><input className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-label" onChange={(event) => onChange({ label: event.target.value })} value={node.data.label} /><label className="mt-4 block text-xs text-[#a9aeb3]" htmlFor="component-category">Category</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-category" onChange={(event) => { const category = event.target.value as ArchitectureComponentCategory; onChange({ category, properties: componentDefaults[category] }); }} value={node.data.category}><option value="COMPUTE">Compute</option><option value="DATA_STORE">Data store</option><option value="MESSAGING">Messaging</option><option value="EDGE_SECURITY">Edge / security</option><option value="IDENTITY_SECRETS">Identity / secrets</option><option value="OBSERVABILITY">Observability</option><option value="CUSTOM">Custom</option></select><label className="mt-4 block text-xs text-[#a9aeb3]" htmlFor="component-type">Type</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-type" onChange={(event) => onChange({ type: event.target.value as ArchitectureComponentType })} value={node.data.type}><option value="SERVICE">Service</option><option value="FUNCTION">Function</option><option value="RELATIONAL_DATABASE">Relational database</option><option value="DOCUMENT_DATABASE">Document database</option><option value="CACHE">Cache</option><option value="QUEUE">Queue</option><option value="STREAM">Stream</option><option value="GATEWAY">Gateway</option><option value="EXTERNAL_API">External API</option><option value="CUSTOM_COMPONENT">Custom Component</option></select><label className="mt-4 block text-xs text-[#a9aeb3]" htmlFor="component-property">{propertyKey.replace(/([A-Z])/g, " $1")}</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="component-property" onChange={(event) => onChange({ properties: { ...node.data.properties, [propertyKey]: event.target.value } })} value={String(node.data.properties[propertyKey] ?? options[0])}>{options.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select>{propertyFields[node.data.category].map((field) => <label className="mt-4 block text-xs text-[#a9aeb3]" key={field}>{field.replace(/([A-Z])/g, " $1")}<textarea className="mt-2 min-h-14 w-full border border-[#3c4542] bg-[#101316] px-2 py-2 text-xs text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} maxLength={500} onChange={(event) => onChange({ properties: { ...node.data.properties, [field]: event.target.value } })} value={String(node.data.properties[field] ?? "")} /></label>)}<button className="mt-7 inline-flex min-h-9 items-center gap-2 border border-[#ff9a8b] px-3 text-xs font-semibold text-[#ffb4a8] hover:bg-[#321d1a] disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onDelete} type="button"><Trash2 aria-hidden="true" size={14} />Delete Component</button></div>;
}
