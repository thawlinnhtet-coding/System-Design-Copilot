"use client";

import { SignInButton, useAuth, useSession, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, CreditCard, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useAuthenticatedApiClient } from "@/lib/api/authenticated-client";
import { AccountSettingsSidebar } from "./account-navigation";
import { planLabel, type UsageLoadState } from "./plan-label";
import { useEntitlements } from "./use-entitlements";

export function AccountSettings() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { session } = useSession();
  const entitlements = useEntitlements();
  const api = useAuthenticatedApiClient();
  const aiConsent = useQuery({ queryKey: ["ai-consent"], queryFn: api.getAiConsent, enabled: isLoaded && isSignedIn });
  const usage = entitlements.data ?? null;
  const usageState: UsageLoadState = entitlements.isError ? "error" : entitlements.isSuccess ? "ready" : "loading";

  if (!isLoaded) {
    return <p className="px-5 py-12 text-sm text-text-muted sm:px-8 lg:px-14">Restoring your session...</p>;
  }

  if (!isSignedIn) {
    return (
      <section className="mx-auto max-w-[720px] px-5 py-16 text-center sm:px-8 lg:px-14">
        <p className="font-mono text-[11px] leading-[1.3] text-signal">ACCOUNT SETTINGS</p>
        <h1 className="mt-3 font-display text-[38px] font-medium leading-[1.08] tracking-[-0.035em]">Account settings</h1>
        <p className="mx-auto mt-4 max-w-[560px] text-sm leading-6 text-text-muted">Sign in to manage identity, plan boundaries, portable data, and privacy.</p>
        <SignInButton fallbackRedirectUrl="/account" mode="modal">
          <button className="mt-7 inline-flex h-11 items-center justify-center border border-signal bg-signal px-[18px] text-sm font-semibold text-text-on-dark hover:brightness-110" type="button">Sign in to continue</button>
        </SignInButton>
      </section>
    );
  }

  const name = user?.fullName ?? ([user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Account user");
  const email = user?.primaryEmailAddress?.emailAddress ?? "Email unavailable";
  const plan = planLabel(usage, usageState);
  const activeWorkspaces = allowanceSummary(usage?.activeWorkspaces, "Workspaces", false, usageState);
  const copilotTurns = allowanceSummary(usage?.copilotTurns, "Copilot Turns remaining", true, usageState);
  const planDetail = usageState === "error"
    ? "Usage is temporarily unavailable. Open Plan & usage to retry."
    : usage?.plan === "PRO" && usage.renewsAt
      ? `Renews ${formatDate(usage.renewsAt)} · ${activeWorkspaces}`
      : `${activeWorkspaces} · ${copilotTurns}`;

  const consentLabel = aiConsent.isError ? "Consent unavailable" : aiConsent.data?.granted ? "Consent granted" : aiConsent.isPending ? "Consent loading" : "Consent needed";

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-background lg:flex-row" data-testid="account-settings-overview">
      <div className="hidden lg:block">
        <AccountSettingsSidebar activeSection="overview" />
      </div>

      <section className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-14 lg:py-[38px]">
        <div className="mx-auto max-w-[1120px]">
          <div className="lg:hidden">
            <MobileAccountNavigation plan={plan} activeWorkspaces={activeWorkspaces} session={session} consentLabel={consentLabel} />
          </div>

          <div className="hidden flex-col gap-[22px] lg:flex">
            <header className="flex flex-col gap-[10px]">
              <Link className="w-fit font-mono text-[11px] leading-[1.3] text-signal hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus" href="/practice">
                ← RETURN TO PRACTICE / ACCOUNT SETTINGS OVERVIEW
              </Link>
              <h1 className="font-display text-[38px] font-medium leading-[1.08] tracking-[-0.035em]">Account settings</h1>
              <p className="max-w-[720px] text-sm leading-[1.5] text-text-muted">See the status of your account, then open one focused settings section when you need to make a change.</p>
            </header>

            <div className="h-px bg-line" />

            <div className="grid gap-11 lg:grid-cols-2">
              <ProfileSummary name={name} email={email} plan={plan} />
              <AccessSessions session={session} />
            </div>

            <div className="h-px bg-line" />

            <div className="grid gap-11 lg:grid-cols-3">
              <SummarySection label="PLAN & USAGE" value={plan} detail={planDetail} action="View all usage boundaries →" href="/account/plan" />
              <SummarySection label="AI PROCESSING" value={consentLabel} detail="Review or revoke consent →" href="/account/ai" />
              <SummarySection label="PORTABLE DATA" value="Import or export" detail="Versioned JSON includes portable design content only. Identity, billing, usage, and Reviews remain excluded." href="/account/data" />
            </div>

            <div className="flex flex-col gap-4 border-t border-[#c7a09a] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="font-mono text-[11px] leading-[1.3] text-[#8d332a]">PRIVACY &amp; DELETION</p>
                <p className="text-sm leading-[1.3] text-[#8d332a]">Delete account</p>
                <p className="max-w-[720px] text-xs leading-[1.3] text-text-muted">Account deletion requires explicit confirmation.</p>
              </div>
              <Link className="shrink-0 text-left text-[13px] leading-[1.3] text-text-muted hover:text-foreground hover:underline sm:text-right" href="/account/privacy">Open privacy &amp; deletion →</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileSummary({ name, email, plan }: { name: string; email: string; plan: string }) {
  return (
    <section className="flex flex-col gap-[15px]" aria-labelledby="profile-summary-heading">
      <p className="font-mono text-[11px] leading-[1.3] text-text-muted" id="profile-summary-heading">PROFILE SUMMARY</p>
      <ProfileRow label="Name" value={name} />
      <ProfileRow label="Email" value={`${email} · Verified`} />
      <ProfileRow label="Account type" value={plan} />
    </section>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-5 border-b border-line py-[13px] text-[13px] leading-[1.3]"><span className="text-text-muted">{label}</span><span className="text-right text-foreground">{value}</span></div>;
}

function AccessSessions({ session }: { session: ReturnType<typeof useSession>["session"] }) {
  return (
    <section className="flex flex-col gap-[15px]" aria-labelledby="sessions-heading">
      <p className="font-mono text-[11px] leading-[1.3] text-text-muted" id="sessions-heading">ACCESS &amp; SESSIONS</p>
      <div className="flex flex-col gap-2 border border-line bg-surface p-[18px]">
        <p className="font-display text-base leading-[1.3] text-foreground">Windows · Chrome</p>
        <p className="font-mono text-[11px] leading-[1.3] text-text-muted">{session ? "CURRENT · ACTIVE NOW" : "CURRENT · RESTORING"}</p>
        <p className="text-[13px] leading-[1.5] text-text-muted">Open Profile &amp; security for device management and recent authentication.</p>
      </div>
      <Link className="w-fit text-[13px] leading-[1.3] text-signal hover:underline" href="/account/profile">Open Profile &amp; security →</Link>
    </section>
  );
}

function SummarySection({ label, value, detail, action, href }: { label: string; value: string; detail: string; action?: string; href: string }) {
  return (
    <section className="flex flex-col gap-2">
      <p className="font-mono text-[11px] leading-[1.3] text-text-muted">{label}</p>
      <p className="font-display text-lg leading-[1.3] text-foreground">{value}</p>
      <p className="text-xs leading-[1.45] text-text-muted">{detail}</p>
      {action ? <Link className="w-fit text-xs font-medium text-signal hover:underline" href={href}>{action}</Link> : <Link className="w-fit text-xs font-medium text-signal hover:underline" href={href}>Open data tools →</Link>}
    </section>
  );
}

function MobileAccountNavigation({ plan, activeWorkspaces, session, consentLabel }: { plan: string; activeWorkspaces: string; session: ReturnType<typeof useSession>["session"]; consentLabel: string }) {
  const rows = [
    { icon: UserRound, label: "Profile & security", detail: session ? "Current browser active" : "Session unavailable", href: "/account/profile" },
    { icon: CreditCard, label: "Plan & usage", detail: `${plan} · ${activeWorkspaces}`, href: "/account/plan" },
    { icon: ShieldCheck, label: "AI processing", detail: consentLabel, href: "/account/ai" },
    { icon: ArrowUpDown, label: "Import & export", detail: "Portable design data", href: "/account/data" },
    { icon: LockKeyhole, label: "Privacy & deletion", detail: "Explicit confirmation required", href: "/account/privacy" },
  ];

  return (
    <div className="flex flex-col gap-[9px] px-[15px] py-[18px]">
      <Link className="w-fit font-mono text-[11px] leading-[1.4] text-signal hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus" href="/practice">
        ← RETURN TO PRACTICE / ACCOUNT SETTINGS OVERVIEW
      </Link>
      <h1 className="font-display text-[28px] leading-[1.2] tracking-[-0.025em] text-foreground">Account settings</h1>
      <p className="max-w-[520px] text-sm leading-6 text-text-muted">See the status of your account, then open one focused settings section when you need to make a change.</p>
      <div className="mt-2 flex flex-col">
        {rows.map(({ icon: Icon, label, detail, href }) => (
          <Link className="flex items-center gap-[9px] border-b border-line py-[11px]" href={href} key={label}>
            <Icon aria-hidden="true" className={label === "Privacy & deletion" ? "text-[#a33f34]" : "text-signal"} size={15} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="text-sm text-foreground">{label}</span><span className="text-xs text-text-muted">{detail}</span></span>
            <span aria-hidden="true" className="text-lg leading-none text-text-muted">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function allowanceSummary(allowance: { used?: number; limit?: number | null } | undefined, label: string, remaining = false, state: UsageLoadState = "ready") {
  if (!allowance) return state === "error" ? `${label} unavailable` : `Loading ${label}`;
  if (allowance.limit == null) return `Unlimited ${label}`;
  const value = remaining ? Math.max(0, allowance.limit - (allowance.used ?? 0)) : `${allowance.used ?? 0}/${allowance.limit}`;
  return remaining ? `${value} ${label}` : `${value} ${label}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
