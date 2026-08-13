import type { Metadata } from "next";
import { AppShell } from "@/components/navigation/app-shell";
import { WorkspaceManagement } from "@/features/workspaces/workspace-management";

export const metadata: Metadata = { title: "Manage Workspaces | System Design Copilot" };

export default function WorkspaceManagementPage() {
  return <AppShell fullBleed><WorkspaceManagement /></AppShell>;
}
