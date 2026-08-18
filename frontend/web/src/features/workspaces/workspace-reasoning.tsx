"use client";

import { useAuthenticatedApiClient, type Assumption, type AssumptionInput, type Decision, type DecisionInput, type QuestionInput, type Requirement, type RequirementInput, type UnresolvedQuestion, type WorkspaceReasoning } from "@/lib/api/authenticated-client";
import { useEffect, useState } from "react";

const buttonClass = "inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton = `${buttonClass} bg-signal text-text-on-dark hover:brightness-110`;
const compactPrimaryButton = "inline-flex self-end h-11 min-h-11 items-center justify-center px-4 text-xs font-semibold leading-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 bg-signal text-text-on-dark hover:brightness-110";
const assumptionUnits = ["requests/second", "requests/minute", "requests/day", "users/day", "MB", "GB", "TB", "ms", "seconds", "percent"];

export function WorkspaceReasoning({ curatedChallenge = false, workspaceId, readOnly = false, reviewBriefRequired = false }: { curatedChallenge?: boolean; workspaceId: string; readOnly?: boolean; reviewBriefRequired?: boolean }) {
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

  useEffect(() => {
    function onReasoningChange(event: Event) {
      const detail = (event as CustomEvent<{ workspaceId?: string }>).detail;
      if (detail?.workspaceId !== workspaceId) return;
      void api.getReasoning(workspaceId).then(setReasoning).catch(() => setError("We could not refresh the Workspace reasoning. Try again."));
    }
    window.addEventListener("workspace-reasoning-change", onReasoningChange);
    return () => window.removeEventListener("workspace-reasoning-change", onReasoningChange);
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
  const requirementDescription = curatedChallenge
    ? "Capture the important functional and quality needs you derive from the challenge brief. You do not need to repeat every detail."
    : "Define the functional and quality needs your system must satisfy before choosing components.";
  if (reviewBriefRequired && !hasReviewBrief) {
    return <div className="space-y-10"><ReviewBriefForm busy={busy} brief={reasoning.reviewBrief} requiredAtEntry onSave={(body) => run(() => api.saveReviewBrief(workspaceId, body))} /></div>;
  }

  return (
    <div className="space-y-10">
      {error ? <p className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}
      {readOnly ? <p className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning" role="status">This Workspace is archived. Restore it from Practice Home before editing its reasoning.</p> : null}
      <ClarifyGuide curatedChallenge={curatedChallenge} />
      <nav aria-label="Reasoning actions" className="flex flex-wrap items-center gap-2 border-y border-line py-2.5">
        <a className="inline-flex h-11 items-center border border-signal px-4 py-2 text-xs font-semibold leading-4 text-signal hover:bg-signal-soft" href="#requirements">+ Requirement</a>
        <span className="ml-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Optional</span>
        <a className="inline-flex h-11 items-center border border-line px-4 py-2 text-xs leading-4 text-foreground hover:bg-surface-alt" href="#assumptions">+ Assumption</a>
        <a className="inline-flex h-11 items-center border border-line px-4 py-2 text-xs leading-4 text-foreground hover:bg-surface-alt" href="#questions">+ Question</a>
      </nav>
      <fieldset className="min-w-0" disabled={readOnly}>
      <ReasoningSection id="requirements" eyebrow="Your design checklist" title="What must this system do?" description={requirementDescription}>
        <form className="grid gap-3 border-b border-line pb-5 lg:grid-cols-[minmax(0,1fr)_9rem_9rem_auto]" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          run(() => api.createRequirement(workspaceId, requirementBody(form)));
          event.currentTarget.reset();
        }}>
          <FieldLabel label="Requirement"><input aria-label="Requirement statement" className="field" name="statement" placeholder="e.g. Users can disable promotional notifications." required /></FieldLabel>
          <FieldLabel label="Type"><select aria-label="Requirement kind" className="field" defaultValue="FUNCTIONAL" name="kind"><option value="FUNCTIONAL">Functional</option><option value="NON_FUNCTIONAL">Quality (non-functional)</option></select></FieldLabel>
          <FieldLabel label="Priority"><select aria-label="Requirement priority" className="field" defaultValue="MUST" name="priority"><option value="MUST">Must</option><option value="SHOULD">Should</option><option value="COULD">Could</option></select></FieldLabel>
          <button className={compactPrimaryButton} disabled={busy} type="submit">Add requirement</button>
        </form>
        <div className="divide-y divide-line">
          {reasoning.requirements.length === 0 ? <EmptyState text={curatedChallenge ? "No requirements yet. Start with the most important promise in the challenge brief." : "No requirements yet. Start with the promise your system must keep."} /> : reasoning.requirements.map((item) => <RequirementRow busy={busy} item={item} key={item.id} onDelete={() => run(() => api.deleteRequirement(workspaceId, item.id ?? ""))} onSave={(body) => run(() => api.updateRequirement(workspaceId, item.id ?? "", { ...body, source: item.source }))} />)}
        </div>
      </ReasoningSection>

      <ReasoningSection collapsible defaultOpen={reasoning.assumptions.length > 0} id="assumptions" eyebrow="Assumptions and estimates · optional" title="What are we taking as true?" description="Open this when a number or condition will change the design.">
        <form className="grid gap-3 border-b border-line pb-5 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_auto]" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          run(() => api.createAssumption(workspaceId, assumptionBody(form)));
          event.currentTarget.reset();
        }}>
          <FieldLabel label="What are you assuming?"><input aria-label="Assumption category" className="field" name="category" placeholder="Traffic" required /></FieldLabel>
          <FieldLabel label="Value"><input aria-label="Assumption value" className="field" name="quantitativeValue" placeholder="100M" /></FieldLabel>
          <FieldLabel label="Unit"><select aria-label="Assumption unit" className="field" defaultValue="" name="unit"><option disabled value="">Select a unit</option>{assumptionUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></FieldLabel>
          <button className={compactPrimaryButton} disabled={busy} type="submit">Add assumption</button>
          <OptionalContext>
            <FieldLabel label="Why does this matter?"><input aria-label="Assumption rationale" className="field" name="rationale" placeholder="Why does this estimate matter?" /></FieldLabel>
            <ReferenceSelect label="Related requirements" name="relatedRequirementIds" options={reasoning.requirements.map((item) => ({ id: item.id, label: item.statement }))} />
          </OptionalContext>
        </form>
        <div className="divide-y divide-line">
          {reasoning.assumptions.length === 0 ? <EmptyState text="No Assumptions yet. Add the first scale, latency, or reliability estimate." /> : reasoning.assumptions.map((item) => <AssumptionRow busy={busy} item={item} key={item.id} onDelete={() => run(() => api.deleteAssumption(workspaceId, item.id ?? ""))} onSave={(body) => run(() => api.updateAssumption(workspaceId, item.id ?? "", { ...body, relatedRequirementIds: item.relatedRequirementIds, source: item.source }))} />)}
        </div>
      </ReasoningSection>

      <ReasoningSection collapsible defaultOpen={reasoning.questions.length > 0} id="questions" eyebrow="Unresolved questions · optional" title="What still needs an answer?" description="Open this when an unknown could change the design.">
        <form className="grid gap-3 border-b border-line pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          run(() => api.createQuestion(workspaceId, questionBody(form)));
          event.currentTarget.reset();
        }}>
          <FieldLabel label="What is still unclear?"><input aria-label="Unresolved question" className="field" name="question" placeholder="e.g. Should a 5xx response trigger another provider?" required /></FieldLabel>
          <FieldLabel label="Why does it matter?"><input aria-label="Why the question matters" className="field" name="whyItMatters" placeholder="What decision will this change?" required /></FieldLabel>
          <button className={compactPrimaryButton} disabled={busy} type="submit">Add question</button>
          <OptionalContext>
            <ReferenceSelect label="Related requirements" name="relatedRequirementIds" options={reasoning.requirements.map((item) => ({ id: item.id, label: item.statement }))} />
            <ReferenceSelect label="Related assumptions" name="relatedAssumptionIds" options={reasoning.assumptions.map((item) => ({ id: item.id, label: item.category }))} />
          </OptionalContext>
        </form>
        <div className="divide-y divide-line">
          {reasoning.questions.length === 0 ? <EmptyState text="No open questions. Add one when an unknown could change the design." /> : reasoning.questions.map((item) => <QuestionRow busy={busy} item={item} key={item.id} onDelete={() => run(() => api.deleteQuestion(workspaceId, item.id ?? ""))} onSave={(body) => run(() => api.updateQuestion(workspaceId, item.id ?? "", { ...body, relatedRequirementIds: item.relatedRequirementIds, relatedAssumptionIds: item.relatedAssumptionIds, resultingDecisionId: item.resultingDecisionId }))} />)}
        </div>
      </ReasoningSection>

      <p className="border-t border-line pt-5 text-xs leading-5 text-text-muted">Decision log opens in Design, after you compare architecture options and trade-offs.</p>

      {reviewBriefRequired ? <ReviewBriefForm busy={busy} brief={reasoning.reviewBrief} requiredAtEntry onSave={(body) => run(() => api.saveReviewBrief(workspaceId, body))} /> : null}
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted" aria-label="Reasoning save status"><span>{reasoning.questions.filter((item) => item.status === "OPEN").length} unresolved question{reasoning.questions.filter((item) => item.status === "OPEN").length === 1 ? "" : "s"} / {error ? "1" : "0"} validation error{error ? "" : "s"}</span><span>{busy ? "Saving..." : "Saved"}</span></div>
    </div>
  );
}

function ReasoningSection({ children, collapsible = false, defaultOpen = false, description, eyebrow, id, title }: { children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean; description: string; eyebrow: string; id: string; title: string }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const heading = <><p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">{eyebrow}</p><h2 className="mt-2 font-display text-2xl font-semibold" id={`${id}-title`}>{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{description}</p></>;
  if (collapsible) return <details aria-labelledby={`${id}-title`} className="border-t border-line pt-6" id={id} onToggle={(event) => setIsOpen(event.currentTarget.open)} open={isOpen}><summary className="cursor-pointer list-none">{heading}</summary><div className="mt-5">{children}</div></details>;
  return <section aria-labelledby={`${id}-title`} className="border-t border-line pt-6" id={id}>{heading}<div className="mt-5">{children}</div></section>;
}

function RequirementRow({ busy, item, onDelete, onSave }: { busy: boolean; item: Requirement; onDelete: () => void; onSave: (body: RequirementInput) => void }) {
  return <details className="group py-4"><summary className="flex cursor-pointer list-none items-start justify-between gap-4"><span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-signal">{item.kind === "NON_FUNCTIONAL" ? "Quality (non-functional)" : "Functional"} · {item.priority}</span><span className="mt-1 block text-sm font-semibold">{item.statement}</span></span><span className="text-xs text-text-muted">{item.status}</span></summary><form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSave(requirementBody(new FormData(event.currentTarget))); }}><input className="field sm:col-span-2" defaultValue={item.statement} name="statement" required /><select aria-label="Requirement kind" className="field" defaultValue={item.kind} name="kind"><option value="FUNCTIONAL">Functional</option><option value="NON_FUNCTIONAL">Quality (non-functional)</option></select><select className="field" defaultValue={item.priority} name="priority"><option value="MUST">Must</option><option value="SHOULD">Should</option><option value="COULD">Could</option></select><select className="field" defaultValue={item.status} name="status"><option value="OPEN">Open</option><option value="SATISFIED">Satisfied</option><option value="DROPPED">Dropped</option></select><input className="field" defaultValue={item.orderIndex} min="0" name="orderIndex" type="number" /><input className="field" defaultValue={item.measurableTarget} name="measurableTarget" placeholder="Measurable target" /><textarea className="field min-h-20 sm:col-span-2" defaultValue={item.rationale} name="rationale" placeholder="Rationale or source" /><div className="flex gap-2 sm:col-span-2"><button className={primaryButton} disabled={busy} type="submit">Save Requirement</button><button className={`${buttonClass} text-danger hover:bg-danger/10`} disabled={busy} onClick={onDelete} type="button">Delete</button></div></form></details>;
}

function AssumptionRow({ busy, item, onDelete, onSave }: { busy: boolean; item: Assumption; onDelete: () => void; onSave: (body: AssumptionInput) => void }) {
  const legacyUnit = item.unit && !assumptionUnits.includes(item.unit) ? item.unit : null;
  return <details className="group py-4"><summary className="flex cursor-pointer list-none items-start justify-between gap-4"><span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-signal">{item.category}</span><span className="mt-1 block text-sm font-semibold">{item.quantitativeValue || "Unquantified"} {item.unit || ""}</span></span><span className="text-xs text-text-muted">{item.confidence}</span></summary><form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSave(assumptionBody(new FormData(event.currentTarget))); }}><input className="field" defaultValue={item.category} name="category" required /><input className="field" defaultValue={item.quantitativeValue} name="quantitativeValue" placeholder="Value" /><select aria-label="Assumption unit" className="field" defaultValue={item.unit || ""} name="unit"><option value="">No unit</option>{legacyUnit ? <option value={legacyUnit}>{legacyUnit}</option> : null}{assumptionUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select><select className="field" defaultValue={item.confidence} name="confidence"><option value="LOW">Low confidence</option><option value="MEDIUM">Medium confidence</option><option value="HIGH">High confidence</option></select><input className="field" defaultValue={item.orderIndex} min="0" name="orderIndex" type="number" /><textarea className="field min-h-20 sm:col-span-2" defaultValue={item.rationale} name="rationale" placeholder="Rationale" /><div className="flex gap-2 sm:col-span-2"><button className={primaryButton} disabled={busy} type="submit">Save Assumption</button><button className={`${buttonClass} text-danger hover:bg-danger/10`} disabled={busy} onClick={onDelete} type="button">Delete</button></div></form></details>;
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
function ClarifyGuide({ curatedChallenge }: { curatedChallenge: boolean }) {
  return <section aria-labelledby="clarify-guide-title" className="border border-line bg-surface-raised px-4 py-4 sm:px-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">HOW TO USE CLARIFY</p><h3 className="mt-2 font-display text-lg font-semibold" id="clarify-guide-title">{curatedChallenge ? "Turn the brief into your checklist." : "Start with what your system must promise."}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">You do not need to know the architecture yet. Plain language is enough.</p><ol className="mt-3 grid gap-2 text-sm leading-6 text-foreground sm:grid-cols-3"><li><span className="font-mono text-xs text-signal">01</span> Write one thing the system must do.</li><li><span className="font-mono text-xs text-signal">02</span> Add a number or condition you are assuming.</li><li><span className="font-mono text-xs text-signal">03</span> Record anything that is still unclear.</li></ol><p className="mt-3 text-xs text-text-muted">You can leave optional sections closed and continue to Design.</p></section>;
}
function FieldLabel({ children, label }: { children: React.ReactNode; label: string }) { return <label className="grid gap-1 text-xs font-semibold text-text-muted">{label}{children}</label>; }
function OptionalContext({ children }: { children: React.ReactNode }) { return <details className="border-t border-line pt-3 lg:col-span-full"><summary className="cursor-pointer list-none text-xs font-semibold text-text-muted">Optional context</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div></details>; }
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
