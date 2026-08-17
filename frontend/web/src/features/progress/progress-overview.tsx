"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthenticatedApiClient, type PracticeProgress } from "@/lib/api/authenticated-client";

export function ProgressOverview() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const [progress, setProgress] = useState<PracticeProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let current = true;
    void api.getProgress().then((nextProgress) => {
      if (!current) return;
      setProgress(nextProgress);
      setError(null);
    }).catch(() => {
      if (current) setError("We could not load your progress. Try again.");
    });
    return () => { current = false; };
  }, [api, isLoaded, isSignedIn]);

  if (!isLoaded) return <p className="text-sm text-text-muted" role="status">Restoring your session...</p>;
  if (!isSignedIn) return <SignInPrompt />;
  if (!progress && !error) return <p className="text-sm text-text-muted" role="status">Loading your practice history...</p>;
  if (!progress) return <p className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p>;

  const trends = progress.qualifiedReviewTrends.slice(0, 3);
  const positiveTrend = trends.find((trend) => trend.change > 0);
  const negativeTrend = trends.find((trend) => trend.change < 0);
  const activity = progress.recentActivity.slice(0, 3);
  const hasEvidence = Boolean(positiveTrend || negativeTrend);
  const nextPractice = negativeTrend
    ? `Practice ${dimensionLabel(negativeTrend.dimension)} under a new Challenge constraint.`
    : "Explore another Challenge to build a comparable Review checkpoint.";

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-[9px]">
        <p className="font-mono text-[11px] font-normal leading-[14px] text-signal">PROGRESS / LEARNING REPORT</p>
        <h1 className="font-display text-[40px] font-medium leading-[43px] text-foreground">Evidence from repeated practice.</h1>
        <p className="max-w-[760px] text-[15px] font-normal leading-[23px] text-text-muted">Practice volume and Review changes are reported separately. Claims remain bounded by comparable evidence.</p>
      </header>
      <div className="h-px w-full bg-line" />

      {error ? <p className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}
      <div className="grid w-full gap-10 lg:grid-cols-2">
        <section aria-labelledby="recent-activity-heading" className="flex min-w-0 flex-col gap-3">
          <p className="font-mono text-[11px] font-normal leading-[14px] text-text-muted" id="recent-activity-heading">RECENT PRACTICE ACTIVITY</p>
          {activity.length ? <ol className="flex flex-col">{activity.map((item, index) => <ActivityRow activity={item} key={`${item.type}-${item.workspaceId}-${item.occurredAt ?? index}`} />)}</ol> : <p className="border-b border-line py-5 text-[14px] leading-[21px] text-text-muted">Your first Workspace will create the first entry in your practice history.</p>}
        </section>
        <section aria-labelledby="review-evidence-heading" className="flex min-w-0 flex-col gap-3">
          <p className="font-mono text-[11px] font-normal leading-[14px] text-text-muted" id="review-evidence-heading">REVIEW EVIDENCE</p>
          <p className="font-display text-[25px] font-normal leading-[33px] text-foreground">{progress.practiceVolume.completedReviewCount} completed Reviews</p>
          <p className="text-[13px] leading-5 text-text-muted">{trends.length ? `${trends.length} Review dimension${trends.length === 1 ? " is" : "s are"} comparable enough to discuss change. More evidence is needed before calling this improvement.` : "Two Reviews must share a Workspace and dimension before this report can call out change."}</p>
          <div className="flex flex-col gap-3">{trends.length ? trends.map((trend) => <DimensionTrend key={`${trend.workspaceId}-${trend.dimension}`} trend={trend} />) : <p className="border border-dashed border-line px-4 py-4 text-[13px] leading-5 text-text-muted">Complete two Reviews of the same Workspace with a shared dimension to inspect qualified change.</p>}</div>
          <div className="border-l-2 border-signal bg-surface-alt px-3 py-3">
            <p className="font-mono text-[11px] font-semibold leading-normal text-signal">INTERPRETATION</p>
            <p className="mt-1 text-[12px] leading-[17px] text-foreground">This report describes changes in recorded reasoning. It does not claim a composite skill score.</p>
          </div>
        </section>
      </div>

      <div className="h-px w-full bg-line" />
      {hasEvidence ? <div className="grid w-full gap-8 lg:grid-cols-3 lg:gap-[50px]">
        {positiveTrend ? <LearningNote label="RECURRING STRENGTH" text={`${dimensionLabel(positiveTrend.dimension)} has recorded improvement across comparable Reviews.`} /> : null}
        {negativeTrend ? <LearningNote label="RECURRING RISK" text={`${dimensionLabel(negativeTrend.dimension)} needs another practice pass across comparable Reviews.`} /> : null}
        <LearningNote label="SUGGESTED NEXT PRACTICE" text={nextPractice} action={<Link className="mt-3 inline-flex text-[13px] font-semibold text-signal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href="/challenges">Browse Challenges →</Link>} />
      </div> : <section className="flex flex-col gap-3 border border-dashed border-line px-5 py-5">
        <p className="font-mono text-[11px] leading-[14px] text-text-muted">LEARNING PATTERNS</p>
        <p className="max-w-2xl text-[15px] leading-[23px] text-foreground">Complete two comparable Reviews to uncover recurring strengths or risks. Until then, this report will stay descriptive.</p>
        <Link className="inline-flex w-fit text-[13px] font-semibold text-signal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href="/challenges">Browse Challenges →</Link>
      </section>}
    </div>
  );
}

function SignInPrompt() {
  return <section className="border border-line bg-surface px-6 py-8 text-center"><p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal">PRIVATE PROGRESS</p><h1 className="mt-4 font-display text-3xl font-medium">Sign in to see your practice history.</h1><p className="mx-auto mt-3 max-w-md text-[14px] leading-[21px] text-text-muted">Progress is built from your owned Workspaces and Reviews, not a public leaderboard.</p><SignInButton mode="modal"><button className="mt-6 inline-flex min-h-11 items-center rounded-[3px] bg-signal px-[18px] text-sm font-semibold text-text-on-dark hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus" type="button">Sign in to continue</button></SignInButton></section>;
}

function ActivityRow({ activity }: { activity: PracticeProgress["recentActivity"][number] }) {
  return <li className="flex min-h-[61.5px] items-start gap-4 border-b border-line py-3 last:border-b-0"><time className="w-[52px] shrink-0 font-mono text-[11px] leading-[14px] text-text-muted" dateTime={activity.occurredAt}>{formatActivityDate(activity.occurredAt)}</time><div className="flex min-w-0 flex-1 flex-col gap-1"><p className="truncate text-[14px] leading-[18px] text-foreground">{activity.workspaceName ?? "Owned Workspace"}</p><p className="text-[12px] leading-4 text-text-muted">{activityLabel(activity.type)}</p></div></li>;
}

function DimensionTrend({ trend }: { trend: PracticeProgress["qualifiedReviewTrends"][number] }) {
  const percentage = Math.max(8, Math.min(100, Math.round((trend.comparisonScore / 5) * 100)));
  const evidenceText = trend.change > 0 ? "Evidence strengthened" : trend.change < 0 ? "Evidence needs attention" : "No recorded change";
  const barColor = trend.change > 0 ? "bg-signal" : trend.change < 0 ? "bg-warning" : "bg-text-muted";
  return <div className="flex flex-col gap-[6px]"><div className="flex items-start justify-between gap-3"><p className="text-[12px] leading-4 text-foreground">{dimensionLabel(trend.dimension)}</p><p className="text-right font-mono text-[11px] leading-[14px] text-text-muted">{evidenceText} · {trend.baselineScore} → {trend.comparisonScore}</p></div><div aria-label={`${dimensionLabel(trend.dimension)} evidence strength`} className="h-[7px] w-full bg-line" role="img"><div className={`h-[7px] ${barColor}`} style={{ width: `${percentage}%` }} /></div></div>;
}

function LearningNote({ action, label, text }: { action?: React.ReactNode; label: string; text: string }) {
  return <section className="flex flex-col gap-[9px]"><p className="font-mono text-[11px] leading-[14px] text-text-muted">{label}</p><p className="text-[15px] leading-[23px] text-foreground">{text}</p>{action}</section>;
}

function activityLabel(type: PracticeProgress["recentActivity"][number]["type"]) {
  return type === "REVIEW_COMPLETED" ? "Review completed" : type === "SCENARIO_COMPLETED" ? "Scenario response" : "Decision recorded";
}

function dimensionLabel(value: string) {
  return ({ requirementsAndEstimation: "Requirements alignment", scalingAndPerformance: "Scaling and performance", reliabilityAndFailureHandling: "Reliability reasoning", dataModelingAndConsistency: "Data modeling and consistency", securityAndPrivacy: "Security and operability", tradeoffCommunication: "Trade-off clarity" } as Record<string, string>)[value] ?? value;
}

function formatActivityDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" }).toUpperCase();
}
