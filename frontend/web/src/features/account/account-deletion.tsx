"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthenticatedApiClient } from "@/lib/api/authenticated-client";
import { AccountSettingsSidebar } from "./account-navigation";

export function AccountDeletionState() {
	const router = useRouter();
	const { isSignedIn } = useAuth();
	const clerk = useClerk();
	const api = useAuthenticatedApiClient();
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const submit = async () => {
		setBusy(true); setError(null);
		try {
			await api.requestAccountDeletion();
			await clerk.signOut().catch(() => undefined);
			router.replace("/");
		} catch {
			setError("We could not delete your account. Nothing was changed; try again shortly.");
		} finally { setBusy(false); }
	};

	return (
		<div className="flex min-h-[calc(100vh-64px)] flex-col bg-background lg:flex-row" data-testid="account-deletion-confirmation">
			<AccountSettingsSidebar activeSection="privacy" />
			<main className="min-w-0 flex-1 bg-[#f7f5ef] px-5 py-7 sm:px-8 lg:px-[46px] lg:py-[42px]">
				<header className="mb-7 flex flex-col gap-2"><h1 className="font-display text-[30px] font-semibold leading-[1.08]">Delete account</h1><p className="text-sm leading-[1.5] text-text-muted">Permanently close your account after reviewing what will be removed.</p></header>
				<section aria-labelledby="delete-account-heading" className="flex w-full max-w-[760px] flex-col gap-[18px] rounded-[6px] border border-[#f1c8c4] bg-white p-7">
					<h2 className="font-display text-[20px] font-semibold leading-[1.2]" id="delete-account-heading">Delete your account?</h2>
					<p className="text-sm leading-[1.4] text-text-muted">This permanently removes your account, architecture revisions, reviews, and associated personal data immediately after confirmation. There is no recovery window.</p>
					<div className="flex flex-col gap-1 rounded-[5px] bg-[#fff1f0] p-4">
						<p className="text-[13px] font-semibold leading-[1.3] text-[#8a241d]">Before you continue</p>
						<p className="text-[13px] leading-[1.4] text-[#8a241d]">Choose Keep my account if you do not want to continue.</p>
					</div>
					{error ? <p className="text-xs text-danger" role="alert">{error}</p> : null}
					<div className="flex flex-wrap items-center gap-3"><Link className="inline-flex h-10 items-center justify-center rounded-[4px] border border-[#b7c0bb] bg-white px-3.5 text-sm font-semibold text-[#35534e] hover:bg-surface-alt" href="/account/privacy">Keep my account</Link><button className="inline-flex h-10 items-center justify-center rounded-[4px] bg-[#b42318] px-3.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60" disabled={busy || !isSignedIn} onClick={() => void submit()} type="button">{busy ? "Deleting..." : "Delete account"}</button></div>
					{!isSignedIn ? <p className="mt-3 text-xs text-text-muted">Sign in before confirming deletion.</p> : null}
				</section>
			</main>
		</div>
	);
}
