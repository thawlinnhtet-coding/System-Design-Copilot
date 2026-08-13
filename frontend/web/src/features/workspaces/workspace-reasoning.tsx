"use client";

import { useAuthenticatedApiClient, type Assumption, type AssumptionInput, type Decision, type DecisionInput, type QuestionInput, type Requirement, type RequirementInput, type UnresolvedQuestion, type WorkspaceReasoning } from "@/lib/api/authenticated-client";
import { useEffect, useState } from "react";

const buttonClass = "inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton = `${buttonClass} bg-signal text-text-on-dark hover:brightness-110`;

export function WorkspaceReasoning({ workspaceId, readOnly = false, reviewBriefRequired = false }: { workspaceId: string; readOnly?: boolean; reviewBriefRequired?: boolean }) {
  const api = useAuthenticatedApiClient();
  const [reasoning, setReasoning] = useState<WorkspaceReasoning | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setReasoning(await api.getReasoning(workspaceId));
  }

  useEffect(() => {
    let current = true;
    api.getReasoning(workspaceId)
      .then((value) => {
        if (current) setReasoning(value);
      })
      .catch(() => {
        if (current) setError("We could not load the Workspace reasoning. Try again.");
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [api, workspaceId]);

  async function run(action: () => Promise<unknown>) {
    if (readOnly) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch {
      setError("That reasoning change could not be saved. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-text-muted">Restoring your reasoning...</p>;
  if (!reasoning) return <p className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error ?? "Reasoning is unavailable."}</p>;

  const hasReviewBrief = Boolean(reasoning.reviewBrief?.systemDescription?.trim() && reasoning.reviewBrief?.reviewGoal?.trim());
  if (reviewBriefRequired && !hasReviewBrief) {
    return <div className="space-y-10"><ReviewBriefForm busy={busy} brief={reasoning.reviewBrief} requiredAtEntry onSave={(body) => run(() => api.saveReviewBrief(workspaceId, body))} /></div>;
  }

  return (
    <div className="space-y-10">
      {error ? <p className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}
      {readOnly ? <p className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning" role="status">This Workspace is archived. Restore it from Practice Home before editing its reasoning.</p> : null}
      <fieldset className="min-w-0" disabled={readOnly}>
      <ReasoningSection eyebrow="Requirements" title="What must this system do?" description="Keep functional and quality needs explicit before choosing components.">
        <form className="grid gap-3 border-b border-line pb-5 lg:grid-cols-[minmax(0,1fr)_9rem_9rem_auto]" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          run(() => api.createRequirement(workspaceId, requirementBody(form)));
          event.currentTarget.reset();
        }}>
          <input aria-label="Requirement statement" className="field" name="statement" placeholder="e.g. Redirect requests stay below 120 ms p99" required />
          <select aria-label="Requirement kind" className="field" defaultValue="FUNCTIONAL" name="kind"><option value="FUNCTIONAL">Functional</option><option value="NON_FUNCTIONAL">Quality</option></select>
          <select aria-label="Requirement priority" className="field" defaultValue="MUST" name="priority"><option value="MUST">Must</option><option value="SHOULD">Should</option><option value="COULD">Could</option></select>
          <button className={primaryButton} disabled={busy} type="submit">Add requirement</button>
        </form>
        <div className="divide-y divide-line">
          {reasoning.requirements.length === 0 ? <EmptyState text="No Requirements yet. Start with the promise the system must keep." /> : reasoning.requirements.map((item) => <RequirementRow busy={busy} item={item} key={item.id} onDelete={() => run(() => api.deleteRequirement(workspaceId, item.id ?? ""))} onSave={(body) => run(() => api.updateRequirement(workspaceId, item.id ?? "", { ...body, source: item.source }))} />)}
        </div>
      </ReasoningSection>

      <ReasoningSection eyebrow="Assumptions and estimates" title="What are we taking as true?" description="Record the numbers and conditions that shape the design.">
        <form className="grid gap-3 border-b border-line pb-5 lg:grid-cols-[11rem_11rem_9rem_minmax(0,1fr)_auto]" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          run(() => api.createAssumption(workspaceId, assumptionBody(form)));
          event.currentTarget.reset();
        }}>
          <input aria-label="Assumption category" className="field" name="category" placeholder="Traffic" required />
          <input aria-label="Assumption value" className="field" name="quantitativeValue" placeholder="100M" />
          <input aria-label="Assumption unit" className="field" name="unit" placeholder="requests/month" />
          <input aria-label="Assumption rationale" className="field" name="rationale" placeholder="Why does this estimate matter?" />
          <ReferenceSelect label="Related requirements" name="relatedRequirementIds" options={reasoning.requirements.map((item) => ({ id: item.id, label: item.statement }))} />
          <button className={primaryButton} disabled={busy} type="submit">Add assumption</button>
        </form>
        <div className="divide-y divide-line">
          {reasoning.assumptions.length === 0 ? <EmptyState text="No Assumptions yet. Add the first scale, latency, or reliability estimate." /> : reasoning.assumptions.map((item) => <AssumptionRow busy={busy} item={item} key={item.id} onDelete={() => run(() => api.deleteAssumption(workspaceId, item.id ?? ""))} onSave={(body) => run(() => api.updateAssumption(workspaceId, item.id ?? "", { ...body, relatedRequirementIds: item.relatedRequirementIds, source: item.source }))} />)}
        </div>
      </ReasoningSection>

      <ReasoningSection eyebrow="Unresolved questions" title="What still needs an answer?" description="Keep uncertainty visible instead of burying it in the architecture.">
        <form className="grid gap-3 border-b border-line pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          run(() => api.createQuestion(workspaceId, questionBody(form)));
          event.currentTarget.reset();
        }}>
          <input aria-label="Unresolved question" className="field" name="question" placeholder="e.g. Do short codes need to be guess-proof?" required />
          <input aria-label="Why the question matters" className="field" name="whyItMatters" placeholder="What decision will this change?" required />
          <ReferenceSelect label="Related requirements" name="relatedRequirementIds" options={reasoning.requirements.map((item) => ({ id: item.id, label: item.statement }))} />
          <ReferenceSelect label="Related assumptions" name="relatedAssumptionIds" options={reasoning.assumptions.map((item) => ({ id: item.id, label: item.category }))} />
          <button className={primaryButton} disabled={busy} type="submit">Add question</button>
        </form>
        <div className="divide-y divide-line">
          {reasoning.questions.length === 0 ? <EmptyState text="No open questions. Add one when an unknown could change the design." /> : reasoning.questions.map((item) => <QuestionRow busy={busy} item={item} key={item.id} onDelete={() => run(() => api.deleteQuestion(workspaceId, item.id ?? ""))} onSave={(body) => run(() => api.updateQuestion(workspaceId, item.id ?? "", { ...body, relatedRequirementIds: item.relatedRequirementIds, relatedAssumptionIds: item.relatedAssumptionIds, resultingDecisionId: item.resultingDecisionId }))} />)}
        </div>
      </ReasoningSection>

      <ReasoningSection eyebrow="Decision log" title="Why did we choose this?" description="Capture the reasoning behind important architecture choices.">
        <form className="grid gap-3 border-b border-line pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          run(() => api.createDecision(workspaceId, decisionBody(form)));
          event.currentTarget.reset();
        }}>
          <input aria-label="Decision title" className="field" name="title" placeholder="Decision title" required />
          <input aria-label="Chosen option" className="field" name="chosenOption" placeholder="Chosen option" required />
          <input aria-label="Decision rationale" className="field" name="rationale" placeholder="Reason and trade-off" required />
          <textarea aria-label="Alternatives considered" className="field" name="alternatives" placeholder="Alternatives considered" />
          <textarea aria-label="Risks" className="field" name="risks" placeholder="Risks" />
          <textarea aria-label="Evidence references" className="field" name="evidenceRefs" placeholder="Evidence references, one per line" />
          <button className={primaryButton} disabled={busy} type="submit">Add decision</button>
        </form>
        <div className="divide-y divide-line">
          {reasoning.decisions.length === 0 ? <EmptyState text="No Decisions yet. Record the first trade-off you are willing to defend." /> : reasoning.decisions.map((item) => <DecisionRow busy={busy} item={item} key={item.id} onDelete={() => run(() => api.deleteDecision(workspaceId, item.id ?? ""))} onSave={(body) => run(() => api.updateDecision(workspaceId, item.id ?? "", { ...body, alternatives: item.alternatives, positiveConsequences: item.positiveConsequences, risks: item.risks, evidenceRefs: item.evidenceRefs }))} />)}
        </div>
      </ReasoningSection>

      <ReviewBriefForm busy={busy} brief={reasoning.reviewBrief} requiredAtEntry={reviewBriefRequired} onSave={(body) => run(() => api.saveReviewBrief(workspaceId, body))} />
      </fieldset>
    </div>
  );
}

function ReasoningSection({ children, description, eyebrow, title }: { children: React.ReactNode; description: string; eyebrow: string; title: string }) {
  return <section aria-labelledby={title} className="border-t border-line pt-6"><p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">{eyebrow}</p><h2 className="mt-2 font-display text-2xl font-semibold" id={title}>{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{description}</p><div className="mt-5">{children}</div></section>;
}

function RequirementRow({ busy, item, onDelete, onSave }: { busy: boolean; item: Requirement; onDelete: () => void; onSave: (body: RequirementInput) => void }) {
  return <details className="group py-4"><summary className="flex cursor-pointer list-none items-start justify-between gap-4"><span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-signal">{item.kind === "NON_FUNCTIONAL" ? "Quality" : "Functional"} · {item.priority}</span><span className="mt-1 block text-sm font-semibold">{item.statement}</span></span><span className="text-xs text-text-muted">{item.status}</span></summary><form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSave(requirementBody(new FormData(event.currentTarget))); }}><input className="field sm:col-span-2" defaultValue={item.statement} name="statement" required /><select className="field" defaultValue={item.kind} name="kind"><option value="FUNCTIONAL">Functional</option><option value="NON_FUNCTIONAL">Quality</option></select><select className="field" defaultValue={item.priority} name="priority"><option value="MUST">Must</option><option value="SHOULD">Should</option><option value="COULD">Could</option></select><select className="field" defaultValue={item.status} name="status"><option value="OPEN">Open</option><option value="SATISFIED">Satisfied</option><option value="DROPPED">Dropped</option></select><input className="field" defaultValue={item.orderIndex} min="0" name="orderIndex" type="number" /><input className="field" defaultValue={item.measurableTarget} name="measurableTarget" placeholder="Measurable target" /><textarea className="field min-h-20 sm:col-span-2" defaultValue={item.rationale} name="rationale" placeholder="Rationale or source" /><div className="flex gap-2 sm:col-span-2"><button className={primaryButton} disabled={busy} type="submit">Save Requirement</button><button className={`${buttonClass} text-danger hover:bg-danger/10`} disabled={busy} onClick={onDelete} type="button">Delete</button></div></form></details>;
}

function AssumptionRow({ busy, item, onDelete, onSave }: { busy: boolean; item: Assumption; onDelete: () => void; onSave: (body: AssumptionInput) => void }) {
  return <details className="group py-4"><summary className="flex cursor-pointer list-none items-start justify-between gap-4"><span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-signal">{item.category}</span><span className="mt-1 block text-sm font-semibold">{item.quantitativeValue || "Unquantified"} {item.unit || ""}</span></span><span className="text-xs text-text-muted">{item.confidence}</span></summary><form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSave(assumptionBody(new FormData(event.currentTarget))); }}><input className="field" defaultValue={item.category} name="category" required /><input className="field" defaultValue={item.quantitativeValue} name="quantitativeValue" placeholder="Value" /><input className="field" defaultValue={item.unit} name="unit" placeholder="Unit" /><select className="field" defaultValue={item.confidence} name="confidence"><option value="LOW">Low confidence</option><option value="MEDIUM">Medium confidence</option><option value="HIGH">High confidence</option></select><input className="field" defaultValue={item.orderIndex} min="0" name="orderIndex" type="number" /><textarea className="field min-h-20 sm:col-span-2" defaultValue={item.rationale} name="rationale" placeholder="Rationale" /><div className="flex gap-2 sm:col-span-2"><button className={primaryButton} disabled={busy} type="submit">Save Assumption</button><button className={`${buttonClass} text-danger hover:bg-danger/10`} disabled={busy} onClick={onDelete} type="button">Delete</button></div></form></details>;
}

function QuestionRow({ busy, item, onDelete, onSave }: { busy: boolean; item: UnresolvedQuestion; onDelete: () => void; onSave: (body: QuestionInput) => void }) {
  return <details className="group py-4"><summary className="flex cursor-pointer list-none items-start justify-between gap-4"><span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-signal">{item.status}</span><span className="mt-1 block text-sm font-semibold">{item.question}</span></span><span className="text-xs text-text-muted">Open question</span></summary><form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave(questionBody(form)); }}><input className="field" defaultValue={item.question} name="question" required /><textarea className="field min-h-20" defaultValue={item.whyItMatters} name="whyItMatters" required /><select className="field" defaultValue={item.status} name="status"><option value="OPEN">Open</option><option value="RESOLVED">Resolved</option><option value="DEFERRED">Deferred</option></select><input className="field" defaultValue={item.orderIndex} min="0" name="orderIndex" type="number" /><textarea className="field min-h-20" defaultValue={item.resolutionNotes} name="resolutionNotes" placeholder="Resolution notes" /><div className="flex gap-2"><button className={primaryButton} disabled={busy} type="submit">Save Question</button><button className={`${buttonClass} text-danger hover:bg-danger/10`} disabled={busy} onClick={onDelete} type="button">Delete</button></div></form></details>;
}

function DecisionRow({ busy, item, onDelete, onSave }: { busy: boolean; item: Decision; onDelete: () => void; onSave: (body: DecisionInput) => void }) {
  return <details className="group py-4"><summary className="flex cursor-pointer list-none items-start justify-between gap-4"><span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-signal">{item.status}</span><span className="mt-1 block text-sm font-semibold">{item.title}</span><span className="mt-1 block text-sm text-text-muted">{item.chosenOption} — {item.rationale}</span></span><span className="text-xs text-text-muted">Decision</span></summary><form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave(decisionBody(form)); }}><input className="field" defaultValue={item.title} name="title" required /><input className="field" defaultValue={item.chosenOption} name="chosenOption" required /><textarea className="field min-h-20" defaultValue={item.rationale} name="rationale" required /><select className="field" defaultValue={item.status} name="status"><option value="PROPOSED">Proposed</option><option value="ACCEPTED">Accepted</option><option value="SUPERSEDED">Superseded</option></select><input className="field" defaultValue={item.orderIndex} min="0" name="orderIndex" type="number" /><div className="flex gap-2"><button className={primaryButton} disabled={busy} type="submit">Save Decision</button><button className={`${buttonClass} text-danger hover:bg-danger/10`} disabled={busy} onClick={onDelete} type="button">Delete</button></div></form></details>;
}

function ReviewBriefForm({ brief, busy, onSave, requiredAtEntry }: { brief?: { systemDescription?: string; reviewGoal?: string } | null; busy: boolean; onSave: (body: { systemDescription: string; reviewGoal: string }) => void; requiredAtEntry: boolean }) {
  const helper = requiredAtEntry
    ? "Required before you can begin an Architecture Review Workspace. You can update it as the review focus changes."
    : "Optional for this Workspace. Add it when you want a later review to examine a specific system and goal.";

  return <section className="border-t border-line pt-6"><p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">Review Brief</p><h2 className="mt-2 font-display text-2xl font-semibold">What should a later review examine?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{helper}</p><form className="mt-5 grid gap-3" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ systemDescription: text(form, "systemDescription"), reviewGoal: text(form, "reviewGoal") }); }}><textarea aria-label="System Description" className="field min-h-24" defaultValue={brief?.systemDescription} name="systemDescription" placeholder="Describe the existing system or product." required /><textarea aria-label="Review Goal" className="field min-h-20" defaultValue={brief?.reviewGoal} name="reviewGoal" placeholder="What should a later review evaluate?" required /><button className={`${primaryButton} w-fit`} disabled={busy} type="submit">Save Review Brief</button></form></section>;
}

function EmptyState({ text }: { text: string }) { return <p className="border-y border-dashed border-line px-4 py-5 text-sm text-text-muted">{text}</p>; }
function text(form: FormData, name: string) { return String(form.get(name) ?? "").trim(); }
function optional(form: FormData, name: string) { const value = text(form, name); return value || undefined; }
function requirementBody(form: FormData): RequirementInput { return { kind: text(form, "kind") || "FUNCTIONAL", statement: text(form, "statement"), priority: text(form, "priority") || "MUST", status: text(form, "status") || "OPEN", measurableTarget: optional(form, "measurableTarget"), rationale: optional(form, "rationale"), source: optional(form, "source"), orderIndex: optionalNumber(form, "orderIndex") }; }
function assumptionBody(form: FormData): AssumptionInput { return { category: text(form, "category"), quantitativeValue: optional(form, "quantitativeValue"), unit: optional(form, "unit"), rationale: optional(form, "rationale"), confidence: text(form, "confidence") || "MEDIUM", status: text(form, "status") || "ACTIVE", source: optional(form, "source"), relatedRequirementIds: ids(form, "relatedRequirementIds"), orderIndex: optionalNumber(form, "orderIndex") }; }
function questionBody(form: FormData): QuestionInput { return { question: text(form, "question"), whyItMatters: text(form, "whyItMatters"), status: text(form, "status") || "OPEN", resolutionNotes: optional(form, "resolutionNotes"), relatedRequirementIds: ids(form, "relatedRequirementIds"), relatedAssumptionIds: ids(form, "relatedAssumptionIds"), resultingDecisionId: optional(form, "resultingDecisionId"), orderIndex: optionalNumber(form, "orderIndex") }; }
function decisionBody(form: FormData): DecisionInput { return { title: text(form, "title"), chosenOption: text(form, "chosenOption"), rationale: text(form, "rationale"), alternatives: optional(form, "alternatives"), positiveConsequences: optional(form, "positiveConsequences"), risks: optional(form, "risks"), status: text(form, "status") || "PROPOSED", evidenceRefs: text(form, "evidenceRefs").split("\n").map((value) => value.trim()).filter(Boolean), orderIndex: optionalNumber(form, "orderIndex") }; }
function optionalNumber(form: FormData, name: string) { const value = text(form, name); return value ? Number(value) : undefined; }
function ids(form: FormData, name: string) { return form.getAll(name).map(String).filter(Boolean); }

type ReferenceOption = { id?: string; label?: string };
function ReferenceSelect({ label, name, options, selected = [] }: { label: string; name: string; options: ReferenceOption[]; selected?: string[] }) {
  return <label className="grid gap-1 text-xs font-semibold text-text-muted sm:col-span-2">{label}<select aria-label={label} className="field min-h-20" multiple name={name} defaultValue={selected.filter(Boolean)}>{options.length === 0 ? <option disabled>No records available yet</option> : options.filter((option) => option.id).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>;
}
