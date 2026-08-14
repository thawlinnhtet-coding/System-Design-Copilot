import { BookOpen } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/navigation/app-shell";
import { ChallengeCatalog } from "@/features/challenges/challenge-catalog";

export default function ChallengesPage() {
  return (
    <AppShell>
      <section className="mx-auto w-full max-w-5xl">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-signal">Library / curated Challenges</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">Choose a problem.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
          Start with a problem, not a reference architecture. Each Challenge becomes a private Workspace you can resume.
        </p>
        <Link className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-signal hover:underline" href="/practice">Return to Practice</Link>

        <div className="mt-10 flex size-11 items-center justify-center rounded-md bg-signal-soft text-signal">
          <BookOpen aria-hidden="true" size={20} />
        </div>
        <ChallengeCatalog />
      </section>
    </AppShell>
  );
}
