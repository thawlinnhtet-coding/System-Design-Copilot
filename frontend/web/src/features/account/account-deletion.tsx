"use client";

import { SignInButton, useAuth, useClerk, useReverification } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthenticatedApiClient } from "@/lib/api/authenticated-client";
import { AccountSettingsSidebar } from "./account-navigation";

export function AccountDeletionState({ state }: { state: "confirmation" | "scheduled" }) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const api = useAuthenticatedApiClient();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancellationToken] = useState<string | null>(() => typeof window === "undefined" ? null : new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token"));
  const scheduled = state === "scheduled";
  useEffect(() => {
    if (cancellationToken) window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }, [cancellationToken]);
  const cancellationRedirect = `/account/privacy/cancel${cancellationToken ? `#token=${encodeURIComponent(cancellationToken)}` : ""}`;
  const requestDeletion = useReverification(api.requestAccountDeletion);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const result = await requestDeletion();
      if ("scheduled" in result && result.scheduled) {
        await clerk.signOut();
        router.replace("/account/privacy/scheduled");
      }
    } catch {
      setError("We could not schedule account deletion. Your account is still available; try again shortly.");
    } finally { setBusy(false); }
  };
  const cancel = async () => {
    const token = cancellationToken;
    if (!token) { setError("This cancellation link is invalid or incomplete. Open the link from your verified email."); return; }
    setBusy(true); setError(null);
    try { await api.cancelAccountDeletion(token); router.replace("/account"); }
    catch { setError("This deletion request cannot be cancelled. It may have expired; contact support if you need help."); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-background lg:flex-row" data-testid={`account-deletion-${state}`}>
      <AccountSettingsSidebar activeSection="privacy" />
      <main className="min-w-0 flex-1 bg-[#f7f5ef] px-5 py-7 sm:px-8 lg:px-[46px] lg:py-[42px]">
        <header className="mb-6 flex flex-col gap-2"><h1 className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.025em]">{scheduled ? "Deletion scheduled" : "Delete account"}</h1><p className="text-sm leading-[1.45] text-text-muted">{scheduled ? "Your account access is suspended. Cancel the request within 7 days to restore access before permanent deletion." : "Review the impact before submitting your deletion request."}</p></header>
        <section className="w-full max-w-[760px] border border-line bg-white p-6" role="alert">
          <p className="font-mono text-[10px] leading-[1.4] text-text-muted">{scheduled ? "DELETION SCHEDULED" : "RECENT AUTHENTICATION REQUIRED"}</p>
          <h2 className="mt-1 font-display text-[22px] leading-[1.2]">{scheduled ? "Your account is scheduled for deletion" : "Delete your account?"}</h2>
          <p className="mt-2 text-[13px] leading-[1.4] text-text-muted">{scheduled ? "Sessions are revoked now. Your product content remains recoverable for 7 days, then deletion is permanent." : "Your sessions will be revoked immediately. You can cancel this request for 7 days from your verified email. After that, your product content will be permanently deleted."}</p>
          <div className="mt-4 flex flex-col gap-2 border border-line bg-background p-3.5 text-[11px] leading-[1.4]"><DeletionRow label="Immediately" value="Sessions revoked and access suspended" /><DeletionRow label="Recovery window" value="7 days · Cancel from your verified email" /><DeletionRow label="After 7 days" value="Product content is permanently deleted" /></div>
          <p className="mt-3 text-xs leading-[1.4] text-text-muted">The personal beta promises product-content deletion after recovery. Independent backup deletion and recovery guarantees are deferred until commercial launch.</p>
          {error ? <p className="mt-3 text-xs text-danger" role="alert">{error}</p> : null}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            {scheduled ? isSignedIn ? <button className="inline-flex h-10 items-center justify-center border border-line px-4 text-xs font-medium text-foreground hover:bg-surface-alt disabled:opacity-60" disabled={busy} onClick={() => void cancel()} type="button">{busy ? "Cancelling..." : "Cancel deletion"}</button> : <SignInButton fallbackRedirectUrl={cancellationRedirect} mode="modal"><button className="inline-flex h-10 items-center justify-center border border-line px-4 text-xs font-medium text-foreground hover:bg-surface-alt" type="button">Sign in to cancel deletion</button></SignInButton> : <><Link className="inline-flex h-10 items-center justify-center border border-line px-4 text-xs font-medium text-foreground hover:bg-surface-alt" href="/account/privacy">Keep my account</Link><button className="inline-flex h-10 items-center justify-center bg-danger px-4 text-xs font-medium text-white hover:brightness-110 disabled:opacity-60" disabled={busy || !isSignedIn} onClick={() => void submit()} type="button">{busy ? "Scheduling..." : "Delete account"}</button></>}
          </div>
          {!scheduled && !isSignedIn ? <p className="mt-3 text-xs text-text-muted">Sign in before requesting deletion.</p> : null}
        </section>
      </main>
    </div>
  );
}
function DeletionRow({ label, value }: { label: string; value: string }) { return <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-3"><span className="font-mono text-[10px] font-semibold text-text-muted">{label}</span><span className="text-foreground sm:max-w-[270px] sm:text-left">{value}</span></div>; }
