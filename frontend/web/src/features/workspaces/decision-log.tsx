"use client";

import { useAuthenticatedApiClient, type Decision } from "@/lib/api/authenticated-client";
import { useEffect, useState } from "react";
import { DecisionRow, decisionBody } from "./workspace-reasoning";

const buttonClass = "inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton = `${buttonClass} bg-signal text-text-on-dark hover:brightness-110`;

export function DecisionLog({ workspaceId, readOnly = false }: { workspaceId: string; readOnly?: boolean }) {
  const api = useAuthenticatedApiClient();
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const reasoning = await api.getReasoning(workspaceId);
    setDecisions(reasoning.decisions ?? []);
  }

  useEffect(() => {
    let current = true;
    api.getReasoning(workspaceId)
      .then((value) => { if (current) setDecisions(value.decisions ?? []); })
      .catch(() => { if (current) setError("We could not load the Decision Log. Try again."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [api, workspaceId]);

  useEffect(() => {
    function onReasoningChange(event: Event) {
      const detail = (event as CustomEvent<{ workspaceId?: string }>).detail;
      if (detail?.workspaceId !== workspaceId) return;
      void api.getReasoning(workspaceId).then((value) => setDecisions(value.decisions ?? [])).catch(() => setError("We could not refresh the Decision Log. Try again."));
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
      window.dispatchEvent(new CustomEvent("workspace-reasoning-change", { detail: { workspaceId } }));
    } catch {
      setError("That decision change could not be saved. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-text-muted">Restoring the Decision Log...</p>;
  if (!decisions) return <p className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error ?? "Decisions are unavailable."}</p>;

  return (
    <section className="border-t border-line pt-8" aria-labelledby="decision-log-title">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">DECISION LOG</p>
      <h2 className="mt-2 font-display text-2xl font-semibold" id="decision-log-title">Record the choices and trade-offs.</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">Each Decision captures a chosen approach, its rationale, alternatives, and risks. Decisions become Review evidence.</p>
      {error ? <p className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}
      {readOnly ? <p className="mt-4 rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning" role="status">This Workspace is archived. Restore it before recording Decisions.</p> : null}
      <form className="mt-5 grid gap-3 border-y border-line py-5" onSubmit={(event) => {
        event.preventDefault();
        run(() => api.createDecision(workspaceId, decisionBody(new FormData(event.currentTarget))));
        event.currentTarget.reset();
      }}>
        <label className="grid gap-1 text-xs font-semibold text-text-muted">Decision<input aria-label="Decision title" className="field" name="title" placeholder="e.g. Use a queue between intake and processing." required /></label>
        <label className="grid gap-1 text-xs font-semibold text-text-muted">Chosen approach<input aria-label="Chosen option" className="field" name="chosenOption" placeholder="e.g. A durable message queue decouples ingestion." required /></label>
        <label className="grid gap-1 text-xs font-semibold text-text-muted">Rationale<textarea aria-label="Decision rationale" className="field min-h-20" name="rationale" placeholder="Why this approach fits the requirements." required /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold text-text-muted">Status<select aria-label="Decision status" className="field" defaultValue="PROPOSED" name="status"><option value="PROPOSED">Proposed</option><option value="ACCEPTED">Accepted</option><option value="SUPERSEDED">Superseded</option></select></label>
        </div>
        <details className="border-t border-line pt-3">
          <summary className="cursor-pointer list-none text-xs font-semibold text-text-muted">Optional context</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-text-muted">Alternatives<textarea className="field min-h-20" name="alternatives" placeholder="Options you considered and rejected." /></label>
            <label className="grid gap-1 text-xs font-semibold text-text-muted">Risks<textarea className="field min-h-20" name="risks" placeholder="What could go wrong with this choice." /></label>
            <label className="grid gap-1 text-xs font-semibold text-text-muted sm:col-span-2">Positive consequences<textarea className="field min-h-20" name="positiveConsequences" placeholder="What this choice protects or enables." /></label>
            <label className="grid gap-1 text-xs font-semibold text-text-muted sm:col-span-2">Evidence references (one per line)<textarea className="field min-h-20" name="evidenceRefs" placeholder="Component or Requirement identifiers this decision cites." /></label>
          </div>
        </details>
        <button className={`${primaryButton} w-fit`} disabled={busy || readOnly} type="submit">Record Decision</button>
      </form>
      <div className="divide-y divide-line">
        {decisions.length === 0 ? <p className="border-y border-dashed border-line px-4 py-5 text-sm text-text-muted">No Decisions yet. Record the first architectural choice and its trade-off.</p> : decisions.map((item) => <DecisionRow busy={busy} item={item} key={item.id} onDelete={() => run(() => api.deleteDecision(workspaceId, item.id ?? ""))} onSave={(body) => run(() => api.updateDecision(workspaceId, item.id ?? "", body))} />)}
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">{decisions.length} decision{decisions.length === 1 ? "" : "s"} · {busy ? "Saving..." : "Saved"}</p>
    </section>
  );
}
