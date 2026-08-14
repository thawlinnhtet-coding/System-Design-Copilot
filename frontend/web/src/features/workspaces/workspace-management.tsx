"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { withAuthDestination } from "@/features/auth/auth-redirect";
import { ApiRequestError, type WorkspaceSummary, useAuthenticatedApiClient } from "@/lib/api/authenticated-client";

const workspaceKey = ["workspaces"] as const;
const action = "inline-flex min-h-11 items-center justify-center rounded-[3px] border px-[18px] text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";

export function WorkspaceManagement() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const router = useRouter();
  const client = useQueryClient();
  const [deleting, setDeleting] = useState<WorkspaceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({ queryKey: workspaceKey, queryFn: api.getWorkspaces, enabled: isLoaded && isSignedIn });

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace(withAuthDestination("/sign-in", "/practice/workspaces"));
  }, [isLoaded, isSignedIn, router]);

  async function mutate(workspace: WorkspaceSummary, operation: "archive" | "restore" | "delete") {
    if (!workspace.id) return;
    setError(null);
    try {
      if (operation === "archive") await api.archiveWorkspace(workspace.id);
      if (operation === "restore") await api.restoreWorkspace(workspace.id);
      if (operation === "delete") await api.deleteWorkspace(workspace.id);
      await client.invalidateQueries({ queryKey: workspaceKey });
      setDeleting(null);
    } catch (caught) {
      setError(caught instanceof ApiRequestError && caught.status === 403
        ? "That action is not available for this Workspace."
        : "The Workspace could not be updated. Your existing work is safe.");
    }
  }

  if (!isLoaded || !isSignedIn) return <p className="px-5 py-12 text-sm text-text-muted" role="status">{isLoaded ? "Taking you to sign in..." : "Restoring your session..."}</p>;
  const workspaces = query.data ?? [];
  const active = workspaces.filter((workspace) => workspace.status === "ACTIVE");
  const archived = workspaces.filter((workspace) => workspace.status === "ARCHIVED");

  return <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1440px] flex-col gap-7 bg-background px-5 py-10 sm:px-8 lg:px-16 lg:py-[42px]">
    <header className="flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-end">
      <div className="max-w-[720px]"><p className="font-mono text-[11px] leading-[1.3] text-text-muted">WORKSPACE / MANAGEMENT</p><h1 className="mt-[10px] font-display text-[42px] font-medium leading-[1.05] tracking-[-0.04em] text-foreground">Your Workspaces.</h1><p className="mt-[10px] max-w-[680px] text-[15px] leading-[1.5] text-text-muted">Keep active practice in view. Archive what is paused, then restore it when the problem becomes useful again.</p></div>
      <Link className={`${action} border-signal bg-signal font-semibold text-text-on-dark`} href="/practice">New Workspace</Link>
    </header>
    {error || query.isError ? <p className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error ?? "We could not load your Workspaces. Try again."}</p> : null}
    {query.isLoading ? <p className="border border-line bg-surface px-7 py-12 text-sm text-text-muted">Loading your Workspaces...</p> : <section className="grid items-start gap-9 min-[1400px]:grid-cols-[860px_360px]">
      <div className="border border-line bg-surface"><div className="flex items-center justify-between border-b border-line p-7"><div><p className="font-mono text-[11px] text-text-muted">YOUR WORKSPACES</p><h2 className="mt-1 font-display text-2xl">Active and archived work</h2></div><span className="border border-line bg-background px-2 py-1 font-mono text-[10px] text-text-muted">{active.length} ACTIVE</span></div>
        <WorkspaceGroup label="ACTIVE WORKSPACES" empty="No active Workspaces. Start a custom design when you are ready to reason through a new problem." workspaces={active}>{(workspace) => <><Link className="text-sm text-signal hover:underline" href={`/workspace/${workspace.id}`}>Open</Link><button className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-foreground" onClick={() => void mutate(workspace, "archive")} type="button"><Archive size={14} />Archive</button></>}</WorkspaceGroup>
        <WorkspaceGroup label="ARCHIVED WORKSPACES" empty="No archived Workspaces. Archiving is a reversible way to clear active practice." workspaces={archived}>{(workspace) => <><button className="inline-flex items-center gap-1 text-sm text-signal hover:underline" onClick={() => void mutate(workspace, "restore")} type="button"><RotateCcw size={14} />Restore</button><button className="inline-flex items-center gap-1 text-sm text-danger hover:underline" onClick={() => setDeleting(workspace)} type="button"><Trash2 size={14} />Delete</button></>}</WorkspaceGroup>
      </div>
      <aside className="flex w-full self-start flex-col gap-3 bg-chrome-850 p-7"><p className="font-mono text-[11px] leading-[1.3] text-text-on-dark-secondary">WORKSPACE STATUS</p><p className="max-w-[300px] font-display text-[22px] leading-[1.35] text-text-on-dark">One active problem at a time.</p><p className="max-w-[290px] text-[13px] leading-[1.45] text-text-on-dark-secondary">Archive paused work to keep Practice focused. Restoring brings the Workspace back exactly where you left it.</p></aside>
    </section>}
    <Link className="inline-flex w-fit items-center font-mono text-[11px] leading-[1.3] text-signal transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus" href="/practice"><ArrowLeft aria-hidden="true" className="mr-1" size={14} />BACK TO PRACTICE</Link>
    {deleting ? <DeleteDialog name={deleting.name ?? "this Workspace"} onCancel={() => setDeleting(null)} onConfirm={() => void mutate(deleting, "delete")} /> : null}
  </main>;
}

function WorkspaceGroup({ children, empty, label, workspaces }: { children: (workspace: WorkspaceSummary) => React.ReactNode; empty: string; label: string; workspaces: WorkspaceSummary[] }) {
  return <section><p className="px-7 pb-2 pt-4 font-mono text-[10px] text-text-muted">{label}</p>{workspaces.length ? workspaces.map((workspace) => <div className="flex items-center justify-between gap-4 border-b border-line px-7 py-3" key={workspace.id}><div className="min-w-0"><p className="truncate text-sm text-foreground">{workspace.name ?? "Untitled Workspace"}</p><p className="mt-1 font-mono text-[11px] text-text-muted">{workspace.type?.replaceAll("_", " ") ?? "WORKSPACE"} · {workspace.source?.replaceAll("_", " ") ?? "UNKNOWN SOURCE"}</p><p className="mt-1 font-mono text-[11px] text-text-muted">{workspace.status} · {workspace.progressPercent ?? 0}% · {workspace.saveState?.replaceAll("_", " ") ?? "SAVED"}</p></div><div className="flex shrink-0 items-center gap-4">{children(workspace)}</div></div>) : <p className="border-b border-line px-7 py-5 text-sm text-text-muted">{empty}</p>}</section>;
}

function DeleteDialog({ name, onCancel, onConfirm }: { name: string; onCancel: () => void; onConfirm: () => void }) {
  return <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-chrome-850/70 p-5" role="dialog" aria-labelledby="delete-workspace-title"><section className="w-full max-w-md border border-line bg-surface p-7 shadow-xl"><p className="font-mono text-[11px] text-danger">DELETE WORKSPACE</p><h2 className="mt-2 font-display text-2xl" id="delete-workspace-title">Delete {name}?</h2><p className="mt-3 text-sm leading-6 text-text-muted">This permanently removes the Workspace and its private reasoning. This cannot be undone.</p><div className="mt-7 flex justify-end gap-3"><button className={`${action} border-line bg-background text-foreground`} onClick={onCancel} type="button">Cancel</button><button className={`${action} border-danger bg-danger text-text-on-dark`} onClick={onConfirm} type="button">Delete Workspace</button></div></section></div>;
}
