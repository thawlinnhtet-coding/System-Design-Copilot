"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiRequestError, useAuthenticatedApiClient } from "@/lib/api/authenticated-client";

const challenges = [
  {
    id: "url-shortener",
    name: "Design a reliable URL shortener",
    description: "Handle 100M redirects per day while keeping reads fast and links durable.",
    difficulty: "FOUNDATION",
    time: "35 MIN",
    focus: "IDENTIFIERS · CACHE · DURABILITY",
  },
  {
    id: "news-feed",
    name: "Design a resilient news feed",
    description: "Serve a personalized, read-heavy feed while balancing freshness, fan-out, and recovery.",
    difficulty: "INTERMEDIATE",
    time: "45 MIN",
    focus: "FAN-OUT · FRESHNESS · SCALE",
  },
  {
    id: "ticket-booking",
    name: "Design a safe ticket-booking system",
    description: "Protect scarce inventory during demand spikes without making successful reservations ambiguous.",
    difficulty: "ADVANCED",
    time: "50 MIN",
    focus: "CONSISTENCY · CONTENTION · RECOVERY",
  },
] as const;

const workspaceQueryKey = ["workspaces"] as const;
const button = "inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";

export function ChallengeCatalog() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workspaces = useQuery({
    queryKey: workspaceQueryKey,
    queryFn: api.getWorkspaces,
    enabled: isLoaded && isSignedIn,
  });

  async function start(challenge: (typeof challenges)[number]) {
    setCreating(challenge.id);
    setError(null);
    try {
      const workspace = await api.createWorkspace(challenge.name, challenge.description, "CHALLENGE", "CURATED_CHALLENGE");
      await queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
      if (workspace.id) router.push(`/workspace/${workspace.id}`);
    } catch (caught) {
      setError(caught instanceof ApiRequestError && caught.status === 403
        ? "Your plan has reached its active Workspace limit. Archive paused work before starting another attempt."
        : "This Challenge could not be started. Your existing Workspaces are unchanged.");
      setCreating(null);
    }
  }

  return (
    <div className="mt-8 grid gap-4" aria-label="Curated Challenges">
      {error ? <p className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}
      {challenges.map((challenge) => {
        const attempts = (workspaces.data ?? []).filter((workspace) => workspace.type === "CHALLENGE" && workspace.name === challenge.name);
        const latest = attempts[0];
        return (
          <article className="border border-line bg-surface p-6 sm:p-7" key={challenge.id}>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  <span className="text-signal">{challenge.difficulty}</span><span>{challenge.time}</span><span>{challenge.focus}</span>
                </div>
                <h2 className="mt-3 font-display text-2xl font-semibold">{challenge.name}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">{challenge.description}</p>
                {attempts.length ? <p className="mt-3 text-xs text-text-muted">{attempts.length} independent {attempts.length === 1 ? "attempt" : "attempts"} · Each attempt keeps its own reasoning.</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                {latest?.id ? <Link className={`${button} border-line text-foreground hover:bg-surface-alt`} href={`/workspace/${latest.id}`}>Resume latest</Link> : null}
                {isLoaded && isSignedIn ? (
                  <button className={`${button} border-signal bg-signal text-text-on-dark hover:brightness-110`} disabled={creating !== null} onClick={() => void start(challenge)} type="button">
                    {creating === challenge.id ? "Starting..." : attempts.length ? "Start new attempt" : "Start Challenge"}
                  </button>
                ) : (
                  <Link className={`${button} border-signal bg-signal text-text-on-dark hover:brightness-110`} href={`/sign-in?returnTo=${encodeURIComponent(`/challenges?challenge=${challenge.id}`)}`}>Sign in to start</Link>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
