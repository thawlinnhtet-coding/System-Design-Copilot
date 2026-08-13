"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowRight, CheckCircle2, Clock3, Layers3, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuthenticatedApiClient, type CurrentEntitlements, type WorkspaceSummary } from "@/lib/api/authenticated-client";
import { useEffect, useState } from "react";

export function ProgressOverview() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [usage, setUsage] = useState<CurrentEntitlements | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let current = true;
    Promise.all([api.getWorkspaces(), api.getUsage()]).then(([nextWorkspaces, nextUsage]) => {
      if (!current) return;
      setWorkspaces(nextWorkspaces);
      setUsage(nextUsage);
    }).catch(() => {
      if (current) setError("We could not load your progress. Try again.");
    }).finally(() => {
      if (current) setHasLoaded(true);
    });
    return () => { current = false; };
  }, [api, isLoaded, isSignedIn]);

  if (!isLoaded) return <p className="text-sm text-text-muted">Restoring your session...</p>;
  if (!isSignedIn) {
    return <section className="rounded-lg border border-line bg-surface p-8 text-center"><p className="font-mono text-xs uppercase tracking-[0.18em] text-signal">Private progress</p><h2 className="mt-4 font-display text-3xl font-semibold">Sign in to see your practice history.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted">Progress is built from your owned Workspaces and Reviews, not a public leaderboard.</p><SignInButton mode="modal"><button className="mt-6 inline-flex min-h-11 items-center rounded-md bg-signal px-4 text-sm font-semibold text-text-on-dark hover:brightness-110" type="button">Sign in to continue</button></SignInButton></section>;
  }

  if (!hasLoaded && !error) return <p className="text-sm text-text-muted">Loading your practice history...</p>;

  const active = workspaces.filter((workspace) => workspace.status !== "ARCHIVED");
  const completedReviews = workspaces.filter((workspace) => workspace.latestReviewState === "COMPLETED");
  const averageProgress = active.length ? Math.round(active.reduce((sum, workspace) => sum + (workspace.progressPercent ?? 0), 0) / active.length) : 0;
  const recent = [...workspaces].sort((a, b) => dateValue(b.updatedAt) - dateValue(a.updatedAt)).slice(0, 5);

  return (
    <div className="space-y-8">
      {error ? <p className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}
      <section className="grid gap-4 sm:grid-cols-3">
        <ProgressStat icon={<Layers3 aria-hidden="true" size={18} />} label="Practice volume" value={`${active.length}`} detail="active Workspaces" />
        <ProgressStat icon={<Clock3 aria-hidden="true" size={18} />} label="In motion" value={`${averageProgress}%`} detail="average Workspace progress" />
        <ProgressStat icon={<CheckCircle2 aria-hidden="true" size={18} />} label="Review evidence" value={`${completedReviews.length}`} detail="completed Reviews" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Recent activity</p><h2 className="mt-2 font-display text-2xl font-semibold">Keep the thread.</h2></div><Sparkles aria-hidden="true" className="text-signal" size={20} /></div>
          {recent.length ? <div className="mt-6 divide-y divide-line">{recent.map((workspace) => <ActivityRow key={workspace.id} workspace={workspace} />)}</div> : <p className="mt-6 rounded-md border border-dashed border-line p-6 text-sm text-text-muted">Your first Workspace will create the first entry in your practice history.</p>}
        </div>
        <aside className="rounded-lg border border-line bg-surface-alt p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Qualified trends</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Evidence over streaks.</h2>
          <div className="mt-6 space-y-5 text-sm leading-6">
            <div><p className="font-semibold">Practice volume</p><p className="mt-1 text-text-muted">{active.length} active Workspace{active.length === 1 ? "" : "s"} shows activity, not skill improvement.</p></div>
            <div className="border-t border-line pt-5"><p className="font-semibold">Review-score change</p><p className="mt-1 text-text-muted">{completedReviews.length > 1 ? "Comparable Review changes can be inspected from the Review history." : "Not enough comparable completed Reviews to claim a trend yet."}</p></div>
          </div>
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-signal hover:underline" href="/practice">Continue practice <ArrowRight aria-hidden="true" size={15} /></Link>
        </aside>
      </section>

      <section className="rounded-lg border border-line bg-surface p-6">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Usage context</p><h2 className="mt-2 font-display text-2xl font-semibold">Your month in practice.</h2></div><Link className="text-sm font-semibold text-signal hover:underline" href="/account">View plan and allowances</Link></div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted">{usage?.reviews?.used ?? 0} full Review{usage?.reviews?.used === 1 ? "" : "s"} completed this month. Usage helps explain activity; it is not a proxy for design quality.</p>
      </section>
    </div>
  );
}

function ProgressStat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <article className="rounded-lg border border-line bg-surface p-5"><div className="flex size-9 items-center justify-center rounded-md bg-signal-soft text-signal">{icon}</div><p className="mt-5 text-sm text-text-muted">{label}</p><p className="mt-1 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-text-muted">{detail}</p></article>;
}

function ActivityRow({ workspace }: { workspace: WorkspaceSummary }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate font-semibold">{workspace.name ?? "Untitled Workspace"}</p><p className="mt-1 text-sm text-text-muted">{workspace.status === "ARCHIVED" ? "Archived" : `${workspace.progressPercent ?? 0}% complete`} · {workspace.saveState ?? "Not started"}</p></div><time className="shrink-0 text-xs text-text-muted" dateTime={workspace.updatedAt ?? undefined}>{formatRelativeDate(workspace.updatedAt)}</time></div>;
}

function dateValue(value?: string) { return value ? new Date(value).getTime() : 0; }
function formatRelativeDate(value?: string) { if (!value) return "No activity yet"; const days = Math.floor((Date.now() - dateValue(value)) / 86_400_000); if (days <= 0) return "Today"; if (days === 1) return "Yesterday"; return `${days} days ago`; }
