"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuthenticatedApiClient } from "@/lib/api/authenticated-client";
import { getChallenges, type ChallengeSummary } from "@/lib/api/public-client";

const workspaceQueryKey = ["workspaces"] as const;

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
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const [search, setSearch] = useState("");
  const catalog = useQuery({ queryKey: ["challenges"], queryFn: getChallenges });
  const workspaces = useQuery({ queryKey: workspaceQueryKey, queryFn: api.getWorkspaces, enabled: isLoaded && isSignedIn });

  const options = useMemo(() => {
    const challenges = catalog.data ?? [];
    return {
      topics: [...new Set(challenges.map((challenge) => challenge.topic))].sort(),
      skills: [...new Set(challenges.map((challenge) => challenge.skillFocus))].sort(),
    };
  }, [catalog.data]);

  const visibleChallenges = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (catalog.data ?? []).filter((challenge) => {
      const timeMatches = filters.time === "all"
        || (filters.time === "short" && challenge.estimatedMinutes <= 30)
        || (filters.time === "standard" && challenge.estimatedMinutes > 30 && challenge.estimatedMinutes <= 60)
        || (filters.time === "extended" && challenge.estimatedMinutes > 60);
      const searchMatches = !normalizedSearch
        || [challenge.title, challenge.description, challenge.topic, challenge.skillFocus]
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      return (filters.topic === "all" || challenge.topic === filters.topic)
        && (filters.difficulty === "all" || challenge.difficulty === filters.difficulty)
        && (filters.skill === "all" || challenge.skillFocus === filters.skill)
        && timeMatches
        && searchMatches;
    });
  }, [catalog.data, filters, search]);

  const totalChallenges = catalog.data?.length ?? 0;
  const hasActiveFilters = search.trim().length > 0 || Object.values(filters).some((value) => value !== "all");

  function updateFilter(key: keyof CatalogFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearch("");
  };

  return (
    <div aria-label="Curated Challenges" className="flex w-full flex-col gap-6">
      <div className="flex h-fit items-end justify-between">
        <div className="flex w-full max-w-[700px] flex-col gap-[9px]">
          <p className="font-mono text-[12px] font-normal leading-4 text-text-muted">CHALLENGES / CURATED PRACTICE</p>
          <h1 className="w-full max-w-[700px] font-display text-[38px] font-medium leading-[41px] tracking-normal text-foreground">Choose a problem worth reasoning through.</h1>
          <p className="w-full max-w-[620px] text-[15px] font-normal leading-[22px] text-text-muted">Browse safe Challenge context before starting a private Workspace.</p>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <span className="font-display text-[28px] font-medium leading-9 text-signal">{catalog.data?.length ?? 0}</span>
          <span className="font-mono text-[12px] font-normal leading-4 text-text-muted">AVAILABLE CHALLENGES</span>
        </div>
      </div>

      <div aria-label="Challenge filters" className="flex min-h-[49px] flex-wrap items-center gap-[10px] border-y border-line py-[7px] lg:flex-nowrap lg:py-0">
        <FilterSelect ariaLabel="Filter by topic" active={filters.topic === "all"} label="Topic" onChange={(value) => updateFilter("topic", value)} value={filters.topic} width="w-[100px]">
          <option value="all">Topic: All</option>
          {options.topics.map((topic) => <option key={topic} value={topic}>{`Topic: ${topic}`}</option>)}
        </FilterSelect>
        <FilterSelect ariaLabel="Filter by difficulty" active={filters.difficulty !== "all"} label="Difficulty" onChange={(value) => updateFilter("difficulty", value)} value={filters.difficulty} width="w-[120px]">
          <option value="all">Difficulty: All</option>
          <option value="FOUNDATION">Difficulty: Foundation</option>
          <option value="INTERMEDIATE">Difficulty: Intermediate</option>
          <option value="ADVANCED">Difficulty: Advanced</option>
        </FilterSelect>
        <FilterSelect ariaLabel="Filter by practice time" active={filters.time !== "all"} label="Time" onChange={(value) => updateFilter("time", value)} value={filters.time} width="w-[116px]">
          <option value="all">Time: Any</option>
          <option value="short">{"Time: 20\u201330 min"}</option>
          <option value="standard">{"Time: 45\u201360 min"}</option>
          <option value="extended">{"Time: 75\u2013120 min"}</option>
        </FilterSelect>
        <FilterSelect ariaLabel="Filter by skill focus" active={filters.skill !== "all"} label="Skill focus" onChange={(value) => updateFilter("skill", value)} value={filters.skill} width="w-[140px]">
          <option value="all">Skill focus: All</option>
          {options.skills.map((skill) => <option key={skill} value={skill}>{`Skill focus: ${skill}`}</option>)}
        </FilterSelect>
        <label className="relative flex h-[34px] w-full shrink-0 items-center gap-2 rounded-[5px] border border-line bg-surface px-[11px] sm:w-[300px]">
          <Search aria-hidden="true" className="shrink-0 text-text-muted" size={15} strokeWidth={1.6} />
          <span className="sr-only">Search challenges</span>
          <input aria-label="Search challenges" className="min-w-0 flex-1 bg-transparent text-[13px] leading-[17px] text-foreground outline-none placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" onChange={(event) => setSearch(event.target.value)} placeholder={"Search by system, pattern, or skill\u2026"} value={search} />
        </label>
        {hasActiveFilters ? <button className="shrink-0 border-0 bg-transparent p-0 text-left text-[13px] font-medium leading-[17px] text-signal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" onClick={resetFilters} type="button">Clear filters</button> : null}
      </div>

      <p aria-live="polite" className={hasActiveFilters ? "text-[13px] leading-[17px] text-text-muted" : "sr-only"}>{`Showing ${visibleChallenges.length} of ${totalChallenges} challenges`}</p>
      {catalog.isPending ? <ChallengeCatalogSkeleton /> : null}
      {catalog.isError ? <p className="border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">The Challenge catalog is temporarily unavailable.</p> : null}
      {!catalog.isPending && !catalog.isError ? (
        <div className="flex w-full flex-col">
          {visibleChallenges.map((challenge, index) => <ChallengeRow challenge={challenge} index={index} attempts={(workspaces.data ?? []).filter((workspace) => workspace.challengeVersionId === challenge.versionId)} key={challenge.slug} />)}
          {!visibleChallenges.length ? (
            <div className="flex flex-col items-start gap-3 border-b border-line py-8">
              <p className="text-[15px] leading-[22px] text-text-muted">No Challenges match these filters.</p>
              <button aria-label="Reset challenge filters" className="border-0 bg-transparent p-0 text-[13px] font-medium leading-[17px] text-signal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" onClick={resetFilters} type="button">Clear filters</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({ active, ariaLabel, children, label, onChange, value, width }: { active: boolean; ariaLabel: string; children: React.ReactNode; label: string; onChange: (value: string) => void; value: string; width: string }) {
  return (
    <label className={`relative flex h-[34px] shrink-0 rounded-[3px] ${width}`}>
      <span className="sr-only">{label}</span>
      <select aria-label={ariaLabel} className={`h-[34px] w-full appearance-none rounded-[3px] border bg-transparent py-2 pl-3 pr-8 text-[13px] font-normal leading-[17px] text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${active ? "border-signal bg-surface-alt" : "border-line"}`} onChange={(event) => onChange(event.target.value)} value={value}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-foreground" size={14} strokeWidth={2} />
    </label>
  );
}

function ChallengeCatalogSkeleton() {
  return (
    <div aria-label="Loading challenges" className="flex w-full flex-col" role="status">
      <span className="sr-only">Loading Challenges...</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div className="flex min-h-[87.5px] w-full items-center gap-5 border-b border-line py-[14px]" key={index}>
          <span className="h-[14px] w-[46px] shrink-0 animate-pulse rounded-sm bg-line/70" />
          <span className="flex min-w-0 flex-1 flex-col gap-[7px]">
            <span className="h-[17px] w-3/5 animate-pulse rounded-sm bg-line/70" />
            <span className="h-[13px] w-4/5 animate-pulse rounded-sm bg-line/50" />
          </span>
          <span className="hidden h-[14px] w-[210px] shrink-0 animate-pulse rounded-sm bg-line/50 md:block" />
          <span className="hidden h-[14px] w-[50px] shrink-0 animate-pulse rounded-sm bg-line/50 sm:block" />
          <span className="h-[18px] w-[14px] shrink-0 animate-pulse rounded-sm bg-line/50" />
        </div>
      ))}
    </div>
  );
}

function ChallengeRow({ challenge, index, attempts }: { challenge: ChallengeSummary; index: number; attempts: Array<{ id?: string; challengeVersionId?: string }> }) {
  const latest = attempts[0];
  const status = latest ? `IN PROGRESS \u00b7 ${challenge.difficulty}` : index === 0 ? `RECOMMENDED \u00b7 ${challenge.difficulty}` : challenge.difficulty;
  const statusColor = latest ? "text-warning" : "text-signal";

  return (
    <article className="relative flex min-h-[87.5px] w-full items-center gap-5 border-b border-line py-[14px]">
      <div className="w-[46px] shrink-0 font-mono text-[12px] font-normal leading-4 text-text-muted">{String(index + 1).padStart(2, "0")}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <h2 className="break-words font-display text-[17px] font-normal leading-[22px] text-foreground sm:overflow-hidden sm:text-ellipsis sm:whitespace-nowrap">
          <Link className="rounded-[2px] hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href={`/challenges/${challenge.slug}`}>{challenge.title}</Link>
        </h2>
        <p className="break-words text-[14px] font-normal leading-[19px] text-text-muted sm:overflow-hidden sm:text-ellipsis sm:whitespace-nowrap">{challenge.description}</p>
      </div>
      <div className="hidden w-[210px] shrink-0 flex-col gap-[5px] md:flex">
        <div className={`whitespace-nowrap font-mono text-[12px] font-normal leading-4 ${statusColor}`}>{status}</div>
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-normal leading-[17px] text-text-muted">{challenge.skillFocus}</div>
      </div>
      <div className="hidden w-[86px] shrink-0 justify-end font-mono text-[12px] font-normal leading-4 text-text-muted sm:flex">{challenge.estimatedMinutes} min</div>
      <Link aria-label={`Open ${challenge.title}`} className="shrink-0 rounded-[2px] font-sans text-[18px] font-normal leading-[23px] text-signal transition-transform hover:translate-x-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href={`/challenges/${challenge.slug}`}>{"\u2192"}</Link>
    </article>
  );
}
