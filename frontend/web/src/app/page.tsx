import { HealthStatus } from "@/components/system/health-status";
import { AuthControls } from "@/features/auth/auth-controls";
import { getHealth } from "@/lib/api/client";

export default async function Home() {
  const health = await getHealth().catch(() => null);

  return (
    <main className="grid min-h-screen grid-rows-[1fr_auto] bg-slate-950 px-6 py-8 text-slate-100 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col py-4">
        <header className="flex items-center justify-between border-b border-slate-800 pb-5">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-cyan-300">
            System Design Copilot
          </p>
          <AuthControls />
        </header>
        <div className="flex flex-1 flex-col justify-center gap-12 py-12 lg:grid lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <section>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
              Build judgment, not just diagrams.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Work through requirements, trade-offs, and failure modes before you ask for feedback.
            </p>
          </section>
          <HealthStatus health={health} />
        </div>
      </div>
      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-slate-800 pt-5 font-mono text-xs text-slate-500">
        <span>ACTIVE PRACTICE WORKSPACE</span>
        <span>LOCAL FOUNDATION</span>
      </footer>
    </main>
  );
}
