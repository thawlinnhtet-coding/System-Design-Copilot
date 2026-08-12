"use client";

import { SignInButton, useAuth, useClerk, useSession, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useAuthenticatedApiClient, type CurrentEntitlements } from "@/lib/api/authenticated-client";
import { AccountSettingsSidebar, type AccountSection } from "./account-navigation";

const sectionCopy: Record<AccountSection, { eyebrow: string; title: string; description: string }> = {
  profile: {
    eyebrow: "ACCOUNT / PROFILE & SECURITY",
    title: "Personal information & security",
    description: "Manage your identity and the browsers that can access your Workspaces.",
  },
  plan: {
    eyebrow: "ACCOUNT / PLAN & USAGE",
    title: "Plan and usage",
    description: "See what is available now, what resets monthly, and where your limits apply.",
  },
  ai: {
    eyebrow: "ACCOUNT / AI PROCESSING",
    title: "AI processing consent",
    description: "Understand what Workspace context is shared with Copilot and Reviews, then change consent when needed.",
  },
  data: {
    eyebrow: "ACCOUNT / IMPORT & EXPORT",
    title: "Portable workspace data",
    description: "Move your design content without exporting identity, billing, or Review records.",
  },
  privacy: {
    eyebrow: "ACCOUNT / PRIVACY & DELETION",
    title: "Privacy and deletion",
    description: "Manage active sessions and request account deletion.",
  },
};

export function AccountDetail({ section }: { section: AccountSection }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const api = useAuthenticatedApiClient();
  const [usage, setUsage] = useState<CurrentEntitlements | null>(null);
  const [usageLoading, setUsageLoading] = useState(section === "plan");
  const [usageError, setUsageError] = useState(false);

  useEffect(() => {
    if (section !== "plan" || !isLoaded || !isSignedIn) return;

    let current = true;
    api.getUsage().then((value) => {
      if (!current) return;
      setUsage(value);
      setUsageLoading(false);
    }).catch(() => {
      if (!current) return;
      setUsageError(true);
      setUsageLoading(false);
    });

    return () => {
      current = false;
    };
  }, [api, isLoaded, isSignedIn, section]);

  if (!isLoaded) return <p className="px-5 py-12 text-sm text-text-muted sm:px-8 lg:px-10">Restoring your session...</p>;
  if (!isSignedIn) {
    return (
      <section className="mx-auto max-w-[720px] px-5 py-16 text-center">
        <p className="font-mono text-[11px] text-signal">ACCOUNT SETTINGS</p>
        <h1 className="mt-3 font-display text-[38px] font-medium">Sign in to manage your account.</h1>
        <SignInButton fallbackRedirectUrl={`/account/${section}`} mode="modal">
          <button className="mt-7 inline-flex h-11 items-center justify-center bg-signal px-[18px] text-sm font-semibold text-text-on-dark" type="button">Sign in to continue</button>
        </SignInButton>
      </section>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? "Email unavailable";
  if (section === "plan") {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col bg-background lg:flex-row" data-testid="account-detail-plan">
        <AccountSettingsSidebar activeSection="plan" variant="overview" />
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-14 lg:py-[38px]">
          <PlanDetail usage={usage} loaded={!usageLoading} loadError={usageError} />
        </main>
      </div>
    );
  }

  const copy = sectionCopy[section];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background" data-testid={`account-detail-${section}`}>
      <header className="border-b border-line bg-surface px-5 py-[18px] sm:px-8 lg:px-10">
        <div className="flex flex-col gap-[5px]">
          <p className="font-mono text-[10px] leading-[1.4] text-signal">{copy.eyebrow}</p>
          <h1 className="font-display text-[28px] font-medium leading-[1.1] tracking-[-0.025em]">{copy.title}</h1>
          <p className="max-w-[720px] text-[13px] leading-[1.45] text-text-muted">{copy.description}</p>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-180px)] flex-col lg:flex-row">
        <AccountSettingsSidebar activeSection={section} variant="detail" />
        <div className="min-w-0 flex-1 px-5 py-7 sm:px-8 lg:px-10 lg:py-6">
          <div className="w-full">
            {section === "profile" ? <ProfileDetail email={email} /> : null}
            {section === "ai" ? <AiDetail /> : null}
            {section === "data" ? <DataDetail /> : null}
            {section === "privacy" ? <PrivacyDetail /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`flex flex-col gap-2 rounded-[5px] border border-line bg-surface p-4 ${className}`}>{children}</section>;
}

function ProfileDetail({ email }: { email: string }) {
  const { session } = useSession();
  const clerk = useClerk();
  const openProfile = () => clerk.openUserProfile();

  return (
    <DetailCard data-testid="profile-security-card">
      <p className="font-mono text-[10px] leading-[1.4] text-text-muted">PERSONAL INFORMATION</p>
      <h2 className="font-display text-[17px] leading-[1.2] text-foreground">Personal information</h2>
      <DetailRow label="Email address" value={`${email} · Verified`} />
      <DetailRow label="This device" value={session ? "Current browser · Active now" : "Restoring session"} />
      <DetailRow label="Other devices" value="2 active" />
      <button className="w-fit text-[11px] font-medium text-signal hover:underline" onClick={openProfile} type="button">Manage active sessions →</button>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-2.5 text-xs leading-5">
        <span className="text-text-muted">Password</span>
        <button className="text-xs font-medium text-signal hover:underline" onClick={openProfile} type="button">Change password →</button>
      </div>
    </DetailCard>
  );
}

function PlanDetail({ usage, loaded, loadError }: { usage: CurrentEntitlements | null; loaded: boolean; loadError: boolean }) {
  const api = useAuthenticatedApiClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = usage?.plan === "PRO";
  const action = async () => {
    setBusy(true);
    setError(null);
    try {
      window.location.assign(isPro ? await api.openBillingPortal() : await api.startCheckout());
    } catch {
      setError(isPro ? "Billing is temporarily unavailable." : "Secure checkout is not available right now.");
      setBusy(false);
    }
  };

  if (!loaded) return <p className="text-sm text-text-muted">Loading plan and usage...</p>;
  if (loadError) return <p className="text-sm text-warning" role="alert">Plan and usage are temporarily unavailable. Try again shortly.</p>;

  return (
    <div className="flex flex-col gap-5">
      <p className="font-mono text-[11px] leading-[1.3] text-signal">ACCOUNT / PLAN &amp; USAGE</p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[38px] font-medium leading-[1.08] tracking-[-0.035em]">{isPro ? "Your Pro plan." : "Plan and usage"}</h1>
          <p className="text-sm leading-[1.4] text-text-muted">{isPro ? "Full practice access with usage safeguards." : "Bounded allowances for the personal beta."}</p>
        </div>
        <span className="rounded-[3px] bg-signal px-2.5 py-[7px] font-mono text-[10px] leading-none text-white">{isPro ? "PRO · ACTIVE" : "FREE · PERSONAL BETA"}</span>
      </div>
      <div className="h-px bg-line" />

      <section className="flex flex-wrap items-center justify-between gap-6 rounded-[5px] bg-chrome-800 p-6" data-testid="plan-state-card">
        <div className="flex flex-col gap-[7px]">
          <p className="font-mono text-[10px] leading-none text-text-on-dark-secondary">CURRENT PLAN</p>
          <h2 className="font-display text-2xl font-medium leading-none text-text-on-dark">{isPro ? "System Design Copilot Pro" : "Free personal beta"}</h2>
          <p className="text-[13px] leading-none text-text-on-dark-secondary">{isPro ? `$20 / month · Renews ${formatRenewal(usage?.renewsAt)}` : "No billing cycle · Upgrade anytime"}</p>
        </div>
        <button className="inline-flex h-11 items-center justify-center bg-signal px-4 text-[13px] font-medium text-white disabled:opacity-60" data-testid="plan-action" disabled={busy} onClick={action} type="button">{isPro ? "Manage billing →" : "Upgrade to Pro →"}</button>
      </section>

      {error ? <p className="text-xs text-warning" role="alert">{error}</p> : null}

      <section>
        <p className="font-mono text-[10px] text-text-muted">PLAN ACCESS</p>
        <div className="mt-2 border-y border-line">
          <PlanAccessRow label="Active Workspaces" value={workspaceValue(usage?.activeWorkspaces, isPro)} />
          <PlanAccessRow label="Copilot Turns" value={isPro ? "Included" : remainingValue(usage?.copilotTurns, "remaining")} />
          <PlanAccessRow label="Full Reviews" value={isPro ? "Included" : reviewValue(usage?.reviews)} />
          <PlanAccessRow label="Challenge library" value={isPro ? "Full access" : "Curated access"} />
        </div>
      </section>

      <p className="text-[11px] leading-[1.4] text-text-muted">{isPro ? "Manage billing includes payment details, invoices, and cancellation." : "Upgrade opens secure checkout. Existing content is preserved and Free allowances remain until the plan changes."}</p>
    </div>
  );
}

function PlanAccessRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-line py-[13px] text-[13px] leading-[1.3] last:border-b-0"><span>{label}</span><span className="font-mono text-[11px] text-signal">{value}</span></div>;
}

function workspaceValue(allowance: { used?: number; limit?: number | null } | undefined, isPro: boolean) {
  if (!allowance) return "Loading";
  if (allowance.limit == null) return isPro ? "Unlimited" : "Included";
  return `${allowance.used ?? 0} / ${allowance.limit} available`;
}

function remainingValue(allowance: { used?: number; limit?: number | null } | undefined, suffix: string) {
  if (!allowance) return "Loading";
  if (allowance.limit == null) return "Included";
  return `${Math.max(0, allowance.limit - (allowance.used ?? 0))} ${suffix}`;
}

function reviewValue(allowance: { used?: number; limit?: number | null } | undefined) {
  if (!allowance) return "Loading";
  if (allowance.limit == null) return "Included";
  return `${allowance.used ?? 0} / ${allowance.limit} this month`;
}

function AiDetail() {
  const [consentGranted, setConsentGranted] = useState(true);

  return (
    <DetailCard className="border-l-[3px] border-l-signal" data-testid="ai-processing-card">
      <p className="font-mono text-[10px] leading-[1.4] text-signal">CONSENT STATUS</p>
      <h2 className="font-display text-[17px] leading-[1.2]">Consent managed per Workspace</h2>
      <p className="text-[11px] leading-[1.4] text-foreground">Included: Requirements, Assumptions, Architecture Document, Decisions, completed Scenario context, and current Review goal.</p>
      <p className="text-[11px] leading-[1.4] text-text-muted">Excluded: identity-provider data, passwords, tokens, billing secrets, and unrelated Workspaces.</p>
      <p className="text-[11px] leading-[1.4] text-text-muted">Revoking blocks future AI operations. Previously transmitted context cannot be retracted.</p>
      <div className="flex flex-wrap gap-2.5">
        <button className="text-[11px] font-medium text-signal hover:underline" type="button">Review exact scope →</button>
        <button aria-pressed={consentGranted} className="text-[11px] font-medium text-[#9a5310] hover:underline" onClick={() => setConsentGranted((value) => !value)} type="button">Revoke future processing</button>
      </div>
    </DetailCard>
  );
}

function DataDetail() {
  return (
    <DetailCard data-testid="portable-data-card">
      <p className="font-mono text-[10px] leading-[1.4] text-text-muted">PORTABLE WORKSPACE DATA</p>
      <h2 className="font-display text-[17px] leading-[1.2]">Import and export design content</h2>
      <p className="text-[11px] leading-[1.4] text-text-muted">Includes portable Requirements, Assumptions, Decisions, Components, and Connections.</p>
      <p className="text-[11px] leading-[1.4] text-text-muted">Excludes identity, billing, usage, provider, and Review data.</p>
      <Link className="w-fit text-[11px] font-medium text-signal hover:underline" href="/data">Open data tools →</Link>
    </DetailCard>
  );
}

function PrivacyDetail() {
  return (
    <DetailCard data-testid="privacy-deletion-card">
      <p className="font-mono text-[10px] leading-[1.4] text-text-muted">PRIVACY &amp; DELETION</p>
      <h2 className="font-display text-[17px] leading-[1.2]">Account controls</h2>
      <p className="text-[11px] leading-[1.4] text-text-muted">Review active sessions or request account deletion.</p>
      <Link className="w-fit text-[11px] font-medium text-danger hover:underline" href="/account/privacy/confirm">Delete account →</Link>
    </DetailCard>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 border-b border-line py-[7px] text-[11px] leading-[1.4]"><span className="text-text-muted">{label}</span><span className="text-right text-foreground">{value}</span></div>;
}

function formatRenewal(value: string | undefined) {
  if (!value) return "next billing date unavailable";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
