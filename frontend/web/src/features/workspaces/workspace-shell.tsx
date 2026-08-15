"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowLeft, Check, PanelRight, RotateCcw, RotateCw } from "lucide-react";
import type { Viewport } from "@xyflow/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthenticatedApiClient, type WorkspaceSummary } from "@/lib/api/authenticated-client";
import { downloadPortablePackage, type PortablePackage } from "@/lib/portable-package";
import { WorkspaceReasoning } from "./workspace-reasoning";
import { ArchitectureCanvas } from "./architecture-canvas";
import { useArchitectureEditorStore } from "./architecture-editor-store";

type Stage = "clarify" | "design" | "stress" | "review";

const stages: Array<{ id: Stage; number: string; label: string }> = [
  { id: "clarify", number: "01", label: "Clarify" },
  { id: "design", number: "02", label: "Design" },
  { id: "stress", number: "03", label: "Stress-test" },
  { id: "review", number: "04", label: "Review" },
];

export function WorkspaceShell({ workspaceId }: { workspaceId: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [stage, setStage] = useState<Stage>("clarify");
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [exportPackage, setExportPackage] = useState<Awaited<ReturnType<typeof api.exportWorkspace>> | null>(null);
  const undo = useArchitectureEditorStore((state) => state.undo);
  const redo = useArchitectureEditorStore((state) => state.redo);
  const canUndo = useArchitectureEditorStore((state) => state.workspaceId === workspaceId && state.past.length > 0);
  const canRedo = useArchitectureEditorStore((state) => state.workspaceId === workspaceId && state.future.length > 0);

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
    if (!workspace || workspace.status === "ARCHIVED") return;
    const panel = nextStage === "clarify" ? "REASONING" : nextStage === "design" ? "CANVAS" : nextStage === "stress" ? "SCENARIOS" : "REVIEW";
    try {
      const saved = await api.updateWorkspaceFocus(workspaceId, nextStage.toUpperCase() === "STRESS" ? "STRESS" : nextStage.toUpperCase(), panel, viewportFromWorkspace(workspace));
      setWorkspace(saved);
    } catch {
      setError("The current stage could not be saved. Your work is safe.");
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

  async function exportWorkspace() {
    setIsExporting(true);
    setError(null);
    try {
      const result = await api.exportWorkspace(workspaceId);
      if (!result.packageNode) throw new Error("The server returned no portable package");
      setExportPackage(result);
    } catch {
      setError("The portable export could not be prepared. Your Workspace is safe.");
    } finally {
      setIsExporting(false);
    }
  }

  return <div className="-mx-5 -mt-8 flex min-h-[calc(100vh-4rem)] bg-surface sm:-mx-8 lg:-mx-10 lg:-mt-10">
    <aside aria-label="Workspace stages" className="hidden w-20 shrink-0 border-r border-line bg-canvas px-2 py-4 text-text-on-dark md:block">
      <Link aria-label="Back to Practice" className="mx-auto flex size-10 items-center justify-center rounded-md text-text-on-dark-secondary hover:bg-white/10 hover:text-text-on-dark" href="/practice"><ArrowLeft aria-hidden="true" size={17} /></Link>
      <div className="mt-8 grid gap-2">{stages.map((item) => <button aria-current={stage === item.id ? "step" : undefined} className={`flex min-h-20 flex-col items-center justify-center gap-1 border px-1 text-[10px] font-semibold transition-colors ${stage === item.id ? "border-signal bg-[#183d38] text-text-on-dark" : "border-transparent text-text-on-dark-secondary hover:border-canvas-line hover:text-text-on-dark"}`} key={item.id} onClick={() => void selectStage(item.id)} type="button"><span className="font-mono text-[10px]">{item.number}</span><span>{item.label}</span></button>)}</div>
    </aside>
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex min-h-14 items-center justify-between gap-4 border-b border-line bg-surface px-5 sm:px-7">
        <div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Workspace</p><h1 className="truncate font-display text-xl font-semibold">{workspace.name}</h1></div>
        <div className="flex items-center gap-1 text-text-muted"><button aria-label="Export portable package" className="text-xs font-semibold text-signal hover:underline" disabled={isExporting} onClick={() => void exportWorkspace()} type="button">{isExporting ? "Exporting..." : "Export"}</button><button aria-label="Undo" className="icon-button disabled:cursor-not-allowed disabled:opacity-40" disabled={!canUndo} onClick={undo} type="button"><RotateCcw aria-hidden="true" size={15} /></button><button aria-label="Redo" className="icon-button disabled:cursor-not-allowed disabled:opacity-40" disabled={!canRedo} onClick={redo} type="button"><RotateCw aria-hidden="true" size={15} /></button><span className="mx-2 hidden items-center gap-1 text-xs sm:flex"><Check aria-hidden="true" className="text-success" size={15} />{workspace.saveState ?? "Not started"}</span><button aria-label="Open contextual rail" className="icon-button" type="button"><PanelRight aria-hidden="true" size={16} /></button></div>
      </header>
      {workspace.status === "ARCHIVED" ? <section className="flex flex-col justify-between gap-4 border-b border-amber-500/30 bg-amber-500/10 px-5 py-4 sm:flex-row sm:items-center sm:px-7" aria-label="Archived Workspace status"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-800">ARCHIVED / READ-ONLY</p><p className="mt-1 text-sm text-foreground">Editing, Copilot use, and Review submission are unavailable until this Workspace is restored. Export remains available.</p></div><button className="inline-flex min-h-11 shrink-0 items-center justify-center border border-signal bg-signal px-4 text-sm font-semibold text-text-on-dark disabled:opacity-50" disabled={isRestoring} onClick={() => void restoreWorkspace()} type="button">{isRestoring ? "Restoring..." : "Restore Workspace"}</button></section> : null}
      {exportPackage?.packageNode ? <section aria-label="Portable export preview" className="border-b border-line bg-background px-5 py-4 sm:px-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">PORTABLE EXPORT PREVIEW</p><p className="mt-1 text-sm text-foreground">{exportPackage.preview?.title ?? workspace.name} · {exportPackage.preview?.requirements ?? 0} Requirements · {exportPackage.preview?.assumptions ?? 0} Assumptions · {exportPackage.preview?.decisions ?? 0} Decisions · {exportPackage.preview?.components ?? 0} Components</p><p className="mt-1 text-xs text-text-muted">Identity, billing, usage, provider metadata, and Reviews are excluded.</p></div><div className="flex gap-2"><button className="border border-line px-3 py-2 text-xs text-text-muted" onClick={() => setExportPackage(null)} type="button">Cancel</button><button className="bg-signal px-3 py-2 text-xs font-semibold text-text-on-dark" onClick={() => { downloadPortablePackage(exportPackage.packageNode as unknown as PortablePackage, `${workspace.name ?? "workspace"}.json`); setExportPackage(null); }} type="button">Download JSON</button></div></div></section> : null}
      <nav aria-label="Mobile Workspace stages" className="grid grid-cols-4 border-b border-line bg-background md:hidden">{stages.map((item) => <button aria-current={stage === item.id ? "step" : undefined} className={`min-h-12 border-r border-line px-2 text-xs font-semibold last:border-r-0 ${stage === item.id ? "text-signal" : "text-text-muted"}`} key={item.id} onClick={() => void selectStage(item.id)} type="button"><span className="mr-1 font-mono text-[10px]">{item.number}</span>{item.label}</button>)}</nav>
      <main className="min-w-0 flex-1 overflow-auto px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">Stage {stages.find((item) => item.id === stage)?.number} / {stages.find((item) => item.id === stage)?.label}</p>{stage === "clarify" ? <><h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight">{workspace.clarifyPrompt ?? "Make the problem explicit."}</h2><p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">{workspace.description ?? "Write down the needs, assumptions, uncertainties, and decisions that should guide the architecture."}</p><p className="mt-5 border-l-2 border-signal pl-4 text-sm font-semibold text-signal">Next action: {workspace.suggestedNextAction ?? "Add your first Requirement or open the blank Canvas."}</p><div className="mt-4 flex flex-wrap gap-3"><button className="inline-flex min-h-10 items-center border border-signal bg-signal px-4 text-sm font-semibold text-text-on-dark" onClick={() => void selectStage("design")} type="button">Open blank Canvas</button><span className="inline-flex min-h-10 items-center border border-line px-4 text-sm text-text-muted">You can skip the first Requirement.</span></div><div className="mt-10"><WorkspaceReasoning readOnly={workspace.status === "ARCHIVED"} reviewBriefRequired={workspace.reviewBriefRequired === true} workspaceId={workspaceId} /></div><section aria-label="Copilot guidance" className="mt-12 border border-line bg-background p-6"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">COPILOT / OPT-IN GUIDANCE</p><h3 className="mt-2 font-display text-2xl font-semibold">Ask a question about the decision you are making.</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">Copilot will ask contextual questions and point to your evidence. It will not generate or silently change your Architecture Document.</p><button className="mt-5 inline-flex min-h-11 cursor-not-allowed items-center border border-line px-4 text-sm font-semibold text-text-muted" disabled type="button">Open Copilot · coming next</button></section></> : stage === "design" ? <><h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight">Shape the architecture.</h2><p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">Place the Components, connect the paths, and keep the structure explainable.</p><div className="mt-8"><ArchitectureCanvas onViewportChange={(nextViewport) => void saveViewport(nextViewport)} readOnly={workspace.status === "ARCHIVED"} viewport={viewportFromWorkspace(workspace)} workspaceId={workspaceId} /></div></> : <StagePlaceholder stage={stage} workspace={workspace} />}</div>
      </main>
    </section>
  </div>;
}

function toStage(value: string | undefined): Stage {
  return value === "DESIGN" || value === "STRESS" || value === "REVIEW" ? value.toLowerCase() as Stage : "clarify";
}

function viewportFromWorkspace(workspace: WorkspaceSummary) {
  const viewport = workspace.canvasViewport;
  if (viewport && typeof viewport.x === "number" && typeof viewport.y === "number" && typeof viewport.zoom === "number") {
    return { x: viewport.x, y: viewport.y, zoom: viewport.zoom };
  }
  return { x: 0, y: 0, zoom: 1 };
}

function StagePlaceholder({ stage, workspace }: { stage: Exclude<Stage, "clarify">; workspace: WorkspaceSummary }) {
  const content = {
    design: { title: "Shape the architecture.", description: "The blank Architecture Canvas will become the primary design surface after the reasoning contract is in place.", action: "Open Canvas" },
    stress: { title: "Test the decision under pressure.", description: "Scenarios will change a condition and give you a place to defend or revise the design.", action: "Prepare a Scenario" },
    review: { title: "Inspect evidence-backed feedback.", description: "Reviews will evaluate an immutable Architecture Revision against this Workspace's reasoning context.", action: "Prepare Review" },
  }[stage];
  return <section aria-label={`${stage} stage`} className="mt-10 border-y border-line py-10"><p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{workspace.source ?? "Custom"} Workspace</p><h2 className="mt-3 font-display text-3xl font-semibold">{content.title}</h2><p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">{content.description}</p><p className="mt-5 max-w-2xl border-l-2 border-signal pl-4 text-sm text-text-muted">This stage stays available while you build evidence. You can return to Clarify or Design at any time.</p><button className="mt-7 inline-flex min-h-11 cursor-not-allowed items-center border border-line px-4 text-sm font-semibold text-text-muted" disabled type="button">{stage === "review" ? "Review submission is coming next" : `${content.action} · coming next`}</button></section>;
}
