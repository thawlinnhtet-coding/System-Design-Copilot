"use client";

import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";

const buttonClassName =
  "rounded-md px-3 py-2 font-mono text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300";

export function AuthControls() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div aria-label="Loading session" className="h-9 w-28" />;
  }

  return (
    <div className="flex items-center gap-2">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <>
        <SignInButton mode="modal">
          <button className={`${buttonClassName} text-slate-300 hover:bg-slate-800`} type="button">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className={`${buttonClassName} bg-cyan-300 text-slate-950 hover:bg-cyan-200`} type="button">
            Create account
          </button>
        </SignUpButton>
        </>
      )}
    </div>
  );
}
