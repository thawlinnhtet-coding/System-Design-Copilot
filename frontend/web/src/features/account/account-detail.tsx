"use client";

import { SignInButton, useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useAuthenticatedApiClient, type ApiRequestError, type CurrentEntitlements } from "@/lib/api/authenticated-client";
import { AccountSettingsSidebar, type AccountSection } from "./account-navigation";
import { useEntitlements } from "./use-entitlements";

const sectionCopy: Record<Exclude<AccountSection, "overview">, { eyebrow: string; title: string; description: string }> = {
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

export function AccountDetail({ section }: { section: Exclude<AccountSection, "overview"> }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const entitlements = useEntitlements();

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
	const emailVerified = user?.primaryEmailAddress?.verification?.status === "verified";
  if (section === "plan") {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col bg-background lg:flex-row" data-testid="account-detail-plan">
        <AccountSettingsSidebar activeSection="plan" />
        <main className="min-w-0 flex-1 bg-[#f7f5ef] px-5 py-7 sm:px-8 lg:px-[46px] lg:py-[42px]">
          <PlanDetail onRetry={() => void entitlements.refetch()} usage={entitlements.data ?? null} loaded={entitlements.isSuccess} loadError={entitlements.isError} />
        </main>
      </div>
    );
  }

  const copy = sectionCopy[section];

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-background lg:flex-row" data-testid={`account-detail-${section}`}>
        <AccountSettingsSidebar activeSection={section} />
        <main className="min-w-0 flex-1 bg-[#f7f5ef] px-5 py-7 sm:px-8 lg:px-[46px] lg:py-[42px]">
          <div className="w-full max-w-[1080px]">
            <DetailHeader title={section === "privacy" ? "Privacy & deletion" : section === "data" ? "Import & export" : copy.title} description={section === "profile" ? "Manage your personal details, sign-in methods, and account security." : copy.description} />
			{section === "profile" ? <ProfileDetail email={email} emailVerified={emailVerified} /> : null}
			{section === "ai" ? <AiDetail emailVerified={emailVerified} /> : null}
            {section === "data" ? <DataDetail /> : null}
            {section === "privacy" ? <PrivacyDetail /> : null}
          </div>
        </main>
    </div>
  );
}

function DetailHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6 flex flex-col gap-2">
      <Link className="w-fit font-mono text-[11px] leading-[1.3] text-signal hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus" href="/account">
        ← ACCOUNT SETTINGS
      </Link>
      <h1 className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">{title}</h1>
      <p className="text-sm leading-[1.45] text-text-muted">{description}</p>
    </header>
  );
}

function ProfileDetail({ email, emailVerified }: { email: string; emailVerified: boolean }) {
	const clerk = useClerk();
	const openProfile = () => clerk.openUserProfile();
	const signOutCurrentSession = () => void clerk.signOut();

  return (
    <div className="flex max-w-[1120px] flex-col gap-4" data-testid="profile-security-card">
      <SettingsSection title="Profile">
        <SettingsRow label="Name" detail="Your display name is visible only within your account." action="Edit" onAction={openProfile} />
		<SettingsRow label="Email address" detail={`${email} · ${emailVerified ? "Verified" : "Verification required before AI and billing"}`} action={emailVerified ? "Edit" : "Verify email"} onAction={openProfile} />
      </SettingsSection>
      <SettingsSection title="Security">
		<SettingsRow label="Sign-in methods" detail="Manage your password, passkeys, and supported sign-in methods." action="Manage sign-in" onAction={openProfile} />
		<SettingsRow label="Two-factor authentication" detail="Add a second verification step to protect your account." action="Set up" onAction={openProfile} />
		<SettingsRow label="Current session" detail="End this browser session through Clerk." action="Sign out" onAction={signOutCurrentSession} />
		<SettingsRow label="Active sessions" detail="Review devices and end sessions across every signed-in browser through Clerk." action="Manage all sessions" onAction={openProfile} />
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="flex flex-col gap-4 border border-[#e2e4de] bg-white p-[22px]"><h2 className="text-lg font-semibold text-foreground">{title}</h2>{children}</section>;
}

function SettingsRow({ label, detail, action, onAction }: { label: string; detail: string; action: string; onAction: () => void }) {
  return <div className="flex flex-col gap-3 border-t border-[#edf0eb] pt-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex max-w-[720px] flex-col gap-1"><p className="text-sm font-semibold text-[#2a3431]">{label}</p><p className="text-[13px] leading-[1.4] text-[#66716c]">{detail}</p></div><button className="inline-flex h-8 shrink-0 items-center justify-center rounded-[4px] bg-signal px-3 text-[13px] font-semibold text-white hover:brightness-110" onClick={onAction} type="button">{action}</button></div>;
}

function PlanDetail({ usage, loaded, loadError, onRetry }: { usage: CurrentEntitlements | null; loaded: boolean; loadError: boolean; onRetry: () => void }) {
  const api = useAuthenticatedApiClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = usage?.plan === "PRO";
  const billingStatus = usage?.billing?.status ?? (isPro ? "PRO_ACTIVE" : "FREE_TEST_MODE");
  const checkoutAvailable = usage?.billing?.checkoutAvailable ?? false;
  const portalAvailable = usage?.billing?.portalAvailable ?? false;
  const isCanceling = billingStatus === "PRO_CANCELING";
  const paidThrough = usage?.billing?.paidThrough ?? usage?.renewsAt;
  const action = async () => {
    if (!checkoutAvailable && !portalAvailable) return;
    setBusy(true);
    setError(null);
    try {
      window.location.assign(isPro ? await api.openBillingPortal() : await api.startCheckout());
    } catch (requestError) {
      setError(planActionError(requestError, isPro));
      setBusy(false);
    }
  };

  if (loadError) {
    return <div className="flex max-w-[560px] flex-col gap-3" data-testid="plan-load-error"><p className="text-sm text-warning" role="alert">Plan and usage are temporarily unavailable. Your existing Workspaces remain available. Try again shortly.</p><button className="inline-flex h-10 w-fit items-center justify-center border border-line px-4 text-xs font-medium text-foreground hover:bg-surface-alt" onClick={onRetry} type="button">Retry plan and usage</button></div>;
  }
  if (!loaded) return <p className="text-sm text-text-muted" role="status">Loading plan and usage...</p>;

  return (
    <div className="flex flex-col gap-5">
      <Link className="w-fit font-mono text-[11px] leading-[1.3] text-signal hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus" href="/account">
        ← ACCOUNT SETTINGS
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[38px] font-medium leading-[1.08] tracking-[-0.035em]">{isCanceling ? `Your Pro plan continues through ${formatRenewal(paidThrough)}.` : isPro ? "Your Pro plan." : "Plan and usage"}</h1>
          <p className="text-sm leading-[1.4] text-text-muted">{isCanceling ? "Cancellation scheduled; your paid access remains available until the paid-through date." : isPro ? "Full practice access with usage safeguards." : "Bounded allowances for the personal beta."}</p>
        </div>
        <span className="rounded-[3px] bg-signal px-2.5 py-[7px] font-mono text-[10px] leading-none text-white">{isCanceling ? "PRO · PAID THROUGH" : isPro ? "PRO · ACTIVE" : "FREE · PERSONAL BETA"}</span>
      </div>
      <div className="h-px bg-line" />

      <section className="flex flex-wrap items-center justify-between gap-6 rounded-[5px] bg-chrome-800 p-6" data-testid="plan-state-card">
        <div className="flex flex-col gap-[7px]">
          <p className="font-mono text-[10px] leading-none text-text-on-dark-secondary">CURRENT PLAN</p>
          <h2 className="font-display text-2xl font-medium leading-none text-text-on-dark">{isPro ? "System Design Copilot Pro" : "Free personal beta"}</h2>
          <p className="text-[13px] leading-none text-text-on-dark-secondary">{isCanceling ? `Access through ${formatRenewal(paidThrough)}` : isPro ? `$20 / month · Renews ${formatRenewal(usage?.renewsAt)}` : "No billing cycle · Upgrade anytime"}</p>
        </div>
        <button className="inline-flex h-11 items-center justify-center bg-signal px-4 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60" data-testid="plan-action" disabled={busy || (isPro ? !portalAvailable : !checkoutAvailable)} onClick={action} type="button">{isPro ? "Manage billing →" : checkoutAvailable ? "Upgrade to Pro →" : "Upgrade unavailable in beta"}</button>
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

      <p className="text-[11px] leading-[1.4] text-text-muted">{isCanceling ? "Your owned Workspaces remain available after the paid-through date; Free limits apply after downgrade." : isPro ? "Manage billing includes payment details, invoices, and cancellation." : checkoutAvailable ? "Upgrade opens secure test-mode Checkout. Existing content is preserved and Free allowances remain until the plan changes." : "Test-mode Pro billing is not enabled in this environment. Your existing Workspaces remain available, and quotas reset at the start of the next UTC month."}</p>
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

function AiDetail({ emailVerified }: { emailVerified: boolean }) {
	const api = useAuthenticatedApiClient();
	const queryClient = useQueryClient();
	const clerk = useClerk();
  const consent = useQuery({ queryKey: ["ai-consent"], queryFn: api.getAiConsent });
  const mutation = useMutation({
    mutationFn: (grant: boolean) => grant
      ? api.grantAiConsent(consent.data?.policy?.currentVersion ?? consent.data?.policyVersion ?? "")
      : api.withdrawAiConsent(),
    onSuccess: (next) => queryClient.setQueryData(["ai-consent"], next),
  });

  if (consent.isPending) return <p className="text-sm text-text-muted">Loading AI processing policy...</p>;
  if (consent.isError || !consent.data) return <p className="text-sm text-warning" role="alert">AI processing policy is temporarily unavailable. Try again shortly.</p>;

  const consentGranted = consent.data.granted === true;
  const policy = consent.data.policy;

	return (
		<div className="flex max-w-[1120px] flex-col gap-4" data-testid="ai-processing-card">
			{!emailVerified ? <section className="border-l-2 border-signal bg-signal-soft px-4 py-3 text-[13px] leading-[1.5] text-foreground" role="status"><p className="font-semibold">Verify your email before enabling AI processing.</p><p className="mt-1 text-text-muted">Private Workspace editing remains available. Copilot and Review AI work stay blocked until Clerk confirms email ownership.</p><button className="mt-3 inline-flex h-8 items-center bg-signal px-3 text-[12px] font-semibold text-white" onClick={() => clerk.openUserProfile()} type="button">Verify email with Clerk</button></section> : null}
			<SettingsSection title="AI processing consent">
        <div className="flex flex-col gap-2 text-[13px] leading-[1.5] text-[#66716c]">
          <p>AI guidance is advisory. Before a Copilot or Review operation, only bounded context from the current Workspace is sent for processing.</p>
          <p>There is no cross-Workspace context picker. Credentials, tokens, passwords, account data, billing, usage, identity data, unrelated Workspaces, and raw provider payloads stay excluded.</p>
        </div>
        <div className="grid gap-4 border-t border-[#edf0eb] pt-4 md:grid-cols-2">
          <PolicyList title="Included categories" values={policy?.includedCategories ?? []} />
          <PolicyList title="Excluded categories" values={policy?.excludedCategories ?? []} />
        </div>
        <SettingsRow label="Provider privacy routing" detail={policy?.providerRouting ?? "Approved non-retaining routing with provider fallback disabled."} action="Policy shown above" onAction={() => undefined} />
			<SettingsRow label="Revocation control" detail={consentGranted ? "Consent is granted. Revoking blocks future AI operations; prior transmissions cannot be retracted." : emailVerified ? "Future AI processing is blocked until you grant consent again." : "Verify email ownership with Clerk before enabling AI processing."} action={mutation.isPending ? "Saving..." : consentGranted ? "Revoke consent" : emailVerified ? "Grant consent" : "Verify email"} onAction={() => consentGranted ? mutation.mutate(false) : emailVerified ? mutation.mutate(true) : clerk.openUserProfile()} />
        {mutation.isError ? <p className="text-xs text-warning" role="alert">The consent change could not be saved. Try again.</p> : null}
        <p className="border-t border-[#edf0eb] pt-4 text-[12px] leading-[1.5] text-[#66716c]">The personal beta stops new AI operations when the USD 0.10 UTC daily budget is reached. {policy?.priorTransmissionNotice ?? "Context already sent to a provider cannot be retracted."}</p>
      </SettingsSection>
    </div>
  );
}

function PolicyList({ title, values }: { title: string; values: string[] }) {
  return <div><p className="font-mono text-[10px] text-text-muted">{title.toUpperCase()}</p><ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[12px] leading-[1.45] text-[#66716c]">{values.map((value) => <li key={value}>{value}</li>)}</ul></div>;
}

function DataDetail() {
  return (
    <div className="flex max-w-[1120px] flex-col gap-4" data-testid="portable-data-card">
      <SettingsSection title="Import & export">
        <SettingsRow label="Export workspace data" detail="Download a versioned portable package containing design content only." action="Start export" onAction={() => undefined} />
        <SettingsRow label="Import workspace data" detail="Create a new Workspace from a compatible portable package." action="Import a package" onAction={() => undefined} />
        <SettingsRow label="Format and exclusions" detail="Identity, billing, usage, providers, and Reviews remain excluded from portable packages." action="Read guide" onAction={() => undefined} />
      </SettingsSection>
    </div>
  );
}

function PrivacyDetail() {
  return (
    <div className="flex max-w-[1120px] flex-col gap-4" data-testid="privacy-deletion-card">
      <SettingsSection title="Privacy & deletion">
        <SettingsRow label="Privacy choices" detail="Review how your account and private Workspace content are handled." action="Review privacy" onAction={() => undefined} />
        <SettingsRow label="Data export" detail="Prepare a portable copy of your Workspace design content." action="Request export" onAction={() => undefined} />
<div className="flex flex-col gap-3 border-t border-[#f2d7d4] pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-col gap-1"><p className="text-sm font-semibold text-[#8d332a]">Delete account</p><p className="text-[13px] leading-[1.4] text-[#66716c]">Explicit confirmation is required before permanent deletion.</p></div><Link className="inline-flex h-8 shrink-0 items-center justify-center rounded-[4px] bg-danger px-3 text-[13px] font-semibold text-white hover:brightness-110" href="/account/privacy/confirm">Delete account</Link></div>
      </SettingsSection>
    </div>
  );
}

function formatRenewal(value: string | undefined) {
  if (!value) return "next billing date unavailable";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function planActionError(error: unknown, isPro: boolean) {
  const requestError = error as Partial<ApiRequestError>;
  const status = requestError?.status;
  const code = typeof requestError?.details?.code === "string" ? requestError.details.code : undefined;
  if (status === 403) {
    if (code === "email_verification_required") return "Clerk could not confirm your email verification. Verify it or sign out and back in after updating the JWT template.";
    if (code === "stripe_test_mode_required") return "Stripe test-mode billing is not enabled on the backend.";
    return isPro ? "Billing management is not available for this account." : "Test-mode Pro Checkout is not enabled for this environment.";
  }
  if (status === 409) return "You already have Pro access. Manage it through the billing portal.";
  if (status === 429) return "Please wait before starting another billing attempt.";
  return isPro ? "Billing is temporarily unavailable." : "Secure checkout is not available right now.";
}
