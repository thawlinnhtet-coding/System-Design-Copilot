"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiRequestError, useAuthenticatedApiClient } from "@/lib/api/authenticated-client";
import { challengeButton } from "./challenge-styles";

export function ChallengeDetail({ slug }: { slug: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useAuthenticatedApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detail = useQuery({
    queryKey: ["challenge", slug],
    queryFn: () => api.getChallenge(slug),
    enabled: isLoaded,
  });

  async function start() {
    setStarting(true);
    setError(null);
    try {
      const workspace = await api.startChallenge(slug);
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      if (workspace.id) router.push(`/workspace/${workspace.id}`);
    } catch (caught) {
      setError(caught instanceof ApiRequestError && caught.status === 429
        ? "Your plan has reached its active Workspace limit. Archive paused work before starting another attempt."
        : "This Challenge could not be started. Your existing Workspaces are unchanged.");
    } finally {
      setStarting(false);
    }
  }

  if (!isLoaded) return <p className="text-sm text-text-muted" role="status">Checking access...</p>;
  if (detail.isPending) return <p className="text-sm text-text-muted" role="status">Loading Challenge...</p>;
  if (detail.isError) return <p className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">This Challenge is unavailable or no longer published.</p>;

  const challenge = detail.data;
  const attempts = challenge.attempts ?? [];
  const latestAttempt = attempts[0];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        <Link className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal" href="/challenges">← Back to Challenges</Link>
        <div className="mt-6 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          <span className="text-signal">{challenge.difficulty}</span><span>{challenge.estimatedMinutes} MIN</span><span>{challenge.topic}</span>
        </div>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">{challenge.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-muted">{challenge.description}</p>
        <section className="mt-10 border-t border-line pt-7"><h2 className="font-display text-2xl font-semibold">Problem statement</h2><p className="mt-4 whitespace-pre-line text-sm leading-7 text-text-muted">{challenge.problemStatement}</p></section>
        <section className="mt-10 border-t border-line pt-7"><h2 className="font-display text-2xl font-semibold">Initial constraints</h2><ul className="mt-4 grid gap-3 text-sm leading-6 text-text-muted">{(challenge.initialConstraints ?? []).map((constraint) => <li className="border-l-2 border-signal pl-4" key={constraint}>{constraint}</li>)}</ul></section>
        <section className="mt-10 border-t border-line pt-7"><h2 className="font-display text-2xl font-semibold">Scenario preview</h2><ul className="mt-4 grid gap-3 text-sm leading-6 text-text-muted">{(challenge.scenarioPreview ?? []).map((scenario) => <li className="border-l-2 border-line pl-4" key={scenario}>{scenario}</li>)}</ul></section>
        {attempts.length ? <section className="mt-10 border-t border-line pt-7"><h2 className="font-display text-2xl font-semibold">Existing attempts</h2><ul className="mt-4 grid gap-2">{attempts.map((attempt) => attempt.id ? <li className="flex items-center justify-between gap-4 border-b border-line py-3 text-sm" key={attempt.id}><span><span className="block text-foreground">{attempt.name ?? "Challenge Workspace"}</span><span className="text-xs text-text-muted">{attempt.status ?? "ACTIVE"}</span></span><Link className="font-semibold text-signal hover:underline" href={`/workspace/${attempt.id}`}>Continue</Link></li> : null)}</ul></section> : null}
      </div>
      <aside className="h-fit border border-line bg-surface p-5 lg:sticky lg:top-8">
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">Practice map</h2>
        <div className="mt-5 grid gap-4">
          <div><p className="text-xs text-text-muted">Topic Packs</p><ol className="mt-2 grid gap-2 text-sm">{(challenge.topicPacks ?? []).map((pack, index) => <li className="flex gap-2" key={pack}><span className="font-mono text-xs text-signal">0{index + 1}</span><span>{pack}</span></li>)}</ol></div>
          <div><p className="text-xs text-text-muted">Skill coverage</p><ul className="mt-2 grid gap-2 text-sm">{(challenge.skillCoverage ?? []).map((skill) => <li className="flex justify-between gap-3" key={skill.name}><span>{skill.name}</span><span className="font-mono text-[10px] uppercase text-signal">{skill.level}</span></li>)}</ul></div>
        </div>
        {error ? <p className="mt-5 border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger" role="alert">{error}</p> : null}
        {isSignedIn ? <>{latestAttempt?.id ? <Link className={`${challengeButton} mt-6 w-full border-signal bg-signal text-text-on-dark hover:brightness-110`} href={`/workspace/${latestAttempt.id}`}>Continue practice</Link> : <button className={`${challengeButton} mt-6 w-full border-signal bg-signal text-text-on-dark hover:brightness-110`} disabled={starting} onClick={() => void start()} type="button">{starting ? "Starting..." : "Start practice"}</button>}{latestAttempt?.id ? <button className={`${challengeButton} mt-3 w-full border-line text-foreground hover:bg-surface-alt`} disabled={starting} onClick={() => void start()} type="button">{starting ? "Starting..." : "Start new attempt"}</button> : null}<p className="mt-3 text-xs leading-5 text-text-muted">{latestAttempt?.id ? "Continue opens your latest private Workspace. Starting a new attempt creates another Workspace." : "Starting creates a new private Workspace."}</p></> : <Link className={`${challengeButton} mt-6 w-full border-signal bg-signal text-text-on-dark`} href={`/sign-in?returnTo=${encodeURIComponent(`/challenges/${slug}`)}`}>Sign in to start practice</Link>}
      </aside>
    </div>
  );
}
