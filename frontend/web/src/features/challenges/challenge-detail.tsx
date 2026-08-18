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
  const olderAttempts = attempts.slice(1);
  const skillNames = challenge.skillCoverage.map((skill) => skill.name);
  const scenarioCount = challenge.scenarioPreview.length;

  return (
    <div className="grid gap-12 pt-[2px] lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
      <article className="flex min-w-0 flex-col gap-5">
        <p className="font-mono text-[11px] leading-4 text-text-muted">CHALLENGES / {challenge.topic.toUpperCase()} / {String(challenge.version).padStart(2, "0")}</p>
        <h1 className="font-display text-[36px] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[42px]">{challenge.title}</h1>
        <p className="max-w-3xl text-[18px] leading-[1.45] text-foreground">{challenge.description}</p>
        <div className="h-px w-full bg-line" />

        <section className="grid gap-3">
          <h2 className="font-mono text-[11px] leading-4 text-text-muted">OBJECTIVE</h2>
          <p className="max-w-3xl whitespace-pre-line text-[15px] leading-[1.55] text-text-muted">{challenge.problemStatement}</p>
        </section>

        <section className="grid gap-3">
          <h2 className="font-mono text-[11px] leading-4 text-text-muted">INITIAL CONSTRAINTS</h2>
          <ul className="grid gap-1 text-[14px] leading-[1.45] text-foreground">
            {challenge.initialConstraints.map((constraint) => <li className="flex gap-3 px-0 py-2" key={constraint}><span aria-hidden="true" className="font-mono text-[11px] text-text-muted">—</span><span>{constraint}</span></li>)}
          </ul>
        </section>

        <section className="grid gap-3">
          <h2 className="font-mono text-[11px] leading-4 text-text-muted">REASONING AREAS</h2>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <p className="font-mono text-[10px] leading-4 text-text-muted">FOCUS AREAS</p>
              <div className="flex flex-wrap gap-2">{challenge.topicPacks.map((pack) => <span className="rounded-[3px] bg-signal-soft px-2.5 py-1.5 text-[12px] text-signal" key={pack}>{pack}</span>)}</div>
            </div>
            <div className="grid gap-2">
              <p className="font-mono text-[10px] leading-4 text-text-muted">SKILLS PRACTICED</p>
              <div className="flex flex-wrap gap-2">{skillNames.map((skill) => <span className="rounded-[3px] bg-signal-soft px-2.5 py-1.5 text-[12px] text-signal" key={skill}>{skill}</span>)}</div>
            </div>
          </div>
        </section>

      </article>

      <aside className="flex h-fit flex-col gap-[18px] lg:sticky lg:top-8">
        <section className="grid gap-3 border border-line bg-surface p-6">
          <p className="font-mono text-[11px] leading-4 text-text-muted">CHALLENGE {String(challenge.version).padStart(2, "0")}</p>
          <h2 className="font-display text-[22px] font-medium leading-tight">{formatDifficulty(challenge.difficulty)}</h2>
          <MetadataRow label="Estimated time" value={`${challenge.estimatedMinutes} minutes`} />
          <MetadataRow label="Skill focus" value={skillNames.join(", ") || challenge.topic} />
          <MetadataRow label="Scenario preview" value={`${scenarioCount} pressure point${scenarioCount === 1 ? "" : "s"}`} />
          <MetadataRow label="Attempt state" value={latestAttempt?.status ?? "Not started"} />
          <MetadataRow label="Challenge version" value={`Version ${challenge.version}`} />
          {error ? <p className="border border-danger/30 bg-danger/10 px-3 py-2 text-xs leading-5 text-danger" role="alert">{error}</p> : null}
          {isSignedIn ? <>{latestAttempt?.id ? <Link className={`${challengeButton} mt-2 w-full border-signal bg-signal text-text-on-dark hover:brightness-110`} href={`/workspace/${latestAttempt.id}`}>Continue practice</Link> : <button className={`${challengeButton} mt-2 w-full border-signal bg-signal text-text-on-dark hover:brightness-110`} disabled={starting} onClick={() => void start()} type="button">{starting ? "Starting..." : "Start practice"}</button>}{latestAttempt?.id ? <button className={`${challengeButton} mt-0 w-full border-line text-foreground hover:bg-surface-alt`} disabled={starting} onClick={() => void start()} type="button">{starting ? "Starting..." : "Start new attempt"}</button> : null}<p className="text-xs leading-5 text-text-muted">{latestAttempt?.id ? "Continue opens your latest private Workspace. Starting a new attempt creates another Workspace." : "Starting creates a new private Workspace."}</p></> : <><Link className={`${challengeButton} mt-2 w-full border-signal bg-signal text-text-on-dark`} href={`/sign-in?returnTo=${encodeURIComponent(`/challenges/${slug}`)}`}>Sign in to start practice</Link><p className="text-xs leading-5 text-text-muted">Sign in or create an account. Your selected Challenge will be preserved.</p></>}
        </section>

        <section className="grid gap-3 bg-chrome-800 p-6 text-text-on-dark">
          <p className="font-mono text-[11px] leading-4 text-text-on-dark-secondary">SCENARIO PREVIEW</p>
          <h2 className="font-display text-xl font-medium leading-tight">A changed condition arrives later.</h2>
          <p className="text-[13px] leading-[1.45] text-text-on-dark-secondary">A later scenario will change one condition in this system. This preview gives you a hint without revealing the response.</p>
        </section>

        <section className="grid gap-2 border border-line bg-surface p-[18px]">
          <h2 className="font-display text-lg font-medium">Existing attempts</h2>
          {olderAttempts.length ? <ul className="grid gap-2">{olderAttempts.map((attempt) => attempt.id ? <li className="flex items-center justify-between gap-4 border-t border-line pt-2 text-sm first:border-t-0 first:pt-0" key={attempt.id}><span><span className="block text-foreground">{attempt.name ?? "Challenge Workspace"}</span><span className="text-xs text-text-muted">{attempt.status ?? "ACTIVE"}</span></span><Link className="font-semibold text-signal hover:underline" href={`/workspace/${attempt.id}`}>Continue</Link></li> : null)}</ul> : <p className="text-[13px] leading-5 text-text-muted">{latestAttempt?.id ? "No other attempts yet." : "No private attempts yet."}</p>}
        </section>
      </aside>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-t border-line py-[9px] text-[13px] leading-5"><span className="text-text-muted">{label}</span><span className="max-w-[55%] text-right text-foreground">{value}</span></div>;
}

function formatDifficulty(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/^\w/, (character) => character.toUpperCase());
}
