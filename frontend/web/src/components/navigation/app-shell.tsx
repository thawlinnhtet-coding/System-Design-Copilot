"use client";

import { ArrowUpDown, ChevronDown, ChevronRight, CreditCard, LockKeyhole, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton, useAuth, useUser } from "@clerk/nextjs";
import { BrandMark } from "@/components/brand/brand-mark";
import { planBadge, planLabel, type UsageLoadState } from "@/features/account/plan-label";
import { useEntitlements } from "@/features/account/use-entitlements";

const primaryNavigation = [
  { href: "/practice", label: "Practice" },
  { href: "/challenges", label: "Challenges" },
  { href: "/progress", label: "Progress" },
] as const;

export function AppShell({ children, fullBleed = false, compactHeader = false }: { children: React.ReactNode; fullBleed?: boolean; compactHeader?: boolean }) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className={`relative z-30 box-border border-b border-[#39413e] bg-chrome-800 text-text-on-dark ${compactHeader ? "h-[64px]" : "h-[72px]"}`}>
        <div className="mx-auto flex h-full w-full items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/practice" aria-label="Go to Practice" className="rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus">
            <BrandMark tone="chrome" />
          </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
            {primaryNavigation.map(({ href, label }) => (
              <Link aria-current={isActive(href) ? "page" : undefined} className={`text-sm transition-colors ${isActive(href) ? "text-text-on-dark" : "text-text-on-dark-secondary hover:text-text-on-dark"}`} href={href} key={href}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isLoaded && isSignedIn ? <AccountMenu isOpen={isAccountOpen} onToggle={() => setIsAccountOpen((open) => !open)} /> : null}
            <button aria-controls="mobile-navigation" aria-expanded={isMenuOpen} aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"} className="inline-flex size-11 items-center justify-center rounded-[3px] border border-white/15 text-text-on-dark md:hidden" onClick={() => setIsMenuOpen((open) => !open)} type="button">
              {isMenuOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen ? (
        <div className="relative z-20 border-b border-line bg-surface px-5 py-4 shadow-lg md:hidden" id="mobile-navigation">
          <nav aria-label="Mobile navigation" className="grid gap-1">
            {primaryNavigation.map(({ href, label }) => (
              <Link aria-current={isActive(href) ? "page" : undefined} className={`flex min-h-11 items-center rounded-[3px] px-3 text-sm ${isActive(href) ? "bg-signal-soft text-signal" : "text-text-muted"}`} href={href} key={href} onClick={() => setIsMenuOpen(false)}>
                {label}
              </Link>
            ))}
            <Link className="flex min-h-11 items-center gap-3 rounded-[3px] px-3 text-sm text-text-muted" href="/account" onClick={() => setIsMenuOpen(false)}>
              Account
            </Link>
          </nav>
        </div>
      ) : null}

      <main className={fullBleed ? compactHeader ? "min-h-[calc(100vh-64px)]" : "min-h-[calc(100vh-72px)]" : compactHeader ? "min-h-[calc(100vh-64px)] px-5 pb-24 pt-8 sm:px-8 lg:px-10 lg:pb-12 lg:pt-10" : "min-h-[calc(100vh-72px)] px-5 pb-24 pt-8 sm:px-8 lg:px-10 lg:pb-12 lg:pt-10"}>{children}</main>
    </div>
  );
}

function AccountMenu({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { user } = useUser();
  const entitlements = useEntitlements();
  const usage = entitlements.data ?? null;
  const usageState: UsageLoadState = entitlements.isError ? "error" : entitlements.isSuccess ? "ready" : "loading";

  const name = user?.fullName ?? ([user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Account user");
  const email = user?.primaryEmailAddress?.emailAddress ?? "Email unavailable";
  const workspaceDetail = usage?.activeWorkspaces ? `${usage.activeWorkspaces.used ?? 0} of ${usage.activeWorkspaces.limit ?? "∞"} active Workspaces` : usageState === "error" ? "Usage details unavailable" : "Usage details loading";
  const badge = planBadge(usage, usageState);
  const menuItems = [
    { href: "/account/profile", label: "Profile & security", detail: "Personal information and active sessions", icon: UserRound },
    { href: "/account/plan", label: "Plan & usage", detail: workspaceDetail, icon: CreditCard },
    { href: "/account/ai", label: "AI processing", detail: "Consent managed", icon: ShieldCheck },
    { href: "/account/data", label: "Import & export", detail: "Portable design data", icon: ArrowUpDown },
    { href: "/account/privacy", label: "Privacy & deletion", detail: "Account controls", icon: LockKeyhole },
  ] as const;

  return (
    <div className="relative hidden md:block">
      <button aria-expanded={isOpen} aria-haspopup="menu" aria-label={isOpen ? "Close account menu" : "Open account menu"} className="flex h-10 w-[184px] items-center gap-2.5 rounded-[5px] px-2 text-left hover:bg-white/5" onClick={onToggle} type="button">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-signal bg-[#203633]">
          <UserRound aria-hidden="true" className="text-text-on-dark" size={18} strokeWidth={1.4} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs font-medium text-text-on-dark">Account</span>
          <span className="font-mono text-[9px] font-semibold tracking-[0.08em] text-[#9a5310]">{badge}</span>
        </span>
        <ChevronDown aria-hidden="true" className="text-text-on-dark-secondary" size={14} />
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-[54px] z-40 flex w-[300px] flex-col gap-0.5 rounded-[5px] border border-line bg-surface p-[10px_12px] shadow-[0_8px_24px_rgba(21,25,24,0.15)]" data-testid="account-menu" role="menu">
          <div className="flex flex-col gap-1 px-2 py-2.5">
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-text-muted">{email}</p>
            <p className="font-mono text-[10px] font-semibold text-[#9a5310]">{planLabel(usage, usageState)}</p>
          </div>
          <Link className="rounded-[3px] px-2 py-1.5 text-[11px] font-medium text-signal transition-colors hover:bg-surface-alt" data-testid="account-settings-overview-link" href="/account" role="menuitem">
            Account settings overview →
          </Link>
          <div className="h-px bg-line" />
          {menuItems.map(({ href, label, detail, icon: Icon }) => (
            <Link className="flex items-center gap-2.5 rounded-[3px] px-2 py-2.5 transition-colors hover:bg-surface-alt" href={href} key={label} role="menuitem">
              <Icon aria-hidden="true" className={label === "Privacy & deletion" ? "text-[#8d332a]" : "text-signal"} size={16} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span className={`text-[13px] font-medium ${label === "Privacy & deletion" ? "text-[#8d332a]" : "text-foreground"}`}>{label}</span><span className="text-[11px] text-text-muted">{detail}</span></span>
              <ChevronRight aria-hidden="true" className="shrink-0 text-text-muted" size={14} />
            </Link>
          ))}
          <SignOutButton>
            <button className="flex items-center gap-2.5 rounded-[3px] px-2 py-2.5 text-left transition-colors hover:bg-surface-alt" role="menuitem" type="button">
              <LogOut aria-hidden="true" className="text-text-muted" size={16} /><span className="text-[13px] text-foreground">Sign out</span>
            </button>
          </SignOutButton>
        </div>
      ) : null}
    </div>
  );
}
