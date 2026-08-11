"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowLeft, Check, PanelRight, RotateCcw, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthenticatedApiClient, type WorkspaceSummary } from "@/lib/api/authenticated-client";
import { WorkspaceReasoning } from "./workspace-reasoning";

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

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let current = true;
    api.getWorkspace(workspaceId)
      .then((value) => {
        if (current) setWorkspace(value);
      })
      .catch(() => {
        if (current) setError("This Workspace could not be opened.");
      });
    return () => {
      current = false;
    };
  }, [api, isLoaded, isSignedIn, workspaceId]);

  if (!isLoaded) return <p className="text-sm text-text-muted">Restoring your session...</p>;
  if (!isSignedIn) {
    return <section className="mx-auto max-w-xl border-y border-line py-12 text-center"><p className="font-mono text-xs uppercase tracking-[0.18em] text-signal">Private Workspace</p><h1 className="mt-3 font-display text-3xl font-semibold">Sign in to continue.</h1><SignInButton mode="modal"><button className="mt-6 inline-flex min-h-11 rounded-md bg-signal px-4 text-sm font-semibold text-text-on-dark" type="button">Sign in</button></SignInButton></section>;
  }
  if (error) return <section className="mx-auto max-w-xl border-y border-line py-12"><p className="text-sm text-danger" role="alert">{error}</p><Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-signal" href="/dashboard"><ArrowLeft aria-hidden="true" size={16} />Back to Practice</Link></section>;
  if (!workspace) return <p className="text-sm text-text-muted">Opening Workspace...</p>;

  return <div className="-mx-5 -mt-8 flex min-h-[calc(100vh-4rem)] bg-surface sm:-mx-8 lg:-mx-10 lg:-mt-10">
    <aside aria-label="Workspace stages" className="hidden w-20 shrink-0 border-r border-line bg-canvas px-2 py-4 text-text-on-dark md:block">
      <Link aria-label="Back to Practice" className="mx-auto flex size-10 items-center justify-center rounded-md text-text-on-dark-secondary hover:bg-white/10 hover:text-text-on-dark" href="/dashboard"><ArrowLeft aria-hidden="true" size={17} /></Link>
      <div className="mt-8 grid gap-2">{stages.map((item) => <button aria-current={stage === item.id ? "step" : undefined} className={`flex min-h-20 flex-col items-center justify-center gap-1 border px-1 text-[10px] font-semibold transition-colors ${stage === item.id ? "border-signal bg-[#183d38] text-text-on-dark" : "border-transparent text-text-on-dark-secondary hover:border-canvas-line hover:text-text-on-dark"}`} key={item.id} onClick={() => setStage(item.id)} type="button"><span className="font-mono text-[10px]">{item.number}</span><span>{item.label}</span></button>)}</div>
    </aside>
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex min-h-14 items-center justify-between gap-4 border-b border-line bg-surface px-5 sm:px-7">
        <div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Workspace</p><h1 className="truncate font-display text-xl font-semibold">{workspace.name}</h1></div>
        <div className="flex items-center gap-1 text-text-muted"><button aria-label="Undo" className="icon-button" type="button"><RotateCcw aria-hidden="true" size={15} /></button><button aria-label="Redo" className="icon-button" type="button"><RotateCw aria-hidden="true" size={15} /></button><span className="mx-2 hidden items-center gap-1 text-xs sm:flex"><Check aria-hidden="true" className="text-success" size={15} />{workspace.saveState ?? "Not started"}</span><button aria-label="Open contextual rail" className="icon-button" type="button"><PanelRight aria-hidden="true" size={16} /></button></div>
      </header>
      <nav aria-label="Mobile Workspace stages" className="grid grid-cols-4 border-b border-line bg-background md:hidden">{stages.map((item) => <button aria-current={stage === item.id ? "step" : undefined} className={`min-h-12 border-r border-line px-2 text-xs font-semibold last:border-r-0 ${stage === item.id ? "text-signal" : "text-text-muted"}`} key={item.id} onClick={() => setStage(item.id)} type="button"><span className="mr-1 font-mono text-[10px]">{item.number}</span>{item.label}</button>)}</nav>
      <main className="min-w-0 flex-1 overflow-auto px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-5xl"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">Stage {stages.find((item) => item.id === stage)?.number} / {stages.find((item) => item.id === stage)?.label}</p>{stage === "clarify" ? <><h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight">Make the problem explicit.</h2><p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">Write down the needs, assumptions, uncertainties, and decisions that should guide the architecture.</p><div className="mt-10"><WorkspaceReasoning readOnly={workspace.status === "ARCHIVED"} workspaceId={workspaceId} /></div></> : <StagePlaceholder stage={stage} workspace={workspace} />}</div>
      </main>
    </section>
  </div>;
}

function StagePlaceholder({ stage, workspace }: { stage: Exclude<Stage, "clarify">; workspace: WorkspaceSummary }) {
  const content = {
    design: { title: "Shape the architecture.", description: "The blank Architecture Canvas will become the primary design surface after the reasoning contract is in place.", action: "Open Canvas" },
    stress: { title: "Test the decision under pressure.", description: "Scenarios will change a condition and give you a place to defend or revise the design.", action: "Prepare a Scenario" },
    review: { title: "Inspect evidence-backed feedback.", description: "Reviews will evaluate an immutable Architecture Revision against this Workspace's reasoning context.", action: "Prepare Review" },
  }[stage];
  return <section className="mt-10 border-y border-line py-10"><p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">{workspace.source ?? "Custom"} Workspace</p><h2 className="mt-3 font-display text-3xl font-semibold">{content.title}</h2><p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">{content.description}</p><button className="mt-7 inline-flex min-h-11 cursor-not-allowed items-center rounded-md border border-line px-4 text-sm font-semibold text-text-muted" disabled type="button">{content.action} · coming next</button></section>;
}
