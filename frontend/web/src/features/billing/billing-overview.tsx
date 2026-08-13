"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowUpRight, CreditCard, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useAuthenticatedApiClient, type ApiRequestError } from "@/lib/api/authenticated-client";
import { useEntitlements } from "@/features/account/use-entitlements";

const buttonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";

export function BillingOverview() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"checkout" | "portal" | null>(null);
  const entitlements = useEntitlements();
  const usage = entitlements.data ?? null;

  if (!isLoaded) {
    return <p className="text-sm text-text-muted">Restoring your session...</p>;
  }

  if (!isSignedIn) {
    return (
      <section className="rounded-lg border border-line bg-surface p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal">Private account</p>
        <h2 className="mt-3 font-display text-2xl font-semibold">Sign in to view billing.</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-text-muted">Plan limits and billing actions are attached to your private account.</p>
        <SignInButton mode="modal">
          <button className={`${buttonClassName} mt-6 bg-signal text-text-on-dark hover:brightness-110`} type="button">Sign in to continue</button>
        </SignInButton>
      </section>
    );
  }

  const isPro = usage?.plan === "PRO";
  const isLoading = entitlements.isLoading;

  async function openPortal() {
    setBusyAction("portal");
    setError(null);
    try {
      window.location.assign(await api.openBillingPortal());
    } catch (requestError) {
      setError(billingError(requestError, "The billing portal is not available right now."));
      setBusyAction(null);
    }
  }

  async function startCheckout() {
    setBusyAction("checkout");
    setError(null);
    try {
      window.location.assign(await api.startCheckout());
    } catch (requestError) {
      setError(billingError(requestError, "Checkout is not available right now."));
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {error || entitlements.isError ? <p className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error ?? "We could not load your plan. Try again."}</p> : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Current plan</p>
              <div className="mt-3 flex items-center gap-3">
                <h2 className="font-display text-4xl font-semibold">{isLoading ? "..." : isPro ? "Pro" : "Free"}</h2>
                <span className="rounded-full border border-success/40 bg-success/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-success">{isPro ? "Active" : "Beta access"}</span>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-text-muted">{isPro ? "Your Pro access is projected from the verified Stripe subscription." : "Free includes meaningful practice with bounded AI usage. Existing Workspaces stay yours at every boundary."}</p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-md bg-signal-soft text-signal"><CreditCard aria-hidden="true" size={20} /></div>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            {isPro ? (
              <button className={`${buttonClassName} border border-line text-foreground hover:bg-surface-alt`} disabled={busyAction !== null} onClick={openPortal} type="button">
                {busyAction === "portal" ? <RefreshCw aria-hidden="true" className="animate-spin" size={16} /> : null} Manage billing <ArrowUpRight aria-hidden="true" size={16} />
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button className={`${buttonClassName} bg-signal text-text-on-dark hover:brightness-110`} disabled={busyAction !== null} onClick={startCheckout} type="button">
                  {busyAction === "checkout" ? <RefreshCw aria-hidden="true" className="animate-spin" size={16} /> : null} Upgrade to Pro <ArrowUpRight aria-hidden="true" size={16} />
                </button>
                <p className="text-xs text-text-muted">Test mode; eligibility is enforced by the backend.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-line bg-surface-alt p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Renewal</p>
          <p className="mt-3 text-lg font-semibold">{usage?.renewsAt ? formatDate(usage.renewsAt) : "Next calendar month"}</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">Usage allowances reset at the start of the next UTC calendar month.</p>
        </aside>
      </section>

      <section aria-labelledby="allowance-heading">
        <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Usage</p><h2 className="mt-2 font-display text-2xl font-semibold" id="allowance-heading">Know your runway.</h2></div><span className="text-xs text-text-muted">{isPro ? "Pro allowances are subject to fair-use controls." : "UTC calendar month"}</span></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Allowance label="Active Workspaces" allowance={usage?.activeWorkspaces} />
          <Allowance label="Copilot Turns" allowance={usage?.copilotTurns} />
          <Allowance label="Full Reviews" allowance={usage?.reviews} />
        </div>
      </section>

      <section className="rounded-lg border border-warning/30 bg-warning/10 p-5 text-sm leading-6 text-foreground">
        <p className="font-semibold">Personal beta billing boundary</p>
         <p className="mt-1 text-text-muted">Stripe stays in test mode during the public Free beta, so no real payment is collected. Checkout and Pro activation are available to authenticated beta users while enabled; a failed upgrade never hides or deletes your work.</p>
      </section>
    </div>
  );
}

function Allowance({ label, allowance }: { label: string; allowance?: { used?: number; limit?: number | null } }) {
  const used = allowance?.used ?? 0;
  const limit = allowance?.limit;
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 8;
  return <article className="rounded-lg border border-line bg-surface p-5"><p className="text-sm text-text-muted">{label}</p><p className="mt-3 text-2xl font-semibold">{used}<span className="text-base font-normal text-text-muted">/{limit ?? "∞"}</span></p><div aria-hidden="true" className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-alt"><div className="h-full rounded-full bg-signal" style={{ width: `${percent}%` }} /></div><p className="mt-2 text-xs text-text-muted">{limit ? `${Math.max(0, limit - used)} remaining` : "No product-level limit"}</p></article>;
}

function billingError(error: unknown, fallback: string) {
  const status = (error as Partial<ApiRequestError>)?.status;
  if (status === 403) return "Pro Checkout is not enabled for this environment.";
  if (status === 409) return "You already have Pro access. Manage it through the billing portal.";
  if (status === 429) return "Please wait before starting another billing attempt.";
  return fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}
