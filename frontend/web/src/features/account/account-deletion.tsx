"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountSettingsSidebar } from "./account-navigation";

export function AccountDeletionState({ state }: { state: "confirmation" | "scheduled" }) {
  const router = useRouter();
  const scheduled = state === "scheduled";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background" data-testid={`account-deletion-${state}`}>
      <header className="border-b border-line bg-surface px-5 py-[18px] sm:px-8 lg:px-10">
        <div className="flex flex-col gap-[5px]">
          <p className="font-mono text-[10px] leading-[1.4] text-signal">ACCOUNT / ACCOUNT DELETION</p>
          <h1 className="font-display text-[28px] font-medium leading-[1.1] tracking-[-0.025em]">{scheduled ? "Deletion scheduled" : "Confirm account deletion"}</h1>
          <p className="max-w-[720px] text-[13px] leading-[1.45] text-text-muted">{scheduled ? "Your account access is suspended. Cancel the request within 7 days to restore access before permanent deletion." : "Review the impact before submitting your deletion request."}</p>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-180px)] flex-col lg:flex-row">
        <AccountSettingsSidebar activeSection="privacy" variant="detail" />

        <div className="flex min-w-0 flex-1 items-center justify-center px-5 py-7 sm:px-8 lg:px-10 lg:py-6">
          <section className="w-full max-w-[520px] rounded-[4px] border border-line bg-surface p-7" role="alert">
              <p className="font-mono text-[10px] leading-[1.4] text-text-muted">{scheduled ? "DELETION SCHEDULED" : "RECENT AUTHENTICATION REQUIRED"}</p>
              <h2 className="mt-1 font-display text-[22px] leading-[1.2]">{scheduled ? "Your account is scheduled for deletion" : "Delete your account?"}</h2>
              <p className="mt-2 text-[13px] leading-[1.4] text-text-muted">{scheduled ? "Sessions are revoked now. Your product content remains recoverable for 7 days, then deletion is permanent." : "Your sessions will be revoked immediately. You can cancel this request for 7 days from your verified email. After that, your product content will be permanently deleted."}</p>

              <div className="mt-4 flex flex-col gap-2 border border-line bg-background p-3.5 text-[11px] leading-[1.4]">
                <DeletionRow label="Immediately" value="Sessions revoked and access suspended" />
                <DeletionRow label="Recovery window" value={scheduled ? "7 days · Cancel from your verified email" : "Cancel the request from your verified email within 7 days"} />
                <DeletionRow label={scheduled ? "Permanent deletion" : "After 7 days"} value="After 7 days · Product content is permanently deleted" last />
              </div>

              <p className="mt-3 text-xs leading-[1.4] text-text-muted">{scheduled ? "Use the secure link in your verified email to cancel this request before the recovery window ends." : "No content is deleted until the recovery period ends."}</p>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                {scheduled ? (
                  <button className="inline-flex h-10 items-center justify-center border border-line px-4 text-xs font-medium text-foreground hover:bg-surface-alt" onClick={() => router.replace("/account/privacy")} type="button">Cancel deletion</button>
                ) : (
                  <Link className="inline-flex h-10 items-center justify-center border border-line px-4 text-xs font-medium text-foreground hover:bg-surface-alt" href="/account/privacy">Keep my account</Link>
                )}
                {!scheduled ? <button className="inline-flex h-10 items-center justify-center bg-danger px-4 text-xs font-medium text-white hover:brightness-110" onClick={() => router.replace("/account/privacy/scheduled")} type="button">Delete account</button> : null}
              </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DeletionRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <div className={`flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-3 ${last ? "" : ""}`}><span className="font-mono text-[10px] font-semibold text-text-muted">{label}</span><span className="text-foreground sm:max-w-[270px] sm:text-left">{value}</span></div>;
}
