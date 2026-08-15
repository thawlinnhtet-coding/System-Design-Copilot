"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { withAuthDestination } from "@/features/auth/auth-redirect";
import {
  ApiRequestError,
  type WorkspaceSummary,
  useAuthenticatedApiClient,
} from "@/lib/api/authenticated-client";

const queryKey = ["workspaces"] as const;
const button =
  "inline-flex h-11 items-center justify-center rounded-[3px] border px-[18px] text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus";
const stages = ["01  CLARIFY", "02  DESIGN", "03  STRESS-TEST", "04  REVIEW"];

export function PracticeHome() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [systemIdea, setSystemIdea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const result = useQuery({
    queryKey,
    queryFn: api.getWorkspaces,
    enabled: isLoaded && isSignedIn,
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace(withAuthDestination("/sign-in", "/practice"));
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <p className="px-5 py-12 text-sm text-text-muted">Restoring your session...</p>;
  }
  if (!isSignedIn) {
    return <p className="px-5 py-12 text-sm text-text-muted" role="status">Taking you to sign in...</p>;
  }

  const workspaces = result.data ?? [];
  const active = workspaces.filter((workspace) => workspace.status === "ACTIVE");
  const recent = [...workspaces]
    .sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""))
    .slice(0, 3);
  const next = active[0];

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !systemIdea.trim()) return;

    setError(null);
    try {
      const workspace = await api.createCustomDesignWorkspace(name.trim(), systemIdea.trim());
      await queryClient.invalidateQueries({ queryKey });
      if (workspace.id) router.push(`/workspace/${workspace.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiRequestError && caught.status === 403
          ? "Your plan has reached its active Workspace limit."
          : "That Workspace could not be created. Try again.",
      );
    }
  }

  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1440px] flex-col gap-7 bg-background px-5 py-10 sm:px-8 lg:px-16 lg:py-[42px]"
      data-testid="practice-home"
    >
      {error || result.isError ? (
        <p className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error ?? "We could not load your Workspaces. Try again."}
        </p>
      ) : null}
      {creating ? (
        <CreateWorkspace
          systemIdea={systemIdea}
          name={name}
          onSystemIdea={setSystemIdea}
          onName={setName}
          onSubmit={create}
        />
      ) : (
        <>
          <header className="flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-[720px]">
              <p className="font-mono text-[11px] leading-[1.3] text-text-muted">PRACTICE / NEXT ACTION</p>
              <h1 className="mt-[10px] font-display text-[42px] font-medium leading-[1.05] tracking-[-0.04em] text-foreground">
                {next ? "Continue the reasoning in progress." : "Start with one decision."}
              </h1>
              <p className="mt-[10px] max-w-[680px] text-[15px] leading-[1.5] text-text-muted">
                {next
                  ? "Your most relevant unfinished Workspace is ready. The next useful step is visible without turning practice into a dashboard."
                  : "Choose the recommended starter Challenge, or begin with your own system. Your first Workspace will guide the practice loop."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className={`${button} shrink-0 border-signal bg-signal font-semibold text-text-on-dark hover:brightness-110`} href="/practice/review">
                Review existing architecture
              </Link>
              <button className={`${button} shrink-0 border-line text-signal hover:bg-surface-alt`} onClick={() => setCreating(true)} type="button">
                Start custom design
              </button>
            </div>
          </header>
          {next ? <ResumeWorkspace workspace={next} /> : <StarterChallenge />}
          <section className="grid gap-9 lg:grid-cols-2">
            <RecommendedChallenge />
            <RecentWorkspaces workspaces={recent} />
          </section>
        </>
      )}
    </main>
  );
}

function ResumeWorkspace({ workspace }: { workspace: WorkspaceSummary }) {
  return (
    <section className="grid min-h-[250px] justify-start border border-line bg-surface lg:h-[250px] min-[1400px]:grid-cols-[900px_360px]">
      <div className="flex min-w-0 flex-col gap-[13px] p-7">
        <p className="font-mono text-[11px] leading-[1.3] text-text-muted">
          CONTINUE WORKSPACE {"\u00b7"} {workspace.saveState?.replaceAll("_", " ") ?? "SAVED"}
        </p>
        <p className="font-mono text-[11px] leading-[1.3] text-signal">{workspaceMetadata(workspace)}</p>
        <h2 className="font-display text-[28px] font-medium leading-[1.3] tracking-[-0.03em]">
          {workspace.name ?? "Untitled Workspace"}
        </h2>
        <p className="max-w-[620px] text-sm leading-[1.5] text-text-muted">
          {workspace.description ?? "Two assumptions remain implicit. Clarify delivery guarantees before extending the queue design."}
        </p>
        <div className="flex flex-wrap gap-[18px] font-mono text-[11px] leading-[1.3] text-text-muted">
          {stages.map((stage) => <span key={stage}>{stage}</span>)}
        </div>
        <Link className={`${button} h-[46px] w-fit border-signal bg-signal text-text-on-dark`} href={`/workspace/${workspace.id}`}>
          Continue Clarify
        </Link>
      </div>
      <aside className="flex w-full self-start flex-col gap-[10px] bg-chrome-850 p-7">
        <p className="font-mono text-[11px] leading-[1.3] text-text-on-dark-secondary">NEXT DECISION</p>
        <p className="max-w-[300px] font-display text-[22px] leading-[1.25] text-text-on-dark">
          What delivery guarantee do downstream consumers actually need?
        </p>
        <p className="max-w-[290px] text-[13px] leading-[1.45] text-text-on-dark-secondary">
          Answering this may become a Requirement or an Assumption.
        </p>
      </aside>
    </section>
  );
}

function workspaceMetadata(workspace: WorkspaceSummary) {
  return `${workspace.type?.replaceAll("_", " ") ?? "WORKSPACE"} · ${workspace.source?.replaceAll("_", " ") ?? "UNKNOWN SOURCE"}`;
}

function StarterChallenge() {
  return (
    <section className="grid min-h-[290px] justify-start border border-line bg-surface lg:h-[290px] min-[1400px]:grid-cols-[900px_360px]">
      <div className="flex h-full flex-col items-start gap-3 p-7">
        <p className="font-mono text-[11px] font-semibold text-signal">RECOMMENDED STARTER {"\u00b7"} FOUNDATION {"\u00b7"} 35 MIN</p>
        <h2 className="font-display text-[28px] font-medium tracking-[-0.03em]">Design a reliable URL shortener</h2>
        <p className="max-w-[720px] text-sm leading-[1.5] text-text-muted">Practice identifier design, a read-heavy data path, and one explicit caching trade-off.</p>
        <Link className={`${button} mt-1 border-signal bg-signal font-semibold text-text-on-dark`} href="/challenges">
          View Challenge {"\u2192"}
        </Link>
      </div>
      <aside className="flex w-full self-start flex-col gap-[10px] bg-chrome-850 p-7">
        <p className="font-mono text-[11px] leading-[1.3] text-text-on-dark-secondary">THE PRACTICE LOOP</p>
        <p className="max-w-[300px] font-display text-[22px] leading-[1.35] text-text-on-dark">
          {"Clarify \u2192 Design \u2192 Stress-test \u2192 Review"}
        </p>
        <p className="max-w-[290px] text-[13px] leading-[1.45] text-text-on-dark-secondary">
          Your work stays private and resumable.
        </p>
      </aside>
    </section>
  );
}

function RecommendedChallenge() {
  return (
    <section className="flex flex-col items-start gap-3">
      <p className="font-mono text-[11px] text-text-muted">RECOMMENDED NEXT CHALLENGE</p>
      <h2 className="font-display text-2xl">Design a URL shortener</h2>
      <p className="text-sm leading-[1.5] text-text-muted">Practice read-heavy scale, identifier design, and cache trade-offs.</p>
      <Link className={`${button} border-signal bg-signal font-semibold text-text-on-dark`} href="/challenges">
        View Challenge {"\u2192"}
      </Link>
    </section>
  );
}

function RecentWorkspaces({ workspaces }: { workspaces: WorkspaceSummary[] }) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] text-text-muted">RECENT WORKSPACES</p>
        {workspaces.length ? <Link className="inline-flex h-8 items-center justify-center rounded-[3px] border border-signal px-3 text-xs font-semibold text-signal transition-colors hover:bg-signal/10 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus" href="/practice/workspaces">Manage all {"\u2192"}</Link> : null}
      </div>
      <div className="mt-3">
        {workspaces.length ? workspaces.map((workspace) => (
          <Link
            className="flex min-h-[38px] items-center justify-between gap-4 border-b border-line py-[10px] text-sm hover:text-signal"
            href={`/workspace/${workspace.id}`}
            key={workspace.id}
          >
            <span>{workspace.name ?? "Untitled Workspace"}</span>
            <span className="font-mono text-[11px] text-text-muted">{workspace.latestReviewState ?? `${workspace.progressPercent ?? 0}%`}</span>
          </Link>
        )) : <p className="border-b border-line py-[10px] text-sm text-text-muted">Your recent Workspaces will appear here.</p>}
      </div>
    </section>
  );
}

function CreateWorkspace({ name, onName, onSubmit, onSystemIdea, systemIdea }: {
  name: string;
  onSystemIdea: (value: string) => void;
  onName: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  systemIdea: string;
}) {
  return (
    <div className="flex flex-col gap-7">
      <header className="max-w-[720px]">
        <p className="font-mono text-[11px] leading-[1.3] text-text-muted">PRACTICE / CUSTOM DESIGN</p>
        <h1 className="mt-[10px] font-display text-[42px] font-medium leading-[1.05] tracking-[-0.04em] text-foreground">Make the problem explicit.</h1>
        <p className="mt-[10px] max-w-[680px] text-[15px] leading-[1.5] text-text-muted">Name the system, state what you are designing, and enter the practice loop without a generated solution.</p>
      </header>
      <nav aria-label="Workspace creation paths" className="flex gap-5 border-b border-line pb-[10px] font-mono text-[11px]">
        <span className="text-signal">CUSTOM DESIGN</span>
        <span className="text-text-muted">MANUAL RECREATION</span>
        <span className="text-text-muted">IMPORT PACKAGE</span>
      </nav>
      <section className="grid min-h-[300px] justify-start border border-line bg-surface lg:h-[300px] min-[1400px]:grid-cols-[860px_360px]">
        <form className="flex min-w-0 flex-col gap-3 p-7" onSubmit={onSubmit}>
          <p className="font-mono text-[11px] leading-[1.3] text-text-muted">CUSTOM DESIGN</p>
          <h2 className="font-display text-2xl leading-[1.3]">Start with your own system</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-[5px]">
              <span className="font-mono text-[10px] text-text-muted">SYSTEM NAME</span>
              <input className="field h-[42px]" maxLength={120} onChange={(event) => onName(event.target.value)} placeholder="e.g. Event ingestion platform" required value={name} />
            </label>
            <label className="grid gap-[5px]">
              <span className="font-mono text-[10px] text-text-muted">WHAT ARE YOU DESIGNING?</span>
              <textarea className="field min-h-24 py-3" maxLength={2000} onChange={(event) => onSystemIdea(event.target.value)} placeholder="Describe the product, users, and decision." required value={systemIdea} />
            </label>
          </div>
          <button className={`${button} mt-auto w-fit border-signal bg-signal font-semibold text-text-on-dark`} type="submit">
            Create blank Workspace {"\u2192"}
          </button>
        </form>
        <aside className="flex w-full self-start flex-col gap-[10px] bg-chrome-850 p-7">
          <p className="font-mono text-[11px] text-text-on-dark-secondary">THE PRACTICE LOOP</p>
          <p className="max-w-[300px] font-display text-[22px] leading-[1.35] text-text-on-dark">{"Clarify \u2192 Design \u2192 Stress-test \u2192 Review"}</p>
          <p className="max-w-[290px] text-[13px] leading-[1.45] text-text-on-dark-secondary">No generated solution. You decide what matters and which trade-offs to defend.</p>
        </aside>
      </section>
    </div>
  );
}
