"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiRequestError, useAuthenticatedApiClient, type WorkspaceSummary } from "@/lib/api/authenticated-client";
import { withAuthDestination } from "@/features/auth/auth-redirect";

const workspacesQueryKey = ["workspaces"] as const;
const buttonClassName = "inline-flex h-11 items-center justify-center rounded-[3px] border px-[18px] text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus";

export function PracticeHome() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workspaces = useQuery({ queryKey: workspacesQueryKey, queryFn: api.getWorkspaces, enabled: isLoaded && isSignedIn });

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace(withAuthDestination("/sign-in", "/practice"));
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) return <p className="px-5 py-12 text-sm text-text-muted">Restoring your session...</p>;
  if (!isSignedIn) {
    return <p className="px-5 py-12 text-sm text-text-muted" role="status">Taking you to sign in...</p>;
  }

  const values = workspaces.data ?? [];
  const active = values.filter((workspace) => workspace.status === "ACTIVE");
  const archived = values.filter((workspace) => workspace.status === "ARCHIVED");

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !description.trim()) return;
    setIsCreating(true); setError(null);
    try {
      const workspace = await api.createWorkspace(name.trim(), description.trim());
      await queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
      setName(""); setDescription("");
      if (workspace.id) router.push(`/workspace/${workspace.id}`);
    } catch (caught) {
      setError(caught instanceof ApiRequestError && caught.status === 403 ? "Your plan has reached its active Workspace limit." : "That Workspace could not be created. Try again.");
    } finally { setIsCreating(false); }
  }

  async function mutate(id: string, action: "archive" | "restore" | "delete" | "rename", nextName?: string) {
    setError(null);
    try {
      if (action === "archive") await api.archiveWorkspace(id);
      if (action === "restore") await api.restoreWorkspace(id);
      if (action === "delete") await api.deleteWorkspace(id);
      if (action === "rename" && nextName) await api.renameWorkspace(id, nextName);
      await queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    } catch (caught) {
      setError(caught instanceof ApiRequestError && caught.status === 403 ? "This action is unavailable under your current plan." : "The Workspace could not be updated. Try again.");
    }
  }

  return <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1120px] flex-col gap-8 bg-background px-5 py-10 sm:px-8 lg:py-12" data-testid="practice-home">
    <header className="max-w-2xl"><p className="font-mono text-[11px] text-text-muted">PRACTICE / WORKSPACES</p><h1 className="mt-3 font-display text-4xl font-medium tracking-tight">Your design practice.</h1><p className="mt-3 text-sm leading-6 text-text-muted">Continue an owned Workspace, or start a new custom system. Imported and manual-review Workspaces will appear here once their backend flows are available.</p></header>
    {error || workspaces.isError ? <p className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error ?? "We could not load your Workspaces. Try again."}</p> : null}
    <section className="border border-line bg-surface p-6" aria-labelledby="new-workspace-heading"><h2 className="font-display text-2xl" id="new-workspace-heading">Start a custom design</h2><form className="mt-5 grid gap-4" onSubmit={createWorkspace}><label className="grid gap-2 text-sm"><span>System name</span><input className="field" maxLength={120} onChange={(event) => setName(event.target.value)} required value={name} /></label><label className="grid gap-2 text-sm"><span>What are you designing?</span><textarea className="field min-h-24" maxLength={5000} onChange={(event) => setDescription(event.target.value)} required value={description} /></label><button className={`${buttonClassName} w-fit border-signal bg-signal text-text-on-dark`} disabled={isCreating} type="submit">{isCreating ? "Creating…" : "Create Workspace"}</button></form></section>
    <WorkspaceList title="Active Workspaces" empty="No active Workspaces yet." workspaces={active} onArchive={(id) => mutate(id, "archive")} onDelete={(id) => mutate(id, "delete")} onRename={(id, value) => mutate(id, "rename", value)} />
    <WorkspaceList archived title="Archived Workspaces" empty="No archived Workspaces." workspaces={archived} onDelete={(id) => mutate(id, "delete")} onRestore={(id) => mutate(id, "restore")} />
  </main>;
}

function WorkspaceList({ title, empty, workspaces, archived = false, onArchive, onRestore, onDelete, onRename }: { title: string; empty: string; workspaces: WorkspaceSummary[]; archived?: boolean; onArchive?: (id: string) => void; onRestore?: (id: string) => void; onDelete: (id: string) => void; onRename?: (id: string, value: string) => void }) {
  return <section aria-labelledby={`${title}-heading`}><h2 className="font-mono text-[11px] text-text-muted" id={`${title}-heading`}>{title.toUpperCase()}</h2><div className="mt-3 divide-y divide-line border-y border-line">{workspaces.length ? workspaces.map((workspace) => <WorkspaceRow archived={archived} key={workspace.id} onArchive={onArchive} onDelete={onDelete} onRename={onRename} onRestore={onRestore} workspace={workspace} />) : <p className="py-5 text-sm text-text-muted">{empty}</p>}</div></section>;
}

function WorkspaceRow({ workspace, archived, onArchive, onRestore, onDelete, onRename }: { workspace: WorkspaceSummary; archived: boolean; onArchive?: (id: string) => void; onRestore?: (id: string) => void; onDelete: (id: string) => void; onRename?: (id: string, value: string) => void }) {
  const [isRenaming, setIsRenaming] = useState(false); const [name, setName] = useState(workspace.name ?? "Untitled Workspace"); const id = workspace.id;
  if (!id) return null;
  return <article className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><Link className="font-medium hover:text-signal hover:underline" href={`/workspace/${id}`}>{workspace.name ?? "Untitled Workspace"}</Link><p className="mt-1 text-xs text-text-muted">{workspace.source ?? "CUSTOM"} · {workspace.progressPercent ?? 0}% complete · {workspace.latestReviewState ?? "No Review yet"}</p></div><div className="flex flex-wrap gap-2">{isRenaming ? <><input aria-label="Workspace name" className="field h-9 w-44" onChange={(event) => setName(event.target.value)} value={name} /><button className="text-sm text-signal" onClick={() => { if (name.trim()) { onRename?.(id, name.trim()); setIsRenaming(false); } }} type="button">Save</button></> : !archived && onRename ? <button className="text-sm text-signal" onClick={() => setIsRenaming(true)} type="button">Rename</button> : null}{archived ? <button className="text-sm text-signal" onClick={() => onRestore?.(id)} type="button">Restore</button> : <button className="text-sm text-signal" onClick={() => onArchive?.(id)} type="button">Archive</button>}<button className="text-sm text-danger" onClick={() => { if (window.confirm(`Delete ${workspace.name ?? "this Workspace"}? This cannot be undone.`)) onDelete(id); }} type="button">Delete</button></div></article>;
}
