"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ApiRequestError, useAuthenticatedApiClient, type AiConsent, type AssumptionInput, type QuestionInput, type RequirementInput } from "@/lib/api/authenticated-client";

type CopilotTurn = { id: string; content: string; model: string; replayed: boolean };
type ProposalKind = "requirement" | "assumption" | "question";

export function CopilotPanel({ embedded = false, workspaceId, readOnly }: { embedded?: boolean; workspaceId: string; readOnly: boolean }) {
  const api = useAuthenticatedApiClient();
  const [consent, setConsent] = useState<AiConsent | null>(null);
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [turn, setTurn] = useState<CopilotTurn | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnId, setTurnId] = useState<string | null>(null);
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
  async function ask(event?: FormEvent) {
    event?.preventDefault();
    if (!question.trim() || disabled) return;
    const id = turnId ?? crypto.randomUUID();
    const submitted = question.trim();
    setSubmittedQuestion(submitted);
    setTurnId(id);
    setPending(true);
    setError(null);
    try {
      const response = await api.streamCopilot(workspaceId, { clientTurnId: id, question: submitted }, (event) => {
        if (event.type !== "delta") return;
        setTurn((current) => ({ id, content: `${current?.content ?? ""}${event.content ?? ""}`, model: event.model ?? current?.model ?? "copilot", replayed: false }));
      });
      setTurn(response);
      setTurnId(null);
    } catch (cause) {
      setError(copilotError(cause));
      setTurnId(null);
    } finally {
      setPending(false);
    }
  }

  function openProposal(kind: ProposalKind) {
    setProposalKind(kind);
    const responseDraft = turn?.content.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? question.trim();
    setProposalText(kind === "question" ? question.trim() : responseDraft);
    setProposalWhy("");
    setProposalError(null);
    setProposalSaved(null);
  }

  async function saveProposal(event: FormEvent) {
    event.preventDefault();
    if (!proposalKind || !proposalText.trim() || readOnly || proposalBusy) return;
    setProposalBusy(true);
    setProposalError(null);
    setProposalSaved(null);
    try {
      if (proposalKind === "requirement") {
        await api.createRequirement(workspaceId, {
          kind: "FUNCTIONAL",
          statement: proposalText.trim(),
          priority: "MUST",
          status: "OPEN",
          rationale: proposalWhy.trim() || "Suggested during Copilot guidance.",
          source: "COPILOT",
        } satisfies RequirementInput);
        setProposalSaved("Requirement added to your design checklist.");
      } else if (proposalKind === "assumption") {
        await api.createAssumption(workspaceId, {
          category: "Copilot suggestion",
          quantitativeValue: proposalText.trim(),
          rationale: proposalWhy.trim() || "Suggested during Copilot guidance.",
          confidence: "LOW",
          status: "ACTIVE",
          source: "COPILOT",
        } satisfies AssumptionInput);
        setProposalSaved("Saved as an assumption.");
      } else {
        await api.createQuestion(workspaceId, {
          question: proposalText.trim(),
          whyItMatters: proposalWhy.trim() || "This could change the design.",
          status: "OPEN",
        } satisfies QuestionInput);
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

  return <section aria-label="Copilot guidance" className={embedded ? "pt-5" : "border border-line bg-background p-5 sm:p-6"}>
    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">COPILOT / ADVISORY</p>
    <h3 className="mt-2 font-display text-[22px] font-normal leading-[1.2]">Think through one decision.</h3>
    <p className="mt-2 text-[13px] leading-5 text-text-muted">Ask about a requirement, trade-off, or failure mode. Copilot suggests; you decide what belongs in the document.</p>
    <details className="mt-4 border-y border-line py-3" aria-label="Copilot context and privacy">
      <summary className="cursor-pointer text-xs font-semibold text-foreground">Privacy &amp; context</summary>
      <div className="mt-3 text-xs leading-5 text-text-muted"><p>Only this Workspace&apos;s brief, Requirements, Assumptions, Decisions, open questions, architecture structure, and Challenge snapshot are sent as untrusted data.</p><p className="mt-2">Excluded: credentials, tokens, passwords, billing and identity data, provider metadata, other Workspaces, and any reference architecture.</p>{consent?.policy ? <p className="mt-2 font-mono text-[10px]">Policy {consent.policy.currentVersion} / private-provider routing / no fallback</p> : null}</div>
    </details>
    {!consent?.granted && !readOnly ? <p className="mt-4 text-sm leading-6 text-text-muted">AI Processing Consent is required before your first turn. <Link className="font-semibold text-signal hover:underline" href="/account/ai">Review consent and privacy policy</Link>.</p> : null}
    {readOnly ? <p className="mt-4 text-sm text-amber-800">Restore this Workspace to use Copilot.</p> : null}
    {!turn ? <div className="mt-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">TRY ASKING</p><div className="mt-2 grid gap-2"><button className="w-full border border-line bg-surface px-3 py-2 text-left text-xs text-foreground hover:bg-surface-alt disabled:opacity-50" disabled={disabled} onClick={() => setQuestion("Help me find a failure mode in this design.")} type="button">Help me find a failure mode</button><button className="w-full border border-line bg-surface px-3 py-2 text-left text-xs text-foreground hover:bg-surface-alt disabled:opacity-50" disabled={disabled} onClick={() => setQuestion("Compare two reasonable trade-offs for this design.")} type="button">Compare two trade-offs</button></div></div> : null}
    <form className="mt-4 border border-line bg-surface p-3" onSubmit={(event) => void ask(event)}>
      <label className="sr-only" htmlFor="copilot-question">Ask Copilot</label>
      <textarea className="min-h-20 w-full resize-y bg-transparent text-sm leading-5 outline-none placeholder:text-text-muted disabled:cursor-not-allowed" disabled={disabled} id="copilot-question" maxLength={4000} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about this design…" value={question} />
      <div className="mt-3 flex flex-wrap items-center gap-2"><button aria-label={turn ? "Ask another question" : "Ask Copilot"} className="inline-flex min-h-10 flex-1 items-center justify-center border border-signal bg-signal px-3 text-xs font-semibold text-text-on-dark disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled || !question.trim()} type="submit">{pending ? "Thinking..." : "Ask Copilot  →"}</button>{error ? <button className="min-h-10 border border-line px-3 text-xs font-semibold text-signal" onClick={() => void ask()} type="button">Retry</button> : null}</div>
    </form>
    {error ? <p className="mt-4 border-l-2 border-danger pl-3 text-sm leading-6 text-danger" role="alert">{error}</p> : null}
    {turn ? <section aria-label="Copilot response" className="mt-5 grid gap-3"><div className="border border-line bg-surface p-3"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">YOU</p><p className="mt-2 text-xs leading-5 text-foreground">{submittedQuestion}</p></div><div className="border border-line bg-background p-3"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">COPILOT {turn.replayed ? "/ RECOVERED" : ""}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-foreground">{turn.content}</p><p className="mt-3 font-mono text-[10px] text-text-muted">Model {turn.model}</p></div><div className="border-t border-line pt-4"><p className="text-sm font-semibold">What should we keep?</p><p className="mt-1 text-xs leading-5 text-text-muted">Choose a destination, then review the draft before saving it.</p><div className="mt-3 grid gap-2"><button className="min-h-10 border border-line px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-alt" disabled={readOnly || proposalBusy} onClick={() => openProposal("requirement")} type="button">Add as requirement</button><button className="min-h-10 border border-line px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-alt" disabled={readOnly || proposalBusy} onClick={() => openProposal("assumption")} type="button">Keep as assumption</button><button className="min-h-10 border border-line px-3 text-left text-xs font-semibold text-foreground hover:bg-surface-alt" disabled={readOnly || proposalBusy} onClick={() => openProposal("question")} type="button">Save as open question</button></div>{proposalSaved ? <p className="mt-3 text-xs text-success" role="status">{proposalSaved}</p> : null}{proposalKind ? <ProposalForm kind={proposalKind} busy={proposalBusy} error={proposalError} onCancel={() => setProposalKind(null)} onChangeText={setProposalText} onChangeWhy={setProposalWhy} onSubmit={saveProposal} text={proposalText} why={proposalWhy} /> : null}</div></section> : null}
  </section>;
}

function ProposalForm({ busy, error, kind, onCancel, onChangeText, onChangeWhy, onSubmit, text, why }: { busy: boolean; error: string | null; kind: ProposalKind; onCancel: () => void; onChangeText: (value: string) => void; onChangeWhy: (value: string) => void; onSubmit: (event: FormEvent) => void; text: string; why: string }) {
  const labels = {
    requirement: { title: "Review requirement draft", text: "Requirement statement", placeholder: "State what the system must do." },
    assumption: { title: "Review assumption draft", text: "What are you assuming?", placeholder: "State the number or condition you are taking as true." },
    question: { title: "Review open question", text: "What is still unclear?", placeholder: "State the question that could change the design." },
  }[kind];
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
