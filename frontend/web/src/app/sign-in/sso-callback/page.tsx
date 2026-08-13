"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { getAuthDestination, withAuthDestination } from "@/features/auth/auth-redirect";

type AuthError = { errors?: Array<{ longMessage?: string; message?: string }> };

function getErrorMessage(caught: unknown) {
  const authError = caught as AuthError;
  return authError.errors?.[0]?.longMessage ?? authError.errors?.[0]?.message ?? "We could not finish authentication. Please return to sign in and try again.";
}

export default function SignInSsoCallbackPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-text-muted">Finishing your secure sign-in...</main>}>
      <SignInSsoCallbackForm />
    </Suspense>
  );
}

function SignInSsoCallbackForm() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = getAuthDestination(searchParams);
  const hasStarted = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clerk.loaded || hasStarted.current) return;
    hasStarted.current = true;

    const finish = async () => {
      try {
        if (signIn.status === "complete") {
          await signIn.finalize();
          router.replace(destination);
          return;
        }

        if (signUp.status === "complete") {
          await signUp.finalize();
          router.replace(destination);
          return;
        }

        // Clerk may transfer an OAuth attempt between sign-in and sign-up when
        // the provider account has not been used in this application before.
        if (signUp.isTransferable) {
          const result = await signIn.create({ transfer: true });
          if (result.error) throw result.error;
          if ((signIn.status as string) === "complete") {
            await signIn.finalize();
            router.replace(destination);
          } else {
            router.replace(withAuthDestination("/sign-in", destination));
          }
          return;
        }

        if (signIn.isTransferable) {
          const result = await signUp.create({ transfer: true });
          if (result.error) throw result.error;
          if ((signUp.status as string) === "complete") {
            await signUp.finalize();
            router.replace(destination);
          } else {
            router.replace(withAuthDestination("/sign-in/continue", destination));
          }
          return;
        }

        if (signUp.status === "missing_requirements") {
          router.replace(withAuthDestination("/sign-in/continue", destination));
          return;
        }

        throw new Error("The OAuth attempt did not reach a complete state.");
      } catch (caught) {
        hasStarted.current = false;
        setError(getErrorMessage(caught));
      }
    };

    void finish();
  }, [clerk, destination, router, signIn, signUp]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div aria-live="polite" className="w-full max-w-md text-center" role="status">
        <div id="clerk-captcha" />
        {error ? (
          <>
            <p className="border-l-2 border-danger bg-[#f5e3e0] px-3 py-2 text-left text-[13px] leading-5 text-danger" role="alert">{error}</p>
            <button className="mt-5 text-[13px] font-semibold text-signal hover:underline" onClick={() => router.replace(withAuthDestination("/sign-in", destination))} type="button">Return to sign in</button>
          </>
        ) : (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-signal" />
            <p className="mt-4 text-[15px] font-medium">Finishing your secure sign-in…</p>
            <p className="mt-2 text-[13px] text-text-muted">This usually takes a moment. Please keep this tab open.</p>
          </>
        )}
      </div>
    </main>
  );
}
