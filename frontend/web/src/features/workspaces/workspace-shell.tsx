"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowLeft, PanelRight, Trash2 } from "lucide-react";
import type { Viewport } from "@xyflow/react";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useAuthenticatedApiClient, type WorkspaceSummary } from "@/lib/api/authenticated-client";
import { WorkspaceReasoning } from "./workspace-reasoning";
import { DecisionLog } from "./decision-log";
import { ArchitectureCanvas, ArchitectureInspector, ConnectionInspector } from "./architecture-canvas";
import { useArchitectureEditorStore, type CanvasBoundary } from "./architecture-editor-store";
import { ScenarioPanel } from "./scenario-panel";
import { ReviewExperience } from "./review-experience";
import { CopilotPanel } from "./copilot-panel";

type Stage = "clarify" | "design" | "stress" | "review";
type ContextTab = "inspector" | "copilot";

const stages: Array<{ id: Stage; number: string; label: string; description: string }> = [
  { id: "clarify", number: "01", label: "Clarify", description: "Make needs explicit" },
  { id: "design", number: "02", label: "Design", description: "Connect responsibilities" },
  { id: "stress", number: "03", label: "Stress-test", description: "Change a condition" },
  { id: "review", number: "04", label: "Review", description: "Inspect the evidence" },
];

export function WorkspaceShell({ workspaceId }: { workspaceId: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [stage, setStage] = useState<Stage>("clarify");
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);
  const [canvasFullScreen, setCanvasFullScreen] = useState(false);
  const contextStorageKey = `workspace-context-tab:${workspaceId}`;
  const subscribeToContextTab = useCallback((onChange: () => void) => subscribeContextTab(contextStorageKey, onChange), [contextStorageKey]);
  const getContextTab = useCallback(() => readContextTab(contextStorageKey), [contextStorageKey]);
  const contextTab = useSyncExternalStore(subscribeToContextTab, getContextTab, () => "inspector" as ContextTab);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let current = true;
    api.getWorkspace(workspaceId)
      .then((value) => {
        if (current) {
          setWorkspace(value);
          setStage(toStage(value.focusStage));
        }
      })
      .catch(() => {
        if (current) setError("This Workspace could not be opened.");
      });
    return () => {
      current = false;
    };
  }, [api, isLoaded, isSignedIn, workspaceId]);

  async function selectStage(nextStage: Stage) {
    setStage(nextStage);
    setCanvasFullScreen(false);
    if (!workspace || workspace.status === "ARCHIVED") return;
    const panel = nextStage === "clarify" ? "REASONING" : nextStage === "design" ? "CANVAS" : nextStage === "stress" ? "SCENARIOS" : "REVIEW";
    try {
      const saved = await api.updateWorkspaceFocus(workspaceId, nextStage.toUpperCase() === "STRESS" ? "STRESS" : nextStage.toUpperCase(), panel, viewportForApi(workspace));
      setWorkspace(saved);
    } catch {
      setError("The current stage could not be saved. Your work is safe.");
    }
  }

  function toggleContextPanel() {
    if (contextOpen) {
      setContextOpen(false);
      setCanvasFullScreen(false);
    } else {
      setContextOpen(true);
    }
  }

  async function saveViewport(nextViewport: Viewport) {
    if (!workspace || workspace.status === "ARCHIVED") return;
    const panel = stage === "clarify" ? "REASONING" : stage === "design" ? "CANVAS" : stage === "stress" ? "SCENARIOS" : "REVIEW";
    try {
      const saved = await api.updateWorkspaceFocus(workspaceId, stage === "stress" ? "STRESS" : stage.toUpperCase(), panel, nextViewport);
      setWorkspace(saved);
    } catch {
      setError("The Canvas position could not be saved. Your architecture is safe.");
    }
  }

  async function restoreWorkspace() {
    if (!workspace) return;
    setIsRestoring(true);
    setError(null);
    try {
      setWorkspace(await api.restoreWorkspace(workspaceId));
    } catch {
      setError("This Workspace could not be restored because your active Workspace allowance is full. Archive another Workspace first.");
    } finally {
      setIsRestoring(false);
    }
  }

  if (!isLoaded) return <p className="text-sm text-text-muted">Restoring your session...</p>;
  if (!isSignedIn) {
    return <section className="mx-auto max-w-xl border-y border-line py-12 text-center"><p className="font-mono text-xs uppercase tracking-[0.18em] text-signal">Private Workspace</p><h1 className="mt-3 font-display text-3xl font-semibold">Sign in to continue.</h1><SignInButton fallbackRedirectUrl={`/workspace/${workspaceId}`} mode="modal"><button className="mt-6 inline-flex min-h-11 rounded-md bg-signal px-4 text-sm font-semibold text-text-on-dark" type="button">Sign in</button></SignInButton></section>;
  }
  if (error) return <section className="mx-auto max-w-xl border-y border-line py-12"><p className="text-sm text-danger" role="alert">{error}</p><Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-signal" href="/practice"><ArrowLeft aria-hidden="true" size={16} />Back to Practice</Link></section>;
  if (!workspace) return <p className="text-sm text-text-muted">Opening Workspace...</p>;

  return <div className="flex min-h-[calc(100vh-56px)] flex-col bg-surface md:flex-row">
    <aside aria-label="Workspace stages" className="hidden w-44 shrink-0 bg-chrome-800 px-[14px] py-6 text-text-on-dark md:flex md:flex-col">
      <Link aria-label="Back to Practice" className="flex items-center gap-2 px-2 text-xs text-text-on-dark-secondary hover:text-text-on-dark" href="/practice"><ArrowLeft aria-hidden="true" size={15} />Back to Practice</Link>
      <div className="mt-7 px-2"><p className="font-mono text-[10px] leading-4 text-text-on-dark-secondary">PRACTICE LOOP</p><p className="mt-1 font-display text-base font-medium leading-tight text-text-on-dark">From question to evidence</p></div>
      <div className="mt-5 grid gap-2">
        {stages.map((item, index) => <div className="relative" key={item.id}>
          {index < stages.length - 1 ? <span aria-hidden="true" className="absolute left-[21px] top-[42px] h-8 w-px bg-[#4b5652]" /> : null}
          <button aria-current={stage === item.id ? "step" : undefined} className={`relative flex min-h-[76px] w-full items-start gap-2.5 rounded-[4px] border px-2 py-2.5 text-left transition-colors ${stage === item.id ? "border-signal bg-[#29413c] text-text-on-dark" : "border-transparent text-text-on-dark-secondary hover:border-canvas-line hover:text-text-on-dark"}`} onClick={() => void selectStage(item.id)} type="button">
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-[9px] ${stage === item.id ? "border-signal bg-signal-soft text-signal" : "border-[#66706c] bg-[#29302e] text-text-on-dark-secondary"}`}>{item.number}</span>
            <span className="min-w-0 pt-0.5"><span className="block text-[13px] leading-4">{item.label}</span><span className="mt-1 block text-[10px] leading-4 text-text-on-dark-secondary">{item.description}</span></span>
          </button>
        </div>)}
      </div>
      <div className="mt-auto px-2"><p className="font-mono text-[10px] text-text-on-dark-secondary">{stageProgress(stage)} OF 4 STAGES</p><div className="mt-2 h-1 rounded-full bg-[#3a4541]"><div className="h-1 rounded-full bg-signal" style={{ width: `${(stageIndex(stage) + 1) * 25}%` }} /></div></div>
    </aside>
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="flex min-h-[58px] items-center justify-between gap-4 border-b border-line bg-surface px-5 sm:px-7">
        <div className="flex min-w-0 items-baseline gap-3"><h1 className="truncate font-display text-[17px] font-medium">{workspace.name ?? "Untitled Workspace"}</h1><span className="hidden font-mono text-[11px] text-text-muted sm:inline">{workspace.source === "CURATED_CHALLENGE" ? "CHALLENGE WORKSPACE" : "CUSTOM WORKSPACE"}</span></div>
        <div className="flex items-center gap-2 text-text-muted"><span className="hidden font-mono text-[11px] uppercase tracking-[0.08em] sm:inline">{formatSaveState(workspace.saveState)}</span><button aria-controls="workspace-context-panel" aria-expanded={contextOpen} aria-label={contextOpen ? "Close contextual rail" : "Open contextual rail"} className="icon-button md:hidden" onClick={toggleContextPanel} type="button"><PanelRight aria-hidden="true" size={16} /></button></div>
      </header>
      {workspace.status === "ARCHIVED" ? <section className="flex flex-col justify-between gap-4 border-b border-amber-500/30 bg-amber-500/10 px-5 py-4 sm:flex-row sm:items-center sm:px-7" aria-label="Archived Workspace status"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-800">ARCHIVED / READ-ONLY</p><p className="mt-1 text-sm text-foreground">Editing, Copilot use, and Review submission are unavailable until this Workspace is restored. Export remains available.</p></div><button className="inline-flex min-h-11 shrink-0 items-center justify-center border border-signal bg-signal px-4 text-sm font-semibold text-text-on-dark disabled:opacity-50" disabled={isRestoring} onClick={() => void restoreWorkspace()} type="button">{isRestoring ? "Restoring..." : "Restore Workspace"}</button></section> : null}
      <nav aria-label="Mobile Workspace stages" className="grid grid-cols-4 border-b border-line bg-background md:hidden">{stages.map((item) => <button aria-current={stage === item.id ? "step" : undefined} className={`min-h-12 border-r border-line px-2 text-xs font-semibold last:border-r-0 ${stage === item.id ? "text-signal" : "text-text-muted"}`} key={item.id} onClick={() => void selectStage(item.id)} type="button"><span className="mr-1 font-mono text-[10px]">{item.number}</span>{item.label}</button>)}</nav>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className={stage === "design" ? (canvasFullScreen ? "min-w-0 flex-1 overflow-hidden" : "min-w-0 flex-1 overflow-auto") : (canvasFullScreen ? "min-w-0 flex-1 overflow-hidden" : "min-w-0 flex-1 overflow-auto px-5 py-8 sm:px-8 lg:px-12 lg:py-10")}>
          <div className={stage === "design" || canvasFullScreen ? "flex h-full flex-col" : "mx-auto max-w-[1000px]"}>{stage === "clarify" ? <ClarifyArtifact workspace={workspace} readOnly={workspace.status === "ARCHIVED"} workspaceId={workspaceId} onDesign={() => void selectStage("design")} /> : stage === "design" ? <><section className={canvasFullScreen ? "flex min-h-0 flex-1 flex-col bg-[#0d1211] px-5 py-6 sm:px-7 sm:py-7" : "flex min-h-0 w-full max-w-[1310px] flex-1 flex-col bg-[#0d1211] px-5 py-6 sm:px-8 lg:px-10 sm:py-7"}><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a7aeb3]">DESIGN / ARCHITECTURE DOCUMENT</p><h2 className="mt-3 max-w-3xl font-display text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-[#f0f3f1]">{canvasFullScreen ? "Architecture Canvas" : "Describe the system as connected responsibilities."}</h2><p className="mt-3 max-w-2xl text-[15px] leading-6 text-[#a7aeb3]">{canvasFullScreen ? "Full-screen editing · Press Esc to return to the Workspace." : "Place the Components, connect the paths, and keep the structure explainable."}</p><div className={canvasFullScreen ? "mt-5 flex min-h-0 flex-1 flex-col" : "mt-7"}><ArchitectureCanvas fullScreen={canvasFullScreen} onFullScreenChange={setCanvasFullScreen} onViewportChange={(nextViewport) => void saveViewport(nextViewport)} readOnly={workspace.status === "ARCHIVED"} viewport={viewportFromWorkspace(workspace)} workspaceId={workspaceId} /></div></section>{canvasFullScreen ? null : <div className="mt-10"><DecisionLog readOnly={workspace.status === "ARCHIVED"} workspaceId={workspaceId} /></div>}</> : <StagePlaceholder stage={stage} workspace={workspace} />}</div>
        </main>
        {contextOpen ? <WorkspaceContextPanel activeTab={contextTab} onClose={toggleContextPanel} onTabChange={(tab) => persistContextTab(contextStorageKey, tab)} readOnly={workspace.status === "ARCHIVED"} stage={stage} workspaceId={workspaceId} /> : null}
      </div>
    </section>
  </div>;
}

function ClarifyArtifact({ workspace, readOnly, workspaceId, onDesign }: { workspace: WorkspaceSummary; readOnly: boolean; workspaceId: string; onDesign: () => void }) {
  const isCuratedChallenge = workspace.source === "CURATED_CHALLENGE";
  const briefLabel = isCuratedChallenge ? "CHALLENGE BRIEF" : "SYSTEM IDEA";
  const clarifyDescription = isCuratedChallenge
    ? "Turn the challenge brief into a short design checklist. Capture only the requirements that will guide your design."
    : "Turn your system idea into Requirements, Assumptions, estimates, and unresolved questions. Start with the promise the system must keep.";
  const nextAction = isCuratedChallenge
    ? "Next action: Make one important design requirement explicit."
    : "Next action: Add your first Requirement.";
  return <article className="flex flex-col gap-[18px]">
    <p className="font-mono text-[11px] leading-4 text-signal">CLARIFY / WORKSPACE DOCUMENT</p>
    <h2 className="max-w-3xl font-display text-[34px] font-medium leading-[1.08] tracking-[-0.03em]">{workspace.clarifyPrompt ?? "Make the system needs explicit."}</h2>
    <p className="max-w-3xl text-[15px] leading-[1.5] text-text-muted">{clarifyDescription}</p>
    <div className="h-px w-full bg-line" />
    <section className="grid gap-3"><p className="font-mono text-[11px] leading-4 text-text-muted">{briefLabel}</p><p className="max-w-3xl font-display text-[18px] leading-[1.4]">{workspace.description ?? "Write down the needs, assumptions, uncertainties, and decisions that should guide the architecture."}</p></section>
    <p className="border-l-2 border-signal pl-4 text-sm font-semibold text-signal">{nextAction}</p>
    <div className="flex flex-wrap gap-2"><a className="inline-flex min-h-10 items-center border border-signal bg-signal px-4 text-sm font-semibold text-text-on-dark" href="#requirements">Start your checklist</a><button className="inline-flex min-h-10 items-center border border-line px-4 text-sm text-foreground" onClick={onDesign} type="button">Continue to Design</button></div>
    <div className="mt-3"><WorkspaceReasoning curatedChallenge={isCuratedChallenge} readOnly={readOnly} reviewBriefRequired={workspace.reviewBriefRequired === true} workspaceId={workspaceId} /></div>
  </article>;
}

function WorkspaceContextPanel({ activeTab, onClose, onTabChange, readOnly, stage, workspaceId }: { activeTab: ContextTab; onClose: () => void; onTabChange: (tab: ContextTab) => void; readOnly: boolean; stage: Stage; workspaceId: string }) {
  return <aside aria-label="Workspace context panel" className="fixed inset-0 z-30 flex min-h-0 w-full flex-col overflow-hidden border-line bg-surface p-[22px] lg:static lg:z-auto lg:w-[320px] lg:shrink-0 lg:overflow-hidden lg:border-l" id="workspace-context-panel">
    <div className="flex items-center justify-between gap-5 border-b border-line pb-3"><div className="flex items-center gap-5" role="tablist" aria-label="Workspace context tabs"><button aria-selected={activeTab === "inspector"} className={`text-xs ${activeTab === "inspector" ? "font-semibold text-signal" : "text-text-muted hover:text-foreground"}`} onClick={() => onTabChange("inspector")} role="tab" type="button">Inspector</button><button aria-selected={activeTab === "copilot"} className={`text-xs ${activeTab === "copilot" ? "font-semibold text-signal" : "text-text-muted hover:text-foreground"}`} onClick={() => onTabChange("copilot")} role="tab" type="button">Copilot</button></div><button aria-label="Close contextual panel" className="text-xs font-semibold text-text-muted hover:text-foreground lg:hidden" onClick={onClose} type="button">Close</button></div>
    <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">{activeTab === "copilot" ? <CopilotPanel embedded readOnly={readOnly} workspaceId={workspaceId} /> : <ContextInspector onOpenCopilot={() => onTabChange("copilot")} readOnly={readOnly} stage={stage} />}</div>
  </aside>;
}

function ContextInspector({ onOpenCopilot, readOnly, stage }: { onOpenCopilot: () => void; readOnly: boolean; stage: string }) {
  if (stage === "design") return <DesignContextInspector onOpenCopilot={onOpenCopilot} readOnly={readOnly} />;
  const stageLabel = stages.find((item) => item.id === stage)?.label ?? "Workspace";
  const artifact = stage === "clarify" ? "Workspace document" : stage === "stress" ? "Scenario response" : "Review evidence";
  const isClarify = stage === "clarify";
  const guidance = stage === "clarify"
    ? "Read the brief, write one requirement in plain language, and add an assumption or question only when it will change the design."
    : stage === "design"
      ? "Select a Component on the Architecture Canvas to inspect its semantic type, properties, and decisions."
      : "The primary artifact remains in the document area. Use this panel for focused context without leaving your current stage.";
  return <section className="pt-5"><p className="font-mono text-[11px] leading-4 text-text-muted">{isClarify ? "CLARIFY / INSPECTOR" : "INSPECTOR"}</p><h2 className="mt-2 font-display text-[22px] font-normal leading-[1.2]">{isClarify ? "Start with one requirement." : stage === "design" ? "Select a Component." : `${stageLabel} context`}</h2>{isClarify ? null : <dl className="mt-5 grid gap-3 border-y border-line py-4 text-[13px]"><div className="flex justify-between gap-4"><dt className="text-text-muted">Stage</dt><dd className="text-right text-foreground">{stageLabel}</dd></div><div className="flex justify-between gap-4"><dt className="text-text-muted">Primary artifact</dt><dd className="text-right text-foreground">{artifact}</dd></div></dl>}<p className="mt-4 text-[13px] leading-5 text-text-muted">{isClarify ? "Read the brief, write one requirement in plain language, and open Copilot when you want a second opinion." : guidance}</p><button aria-label="Open Copilot" className="mt-5 inline-flex min-h-10 items-center border border-signal px-3 text-sm font-semibold text-signal hover:bg-signal-soft" onClick={onOpenCopilot} type="button">Open Copilot&nbsp; →</button></section>;
}

function DesignContextInspector({ onOpenCopilot, readOnly }: { onOpenCopilot: () => void; readOnly: boolean }) {
  const selectedNodeId = useArchitectureEditorStore((state) => state.selectedNodeId);
  const selectedNodeIds = useArchitectureEditorStore((state) => state.selectedNodeIds);
  const selectedEdgeId = useArchitectureEditorStore((state) => state.selectedEdgeId);
  const node = useArchitectureEditorStore((state) => state.nodes.find((item) => item.id === selectedNodeId));
  const edge = useArchitectureEditorStore((state) => state.edges.find((item) => item.id === selectedEdgeId));
  const boundary = useArchitectureEditorStore((state) => state.boundaries.find((item) => item.id === selectedNodeId));
  const nodes = useArchitectureEditorStore((state) => state.nodes);
  const updateComponent = useArchitectureEditorStore((state) => state.updateComponent);
  const updateConnection = useArchitectureEditorStore((state) => state.updateConnection);
  const updateBoundary = useArchitectureEditorStore((state) => state.updateBoundary);
  const requestDelete = useArchitectureEditorStore((state) => state.requestDelete);
  const duplicateComponent = useArchitectureEditorStore((state) => state.duplicateComponent);
  const duplicateNodes = useArchitectureEditorStore((state) => state.duplicateNodes);
  if (edge) {
    const source = nodes.find((item) => item.id === edge.source);
    const target = nodes.find((item) => item.id === edge.target);
    return <ConnectionInspector disabled={readOnly} edge={edge} sourceLabel={source?.data.label ?? "Unknown Component"} targetLabel={target?.data.label ?? "Unknown Component"} onChange={(patch) => updateConnection(edge.id, patch)} onDelete={() => requestDelete({ kind: "edge", id: edge.id, label: `${source?.data.label ?? "?"} → ${target?.data.label ?? "?"}` })} />;
  }
  if (boundary) return <BoundaryInspector boundary={boundary} disabled={readOnly} memberCount={boundary.componentIds.length} onChange={(patch) => updateBoundary(boundary.id, patch)} onDelete={() => requestDelete({ kind: "boundary", id: boundary.id, label: boundary.label })} />;
  if (selectedNodeIds.length > 1) {
    const selected = nodes.filter((item) => selectedNodeIds.includes(item.id));
    return <section className="pt-5"><p className="font-mono text-[11px] leading-4 text-text-muted">DESIGN / INSPECTOR</p><h2 className="mt-2 font-display text-[22px] font-normal leading-[1.2]">{selected.length} Components selected</h2><p className="mt-4 text-[13px] leading-5 text-text-muted">Duplicate, group, distribute, or delete the selection from the Canvas toolbar above the selection.</p><div className="mt-5 flex flex-wrap gap-2"><button className="inline-flex min-h-10 items-center border border-line px-3 text-sm text-foreground hover:border-signal" disabled={readOnly} onClick={() => duplicateNodes(selectedNodeIds)} type="button">Duplicate</button><button className="inline-flex min-h-10 items-center border border-danger/50 px-3 text-sm text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50" disabled={readOnly} onClick={() => requestDelete({ kind: "nodes", ids: selectedNodeIds, label: `${selected.length} Components`, connectionCount: 0 })} type="button">Delete</button></div></section>;
  }
  if (!node) return <section className="pt-5"><p className="font-mono text-[11px] leading-4 text-text-muted">DESIGN / INSPECTOR</p><h2 className="mt-2 font-display text-[22px] font-normal leading-[1.2]">Select a Component or Connection.</h2><p className="mt-4 text-[13px] leading-5 text-text-muted">Select a Component to inspect its responsibility and properties, or a Connection to describe its intent, protocol, and guarantees.</p><button aria-label="Open Copilot" className="mt-5 inline-flex min-h-10 items-center border border-signal px-3 text-sm font-semibold text-signal hover:bg-signal-soft" onClick={onOpenCopilot} type="button">Open Copilot</button></section>;
  return <ArchitectureInspector disabled={readOnly} node={node} onChange={(patch) => updateComponent(node.id, patch)} onDelete={() => requestDelete({ kind: "nodes", ids: [node.id], label: node.data.label, connectionCount: edgesTouching(node.id) })} onDuplicate={() => duplicateComponent(node.id)} />;
}

function edgesTouching(nodeId: string) {
  return useArchitectureEditorStore.getState().edges.filter((edge) => edge.source === nodeId || edge.target === nodeId).length;
}

function BoundaryInspector({ boundary, disabled, memberCount, onChange, onDelete }: { boundary: { label: string; type: CanvasBoundary["type"] }; disabled: boolean; memberCount: number; onChange: (patch: { label?: string; type?: CanvasBoundary["type"] }) => void; onDelete: () => void }) {
  return <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a7aeb3]">Boundary Inspector</p><label className="mt-5 block text-xs text-[#a7aeb3]" htmlFor="boundary-label">Label</label><input className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="boundary-label" onChange={(event) => onChange({ label: event.target.value })} value={boundary.label} /><label className="mt-4 block text-xs text-[#a7aeb3]" htmlFor="boundary-type">Type</label><select className="mt-2 min-h-10 w-full border border-[#3c4542] bg-[#101316] px-2 text-sm text-[#f2f3f3] outline-none focus:border-[#a9e5d8] disabled:opacity-50" disabled={disabled} id="boundary-type" onChange={(event) => onChange({ type: event.target.value as CanvasBoundary["type"] })} value={boundary.type}><option value="DEPLOYMENT">Deployment</option><option value="NETWORK">Network</option><option value="REGION">Region</option><option value="AVAILABILITY">Availability</option><option value="TRUST">Trust</option></select><p className="mt-4 text-[13px] text-text-muted">{memberCount} Component{memberCount === 1 ? "" : "s"} in this Boundary.</p><button className="mt-6 inline-flex min-h-9 items-center gap-2 border border-danger/50 px-3 text-xs font-semibold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onDelete} type="button"><Trash2 aria-hidden="true" size={14} />Delete Boundary</button></div>;
}

function toStage(value: string | undefined): Stage {
  return value === "DESIGN" || value === "STRESS" || value === "REVIEW" ? value.toLowerCase() as Stage : "clarify";
}

function viewportFromWorkspace(workspace: WorkspaceSummary) {
  const viewport = workspace.canvasViewport;
  if (viewport && typeof viewport.x === "number" && typeof viewport.y === "number" && typeof viewport.zoom === "number") {
    return { x: viewport.x, y: viewport.y, zoom: viewport.zoom };
  }
  return undefined;
}

function viewportForApi(workspace: WorkspaceSummary) {
  return viewportFromWorkspace(workspace) ?? { x: 0, y: 0, zoom: 1 };
}

function StagePlaceholder({ stage, workspace }: { stage: Exclude<Stage, "clarify">; workspace: WorkspaceSummary }) {
  if (stage === "stress") return <ScenarioPanel readOnly={workspace.status === "ARCHIVED"} workspaceId={workspace.id ?? ""} />;
  if (stage === "review") return <ReviewExperience readOnly={workspace.status === "ARCHIVED"} workspaceId={workspace.id ?? ""} />;
  return <section aria-label={`${stage} stage`} className="border-y border-line py-10"><p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{workspace.source ?? "Custom"} Workspace</p><h2 className="mt-3 font-display text-3xl font-semibold">Shape the architecture.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">The Architecture Canvas is the primary design surface for this Workspace.</p><p className="mt-5 max-w-2xl border-l-2 border-signal pl-4 text-sm text-text-muted">This stage stays available while you build evidence. You can return to Clarify or Design at any time.</p></section>;
}

function stageIndex(stage: Stage) {
  return stages.findIndex((item) => item.id === stage);
}

function stageProgress(stage: Stage) {
  return String(stageIndex(stage) + 1).padStart(2, "0");
}

function formatSaveState(value: string | undefined) {
  return value ? value.replaceAll("_", " ") : "NOT STARTED";
}

function readContextTab(key: string): ContextTab {
  if (typeof window === "undefined") return "inspector";
  const stored = window.localStorage.getItem(key);
  return stored === "inspector" || stored === "copilot" ? stored : "inspector";
}

function subscribeContextTab(key: string, onChange: () => void) {
  const handler = (event: StorageEvent) => {
    if (!event.key || event.key === key) onChange();
  };
  window.addEventListener("storage", handler);
  window.addEventListener("workspace-context-tab-change", onChange);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("workspace-context-tab-change", onChange);
  };
}

function persistContextTab(key: string, value: ContextTab) {
  window.localStorage.setItem(key, value);
  window.dispatchEvent(new Event("workspace-context-tab-change"));
}
