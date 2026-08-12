import { AppShell } from "@/components/navigation/app-shell";
import { AccountSettings } from "@/features/account/account-settings";

export default function AccountPage() {
  return (
    <AppShell compactHeader fullBleed>
      <AccountSettings />
    </AppShell>
  );
}
