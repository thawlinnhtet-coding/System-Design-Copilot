import type { Metadata } from "next";
import { AppShell } from "@/components/navigation/app-shell";
import { AccountDetail } from "@/features/account/account-detail";
import type { AccountSection } from "@/features/account/account-navigation";

export const metadata: Metadata = {
  title: "Account Settings | System Design Copilot",
  description: "Manage identity, usage, consent, portable data, and privacy.",
};

type AccountDetailSection = Exclude<AccountSection, "overview">;
const sections = new Set<AccountDetailSection>(["profile", "plan", "ai", "data", "privacy"]);

export default async function AccountDetailPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const resolvedSection = sections.has(section as AccountDetailSection) ? section as AccountDetailSection : "profile";
  return <AppShell compactHeader fullBleed><AccountDetail section={resolvedSection} /></AppShell>;
}
