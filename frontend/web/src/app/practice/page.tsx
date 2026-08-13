import type { Metadata } from "next";
import { AppShell } from "@/components/navigation/app-shell";
import { PracticeHome } from "@/features/workspaces/practice-home";

export const metadata: Metadata = {
  title: "Practice Home | System Design Copilot",
  description: "Choose what to practice next and continue your system design work.",
};

export default function PracticeHomePage() {
  return <AppShell fullBleed><PracticeHome /></AppShell>;
}
