"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiRequestError, useAuthenticatedApiClient } from "@/lib/api/authenticated-client";
import { getChallenges, type ChallengeSummary } from "@/lib/api/public-client";
import { challengeButton } from "./challenge-styles";

const workspaceQueryKey = ["workspaces"] as const;
const select = "min-h-11 border border-line bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-focus";

type CatalogFilters = {
  topic: string;
  difficulty: string;
  time: string;
  skill: string;
};

const initialFilters: CatalogFilters = { topic: "all", difficulty: "all", time: "all", skill: "all" };

export function ChallengeCatalog() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const catalog = useQuery({ queryKey: ["challenges"], queryFn: getChallenges });
  const workspaces = useQuery({ queryKey: workspaceQueryKey, queryFn: api.getWorkspaces, enabled: isLoaded && isSignedIn });

  const options = useMemo(() => {
    const challenges = catalog.data ?? [];
    return {
      topics: [...new Set(challenges.map((challenge) => challenge.topic))].sort(),
      skills: [...new Set(challenges.map((challenge) => challenge.skillFocus))].sort(),
    };
  }, [catalog.data]);

  const visibleChallenges = useMemo(() => (catalog.data ?? []).filter((challenge) => {
    const timeMatches = filters.time === "all"
      || (filters.time === "short" && challenge.estimatedMinutes <= 30)
      || (filters.time === "standard" && challenge.estimatedMinutes > 30 && challenge.estimatedMinutes <= 60)
      || (filters.time === "extended" && challenge.estimatedMinutes > 60);
    return (filters.topic === "all" || challenge.topic === filters.topic)
      && (filters.difficulty === "all" || challenge.difficulty === filters.difficulty)
      && (filters.skill === "all" || challenge.skillFocus === filters.skill)
      && timeMatches;
  }), [catalog.data, filters]);

  async function start(slug: string) {
    setCreating(slug);
    setError(null);
    try {
      const workspace = await api.startChallenge(slug);
      await queryClient.invalidateQueries({ queryKey: workspaceQueryKey });
      if (workspace.id) router.push(`/workspace/${workspace.id}`);
    } catch (caught) {
      setError(caught instanceof ApiRequestError && caught.status === 429
        ? "Your plan has reached its active Workspace limit. Archive paused work before starting another attempt."
        : "This Challenge could not be started. Your existing Workspaces are unchanged.");
    } finally {
      setCreating(null);
    }
  }

  function updateFilter(key: keyof CatalogFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  if (catalog.isPending) return <p className="mt-8 text-sm text-text-muted" role="status">Loading Challenges...</p>;
  if (catalog.isError) return <p className="mt-8 border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">The Challenge catalog is temporarily unavailable.</p>;

  return (
    <div className="mt-8" aria-label="Curated Challenges">
      <div className="grid gap-3 border-y border-line py-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Challenge filters">
        <label className="grid gap-1.5 text-xs text-text-muted">Topic<select aria-label="Filter by topic" className={select} onChange={(event) => updateFilter("topic", event.target.value)} value={filters.topic}><option value="all">All topics</option>{options.topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs text-text-muted">Difficulty<select aria-label="Filter by difficulty" className={select} onChange={(event) => updateFilter("difficulty", event.target.value)} value={filters.difficulty}><option value="all">All levels</option><option value="FOUNDATION">Foundation</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></label>
        <label className="grid gap-1.5 text-xs text-text-muted">Practice time<select aria-label="Filter by practice time" className={select} onChange={(event) => updateFilter("time", event.target.value)} value={filters.time}><option value="all">Any duration</option><option value="short">20–30 min</option><option value="standard">45–60 min</option><option value="extended">75–120 min</option></select></label>
        <label className="grid gap-1.5 text-xs text-text-muted">Skill focus<select aria-label="Filter by skill focus" className={select} onChange={(event) => updateFilter("skill", event.target.value)} value={filters.skill}><option value="all">All skills</option>{options.skills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}</select></label>
      </div>
      {error ? <p className="mt-4 border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}
      <div className="divide-y divide-line">
        {visibleChallenges.map((challenge) => <ChallengeRow challenge={challenge} creating={creating} isSignedIn={Boolean(isLoaded && isSignedIn)} attempts={(workspaces.data ?? []).filter((workspace) => workspace.challengeVersionId === challenge.versionId)} onStart={start} key={challenge.slug} />)}
      </div>
      {!visibleChallenges.length ? <p className="py-8 text-sm text-text-muted">No Challenges match these filters.</p> : null}
    </div>
  );
}

function ChallengeRow({ challenge, creating, isSignedIn, attempts, onStart }: { challenge: ChallengeSummary; creating: string | null; isSignedIn: boolean; attempts: Array<{ id?: string; challengeVersionId?: string }>; onStart: (slug: string) => Promise<void> }) {
  const latest = attempts[0];
  return (
    <article className="grid gap-4 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div>
        <div className="flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted"><span className="text-signal">{challenge.difficulty}</span><span>{challenge.estimatedMinutes} MIN</span><span>{challenge.topic}</span></div>
        <h2 className="mt-2 font-display text-xl font-semibold"><Link className="hover:text-signal" href={`/challenges/${challenge.slug}`}>{challenge.title}</Link></h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-muted">{challenge.description}</p>
        <p className="mt-2 text-xs text-text-muted">Skill focus: <span className="text-foreground">{challenge.skillFocus}</span>{attempts.length ? ` · ${attempts.length} ${attempts.length === 1 ? "attempt" : "attempts"}` : ""}</p>
      </div>
      <div className="flex flex-wrap gap-3 lg:justify-end">
        <Link className={`${challengeButton} border-line text-foreground hover:bg-surface-alt`} href={`/challenges/${challenge.slug}`}>View Challenge</Link>
        {latest?.id ? <Link className={`${challengeButton} border-line text-foreground hover:bg-surface-alt`} href={`/workspace/${latest.id}`}>Resume latest</Link> : null}
        {isSignedIn ? <button className={`${challengeButton} border-signal bg-signal text-text-on-dark hover:brightness-110`} disabled={creating !== null} onClick={() => void onStart(challenge.slug)} type="button">{creating === challenge.slug ? "Starting..." : attempts.length ? "Start new attempt" : "Start Challenge"}</button> : <Link className={`${challengeButton} border-signal bg-signal text-text-on-dark hover:brightness-110`} href={`/sign-in?returnTo=${encodeURIComponent(`/challenges/${challenge.slug}`)}`}>Sign in to start</Link>}
      </div>
    </article>
  );
}
