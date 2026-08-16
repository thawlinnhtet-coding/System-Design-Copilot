"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowRight, CheckCircle2, ClipboardCheck, Layers3, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthenticatedApiClient, type CurrentEntitlements, type PracticeProgress } from "@/lib/api/authenticated-client";

export function ProgressOverview() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const [progress, setProgress] = useState<PracticeProgress | null>(null);
  const [usage, setUsage] = useState<CurrentEntitlements | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let current = true;
    void Promise.all([api.getProgress(), api.getUsage()]).then(([nextProgress, nextUsage]) => {
      if (!current) return;
      setProgress(nextProgress); setUsage(nextUsage); setError(null);
    }).catch(() => { if (current) setError("We could not load your progress. Try again."); });
    return () => { current = false; };
  }, [api, isLoaded, isSignedIn]);

  if (!isLoaded) return <p className="text-sm text-text-muted">Restoring your session...</p>;
  if (!isSignedIn) return <SignInPrompt />;
  if (!progress && !error) return <p className="text-sm text-text-muted">Loading your practice history...</p>;
  if (!progress) return <p className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p>;

  const volume = progress.practiceVolume;
  return <div className="space-y-8">
    {error ? <p className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}
    <section className="grid gap-4 sm:grid-cols-3">
      <ProgressStat icon={<Layers3 aria-hidden="true" size={18} />} label="Practice volume" value={`${volume.ownedWorkspaceCount}`} detail="owned Workspaces" />
      <ProgressStat icon={<ClipboardCheck aria-hidden="true" size={18} />} label="Scenario practice" value={`${volume.completedScenarioCount}`} detail="completed Scenarios" />
      <ProgressStat icon={<CheckCircle2 aria-hidden="true" size={18} />} label="Review evidence" value={`${volume.completedReviewCount}`} detail="completed Reviews" />
    </section>
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Recent activity</p><h2 className="mt-2 font-display text-2xl font-semibold">Keep the thread.</h2></div><Sparkles aria-hidden="true" className="text-signal" size={20} /></div>
        {progress.recentActivity.length ? <ol className="mt-6 divide-y divide-line">{progress.recentActivity.map((activity, index) => <ActivityRow activity={activity} key={`${activity.type}-${activity.workspaceId}-${activity.occurredAt ?? index}`} />)}</ol> : <p className="mt-6 rounded-md border border-dashed border-line p-6 text-sm text-text-muted">Your first Workspace will create the first entry in your practice history.</p>}
      </div>
      <aside className="rounded-lg border border-line bg-surface-alt p-6"><p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Qualified trends</p><h2 className="mt-2 font-display text-2xl font-semibold">Evidence over streaks.</h2><div className="mt-6 space-y-5 text-sm leading-6"><div><p className="font-semibold">Practice volume</p><p className="mt-1 text-text-muted">{volume.activeWorkspaceCount} active Workspace{volume.activeWorkspaceCount === 1 ? "" : "s"} and {volume.completedScenarioCount} completed Scenarios describe practice activity, not skill improvement.</p></div><div className="border-t border-line pt-5"><p className="font-semibold">Review-score changes</p><p className="mt-1 text-text-muted">Only dimensions present in two completed Reviews of the same Workspace are shown below. They are evidence to inspect, not proof of improvement.</p></div></div><Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-signal hover:underline" href="/practice">Continue practice <ArrowRight aria-hidden="true" size={15} /></Link></aside>
    </section>
    <section className="rounded-lg border border-line bg-surface p-6"><p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Comparable Review dimensions</p><h2 className="mt-2 font-display text-2xl font-semibold">Compare a design’s own checkpoints.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted">Each change compares two immutable Reviews in one Workspace. Dimensions are never combined into a composite score.</p>{progress.qualifiedReviewTrends.length ? <ol className="mt-6 divide-y divide-line border-y border-line">{progress.qualifiedReviewTrends.map((trend) => <li className="flex flex-wrap items-center justify-between gap-4 py-4" key={`${trend.workspaceId}-${trend.dimension}`}><div><p className="text-sm font-semibold">{dimensionLabel(trend.dimension)}</p><p className="mt-1 text-xs text-text-muted">{trend.workspaceName ?? "Owned Workspace"} · {trend.baselineScore} → {trend.comparisonScore} / 5</p></div><p className={`font-mono text-sm ${trend.change > 0 ? "text-signal" : trend.change < 0 ? "text-danger" : "text-text-muted"}`}>{trend.change > 0 ? "+" : ""}{trend.change}</p></li>)}</ol> : <p className="mt-6 rounded-md border border-dashed border-line p-5 text-sm text-text-muted">Complete two Reviews of the same Workspace with a shared dimension to inspect a qualified change.</p>}</section>
    <section className="rounded-lg border border-line bg-surface p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Usage context</p><h2 className="mt-2 font-display text-2xl font-semibold">Your month in practice.</h2></div><Link className="text-sm font-semibold text-signal hover:underline" href="/account">View plan and allowances</Link></div><p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted">{usage?.reviews?.used ?? 0} full Review{usage?.reviews?.used === 1 ? "" : "s"} completed this month. Usage helps explain activity; it is not a proxy for design quality.</p></section>
  </div>;
}

function SignInPrompt() { return <section className="rounded-lg border border-line bg-surface p-8 text-center"><p className="font-mono text-xs uppercase tracking-[0.18em] text-signal">Private progress</p><h2 className="mt-4 font-display text-3xl font-semibold">Sign in to see your practice history.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted">Progress is built from your owned Workspaces and Reviews, not a public leaderboard.</p><SignInButton mode="modal"><button className="mt-6 inline-flex min-h-11 items-center rounded-md bg-signal px-4 text-sm font-semibold text-text-on-dark hover:brightness-110" type="button">Sign in to continue</button></SignInButton></section>; }
function ProgressStat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <article className="rounded-lg border border-line bg-surface p-5"><div className="flex size-9 items-center justify-center rounded-md bg-signal-soft text-signal">{icon}</div><p className="mt-5 text-sm text-text-muted">{label}</p><p className="mt-1 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-text-muted">{detail}</p></article>; }
function ActivityRow({ activity }: { activity: PracticeProgress["recentActivity"][number] }) { return <li className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate font-semibold">{activity.workspaceName ?? "Owned Workspace"}</p><p className="mt-1 text-sm text-text-muted">{activityLabel(activity.type)}</p></div><time className="shrink-0 text-xs text-text-muted" dateTime={activity.occurredAt}>{formatRelativeDate(activity.occurredAt)}</time></li>; }
function activityLabel(type: PracticeProgress["recentActivity"][number]["type"]) { return type === "REVIEW_COMPLETED" ? "Completed a Review" : type === "SCENARIO_COMPLETED" ? "Completed a Scenario" : "Updated Workspace activity"; }
function dimensionLabel(value: string) { return ({ requirementsAndEstimation: "Requirements alignment", scalingAndPerformance: "Scaling and performance", reliabilityAndFailureHandling: "Reliability and failure handling", dataModelingAndConsistency: "Data modeling and consistency", securityAndPrivacy: "Security and operability", tradeoffCommunication: "Trade-off reasoning" } as Record<string, string>)[value] ?? value; }
function formatRelativeDate(value?: string) { if (!value) return "No activity yet"; const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000); if (days <= 0) return "Today"; if (days === 1) return "Yesterday"; return `${days} days ago`; }
