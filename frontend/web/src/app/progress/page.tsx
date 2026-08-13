import { AppShell } from "@/components/navigation/app-shell";
import { ProgressOverview } from "@/features/progress/progress-overview";

export default function ProgressPage() {
  return (
    <AppShell>
      <section className="mx-auto w-full max-w-5xl">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-signal">Progress / evidence of judgment</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">See how your reasoning changes.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
          Progress will follow recorded Decisions, defended Scenarios, Review Findings, and open questions rather than streaks or arbitrary points.
        </p>

        <div className="mt-10"><ProgressOverview /></div>
      </section>
    </AppShell>
  );
}
