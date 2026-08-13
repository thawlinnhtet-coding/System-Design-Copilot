import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";

export default function ChallengesPage() {
  return (
    <AppShell>
      <section className="mx-auto w-full max-w-5xl">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-signal">Library / curated Challenges</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">Choose a problem.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
          Start with a problem, not a reference architecture. Each Challenge becomes a private Workspace you can resume.
        </p>

        <div className="mt-10 rounded-lg border border-line bg-surface p-6 sm:p-8">
          <div className="flex size-11 items-center justify-center rounded-md bg-signal-soft text-signal">
            <BookOpen aria-hidden="true" size={20} />
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold">The starter library is next.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-text-muted">
            URL shortener, news feed, and ticket-booking Challenges are being connected to the Workspace flow. Your Practice Home is ready for custom Workspaces now.
          </p>
          <Link className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-signal px-4 text-sm font-semibold text-text-on-dark transition-colors hover:brightness-110" href="/practice">
            Return to Practice
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
