"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { useAuthenticatedApiClient, type ApiRequestError } from "@/lib/api/authenticated-client";

export function PricingAction({ pro = false }: { pro?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const className = `min-h-11 w-full rounded border px-4 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${pro ? "border-signal bg-signal text-white hover:brightness-110" : "border-foreground text-foreground hover:bg-surface-alt"}`;

  if (!pro) {
    return <Link className={`inline-flex items-center justify-center ${className}`} href={isSignedIn ? "/practice" : "/sign-up"}>{isSignedIn ? "Continue with Free" : "Start with Free"}</Link>;
  }

  if (!isLoaded || !isSignedIn) {
    return <Link className={`inline-flex items-center justify-center ${className}`} href="/sign-in">Sign in to upgrade</Link>;
  }

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      window.location.assign(await api.startCheckout());
    } catch (requestError) {
      const status = (requestError as Partial<ApiRequestError>)?.status;
      setError(status === 403 ? "Pro Checkout is not enabled for this environment." : status === 409 ? "You already have Pro access. Manage it from Account → Billing." : status === 429 ? "Please wait before trying Checkout again." : "Checkout is unavailable right now.");
      setBusy(false);
    }
  }

  return <div className="w-full"><button className={className} disabled={busy} onClick={startCheckout} type="button">{busy ? "Opening Checkout..." : "Upgrade to Pro"}</button>{error ? <p className="mt-2 text-xs leading-5 text-warning" role="alert">{error}</p> : null}</div>;
}
