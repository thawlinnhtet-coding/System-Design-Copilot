import { AppShell } from "@/components/navigation/app-shell";
import { WorkspaceShell } from "@/features/workspaces/workspace-shell";

export default async function WorkspacePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return <AppShell compactHeader fullBleed><WorkspaceShell workspaceId={workspaceId} /></AppShell>;
}
