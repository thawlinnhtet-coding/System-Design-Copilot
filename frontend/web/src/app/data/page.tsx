import { AppShell } from "@/components/navigation/app-shell";
import { PortableData } from "@/features/data/portable-data";

export default function DataPage() {
  return (
    <AppShell>
      <section className="mx-auto w-full max-w-5xl">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-signal">Data / portable design content</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">Move your design without moving your account.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">Import and export use a versioned System Design Copilot package. Your identity, billing, usage, provider, and Review data stay outside the portable file.</p>
        <div className="mt-10"><PortableData /></div>
      </section>
    </AppShell>
  );
}
