"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

const buttonClassName =
  "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function AuthControls() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div aria-label="Loading session" className="h-9 w-28" />;
  }

  return (
    <div className="flex items-center gap-2">
      {isSignedIn ? (
        <>
          <a className={`${buttonClassName} text-text-muted hover:bg-surface-alt hover:text-foreground`} href="/practice">
            Practice
          </a>
          <UserButton />
        </>
      ) : (
        <Link className={`${buttonClassName} text-text-muted hover:bg-surface-alt hover:text-foreground`} href="/sign-in">
          Sign in
        </Link>
      )}
    </div>
  );
}
