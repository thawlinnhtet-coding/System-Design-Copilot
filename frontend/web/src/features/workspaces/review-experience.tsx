"use client";

import { ChevronRight, ExternalLink, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiRequestError, useAuthenticatedApiClient, type ReviewDetails, type ReviewSubmission } from "@/lib/api/authenticated-client";

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
  revision: { id?: string; documentVersion?: number; createdAt?: string };
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

export function ReviewExperience({ adapter = {}, workspaceId, readOnly = false }: { adapter?: ReviewExperienceAdapter; workspaceId?: string; readOnly?: boolean }) {
  const api = useAuthenticatedApiClient();
  const [comparisonId, setComparisonId] = useState<string | null>(null);
  const [remote, setRemote] = useState<ReviewExperienceView[]>([]);
  const [loading, setLoading] = useState(Boolean(workspaceId));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isRetrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    let active = true;
    void api.getReviews(workspaceId)
      .then((items) => { if (active) { setError(null); setRemote(items.map(toView)); setLoading(false); } })
      .catch(() => { if (active) { setError("Review history could not be loaded. Your Workspace is unchanged."); setLoading(false); } });
    return () => { active = false; };
  }, [api, workspaceId]);
  const currentRemote = useMemo(() => remote[0], [remote]);
  useEffect(() => {
    if (!workspaceId || !currentRemote || !["PENDING", "PROCESSING"].includes(currentRemote.state)) return;
    const interval = window.setInterval(() => {
      void api.getReviews(workspaceId).then((items) => setRemote(items.map(toView))).catch(() => setError("Review status could not be refreshed. Your Workspace is unchanged."));
    }, 5000);
    return () => window.clearInterval(interval);
  }, [api, currentRemote, workspaceId]);

  async function submit() {
    if (!workspaceId) return;
    setSubmitting(true);
    try {
      const submitted = await api.submitReview(workspaceId, crypto.randomUUID());
      setRemote((current) => [toView(submitted), ...current]);
    } catch (caught) {
      setError(caught instanceof ApiRequestError && caught.status === 403 ? "Review access is unavailable for this account." : "The Review could not be requested. Your Workspace remains editable.");
    } finally { setSubmitting(false); }
  }

  async function retry(reviewId: string) {
    if (!workspaceId) return;
    setRetrying(true);
    try {
      const submitted = await api.retryReview(workspaceId, reviewId);
      setRemote((current) => current.map((item) => item.id === reviewId ? toView(submitted) : item));
    } catch { setError("This Review could not be retried. Its immutable checkpoint was not changed."); }
    finally { setRetrying(false); }
  }

  const review = adapter.current ?? currentRemote;
  const activeAdapter: ReviewExperienceAdapter = { ...adapter, current: review, history: adapter.history ?? remote.slice(1), onRetry: adapter.onRetry ?? (workspaceId ? (id) => void retry(id) : undefined), onCarryFinding: adapter.onCarryFinding ?? (workspaceId ? copyFinding : undefined) };

  if (!review && !workspaceId) return <ReviewIntegrationGap />;
  if (!review) return <ReviewSubmissionState loading={loading} readOnly={readOnly} submitting={isSubmitting} error={error} onSubmit={() => void submit()} />;

  return <section aria-label="Architecture Review" className="max-w-5xl">
    <header className="border-b border-line pb-7">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">Architecture Review / immutable checkpoint</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">{headingFor(review.state)}</h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">{descriptionFor(review)}</p>
      <p className="mt-5 font-mono text-xs text-text-muted">REVISION {review.revision.id} · DOCUMENT v{review.revision.documentVersion}</p>
    </header>

    {error ? <p className="mt-5 border-l-2 border-danger pl-4 text-sm text-danger" role="alert">{error}</p> : null}
    {review.state === "COMPLETED" ? <CompletedReview adapter={activeAdapter} review={review} /> : <ReviewStatus adapter={activeAdapter} review={review} retrying={isRetrying} />}
    {comparisonId ? <ReviewComparison current={review} comparison={activeAdapter.history?.find((item) => item.id === comparisonId)} /> : null}

    <ReviewHistory current={review} history={activeAdapter.history ?? []} comparisonId={comparisonId} onSelectComparison={setComparisonId} />
  </section>;
}

function ReviewIntegrationGap() {
  return <section aria-label="Review processing unavailable" className="max-w-3xl border-y border-line py-10"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">REVIEW / WAITING FOR PROCESSING</p><h2 className="mt-3 font-display text-3xl font-semibold">Prepare the evidence; keep practicing.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">Review processing is connected from the Workspace review stage.</p><button className="mt-6 inline-flex min-h-11 cursor-not-allowed items-center border border-line px-4 text-sm font-semibold text-text-muted" disabled type="button">Open a Workspace to request Review</button></section>;
}

function ReviewSubmissionState({ loading, readOnly, submitting, error, onSubmit }: { loading: boolean; readOnly: boolean; submitting: boolean; error: string | null; onSubmit: () => void }) {
  return <section aria-label="Review processing unavailable" className="max-w-3xl border-y border-line py-10">
    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">REVIEW / IMMUTABLE CHECKPOINT</p>
    <h2 className="mt-3 font-display text-3xl font-semibold">Ask for feedback on this revision.</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">Submitting records an immutable Architecture Revision. You can continue practicing while the Review is queued and processed.</p>
    {error ? <p className="mt-4 text-sm text-danger" role="alert">{error}</p> : null}
    <button className="mt-6 inline-flex min-h-11 items-center border border-signal bg-signal px-4 text-sm font-semibold text-text-on-dark disabled:opacity-50" disabled={loading || readOnly || submitting} onClick={onSubmit} type="button">{loading ? "Loading Reviews..." : submitting ? "Creating checkpoint..." : readOnly ? "Restore Workspace to request Review" : "Request Review"}</button>
  </section>;
}

function ReviewStatus({ adapter, review, retrying }: { adapter: ReviewExperienceAdapter; review: ReviewExperienceView; retrying: boolean }) {
  const retryable = review.state === "FAILED_RETRYABLE";
  return <section className="mt-8 border-l-2 border-signal bg-surface-raised px-5 py-6" aria-label="Review status">
    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">{review.state.replace("_", " ")}</p>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground">{review.failureMessage ?? statusMessage(review.state)}</p>
    {retryable ? <button className="mt-5 inline-flex min-h-11 items-center gap-2 border border-signal px-4 text-sm font-semibold text-signal disabled:opacity-50" disabled={!adapter.onRetry || retrying} onClick={() => adapter.onRetry?.(review.id)} type="button"><RotateCcw aria-hidden="true" size={16} />{retrying ? "Retrying..." : "Retry this revision"}</button> : null}
    {retryable && !adapter.onRetry ? <p className="mt-3 text-xs text-text-muted">Retry will reuse this immutable revision when the Review API adapter is connected.</p> : null}
  </section>;
}

function CompletedReview({ adapter, review }: { adapter: ReviewExperienceAdapter; review: ReviewExperienceView }) {
  return <div className="mt-9 space-y-10">
    <section><SectionLabel>Interpretation</SectionLabel><p className="mt-3 max-w-3xl text-lg leading-8 text-foreground">{review.interpretation ?? "The completed Review did not include an interpretation."}</p></section>
    <div className="grid gap-8 lg:grid-cols-2"><TextList label="Strengths worth preserving" items={review.strengths} /><TextList label="Prioritized risks" items={review.risks} /></div>
    <section><SectionLabel>Evidence-linked Findings</SectionLabel><div className="mt-4 divide-y divide-line border-y border-line">{(review.findings ?? []).map((finding) => <article className="py-5" key={finding.id}><p className={`font-mono text-[10px] uppercase tracking-[0.14em] ${severityClass(finding.severity)}`}>{finding.severity}</p><h3 className="mt-2 font-display text-xl font-semibold">{finding.title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-text-muted">{finding.impact}</p><p className="mt-3 max-w-3xl text-sm leading-6 text-foreground"><span className="font-semibold">Recommendation: </span>{finding.recommendation}</p><div className="mt-4 flex flex-wrap gap-3"><button className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-signal disabled:text-text-muted" disabled={!finding.evidenceLabel || !adapter.onInspectEvidence} onClick={() => adapter.onInspectEvidence?.(finding)} type="button"><ExternalLink aria-hidden="true" size={15} />{finding.evidenceLabel ? `Inspect ${finding.evidenceLabel}` : "No linked evidence"}</button><button className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-signal disabled:text-text-muted" disabled={!adapter.onCarryFinding} onClick={() => adapter.onCarryFinding?.(finding)} type="button">Copy to carry into reasoning <ChevronRight aria-hidden="true" size={15} /></button></div></article>)}</div></section>
    <div className="grid gap-8 lg:grid-cols-2"><TextList label="Uncertainty and missing context" items={review.uncertainty} /><TextList label="Recommended next actions" items={review.nextActions} ordered /></div>
    <section><SectionLabel>Seven supporting dimensions</SectionLabel><div className="mt-4 divide-y divide-line border-y border-line">{reviewDimensions.map((label) => { const dimension = review.dimensions?.find((item) => item.label === label); return <div className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start" key={label}><div><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-sm leading-6 text-text-muted">{dimension?.evidence ?? "Evidence will be available with the completed Review."}</p></div><p className="font-mono text-sm text-text-muted">{dimension ? `${dimension.score} / 5` : "— / 5"}</p></div>; })}</div><p className="mt-3 text-xs text-text-muted">Dimensions remain separate. This experience does not calculate a composite score.</p></section>
  </div>;
}

function ReviewHistory({ current, history, comparisonId, onSelectComparison }: { current: ReviewExperienceView; history: ReviewExperienceView[]; comparisonId: string | null; onSelectComparison: (id: string | null) => void }) {
  const completed = history.filter((item) => item.state === "COMPLETED" && item.id !== current.id);
  return <section className="mt-12 border-t border-line pt-8"><SectionLabel>Review history and comparison</SectionLabel><p className="mt-2 text-sm leading-6 text-text-muted">Reviews remain immutable checkpoints scoped to this Workspace. Select one completed Review to compare evidence and dimensions; no Workspace content changes.</p><ol className="mt-5 divide-y divide-line border-y border-line">{[current, ...history.filter((item) => item.id !== current.id)].map((item) => <li className="flex flex-wrap items-center justify-between gap-3 py-4" key={item.id}><div><p className="text-sm font-semibold">Revision {item.revision.id}</p><p className="mt-1 font-mono text-xs text-text-muted">{item.state.replace("_", " ")} · document v{item.revision.documentVersion}</p></div>{item.state === "COMPLETED" && item.id !== current.id ? <button className="min-h-10 text-sm font-semibold text-signal hover:underline" onClick={() => onSelectComparison(comparisonId === item.id ? null : item.id)} type="button">{comparisonId === item.id ? "Hide comparison" : "Compare"}</button> : null}</li>)}</ol>{completed.length === 0 ? <p className="mt-4 text-sm text-text-muted">Complete a second Review in this Workspace to compare evidence and dimensions.</p> : null}</section>;
}

function ReviewComparison({ current, comparison }: { current: ReviewExperienceView; comparison?: ReviewExperienceView }) {
  if (!comparison) return null;
  return <section className="mt-10 border border-line bg-surface p-5" aria-label="Review comparison"><SectionLabel>Selected immutable comparison</SectionLabel><div className="mt-4 grid gap-6 sm:grid-cols-2"><ComparisonReviewColumn label="Current revision" review={current} /><ComparisonReviewColumn label="Selected revision" review={comparison} /></div></section>;
}

function ComparisonReviewColumn({ label, review }: { label: string; review: ReviewExperienceView }) { return <div><p className="text-sm font-semibold">{label}</p><p className="mt-1 font-mono text-[10px] text-text-muted">{review.revision.id}</p><div className="mt-4 divide-y divide-line border-y border-line">{(review.dimensions ?? []).map((dimension) => <div className="flex justify-between gap-3 py-2 text-xs" key={dimension.label}><span>{dimension.label}</span><span className="font-mono text-text-muted">{dimension.score}/5</span></div>)}</div><p className="mt-4 text-xs text-text-muted">{review.findings?.length ?? 0} findings · {review.risks?.length ?? 0} risks</p></div>; }

function TextList({ label, items = [], ordered = false }: { label: string; items?: string[]; ordered?: boolean }) { const List = ordered ? "ol" : "ul"; return <section><SectionLabel>{label}</SectionLabel>{items.length ? <List className={`mt-3 space-y-3 text-sm leading-6 text-foreground ${ordered ? "list-decimal pl-5" : ""}`}>{items.map((item) => <li className={ordered ? "pl-1" : "border-l-2 border-line pl-3"} key={item}>{item}</li>)}</List> : <p className="mt-3 text-sm text-text-muted">No {label.toLowerCase()} were returned.</p>}</section>; }
function SectionLabel({ children }: { children: ReactNode }) { return <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{children}</p>; }
function headingFor(state: ReviewRequestState) { return state === "COMPLETED" ? "Review the current revision." : state === "PROCESSING" ? "Reviewing architecture…" : state === "PENDING" ? "Review queued." : state === "FAILED_RETRYABLE" ? "Review needs another attempt." : "Review could not be completed."; }
function descriptionFor(review: ReviewExperienceView) { return review.state === "COMPLETED" ? "Interpret the evidence, preserve what is working, and choose the next change deliberately." : "This Review evaluates a checkpoint. You can continue practicing while its status changes."; }
function statusMessage(state: ReviewRequestState) { return state === "PENDING" ? "The immutable checkpoint is recorded. Review processing has not started yet." : state === "PROCESSING" ? "Examining requirements, architecture evidence, and completed Scenarios. Your Workspace remains editable." : state === "FAILED_FINAL" ? "The Review reached a final failure state. Its checkpoint remains available, but this attempt cannot be retried." : "The Review could not be completed. Retrying will use the same immutable checkpoint and must not duplicate usage."; }
function severityClass(severity: ReviewFindingView["severity"]) { return severity === "critical" ? "text-danger" : severity === "high" ? "text-scenario" : "text-text-muted"; }

function toView(value: ReviewDetails | ReviewSubmission): ReviewExperienceView {
  const output = "output" in value && value.output && typeof value.output === "object" ? value.output as Record<string, unknown> : undefined;
  const scores = output?.scores && typeof output.scores === "object" ? output.scores as Record<string, unknown> : {};
  const findings = Array.isArray(output?.findings) ? output.findings as Array<Record<string, unknown>> : [];
  return {
    id: value.id ?? "pending-review",
    state: reviewState(value.status, value.errorCode),
    revision: { id: value.revisionId, createdAt: value.createdAt },
    interpretation: stringValue(output?.summary),
    risks: findings.map((finding) => stringValue(finding.message)).filter((item): item is string => Boolean(item)),
    findings: findings.map((finding, index) => ({
      id: stringValue(finding.id) ?? `finding-${index}`,
      severity: severityValue(finding.severity),
      title: stringValue(finding.message) ?? "Evidence-grounded finding",
      impact: stringValue(finding.message) ?? "Review the linked evidence before changing the Workspace.",
      recommendation: "Inspect the evidence, then decide what to carry into your reasoning.",
      evidenceLabel: evidenceLabel(finding),
    })),
    uncertainty: typeof output?.uncertainty === "number" ? [`The Review reported ${(output.uncertainty * 100).toFixed(0)}% uncertainty; inspect its evidence before acting.`] : [],
    nextActions: findings.length ? ["Inspect the linked evidence and manually record the next decision."] : [],
    dimensions: reviewDimensions.map((label) => ({ label, score: scoreFor(label, scores), evidence: "Score derived from this immutable Review checkpoint." })).filter((item) => item.score > 0),
    strengths: Array.isArray(output?.strengths) ? output.strengths.filter((item): item is string => typeof item === "string") : [],
    failureMessage: value.errorCode ? `Review processing reported: ${value.errorCode.replaceAll("_", " ")}.` : undefined,
  };
}

function reviewState(status: string | undefined, errorCode?: string | null): ReviewRequestState { return status === "COMPLETED" ? "COMPLETED" : status === "FAILED_FINAL" || (status === "FAILED" && (errorCode === "invalid_review_output" || errorCode === "review_quota_exceeded")) ? "FAILED_FINAL" : status === "FAILED" ? "FAILED_RETRYABLE" : status === "PROCESSING" || status === "RETRYING" ? "PROCESSING" : "PENDING"; }
function stringValue(value: unknown) { return typeof value === "string" && value.trim() ? value : undefined; }
function severityValue(value: unknown): ReviewFindingView["severity"] { const severity = stringValue(value)?.toLowerCase(); return severity === "critical" || severity === "high" || severity === "medium" || severity === "low" || severity === "observation" ? severity : "observation"; }
function evidenceLabel(finding: Record<string, unknown>) { const evidence = Array.isArray(finding.evidence) ? finding.evidence[0] : undefined; return evidence && typeof evidence === "object" ? stringValue((evidence as Record<string, unknown>).sourceId) : undefined; }
function scoreFor(label: string, scores: Record<string, unknown>) { const key = { "Requirements alignment": "requirementsAlignment", "Scalability and capacity": "scalabilityAndCapacity", "Reliability and failure handling": "reliabilityAndFailureHandling", "Data model and consistency": "dataModelingAndConsistency", "Performance and bottlenecks": "performanceAndBottlenecks", "Security and operability": "securityAndOperability", "Trade-off reasoning": "tradeoffCommunication" }[label]; const value = key ? scores[key] : undefined; return typeof value === "number" ? value : 0; }
function copyFinding(finding: ReviewFindingView) { void navigator.clipboard?.writeText(`${finding.title}\n${finding.impact}\n${finding.recommendation}`); }
