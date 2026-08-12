import Link from "next/link";

export type AccountSection = "profile" | "plan" | "ai" | "data" | "privacy";

export const accountNavigation = [
  ["profile", "Profile & security"],
  ["plan", "Plan & usage"],
  ["ai", "AI processing"],
  ["data", "Import & export"],
  ["privacy", "Privacy & deletion"],
] as const satisfies ReadonlyArray<readonly [AccountSection, string]>;

export function AccountSettingsSidebar({ activeSection, variant }: { activeSection: AccountSection; variant: "overview" | "detail" }) {
  const overview = variant === "overview";

  return (
    <aside className={`border-b border-line bg-surface sm:px-8 lg:shrink-0 lg:border-b-0 lg:border-r ${overview ? "px-5 py-4 lg:w-[280px] lg:px-[32px] lg:py-[38px]" : "px-5 py-4 lg:w-[220px] lg:px-[18px] lg:py-6"}`} aria-label="Account settings navigation" data-testid="account-settings-sidebar">
      {overview ? <p className="font-mono text-[11px] leading-[1.3] text-text-muted">ACCOUNT SETTINGS</p> : null}
      <nav className={`${overview ? "flex flex-col gap-[10px]" : "mt-0 flex flex-wrap gap-[6px] lg:flex-col"}`} aria-label="Account settings">
        {accountNavigation.map(([id, label]) => {
          const active = activeSection === id;
          const displayLabel = overview && id === "data" ? "Data import & export" : label;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`${overview ? "px-[10px] py-[11px] text-[13px] leading-[1.3]" : "px-[9px] py-[10px] text-xs leading-[1.4]"} rounded-[3px] ${active ? "bg-signal-soft font-medium text-signal" : "text-text-muted hover:bg-surface-alt hover:text-foreground"}`}
              href={`/account/${id}`}
              key={id}
            >
              {displayLabel}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
