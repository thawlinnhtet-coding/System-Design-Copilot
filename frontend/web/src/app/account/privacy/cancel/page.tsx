import type { Metadata } from "next";
import { AppShell } from "@/components/navigation/app-shell";
import { AccountDeletionState } from "@/features/account/account-deletion";
export const metadata: Metadata = { title: "Cancel Account Deletion | System Design Copilot" };
export default function CancelAccountDeletionPage() { return <AppShell compactHeader fullBleed><AccountDeletionState state="scheduled" /></AppShell>; }
