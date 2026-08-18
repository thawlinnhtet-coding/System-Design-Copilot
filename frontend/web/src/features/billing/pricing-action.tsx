"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { useEntitlements } from "@/features/account/use-entitlements";
import { useAuthenticatedApiClient, type ApiRequestError } from "@/lib/api/authenticated-client";

export function PricingAction({ pro = false }: { pro?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const entitlements = useEntitlements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const className = `min-h-11 w-full rounded border px-4 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${pro ? "border-signal bg-signal text-white hover:brightness-110" : "border-foreground text-foreground hover:bg-surface-alt"}`;

  if (!pro) {
    return <Link className={`inline-flex items-center justify-center ${className}`} href={isSignedIn ? "/practice" : "/sign-up"}>{isSignedIn ? "Continue with Free" : "Start with Free"}</Link>;
  }

  if (!isLoaded || !isSignedIn) {
    return <Link className={`inline-flex items-center justify-center ${className}`} href="/sign-in">Sign in to upgrade</Link>;
  }

  if (entitlements.isLoading) {
    return <button className={className} disabled type="button">Checking upgrade eligibility...</button>;
  }

  if (entitlements.isError) {
    return <div className="w-full"><button className={className} disabled type="button">Upgrade unavailable</button><p className="mt-2 text-xs leading-5 text-warning" role="alert">We could not verify your plan. Open Account → Plan &amp; usage to retry.</p></div>;
  }

  if (entitlements.data?.plan === "PRO") {
    return <Link className={`inline-flex items-center justify-center ${className}`} href="/account/plan">Manage Pro billing</Link>;
  }

  if (entitlements.data?.billing?.checkoutAvailable === false) {
    return <div className="w-full"><button className={className} disabled type="button">Upgrade unavailable in beta</button><p className="mt-2 text-xs leading-5 text-text-muted" role="status">Test-mode Pro billing is not enabled in this environment; existing Workspaces and content remain available.</p></div>;
  }

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      window.location.assign(await api.startCheckout());
    } catch (requestError) {
      const apiError = requestError as Partial<ApiRequestError>;
      const status = apiError?.status;
      const code = typeof apiError?.details?.code === "string" ? apiError.details.code : undefined;
      if (status === 403 && code === "email_verification_required") {
        setError("Clerk could not confirm your email verification. Verify it or sign out and back in after updating the JWT template.");
        setBusy(false);
        return;
      }
      if (status === 403 && code === "stripe_test_mode_required") {
        setError("Stripe test-mode billing is not enabled on the backend.");
        setBusy(false);
        return;
      }
      setError(status === 403 ? "Pro Checkout is not enabled for this environment." : status === 409 ? "You already have Pro access. Manage it from Account → Billing." : status === 429 ? "Please wait before trying Checkout again." : "Checkout is unavailable right now.");
      setBusy(false);
    }
  }

  return <div className="w-full"><button className={className} disabled={busy} onClick={startCheckout} type="button">{busy ? "Opening Checkout..." : "Upgrade to Pro"}</button>{error ? <p className="mt-2 text-xs leading-5 text-warning" role="alert">{error}</p> : null}</div>;
}
