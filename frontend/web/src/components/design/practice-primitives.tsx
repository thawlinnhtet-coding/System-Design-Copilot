import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Check, CircleAlert, CloudOff, LoaderCircle, Save } from "lucide-react";

export type SaveStatus = "saved" | "saving" | "unsaved" | "conflict" | "offline" | "error";

export function PracticeButton({ tone = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "quiet" | "danger" }) {
  const toneClass = tone === "primary"
    ? "border-signal bg-signal text-text-on-dark hover:brightness-110"
    : tone === "danger"
      ? "border-danger text-danger hover:bg-danger/10"
      : "border-line text-foreground hover:bg-surface-alt";
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border px-4 text-sm font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${className}`} {...props} />;
}

export function PracticeLink({ tone = "primary", className = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { tone?: "primary" | "quiet" }) {
  const toneClass = tone === "primary" ? "border-signal bg-signal text-text-on-dark hover:brightness-110" : "border-line text-foreground hover:bg-surface-alt";
  return <a className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border px-4 text-sm font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus ${toneClass} ${className}`} {...props} />;
}

export function PracticeField({ label, hint, children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { label: string; hint?: string }) {
  return <div className={`grid gap-2 ${className}`} {...props}><label className="text-xs font-semibold text-foreground">{label}</label>{children}{hint ? <p className="text-xs leading-5 text-text-muted">{hint}</p> : null}</div>;
}

export function FocusPanel({ eyebrow, title, children, className = "", ...props }: HTMLAttributes<HTMLElement> & { eyebrow?: string; title?: string }) {
  return <section className={`border border-line bg-surface p-5 sm:p-6 ${className}`} {...props}>{eyebrow ? <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{eyebrow}</p> : null}{title ? <h2 className="mt-2 font-display text-2xl font-medium tracking-[-0.03em]">{title}</h2> : null}{children}</section>;
}

export function EvidenceLink({ children, onClick, ...props }: { children: ReactNode; onClick?: () => void } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick">) {
  return <button className="inline-flex min-h-10 items-center gap-2 text-left text-sm font-semibold text-signal transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus disabled:text-text-muted" onClick={onClick} {...props}>{children}</button>;
}

export function SaveStatus({ status, message }: { status: SaveStatus; message?: string }) {
  const content = message ?? ({ saved: "Saved", saving: "Saving…", unsaved: "Unsaved changes", conflict: "Conflict", offline: "Offline", error: "Save failed" }[status]);
  const Icon = status === "saved" ? Check : status === "saving" ? LoaderCircle : status === "offline" ? CloudOff : status === "conflict" || status === "error" ? CircleAlert : Save;
  const tone = status === "conflict" || status === "error" ? "text-danger" : status === "offline" ? "text-warning" : "text-signal";
  return <span aria-live="polite" className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${tone}`} role="status"><Icon aria-hidden="true" className={status === "saving" ? "animate-spin motion-reduce:animate-none" : undefined} size={13} />{content}</span>;
}

export function StageRail<T extends string>({ stages, active, onChange }: { stages: ReadonlyArray<{ id: T; number: string; label: string }>; active: T; onChange: (stage: T) => void }) {
  return <nav aria-label="Workspace stages" className="flex overflow-x-auto border-b border-line" role="tablist">{stages.map((stage) => <button aria-selected={active === stage.id} className={`min-h-12 shrink-0 border-b-2 px-3 text-left text-sm transition-colors motion-reduce:transition-none sm:px-5 ${active === stage.id ? "border-signal text-foreground" : "border-transparent text-text-muted hover:border-line hover:text-foreground"}`} key={stage.id} onClick={() => onChange(stage.id)} role="tab" type="button"><span className="mr-2 font-mono text-[10px] text-text-muted">{stage.number}</span>{stage.label}</button>)}</nav>;
}
