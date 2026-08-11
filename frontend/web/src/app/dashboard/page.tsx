import type { Metadata } from "next";
import { AppShell } from "@/components/navigation/app-shell";
import { WorkspaceDashboard } from "@/features/workspaces/workspace-dashboard";

export const metadata: Metadata = {
  title: "Practice Home | System Design Copilot",
  description: "Choose what to practice next and continue your system design work.",
};

export default function PracticeHomePage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl">
        <WorkspaceDashboard />
      </div>
    </AppShell>
  );
}
