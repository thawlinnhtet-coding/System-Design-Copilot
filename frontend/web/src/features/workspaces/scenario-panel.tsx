"use client";

import { useEffect, useState } from "react";
import { ApiRequestError, type Scenario, type ScenarioResponseInput, useAuthenticatedApiClient } from "@/lib/api/authenticated-client";

type Draft = Required<Pick<ScenarioResponseInput, "response">> & Pick<ScenarioResponseInput, "architectureChanges" | "decisionChanges">;

export function ScenarioPanel({ workspaceId, readOnly, onInspectArchitecture, onActiveScenario }: { workspaceId: string; readOnly: boolean; onInspectArchitecture?: () => void; onActiveScenario?: (scenario: Scenario | null) => void }) {
	const api = useAuthenticatedApiClient();
	const [scenarios, setScenarios] = useState<Scenario[] | null>(null);
	const [draft, setDraft] = useState<Draft>({ response: "", architectureChanges: "", decisionChanges: "" });
	const [error, setError] = useState<string | null>(null);
	const [working, setWorking] = useState(false);

	useEffect(() => {
		let current = true;
		api.getScenarios(workspaceId).then((value) => { if (current) { setScenarios(value); selectActive(value, onActiveScenario); } }).catch(() => { if (current) setError("Scenarios could not be loaded. Try again."); });
		return () => { current = false; };
	}, [api, onActiveScenario, workspaceId]);

	const active = scenarios?.find((scenario) => scenario.status === "REVEALED" || scenario.status === "DRAFT");
	const available = scenarios?.find((scenario) => scenario.status === "AVAILABLE" && scenarios.filter((item) => item.orderIndex < scenario.orderIndex).every((item) => item.status === "COMPLETED"));

	useEffect(() => {
		if (active) setDraft({ response: active.response ?? "", architectureChanges: active.architectureChanges ?? "", decisionChanges: active.decisionChanges ?? "" });
	}, [active?.id]);

	async function start(scenario: Scenario) {
		setWorking(true); setError(null);
		try { replace(await api.startScenario(workspaceId, scenario.id)); }
		catch { setError("This Scenario is not available yet. Complete the current pressure test first."); }
		finally { setWorking(false); }
	}
	async function save(complete: boolean) {
		if (!active) return;
		setWorking(true); setError(null);
		try { replace(complete ? await api.completeScenario(workspaceId, active.id, draft) : await api.saveScenarioDraft(workspaceId, active.id, draft)); }
		catch (exception) { setError(message(exception, complete)); }
		finally { setWorking(false); }
	}
	async function createAiScenario() {
		setWorking(true); setError(null);
		try { replace(await api.createAiAssistedScenario(workspaceId)); }
		catch (exception) { setError(message(exception, false)); }
		finally { setWorking(false); }
	}
	function replace(next: Scenario) {
		setScenarios((current) => current ? [...current.filter((item) => item.id !== next.id), next].sort((a, b) => a.orderIndex - b.orderIndex) : [next]);
		onActiveScenario?.(next.status === "REVEALED" || next.status === "DRAFT" ? next : null);
	}

	if (error && !scenarios) return <section aria-label="Scenario error" className="border-y border-line py-8"><p role="alert" className="text-sm text-danger">{error}</p><button className="mt-4 text-sm font-semibold text-signal hover:underline" onClick={() => window.location.reload()} type="button">Try again</button></section>;
	if (!scenarios) return <p className="text-sm text-text-muted">Loading Scenario arc...</p>;

	return <section aria-label="Workspace Scenarios" className="max-w-3xl">
		<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-scenario">Pressure-test / user started</p>
		<h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Test the design under one changed condition.</h2>
		<p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">Scenarios stay inspectable and non-blocking. Your response and related changes become evidence for a later Review.</p>
		{error ? <p className="mt-5 border-l-2 border-danger pl-3 text-sm text-danger" role="alert">{error}</p> : null}
		{active ? <ActiveScenario scenario={active} draft={draft} disabled={readOnly || working} onChange={setDraft} onInspectArchitecture={onInspectArchitecture} onSave={() => void save(false)} onComplete={() => void save(true)} /> : <>
			{available ? <section className="mt-8 border-l-2 border-scenario bg-surface-raised p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-scenario">AVAILABLE / SCENARIO {available.orderIndex + 1} OF {scenarios.filter((item) => item.source === "CURATED").length || scenarios.length}</p><h3 className="mt-2 font-display text-2xl font-semibold">Choose when to begin.</h3><p className="mt-2 text-sm leading-6 text-text-muted">Starting reveals one changed condition. It becomes part of later Review context.</p><button className="mt-5 inline-flex min-h-11 border border-signal bg-signal px-4 text-sm font-semibold text-text-on-dark disabled:opacity-50" disabled={readOnly || working} onClick={() => void start(available)} type="button">Start Scenario →</button></section> : <section className="mt-8 border-y border-line py-7"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">NO ACTIVE SCENARIO</p><p className="mt-2 text-sm text-text-muted">Complete the current Scenario before the next pressure test becomes available.</p></section>}
			{scenarios.length === 0 ? <section className="mt-8 border border-line bg-surface-raised p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">AI-ASSISTED / ADVISORY</p><h3 className="mt-2 font-display text-xl font-semibold">Ask for a pressure test.</h3><p className="mt-2 text-sm leading-6 text-text-muted">AI Processing Consent is required. The suggested Scenario is validated before it is shown and never changes your design.</p><button className="mt-5 inline-flex min-h-11 border border-line px-4 text-sm font-semibold text-signal disabled:opacity-50" disabled={readOnly || working} onClick={() => void createAiScenario()} type="button">Create AI-assisted Scenario</button></section> : null}
		</>}
		{scenarios.some((item) => item.status === "COMPLETED") ? <ol className="mt-10 space-y-3 border-t border-line pt-6">{scenarios.filter((item) => item.status === "COMPLETED").map((item) => <li className="border-l-2 border-signal pl-4" key={item.id}><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">COMPLETED / SCENARIO {item.orderIndex + 1}</p><p className="mt-1 font-display text-lg font-semibold">{item.title}</p><p className="mt-1 text-sm text-text-muted">Response included in later Review context.</p></li>)}</ol> : null}
	</section>;
}

function ActiveScenario({ scenario, draft, disabled, onChange, onInspectArchitecture, onSave, onComplete }: { scenario: Scenario; draft: Draft; disabled: boolean; onChange: (value: Draft) => void; onInspectArchitecture?: () => void; onSave: () => void; onComplete: () => void }) {
	return <section className="mt-8 border-l-2 border-scenario bg-surface-raised p-5" aria-label="Active Scenario"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-scenario">REVEALED / SCENARIO {scenario.orderIndex + 1}</p><h3 className="mt-2 font-display text-2xl font-semibold">{scenario.changedCondition}</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-foreground">{scenario.details}</p><div className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-semibold text-foreground">What changes, and why?<textarea className="min-h-32 border border-line bg-background p-3 text-sm font-normal outline-none focus:border-signal focus:ring-2 focus:ring-signal/20" disabled={disabled} onChange={(event) => onChange({ ...draft, response: event.target.value })} value={draft.response} /></label><label className="grid gap-2 text-sm font-semibold text-foreground">Related architecture changes <span className="font-normal text-text-muted">(optional)</span><textarea className="min-h-20 border border-line bg-background p-3 text-sm font-normal outline-none focus:border-signal focus:ring-2 focus:ring-signal/20" disabled={disabled} onChange={(event) => onChange({ ...draft, architectureChanges: event.target.value })} value={draft.architectureChanges} /></label><label className="grid gap-2 text-sm font-semibold text-foreground">Related Decision changes <span className="font-normal text-text-muted">(optional)</span><textarea className="min-h-20 border border-line bg-background p-3 text-sm font-normal outline-none focus:border-signal focus:ring-2 focus:ring-signal/20" disabled={disabled} onChange={(event) => onChange({ ...draft, decisionChanges: event.target.value })} value={draft.decisionChanges} /></label></div><div className="mt-6 flex flex-wrap gap-3"><button className="inline-flex min-h-11 border border-line px-4 text-sm font-semibold text-signal disabled:opacity-50" disabled={disabled} onClick={onInspectArchitecture} type="button">Inspect architecture</button><button className="inline-flex min-h-11 border border-line px-4 text-sm font-semibold text-text-muted disabled:opacity-50" disabled={disabled} onClick={onSave} type="button">Save response</button><button className="inline-flex min-h-11 border border-signal bg-signal px-4 text-sm font-semibold text-text-on-dark disabled:opacity-50" disabled={disabled || draft.response.trim().length < 10} onClick={onComplete} type="button">Mark complete</button></div></section>;
}

function selectActive(values: Scenario[], onActiveScenario?: (scenario: Scenario | null) => void) { onActiveScenario?.(values.find((value) => value.status === "REVEALED" || value.status === "DRAFT") ?? null); }
function message(error: unknown, completing: boolean) { if ((error instanceof ApiRequestError || (typeof error === "object" && error !== null && "details" in error)) && (error as { details?: { code?: string } }).details?.code === "ai_consent_required") return "AI Processing Consent is required before an AI-assisted Scenario can be shown."; return completing ? "The Scenario could not be completed. Keep your response and try again." : "The Scenario could not be saved. Your response remains here."; }
