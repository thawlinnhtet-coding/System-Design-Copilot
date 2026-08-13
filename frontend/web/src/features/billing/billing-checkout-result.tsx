"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthenticatedApiClient } from "@/lib/api/authenticated-client";

const buttonClassName = "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function BillingCheckoutResult({ canceled = false }: { canceled?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const [plan, setPlan] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (canceled || !isLoaded || !isSignedIn) return;

    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    let active = true;
    let attempts = 0;
    const checkEntitlement = () => {
      api.getUsage()
        .then((usage) => {
          if (active) {
            setPlan(usage.plan ?? "FREE");
            setHasError(false);
          }
        })
        .catch(() => {
          if (active) setHasError(true);
        });
    };

    const reconcile = sessionId
      ? api.reconcileCompletedCheckout(sessionId).catch(() => {
        if (active) setHasError(true);
      })
      : Promise.resolve();

    reconcile.finally(checkEntitlement);
    const interval = window.setInterval(() => {
      attempts += 1;
      checkEntitlement();
      if (attempts >= 15) window.clearInterval(interval);
    }, 2_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [api, canceled, isLoaded, isSignedIn]);

  if (!isLoaded) return <p className="text-sm text-text-muted">Restoring your session...</p>;

  if (!isSignedIn) {
    return <ResultShell eyebrow="Private account" title="Sign in to verify your plan.">
      <p className="text-sm leading-6 text-text-muted">Only the backend can confirm Pro access for your account.</p>
      <SignInButton mode="modal"><button className={`${buttonClassName} mt-6 bg-signal text-text-on-dark hover:brightness-110`} type="button">Sign in to continue</button></SignInButton>
    </ResultShell>;
  }

  if (canceled) {
    return <ResultShell eyebrow="Checkout canceled" title="Your plan is unchanged.">
      <p className="text-sm leading-6 text-text-muted">No Pro access was granted. Your existing Workspaces and current Free allowance remain available.</p>
      <Link className={`${buttonClassName} mt-6 bg-signal text-text-on-dark hover:brightness-110`} href="/account">Return to billing</Link>
    </ResultShell>;
  }

  const isPro = plan === "PRO";
  return <ResultShell eyebrow={isPro ? "Pro verified" : "Payment received"} title={isPro ? "Pro is active." : "We are verifying your Pro access."}>
    <p className="text-sm leading-6 text-text-muted">{isPro ? "The backend has verified your Stripe Checkout. Your Pro entitlements are now active." : hasError ? "We could not read your current entitlement. Return to billing and try again." : "The backend is confirming your completed Stripe Checkout, which can take a moment."}</p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Link className={`${buttonClassName} bg-signal text-text-on-dark hover:brightness-110`} href="/account">{isPro ? "View plan" : "Check billing"}</Link>
      {!isPro ? <Link className={`${buttonClassName} border border-line text-foreground hover:bg-surface-alt`} href="/practice">Continue practicing</Link> : null}
    </div>
  </ResultShell>;
}

function ResultShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="mx-auto w-full max-w-2xl rounded-lg border border-line bg-surface p-6 sm:p-10"><p className="font-mono text-xs uppercase tracking-[0.18em] text-signal">{eyebrow}</p><h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1><div className="mt-4">{children}</div></section>;
}
