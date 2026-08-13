import type { HealthResponse } from "@/lib/api/client";

type HealthStatusProps = {
  health: HealthResponse | null;
};

export function HealthStatus({ health }: HealthStatusProps) {
  const available = health?.status === "UP";

  return (
    <section
      aria-label="Backend status"
      className="rounded-md border border-line bg-canvas p-5"
    >
      <div className="flex items-center gap-3" role="status">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${
            available ? "bg-success" : "bg-warning"
          }`}
        />
        <p className="font-mono text-sm font-medium text-text-on-dark">
          {available ? "Backend available" : "Backend unavailable"}
        </p>
      </div>
      {available ? (
          <p className="mt-4 font-mono text-xs tracking-wide text-text-on-dark-secondary">
          {health.service} v{health.version}
        </p>
      ) : (
          <p className="mt-4 text-sm leading-6 text-text-on-dark-secondary">
          Start the API locally to verify the development connection.
        </p>
      )}
    </section>
  );
}
