"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useAuthenticatedApiClient,
  type WorkspaceSummary,
} from "@/lib/api/authenticated-client";
import { useEffect, useState, type FormEvent } from "react";

const buttonClassName =
  "min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";

export function WorkspaceDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [usage, setUsage] = useState<WorkspaceUsage | null>(null);
  const [hasLoadedDashboard, setHasLoadedDashboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    let current = true;
    Promise.all([api.getWorkspaces(), api.getUsage()])
      .then(([nextWorkspaces, nextUsage]) => {
        if (!current) {
          return;
        }
        setWorkspaces(nextWorkspaces);
        const activeWorkspaces = nextUsage.activeWorkspaces;
        setUsage(
          activeWorkspaces?.used !== undefined
            ? { used: activeWorkspaces.used, limit: activeWorkspaces.limit ?? null }
            : null,
        );
      })
      .catch(() => {
        if (current) {
          setError("We could not load your Workspaces. Try again.");
        }
      })
      .finally(() => {
        if (current) {
          setHasLoadedDashboard(true);
        }
      });

    return () => {
      current = false;
    };
  }, [api, isLoaded, isSignedIn]);

  const isLoading = isLoaded && isSignedIn && !hasLoadedDashboard && !error;

  if (!isLoaded) {
    return <p className="text-sm text-text-muted">Restoring your session...</p>;
  }

  if (!isSignedIn) {
    return (
      <section className="rounded-lg border border-line bg-surface p-8 text-center shadow-sm">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">Private practice space</p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground">Sign in to work on your systems.</h1>
        <p className="mx-auto mt-3 max-w-md leading-7 text-text-muted">
          Your Workspaces are private and saved behind the Spring API ownership boundary.
        </p>
        <SignInButton mode="modal">
          <button className={`${buttonClassName} mt-6 bg-signal text-text-on-dark hover:brightness-110`} type="button">
            Sign in to continue
          </button>
        </SignInButton>
      </section>
    );
  }

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !description.trim()) {
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const workspace = await api.createWorkspace(name.trim(), description.trim());
      setWorkspaces((current) => [workspace, ...current]);
      setUsage((current) => (current ? { ...current, used: current.used + 1 } : current));
      setName("");
      setDescription("");
      if (workspace.id) {
        router.push(`/workspace/${workspace.id}`);
      }
    } catch {
      setError("That Workspace could not be created. Check your plan allowance and try again.");
    } finally {
      setIsCreating(false);
    }
  }

  const nextWorkspace = workspaces.find((workspace) => workspace.status === "ACTIVE");

  async function renameWorkspace(workspace: WorkspaceSummary) {
    if (!editingName.trim() || !workspace.id) {
      return;
    }

    setBusyId(workspace.id);
    setError(null);
    try {
      const updated = await api.renameWorkspace(workspace.id, editingName.trim());
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditingId(null);
    } catch {
      setError("The Workspace could not be renamed.");
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus(workspace: WorkspaceSummary) {
    if (!workspace.id) {
      return;
    }

    setBusyId(workspace.id);
    setError(null);
    try {
      const updated = workspace.status === "ARCHIVED"
        ? await api.restoreWorkspace(workspace.id)
        : await api.archiveWorkspace(workspace.id);
      setWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setUsage((current) => {
        if (!current) {
          return current;
        }
        return { ...current, used: updated.status === "ACTIVE" ? current.used + 1 : current.used - 1 };
      });
    } catch {
      setError("The Workspace status could not be changed. Check your active-Workspace allowance.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteWorkspace(workspace: WorkspaceSummary) {
    if (!workspace.id || !window.confirm(`Permanently delete ${workspace.name ?? "this Workspace"}?`)) {
      return;
    }

    setBusyId(workspace.id);
    setError(null);
    try {
      await api.deleteWorkspace(workspace.id);
      setWorkspaces((current) => current.filter((item) => item.id !== workspace.id));
      if (workspace.status === "ACTIVE") {
        setUsage((current) => (current ? { ...current, used: current.used - 1 } : current));
      }
    } catch {
      setError("The Workspace could not be deleted.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-line pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">Practice home</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Your systems, in progress.</h1>
          <p className="mt-3 max-w-2xl leading-7 text-text-muted">
            Start with a blank system. Clarify the problem, make the trade-offs, and keep the reasoning visible.
          </p>
        </div>
      </header>

      {error ? (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="next-action-heading" className="border-y border-line py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal">Next meaningful action</p>
            <h2 className="mt-2 font-display text-2xl font-semibold" id="next-action-heading">{nextWorkspace ? `Continue ${nextWorkspace.name}` : "Start your first system"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{nextWorkspace ? "Pick up at the Clarify stage and keep the reasoning visible." : "Create a Workspace from a system idea, then make the problem explicit before choosing components."}</p>
          </div>
          {nextWorkspace?.id ? <Link className={primaryActionClass} href={`/workspace/${nextWorkspace.id}`}>Continue Workspace</Link> : <a className={primaryActionClass} href="#new-workspace">Create Workspace</a>}
        </div>
      </section>

      <section className="grid gap-8 border-y border-line py-6 lg:grid-cols-[minmax(0,1fr)_18rem]" id="new-workspace">
        <form className="lg:border-r lg:border-line lg:pr-8" onSubmit={createWorkspace}>
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">New Workspace</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-foreground">Start a custom system</h2>
            </div>
            <span className="text-xs text-text-muted">No generated solution</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
              <span>System name</span>
              <input
                className="w-full rounded-md border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Event ingestion platform"
                required
                value={name}
              />
            </label>
          <label className="space-y-2 text-sm text-foreground">
              <span>What are you designing?</span>
              <textarea
                className="min-h-24 w-full resize-y rounded-md border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                maxLength={2000}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the product, users, and the decision you want to practice."
                required
                value={description}
              />
            </label>
          </div>
          <button className={`${buttonClassName} mt-5 bg-signal text-text-on-dark hover:brightness-110`} disabled={isCreating} type="submit">
            {isCreating ? "Creating..." : "Create blank workspace"}
          </button>
        </form>

        <aside className="border-t border-line pt-6 lg:border-t-0 lg:pt-0">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Free plan</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{usage?.used ?? "-"}<span className="text-lg text-text-muted">/{usage?.limit ?? "-"}</span></p>
          <p className="mt-1 text-sm text-text-muted">active Workspaces</p>
          <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-text-muted">
            Archived Workspaces remain available without using an active-Workspace allowance.
          </p>
        </aside>
      </section>

      <section aria-labelledby="workspace-list-heading">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Workspace archive</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-foreground" id="workspace-list-heading">Keep the loop moving.</h2>
          </div>
          <span className="text-sm text-text-muted">{workspaces.length} total</span>
        </div>

        {isLoading ? <p className="mt-5 text-sm text-text-muted">Loading your Workspaces...</p> : null}
        {!isLoading && workspaces.length === 0 ? (
          <div className="mt-5 border-y border-dashed border-line px-6 py-10 text-center text-sm text-text-muted">
            Your first Workspace starts with a question, not an AI-generated diagram.
          </div>
        ) : null}
        <div className="mt-5 divide-y divide-line border-y border-line">
          {workspaces.map((workspace) => (
            <article className="py-5" key={workspace.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {editingId === workspace.id ? (
                    <div className="flex gap-2">
                      <input
                        aria-label={`Rename ${workspace.name ?? "Workspace"}`}
                        className="min-w-0 flex-1 rounded-md border border-signal bg-background px-3 py-2 text-foreground outline-none"
                        maxLength={120}
                        onChange={(event) => setEditingName(event.target.value)}
                        value={editingName}
                      />
                      <button className={`${buttonClassName} bg-signal text-text-on-dark`} disabled={busyId === workspace.id} onClick={() => renameWorkspace(workspace)} type="button">Save</button>
                      <button className={`${buttonClassName} text-text-muted hover:bg-surface-alt`} onClick={() => setEditingId(null)} type="button">Cancel</button>
                    </div>
                  ) : (
                  <h3 className="truncate text-lg font-semibold text-foreground">{workspace.name}</h3>
                  )}
                   <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-muted">{workspace.description}</p>
                </div>
                 <span className="shrink-0 rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  {workspace.status === "ARCHIVED" ? "Archived" : "Active"}
                </span>
              </div>
               <div className="mt-5 grid grid-cols-3 gap-3 border-y border-line py-4 text-xs">
                 <div><p className="text-text-muted">Source</p><p className="mt-1 text-foreground">{workspace.source ?? "Custom"}</p></div>
                 <div><p className="text-text-muted">Progress</p><p className="mt-1 text-foreground">{workspace.progressPercent ?? 0}%</p></div>
                 <div><p className="text-text-muted">Save state</p><p className="mt-1 text-foreground">{workspace.saveState ?? "Not started"}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-4">
                {workspace.id && workspace.status === "ACTIVE" ? <Link className={`${buttonClassName} bg-signal text-text-on-dark hover:brightness-110`} href={`/workspace/${workspace.id}`}>Continue</Link> : null}
                <button
                   className={`${buttonClassName} border border-line text-foreground hover:bg-surface-alt`}
                  disabled={busyId === workspace.id}
                  onClick={() => {
                    setEditingId(workspace.id ?? null);
                    setEditingName(workspace.name ?? "");
                  }}
                  type="button"
                >Rename</button>
                <button className={`${buttonClassName} border border-line text-foreground hover:bg-surface-alt`} disabled={busyId === workspace.id} onClick={() => changeStatus(workspace)} type="button">
                  {workspace.status === "ARCHIVED" ? "Restore" : "Archive"}
                </button>
                <button className={`${buttonClassName} text-danger hover:bg-danger/10`} disabled={busyId === workspace.id} onClick={() => deleteWorkspace(workspace)} type="button">Delete permanently</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

const primaryActionClass = "inline-flex min-h-11 items-center justify-center rounded-md bg-signal px-4 text-sm font-semibold text-text-on-dark transition-colors hover:brightness-110";

type WorkspaceUsage = {
  used: number;
  limit: number | null;
};
