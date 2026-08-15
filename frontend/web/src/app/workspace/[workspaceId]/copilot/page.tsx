import Link from "next/link";
import { AppShell } from "@/components/navigation/app-shell";
import { CopilotPanel } from "@/features/workspaces/copilot-panel";

export default async function WorkspaceCopilotPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return <AppShell><main className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><Link className="text-sm font-semibold text-signal hover:underline" href={`/workspace/${workspaceId}`}>← Back to Workspace</Link><p className="mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">WORKSPACE / CONTEXTUAL COPILOT</p><CopilotPanel readOnly={false} workspaceId={workspaceId} /></main></AppShell>;
}
