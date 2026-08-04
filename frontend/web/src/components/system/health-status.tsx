import type { HealthResponse } from "@/lib/api/client";

type HealthStatusProps = {
  health: HealthResponse | null;
};

export function HealthStatus({ health }: HealthStatusProps) {
  const available = health?.status === "UP";

  return (
    <section
      aria-label="Backend status"
      className="rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl shadow-cyan-950/30"
    >
      <div className="flex items-center gap-3" role="status">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${
            available ? "bg-emerald-400 shadow-[0_0_16px_#34d399]" : "bg-amber-400"
          }`}
        />
        <p className="font-mono text-sm font-medium text-slate-100">
          {available ? "Backend available" : "Backend unavailable"}
        </p>
      </div>
      {available ? (
        <p className="mt-4 font-mono text-xs tracking-wide text-slate-400">
          {health.service} v{health.version}
        </p>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Start the API locally to verify the development connection.
        </p>
      )}
    </section>
  );
}
