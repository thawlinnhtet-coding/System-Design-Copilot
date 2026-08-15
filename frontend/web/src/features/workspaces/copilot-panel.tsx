"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiRequestError, useAuthenticatedApiClient, type AiConsent } from "@/lib/api/authenticated-client";

type CopilotTurn = { id: string; content: string; model: string; replayed: boolean };

export function CopilotPanel({ workspaceId, readOnly }: { workspaceId: string; readOnly: boolean }) {
  const api = useAuthenticatedApiClient();
  const [consent, setConsent] = useState<AiConsent | null>(null);
  const [question, setQuestion] = useState("");
  const [turn, setTurn] = useState<CopilotTurn | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnId, setTurnId] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    api.getAiConsent().then((value) => { if (current) setConsent(value); }).catch(() => { if (current) setError("Copilot consent settings could not be loaded. Try again."); });
    return () => { current = false; };
  }, [api]);

  const disabled = readOnly || pending || !consent?.granted;
  const submitLabel = useMemo(() => pending ? "Thinking…" : turn ? "Ask another question" : "Ask Copilot", [pending, turn]);

  async function ask(event?: FormEvent) {
    event?.preventDefault();
    if (!question.trim() || disabled) return;
    const id = turnId ?? crypto.randomUUID();
    setTurnId(id);
    setPending(true);
    setError(null);
    try {
      const response = await api.askCopilot(workspaceId, { clientTurnId: id, question: question.trim() });
      setTurn(response);
      setTurnId(null);
    } catch (cause) {
      setError(copilotError(cause));
		setTurnId(null);
    } finally {
      setPending(false);
    }
  }

  return <aside aria-label="Copilot guidance" className="border border-line bg-background p-5 sm:p-6">
    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">COPILOT / ADVISORY GUIDANCE</p>
    <h3 className="mt-2 font-display text-2xl font-semibold">Interrogate the design, not a generated answer.</h3>
    <p className="mt-2 text-sm leading-6 text-text-muted">Copilot asks contextual questions, surfaces trade-offs, and explains uncertainty. It cannot change your Architecture Document, Requirements, or Decisions.</p>
    <section className="mt-5 border-y border-line py-4" aria-label="Copilot context and privacy">
      <p className="text-sm font-semibold">Bounded Workspace context</p>
      <p className="mt-1 text-xs leading-5 text-text-muted">Only this Workspace’s brief, Requirements, Assumptions, Decisions, open questions, architecture structure, and Challenge snapshot are sent as untrusted data.</p>
      <p className="mt-2 text-xs leading-5 text-text-muted">Excluded: credentials, tokens, passwords, billing and identity data, provider metadata, other Workspaces, and any reference architecture.</p>
      {consent?.policy ? <p className="mt-2 font-mono text-[10px] text-text-muted">Policy {consent.policy.currentVersion} · private-provider routing · no fallback</p> : null}
    </section>
    {!consent?.granted && !readOnly ? <p className="mt-4 text-sm leading-6 text-text-muted">AI Processing Consent is required before your first turn. <Link className="font-semibold text-signal hover:underline" href="/account/ai">Review consent and privacy policy</Link>.</p> : null}
    {readOnly ? <p className="mt-4 text-sm text-amber-800">Restore this Workspace to use Copilot.</p> : null}
    <form className="mt-5" onSubmit={(event) => void ask(event)}>
      <label className="block text-sm font-semibold" htmlFor="copilot-question">What decision are you evaluating?</label>
      <textarea className="mt-2 min-h-28 w-full resize-y border border-line bg-surface p-3 text-sm outline-none focus:border-signal disabled:cursor-not-allowed disabled:bg-muted" disabled={disabled} id="copilot-question" maxLength={4000} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: What failure modes should I examine before relying on this cache?" value={question} />
      <div className="mt-3 flex flex-wrap items-center gap-3"><button className="inline-flex min-h-11 items-center border border-signal bg-signal px-4 text-sm font-semibold text-text-on-dark disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled || !question.trim()} type="submit">{submitLabel}</button>{error ? <button className="min-h-11 border border-line px-3 text-sm font-semibold text-signal" onClick={() => void ask()} type="button">Retry safely</button> : null}</div>
    </form>
    {error ? <p className="mt-4 border-l-2 border-danger pl-3 text-sm leading-6 text-danger" role="alert">{error}</p> : null}
    {turn ? <section aria-label="Copilot response" className="mt-6 border-l-2 border-signal pl-4"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">COPILOT RESPONSE {turn.replayed ? "/ RECOVERED" : ""}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{turn.content}</p><p className="mt-3 font-mono text-[10px] text-text-muted">Model {turn.model}</p></section> : null}
  </aside>;
}

function copilotError(cause: unknown) {
  if (!(cause instanceof ApiRequestError)) return "Connection lost before Copilot could respond. Retry safely; no accepted turn was recorded.";
  const code = typeof cause.details?.code === "string" ? cause.details.code : "";
  if (cause.status === 428 || code === "ai_consent_required") return "AI Processing Consent is required before Copilot can use this Workspace context.";
  if (cause.status === 403 || code === "email_verification_required") return "Verify your email before using Copilot in the public beta.";
  if (cause.status === 429 || code === "quota_exceeded") return "Your Copilot allowance or the beta AI budget is currently unavailable. Try again after renewal.";
  if (cause.status === 503 || code.startsWith("ai_")) return "The privacy-preserving AI provider is unavailable or declined this turn. Your Workspace was not changed; retry later.";
  return "Copilot could not complete this turn. Retry safely; failed turns do not consume usage.";
}
