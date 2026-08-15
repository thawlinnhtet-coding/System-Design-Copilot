"use client";

import { ChevronRight, ExternalLink, RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { ArchitectureRevisionResponse } from "@/lib/api/authenticated-client";

export type ReviewRequestState = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED_RETRYABLE" | "FAILED_FINAL";

export type ReviewFindingView = {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "observation";
  title: string;
  impact: string;
  recommendation: string;
  evidenceLabel?: string;
};

export type ReviewExperienceView = {
  id: string;
  state: ReviewRequestState;
  revision: Pick<ArchitectureRevisionResponse, "id" | "documentVersion" | "createdAt">;
  interpretation?: string;
  strengths?: string[];
  risks?: string[];
  findings?: ReviewFindingView[];
  uncertainty?: string[];
  nextActions?: string[];
  dimensions?: Array<{ label: string; score: number; evidence: string }>;
  failureMessage?: string;
};

export type ReviewExperienceAdapter = {
  current?: ReviewExperienceView;
  history?: ReviewExperienceView[];
  onRetry?: (reviewId: string) => void;
  onInspectEvidence?: (finding: ReviewFindingView) => void;
  onCarryFinding?: (finding: ReviewFindingView) => void;
};

const reviewDimensions = ["Requirements alignment", "Scalability and capacity", "Reliability and failure handling", "Data model and consistency", "Performance and bottlenecks", "Security and operability", "Trade-off reasoning"];

export function ReviewExperience({ adapter = {} }: { adapter?: ReviewExperienceAdapter }) {
  const [comparisonId, setComparisonId] = useState<string | null>(null);
  const review = adapter.current;

  if (!review) return <ReviewIntegrationGap />;

  return <section aria-label="Architecture Review" className="max-w-5xl">
    <header className="border-b border-line pb-7">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">Architecture Review / immutable checkpoint</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">{headingFor(review.state)}</h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">{descriptionFor(review)}</p>
      <p className="mt-5 font-mono text-xs text-text-muted">REVISION {review.revision.id} · DOCUMENT v{review.revision.documentVersion}</p>
    </header>

    {review.state === "COMPLETED" ? <CompletedReview adapter={adapter} review={review} /> : <ReviewStatus adapter={adapter} review={review} />}

    <ReviewHistory current={review} history={adapter.history ?? []} comparisonId={comparisonId} onSelectComparison={setComparisonId} />
  </section>;
}

function ReviewIntegrationGap() {
  return <section aria-label="Review processing unavailable" className="max-w-3xl border-y border-line py-10">
    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">REVIEW / WAITING FOR PROCESSING</p>
    <h2 className="mt-3 font-display text-3xl font-semibold">Prepare the evidence; keep practicing.</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">Review submission, checkpoint creation, status polling, retry, and saved feedback are connected by Reliable Review Processing. That service is not available in this branch yet, so no Review has been requested from this screen.</p>
    <button className="mt-6 inline-flex min-h-11 cursor-not-allowed items-center border border-line px-4 text-sm font-semibold text-text-muted" disabled type="button">Review processing is being connected</button>
  </section>;
}

function ReviewStatus({ adapter, review }: { adapter: ReviewExperienceAdapter; review: ReviewExperienceView }) {
  const retryable = review.state === "FAILED_RETRYABLE";
  return <section className="mt-8 border-l-2 border-signal bg-surface-raised px-5 py-6" aria-label="Review status">
    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">{review.state.replace("_", " ")}</p>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground">{review.failureMessage ?? statusMessage(review.state)}</p>
    {retryable ? <button className="mt-5 inline-flex min-h-11 items-center gap-2 border border-signal px-4 text-sm font-semibold text-signal disabled:opacity-50" disabled={!adapter.onRetry} onClick={() => adapter.onRetry?.(review.id)} type="button"><RotateCcw aria-hidden="true" size={16} />Retry this revision</button> : null}
    {retryable && !adapter.onRetry ? <p className="mt-3 text-xs text-text-muted">Retry will reuse this immutable revision when the Review API adapter is connected.</p> : null}
  </section>;
}

function CompletedReview({ adapter, review }: { adapter: ReviewExperienceAdapter; review: ReviewExperienceView }) {
  return <div className="mt-9 space-y-10">
    <section><SectionLabel>Interpretation</SectionLabel><p className="mt-3 max-w-3xl text-lg leading-8 text-foreground">{review.interpretation ?? "The completed Review did not include an interpretation."}</p></section>
    <div className="grid gap-8 lg:grid-cols-2"><TextList label="Strengths worth preserving" items={review.strengths} /><TextList label="Prioritized risks" items={review.risks} /></div>
    <section><SectionLabel>Evidence-linked Findings</SectionLabel><div className="mt-4 divide-y divide-line border-y border-line">{(review.findings ?? []).map((finding) => <article className="py-5" key={finding.id}><p className={`font-mono text-[10px] uppercase tracking-[0.14em] ${severityClass(finding.severity)}`}>{finding.severity}</p><h3 className="mt-2 font-display text-xl font-semibold">{finding.title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-text-muted">{finding.impact}</p><p className="mt-3 max-w-3xl text-sm leading-6 text-foreground"><span className="font-semibold">Recommendation: </span>{finding.recommendation}</p><div className="mt-4 flex flex-wrap gap-3"><button className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-signal disabled:text-text-muted" disabled={!finding.evidenceLabel || !adapter.onInspectEvidence} onClick={() => adapter.onInspectEvidence?.(finding)} type="button"><ExternalLink aria-hidden="true" size={15} />{finding.evidenceLabel ? `Inspect ${finding.evidenceLabel}` : "No linked evidence"}</button><button className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-signal disabled:text-text-muted" disabled={!adapter.onCarryFinding} onClick={() => adapter.onCarryFinding?.(finding)} type="button">Carry into reasoning <ChevronRight aria-hidden="true" size={15} /></button></div></article>)}</div></section>
    <div className="grid gap-8 lg:grid-cols-2"><TextList label="Uncertainty and missing context" items={review.uncertainty} /><TextList label="Recommended next actions" items={review.nextActions} ordered /></div>
    <section><SectionLabel>Seven supporting dimensions</SectionLabel><div className="mt-4 divide-y divide-line border-y border-line">{reviewDimensions.map((label) => { const dimension = review.dimensions?.find((item) => item.label === label); return <div className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start" key={label}><div><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-sm leading-6 text-text-muted">{dimension?.evidence ?? "Evidence will be available with the completed Review."}</p></div><p className="font-mono text-sm text-text-muted">{dimension ? `${dimension.score} / 5` : "— / 5"}</p></div>; })}</div><p className="mt-3 text-xs text-text-muted">Dimensions remain separate. This experience does not calculate a composite score.</p></section>
  </div>;
}

function ReviewHistory({ current, history, comparisonId, onSelectComparison }: { current: ReviewExperienceView; history: ReviewExperienceView[]; comparisonId: string | null; onSelectComparison: (id: string | null) => void }) {
  const completed = history.filter((item) => item.state === "COMPLETED" && item.id !== current.id);
  return <section className="mt-12 border-t border-line pt-8"><SectionLabel>Review history and comparison</SectionLabel><p className="mt-2 text-sm leading-6 text-text-muted">Reviews remain immutable checkpoints scoped to this Workspace. Select one completed Review to prepare a comparison; no Workspace content changes.</p><ol className="mt-5 divide-y divide-line border-y border-line">{[current, ...history.filter((item) => item.id !== current.id)].map((item) => <li className="flex flex-wrap items-center justify-between gap-3 py-4" key={item.id}><div><p className="text-sm font-semibold">Revision {item.revision.id}</p><p className="mt-1 font-mono text-xs text-text-muted">{item.state.replace("_", " ")} · document v{item.revision.documentVersion}</p></div>{item.state === "COMPLETED" && item.id !== current.id ? <button className="min-h-10 text-sm font-semibold text-signal hover:underline" onClick={() => onSelectComparison(comparisonId === item.id ? null : item.id)} type="button">{comparisonId === item.id ? "Comparison selected" : "Compare"}</button> : null}</li>)}</ol>{completed.length === 0 ? <p className="mt-4 text-sm text-text-muted">Complete a second Review in this Workspace to compare evidence and dimensions.</p> : comparisonId ? <p className="mt-4 border-l-2 border-signal pl-4 text-sm text-text-muted">Comparison selected. The API adapter will load both immutable Review records when #14 is integrated.</p> : null}</section>;
}

function TextList({ label, items = [], ordered = false }: { label: string; items?: string[]; ordered?: boolean }) { const List = ordered ? "ol" : "ul"; return <section><SectionLabel>{label}</SectionLabel>{items.length ? <List className={`mt-3 space-y-3 text-sm leading-6 text-foreground ${ordered ? "list-decimal pl-5" : ""}`}>{items.map((item) => <li className={ordered ? "pl-1" : "border-l-2 border-line pl-3"} key={item}>{item}</li>)}</List> : <p className="mt-3 text-sm text-text-muted">No {label.toLowerCase()} were returned.</p>}</section>; }
function SectionLabel({ children }: { children: ReactNode }) { return <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{children}</p>; }
function headingFor(state: ReviewRequestState) { return state === "COMPLETED" ? "Review the current revision." : state === "PROCESSING" ? "Reviewing architecture…" : state === "PENDING" ? "Review queued." : state === "FAILED_RETRYABLE" ? "Review needs another attempt." : "Review could not be completed."; }
function descriptionFor(review: ReviewExperienceView) { return review.state === "COMPLETED" ? "Interpret the evidence, preserve what is working, and choose the next change deliberately." : "This Review evaluates a checkpoint. You can continue practicing while its status changes."; }
function statusMessage(state: ReviewRequestState) { return state === "PENDING" ? "The immutable checkpoint is recorded. Review processing has not started yet." : state === "PROCESSING" ? "Examining requirements, architecture evidence, and completed Scenarios. Your Workspace remains editable." : state === "FAILED_FINAL" ? "The Review reached a final failure state. Its checkpoint remains available, but this attempt cannot be retried." : "The Review could not be completed. Retrying will use the same immutable checkpoint and must not duplicate usage."; }
function severityClass(severity: ReviewFindingView["severity"]) { return severity === "critical" ? "text-danger" : severity === "high" ? "text-scenario" : "text-text-muted"; }
