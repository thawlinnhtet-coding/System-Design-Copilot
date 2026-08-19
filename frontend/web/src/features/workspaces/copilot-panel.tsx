"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { ApiRequestError, useAuthenticatedApiClient, type AiConsent, type AssumptionInput, type QuestionInput, type RequirementInput } from "@/lib/api/authenticated-client";

type CopilotTurn = { id: string; question: string; content: string; model: string; replayed: boolean };
type ProposalKind = "requirement" | "assumption" | "question";

export function CopilotPanel({ embedded = false, workspaceId, readOnly }: { embedded?: boolean; workspaceId: string; readOnly: boolean }) {
  const api = useAuthenticatedApiClient();
  const [consent, setConsent] = useState<AiConsent | null>(null);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<CopilotTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null);
  const [proposalKind, setProposalKind] = useState<ProposalKind | null>(null);
  const [proposalText, setProposalText] = useState("");
  const [proposalWhy, setProposalWhy] = useState("");
  const [proposalBusy, setProposalBusy] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalSaved, setProposalSaved] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    api.getAiConsent().then((value) => { if (current) setConsent(value); }).catch(() => { if (current) setError("Copilot consent settings could not be loaded. Try again."); });
    return () => { current = false; };
  }, [api]);

  const disabled = readOnly || pending || !consent?.granted;
  const activeTurn = turns.find((item) => item.id === activeTurnId) ?? turns[turns.length - 1];

  async function ask(event?: FormEvent) {
    event?.preventDefault();
    if (!question.trim() || disabled) return;
    const id = crypto.randomUUID();
    const submitted = question.trim();
    setTurns((current) => [...current, { id, question: submitted, content: "", model: "copilot", replayed: false }]);
    setActiveTurnId(id);
    setQuestion("");
    setPending(true);
    setError(null);
    try {
      const response = await api.streamCopilot(workspaceId, { clientTurnId: id, question: submitted }, (streamEvent) => {
        if (streamEvent.type !== "delta") return;
        setTurns((current) => current.map((item) => item.id === id ? { ...item, content: `${item.content}${streamEvent.content ?? ""}`, model: streamEvent.model ?? item.model } : item));
      });
      setTurns((current) => current.map((item) => item.id === id ? { ...item, ...response, question: submitted } : item));
    } catch (cause) {
      setError(copilotError(cause));
    } finally {
      setPending(false);
    }
  }

  function openProposal(kind: ProposalKind) {
    const responseDraft = activeTurn?.content.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "";
    setProposalKind(kind);
    setProposalText(kind === "question" ? activeTurn?.question ?? question.trim() : responseDraft);
    setProposalWhy("");
    setProposalError(null);
    setProposalSaved(null);
  }

  function startNewChat() {
    setTurns([]);
    setActiveTurnId(null);
    setQuestion("");
    setError(null);
    setProposalKind(null);
    setProposalSaved(null);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && question.trim()) event.currentTarget.form?.requestSubmit();
    }
  }

  async function saveProposal(event: FormEvent) {
    event.preventDefault();
    if (!proposalKind || !proposalText.trim() || readOnly || proposalBusy) return;
    setProposalBusy(true);
    setProposalError(null);
    setProposalSaved(null);
    try {
      if (proposalKind === "requirement") {
        await api.createRequirement(workspaceId, { kind: "FUNCTIONAL", statement: proposalText.trim(), priority: "MUST", status: "OPEN", rationale: proposalWhy.trim() || "Suggested during Copilot guidance.", source: "COPILOT" } satisfies RequirementInput);
        setProposalSaved("Requirement added to your design checklist.");
      } else if (proposalKind === "assumption") {
        await api.createAssumption(workspaceId, { category: "Copilot suggestion", quantitativeValue: proposalText.trim(), rationale: proposalWhy.trim() || "Suggested during Copilot guidance.", confidence: "LOW", status: "ACTIVE", source: "COPILOT" } satisfies AssumptionInput);
        setProposalSaved("Saved as an assumption.");
      } else {
        await api.createQuestion(workspaceId, { question: proposalText.trim(), whyItMatters: proposalWhy.trim() || "This could change the design.", status: "OPEN" } satisfies QuestionInput);
        setProposalSaved("Saved as an open question.");
      }
      window.dispatchEvent(new CustomEvent("workspace-reasoning-change", { detail: { workspaceId } }));
      setProposalKind(null);
      setProposalText("");
      setProposalWhy("");
    } catch (cause) {
      setProposalError(copilotError(cause));
    } finally {
      setProposalBusy(false);
    }
  }

  return <section aria-label="Copilot guidance" className={embedded ? "flex h-full min-h-0 flex-col pt-5" : "flex h-full min-h-0 flex-col border border-line bg-background p-5 sm:p-6"}>
    <div className="flex items-center justify-between gap-3"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">COPILOT / CLARIFY</p><button className="text-xs font-semibold text-signal hover:underline disabled:opacity-50" disabled={!turns.length && !question} onClick={startNewChat} type="button">+ New chat</button></div>
    <h3 className="mt-2 font-display text-[22px] font-normal leading-[1.2]">Think through one decision.</h3>
    <p className="mt-2 text-[13px] leading-5 text-text-muted">Using this Workspace brief, requirements, assumptions, and open questions.</p>
    <details className="mt-4 border-y border-line py-3" aria-label="Copilot context and privacy"><summary className="cursor-pointer text-xs font-semibold text-foreground">Privacy &amp; context</summary><div className="mt-3 text-xs leading-5 text-text-muted"><p>Only this Workspace&apos;s brief, Requirements, Assumptions, Decisions, open questions, architecture structure, and Challenge snapshot are sent as untrusted data.</p><p className="mt-2">Excluded: credentials, tokens, passwords, billing and identity data, provider metadata, other Workspaces, and any reference architecture.</p>{consent?.policy ? <p className="mt-2 font-mono text-[10px]">Policy {consent.policy.currentVersion} / private-provider routing / no fallback</p> : null}</div></details>
    {!consent?.granted && !readOnly ? <p className="mt-4 text-sm leading-6 text-text-muted">AI Processing Consent is required before your first turn. <Link className="font-semibold text-signal hover:underline" href="/account/ai">Review consent and privacy policy</Link>.</p> : null}
    {readOnly ? <p className="mt-4 text-sm text-amber-800">Restore this Workspace to use Copilot.</p> : null}
    {turns.length ? <div aria-label="Copilot conversation" className="mt-5 max-h-[min(58vh,620px)] space-y-5 overflow-y-auto pr-1" role="log">{turns.map((item) => <section aria-label={`Copilot response to: ${item.question}`} className="grid gap-3" key={item.id} onClick={() => setActiveTurnId(item.id)}><div className="border border-line bg-surface p-3"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">YOU</p><p className="mt-2 text-xs leading-5 text-foreground">{item.question}</p></div><div className={`border p-3 ${activeTurn?.id === item.id ? "border-signal bg-background" : "border-line bg-background"}`}><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">COPILOT {item.replayed ? "/ RECOVERED" : ""}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-foreground">{item.content || (pending && activeTurn?.id === item.id ? "Thinking..." : "No response returned.")}</p>{item.content ? <p className="mt-3 font-mono text-[10px] text-text-muted">Model {item.model}</p> : null}</div>{activeTurn?.id === item.id && item.content ? <div className="border-t border-line pt-3"><p className="text-sm font-semibold">What should we keep?</p><p className="mt-1 text-xs leading-5 text-text-muted">Choose a destination, then review the draft before saving it.</p><div className="mt-3 grid gap-2"><button className="min-h-10 border border-line px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-alt" disabled={readOnly || proposalBusy} onClick={() => openProposal("requirement")} type="button">Add as requirement</button><button className="min-h-10 border border-line px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-alt" disabled={readOnly || proposalBusy} onClick={() => openProposal("assumption")} type="button">Keep as assumption</button><button className="min-h-10 border border-line px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-alt" disabled={readOnly || proposalBusy} onClick={() => openProposal("question")} type="button">Save as open question</button></div>{proposalSaved ? <p className="mt-3 text-xs text-success" role="status">{proposalSaved}</p> : null}{proposalKind ? <ProposalForm kind={proposalKind} busy={proposalBusy} error={proposalError} onCancel={() => setProposalKind(null)} onChangeText={setProposalText} onChangeWhy={setProposalWhy} onSubmit={saveProposal} text={proposalText} why={proposalWhy} /> : null}</div> : null}</section>)}</div> : null}
    <form aria-label="Copilot composer" className="sticky bottom-0 z-10 mt-4 border border-line bg-surface p-2 transition-colors focus-within:border-signal" onSubmit={(event) => void ask(event)}><label className="sr-only" htmlFor="copilot-question">Ask Copilot</label><textarea aria-keyshortcuts="Enter" className="min-h-14 w-full resize-y bg-transparent px-1 text-sm leading-5 outline-none placeholder:text-text-muted disabled:cursor-not-allowed" disabled={disabled} id="copilot-question" maxLength={4000} onChange={(event) => setQuestion(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Ask a follow-up question…" value={question} /><div className="mt-1 flex min-h-10 items-center justify-end gap-2"><button aria-label="Send message" className="inline-flex size-10 items-center justify-center rounded-full border border-signal bg-signal text-text-on-dark transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled || !question.trim()} title="Send message" type="submit"><ArrowUp aria-hidden="true" size={17} strokeWidth={2.5} /></button>{error ? <button className="min-h-10 border border-line px-3 text-xs font-semibold text-signal hover:bg-surface-alt" onClick={() => void ask()} type="button">Retry</button> : null}</div></form>
    {error ? <p className="mt-4 border-l-2 border-danger pl-3 text-sm leading-6 text-danger" role="alert">{error}</p> : null}
  </section>;
}

function ProposalForm({ busy, error, kind, onCancel, onChangeText, onChangeWhy, onSubmit, text, why }: { busy: boolean; error: string | null; kind: ProposalKind; onCancel: () => void; onChangeText: (value: string) => void; onChangeWhy: (value: string) => void; onSubmit: (event: FormEvent) => void; text: string; why: string }) {
  const labels = { requirement: { title: "Review requirement draft", text: "Requirement statement", placeholder: "State what the system must do." }, assumption: { title: "Review assumption draft", text: "What are you assuming?", placeholder: "State the number or condition you are taking as true." }, question: { title: "Review open question", text: "What is still unclear?", placeholder: "State the question that could change the design." } }[kind];
  return <form aria-label={labels.title} className="mt-4 grid gap-3 border border-line bg-surface p-3" onSubmit={onSubmit}><label className="grid gap-1 text-xs font-semibold text-text-muted">{labels.text}<textarea aria-label={labels.text} className="field min-h-20" disabled={busy} onChange={(event) => onChangeText(event.target.value)} placeholder={labels.placeholder} required value={text} /></label><label className="grid gap-1 text-xs font-semibold text-text-muted">Why does it matter?<textarea aria-label="Why does it matter?" className="field min-h-16" disabled={busy} onChange={(event) => onChangeWhy(event.target.value)} placeholder="Explain how this guides the design." value={why} /></label>{error ? <p className="text-xs text-danger" role="alert">{error}</p> : null}<div className="flex flex-wrap gap-2"><button className="min-h-10 border border-signal bg-signal px-3 text-xs font-semibold text-text-on-dark" disabled={busy || !text.trim()} type="submit">{busy ? "Saving..." : "Confirm and save"}</button><button className="min-h-10 border border-line px-3 text-xs font-semibold" disabled={busy} onClick={onCancel} type="button">Cancel</button></div></form>;
}

function copilotError(cause: unknown) {
  if (!(cause instanceof ApiRequestError)) return "The Copilot stream ended unexpectedly. Check the backend connection and retry; no accepted turn was recorded.";
  const code = typeof cause.details?.code === "string" ? cause.details.code : "";
  if (cause.status === 401) return "Your session expired before Copilot could respond. Sign in again and retry.";
  if (cause.status === 404) return "The Copilot streaming endpoint is unavailable. Restart the backend and retry.";
  if (code === "ai_stream_protocol_error") return "Copilot returned an unreadable stream. The provider response could not be decoded; retry safely.";
  if (code === "ai_stream_transport_error") return "The Copilot connection ended before the response completed. Retry safely; no accepted turn was recorded.";
  if (cause.status === 428 || code === "ai_consent_required") return "AI Processing Consent is required before Copilot can use this Workspace context.";
  if (cause.status === 403 || code === "email_verification_required") return "Verify your email before using Copilot in the public beta.";
  if (cause.status === 429 || code === "quota_exceeded") return "Your Copilot allowance or the beta AI budget is currently unavailable. Try again after renewal.";
  if (cause.status === 503 || code.startsWith("ai_")) return "The privacy-preserving AI provider is unavailable or declined this turn. Your Workspace was not changed; retry later.";
  return "Copilot could not complete this turn. Retry safely; failed turns do not consume usage.";
}
