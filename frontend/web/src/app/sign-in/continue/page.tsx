"use client";

import { useSignUp } from "@clerk/nextjs";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { getAuthDestination, withAuthDestination } from "@/features/auth/auth-redirect";

type AuthError = { errors?: Array<{ longMessage?: string; message?: string }> };

export default function SignInContinuePage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background px-5 text-sm text-text-muted">Loading secure account setup...</main>}>
      <SignInContinueForm />
    </Suspense>
  );
}

function SignInContinueForm() {
  const { signUp } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = getAuthDestination(searchParams);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const missingFields = signUp.missingFields.map(String);
  const needsFirstName = missingFields.includes("first_name");
  const needsLastName = missingFields.includes("last_name");
  const needsLegalAcceptance = missingFields.includes("legal_accepted");
  const hasActiveContinuation = signUp.status === "missing_requirements";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (needsFirstName && !firstName.trim()) return setError("Enter your first name.");
    if (needsLastName && !lastName.trim()) return setError("Enter your last name.");
    if (needsLegalAcceptance && !legalAccepted) return setError("Accept the terms to continue.");

    setPending(true);
    try {
      const result = await signUp.update({
        ...(needsFirstName ? { firstName: firstName.trim() } : {}),
        ...(needsLastName ? { lastName: lastName.trim() } : {}),
        ...(needsLegalAcceptance ? { legalAccepted: true } : {}),
      });
      if (result.error) throw result.error;
      if (signUp.status !== "complete") throw new Error("Your account still needs another required detail.");
      await signUp.finalize();
      router.replace(destination);
    } catch (caught) {
      const authError = caught as AuthError;
      setError(authError.errors?.[0]?.longMessage ?? authError.errors?.[0]?.message ?? "We could not finish setting up your account. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-[440px]">
        <p className="font-mono text-[11px] tracking-[0.14em] text-signal">ONE LAST STEP</p>
        <h1 className="mt-3 font-display text-[34px] font-medium leading-[1.15] tracking-[-0.035em]">Finish your account</h1>
        <p className="mt-3 text-[15px] leading-[1.45] text-text-muted">Your provider account is connected. Add the required details to start your private Workspace.</p>
        {!hasActiveContinuation ? (
          <p className="mt-6 border-l-2 border-danger bg-[#f5e3e0] px-3 py-2 text-[13px] leading-5 text-danger" role="alert">This sign-in session has expired. Return to sign in and try again.</p>
        ) : (
          <form className="mt-7 grid gap-4" noValidate onSubmit={submit}>
            {needsFirstName && <label className="grid gap-2 text-[14px] font-medium">First name<input autoComplete="given-name" className="auth-input" onChange={(event) => setFirstName(event.target.value)} required value={firstName} /></label>}
            {needsLastName && <label className="grid gap-2 text-[14px] font-medium">Last name<input autoComplete="family-name" className="auth-input" onChange={(event) => setLastName(event.target.value)} required value={lastName} /></label>}
            {needsLegalAcceptance && <label className="flex items-start gap-3 text-[13px] leading-5 text-text-muted"><input checked={legalAccepted} className="mt-1" onChange={(event) => setLegalAccepted(event.target.checked)} required type="checkbox" /><span>I agree to the <Link className="font-semibold text-signal hover:underline" href="/terms">Terms</Link> and <Link className="font-semibold text-signal hover:underline" href="/privacy">Privacy Policy</Link>.</span></label>}
            <button className="flex h-12 items-center justify-center gap-2 rounded-[3px] bg-signal text-[15px] font-semibold text-white hover:bg-[#0c655e] disabled:cursor-wait disabled:opacity-70" disabled={pending} type="submit">{pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <>Continue securely <ArrowRight aria-hidden="true" size={17} /></>}</button>
          </form>
        )}
        {error && <p aria-live="assertive" className="mt-4 border-l-2 border-danger bg-[#f5e3e0] px-3 py-2 text-[12px] leading-5 text-danger" role="alert">{error}</p>}
        <p className="mt-6 text-center text-[13px] text-text-muted"><Link className="font-semibold text-signal hover:underline" href={withAuthDestination("/sign-in", destination)}>Return to sign in</Link></p>
      </section>
    </main>
  );
}
