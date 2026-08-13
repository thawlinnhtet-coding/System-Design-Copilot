import Link from "next/link";
import { ArrowUpDown, CreditCard, LockKeyhole, Settings, ShieldCheck, UserRound } from "lucide-react";

export type AccountSection = "overview" | "profile" | "plan" | "ai" | "data" | "privacy";

export const accountNavigation = [
  ["overview", "Overview"],
  ["profile", "Profile & security"],
  ["plan", "Plan & usage"],
  ["ai", "AI processing"],
  ["data", "Import & export"],
  ["privacy", "Privacy & deletion"],
] as const satisfies ReadonlyArray<readonly [AccountSection, string]>;

const navigationIcons = {
  overview: Settings,
  profile: UserRound,
  plan: CreditCard,
  ai: ShieldCheck,
  data: ArrowUpDown,
  privacy: LockKeyhole,
} as const;

export function AccountSettingsSidebar({ activeSection }: { activeSection: AccountSection }) {
  return (
    <aside className="border-b border-line bg-white px-5 py-4 sm:px-8 lg:min-h-full lg:w-[270px] lg:shrink-0 lg:border-b-0 lg:border-r lg:px-5 lg:py-7" aria-label="Account settings navigation" data-testid="account-settings-sidebar">
      <p className="font-mono text-[11px] font-semibold leading-[1.3] tracking-[0.07em] text-[#75807a]">ACCOUNT SETTINGS</p>
      <nav className="mt-2 flex flex-wrap gap-[6px] lg:flex-col lg:gap-2" aria-label="Account settings">
        {accountNavigation.map(([id, label]) => {
          const active = activeSection === id;
          const Icon = navigationIcons[id];

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 rounded-[4px] px-3 py-2.5 text-sm leading-[1.3] ${active ? "bg-[#ddf2ee] font-semibold text-[#0c6f68]" : "text-[#58645e] hover:bg-surface-alt hover:text-foreground"}`}
              href={id === "overview" ? "/account" : `/account/${id}`}
              key={id}
            >
              <Icon aria-hidden="true" size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
