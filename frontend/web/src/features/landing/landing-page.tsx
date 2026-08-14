"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/brand/brand-mark";

const stages = [
  { label: "Understand the Challenge", short: "Clarify", note: "Make requirements and assumptions explicit." },
  { label: "Make an architecture decision", short: "Design", note: "Record why the architecture fits." },
  { label: "Respond to a Scenario", short: "Stress-test", note: "Test one changed condition." },
  { label: "Inspect evidence-backed feedback", short: "Review", note: "Inspect evidence, risks, and the next revision." },
] as const;

const challenges = [
  ["01", "Reliable URL shortener", "Design low-latency redirects with durable links.", "Intermediate", "45–60 min", "Caching · data model"],
  ["02", "Multi-region notification service", "Balance delivery guarantees, fan-out, and regional failure.", "Advanced", "60–75 min", "Queues · resilience"],
  ["03", "Collaborative document editing", "Reason about concurrent writes and user-visible consistency.", "Advanced", "75–90 min", "Consistency · sync"],
] as const;

export function LandingPage() {
  const [activeStage, setActiveStage] = useState(1);

  return (
    <main className="overflow-x-hidden bg-background text-foreground">
      <PublicNavigation />
      <section className="min-h-[520px] bg-background px-5 py-12 sm:px-8 lg:px-16 lg:py-16">
        <div className="mx-auto grid max-w-[1312px] gap-12 lg:grid-cols-[minmax(0,760px)_420px] lg:gap-[72px]">
          <div className="flex flex-col justify-center">
            <p className="inline-flex w-fit items-center gap-2 text-[13px] font-medium text-text-muted"><span className="h-[3px] w-[18px] bg-signal" />Public personal beta</p>
            <h1 className="mt-7 max-w-[760px] whitespace-pre-line font-display text-[clamp(44px,5vw,64px)] font-medium leading-[1.02] tracking-[-0.045em]">{"Design systems.\nExplain your decisions.\nImprove with evidence."}</h1>
            <p className="mt-7 max-w-[650px] text-[18px] leading-7 text-text-muted">Practice architecture judgment through realistic challenges, changed conditions, and evidence-backed review. Your engineering artifact stays at the center.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link className="inline-flex min-h-12 items-center gap-2 bg-signal px-5 text-[16px] font-semibold text-white transition-colors hover:bg-[#0c655e]" href="/challenges">Explore Challenges <ArrowRight aria-hidden="true" size={18} /></Link>
              <a className="inline-flex min-h-12 items-center gap-2 px-3 text-[16px] font-semibold hover:text-signal" href="#practice-demo">See how practice works <ArrowDown aria-hidden="true" size={17} /></a>
            </div>
          </div>
          <aside className="border-l border-line pl-6 sm:pl-8 lg:pt-8">
            <p className="font-mono text-[13px] text-signal">01 — 04</p>
            <h2 className="mt-4 font-display text-[28px] font-medium leading-tight tracking-[-0.035em]">A repeatable engineering loop</h2>
            <ol className="mt-7 divide-y divide-line border-y border-line">
              {stages.map((stage, index) => <li className="grid grid-cols-[30px_1fr] gap-3 py-3.5" key={stage.short}><span className="font-mono text-[12px] text-text-muted">{String(index + 1).padStart(2, "0")}</span><span className="text-[14px] leading-5">{stage.note}</span></li>)}
            </ol>
          </aside>
        </div>
      </section>

      <section className="bg-chrome-850 px-5 py-12 text-text-on-dark sm:px-8 lg:h-[760px] lg:px-16 lg:py-12" id="practice-demo">
        <div className="mx-auto max-w-[1312px]">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div><p className="text-[12px] text-signal-soft">THE PRACTICE WORKSPACE</p><h2 className="mt-2 font-display text-[clamp(28px,3vw,34px)] font-medium tracking-[-0.04em]">One system, examined from four angles.</h2></div>
            <p className="text-[14px] text-text-on-dark-secondary">Select a state to inspect the loop</p>
          </div>
          <div aria-label="Practice stages" className="mt-7 grid border border-[#34403c] sm:grid-cols-4" role="tablist">
            {stages.map((stage, index) => <button aria-controls="practice-stage-panel" aria-selected={activeStage === index} className={`min-h-12 border-b border-[#34403c] px-4 text-left text-[13px] transition-colors last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 ${activeStage === index ? "bg-background text-foreground" : "text-text-on-dark-secondary hover:bg-[#202624]"}`} id={`practice-stage-tab-${index}`} key={stage.short} onClick={() => setActiveStage(index)} role="tab" tabIndex={activeStage === index ? 0 : -1} type="button"><span className={`mr-3 font-mono text-[11px] ${activeStage === index ? "text-signal" : ""}`}>{String(index + 1).padStart(2, "0")}</span>{stage.label}</button>)}
          </div>
          <WorkspacePreview activeStage={activeStage} />
        </div>
      </section>

      <section className="border-b border-line bg-background px-5 py-12 sm:px-8 lg:h-[250px] lg:px-16 lg:py-11">
        <div className="mx-auto grid max-w-[1312px] gap-8 lg:grid-cols-[340px_1fr] lg:gap-12">
          <div><p className="text-[11px] text-signal">WHAT CHANGES WITH PRACTICE</p><h2 className="mt-3 font-display text-[30px] font-medium tracking-[-0.04em]">Better judgment, made visible.</h2></div>
          <div className="grid gap-7 sm:grid-cols-3 sm:gap-8">
            <Outcome number="01" title="Clarify">Turn vague prompts into explicit requirements, assumptions, and estimates.</Outcome>
            <Outcome number="02" title="Decide">Record architecture choices with the evidence and trade-offs that shaped them.</Outcome>
            <Outcome number="03" title="Improve">Respond to changed conditions, inspect risks, and revise with purpose.</Outcome>
          </div>
        </div>
      </section>

      <section className="bg-surface px-5 py-12 sm:px-8 lg:h-[430px] lg:px-16 lg:py-[42px]">
        <div className="mx-auto max-w-[1312px]">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-[11px] text-signal">REAL CHALLENGES</p><h2 className="mt-2 font-display text-[32px] font-medium tracking-[-0.04em]">Choose a system worth reasoning about.</h2></div><Link className="text-[14px] font-semibold text-signal hover:underline" href="/challenges">Browse all Challenges →</Link></div>
          <div className="mt-5 border-y border-line">
            {challenges.map(([number, title, description, difficulty, time, focus]) => <Link className="group grid gap-3 border-b border-line py-4 last:border-b-0 lg:grid-cols-[34px_minmax(300px,470px)_150px_140px_220px_20px] lg:items-center lg:gap-4" href="/challenges" key={number}><span className="font-mono text-[11px] text-text-muted">{number}</span><span><strong className="block text-[17px] font-semibold group-hover:text-signal">{title}</strong><span className="mt-1 block text-[13px] text-text-muted">{description}</span></span><Meta label="Difficulty" value={difficulty} /><Meta label="Time" value={time} /><Meta label="Skill focus" value={focus} /><ChevronRight aria-hidden="true" className="hidden text-signal lg:block" size={17} /></Link>)}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-background px-5 py-10 sm:px-8 lg:h-[150px] lg:px-16 lg:py-0">
        <div className="mx-auto grid h-full max-w-[1312px] items-center gap-6 lg:grid-cols-[120px_360px_minmax(0,1fr)_150px] lg:gap-9"><p className="font-mono text-[12px] text-warning">BETA / 01</p><h2 className="font-display text-[25px] font-medium tracking-[-0.035em]">Free during the personal beta.</h2><p className="text-[14px] leading-5 text-text-muted">Practice features are available without a paid plan while the product is being validated. Availability and recovery are best-effort; your architecture exports remain yours.</p><Link className="flex flex-col items-end gap-1 text-right" href="/pricing"><span className="font-mono text-[9px] text-text-muted">COMMERCIAL LAUNCH</span><span className="inline-flex items-center gap-2 text-[13px] font-semibold text-signal hover:underline">View future plans <ArrowRight aria-hidden="true" size={15} /></span></Link></div>
      </section>

      <section className="bg-background px-5 py-16 sm:px-8 lg:h-[250px] lg:px-16">
        <div className="mx-auto flex h-full max-w-[1312px] flex-wrap items-center justify-between gap-8"><div><p className="text-[11px] text-signal">YOUR NEXT SYSTEM</p><h2 className="mt-3 max-w-[780px] font-display text-[clamp(32px,3vw,40px)] font-medium tracking-[-0.04em]">Start with the Challenge, not the sign-up form.</h2></div><Link className="inline-flex min-h-[50px] items-center gap-2 bg-signal px-5 text-[16px] font-semibold text-white hover:bg-[#0c655e]" href="/challenges">Explore Challenges <ArrowRight aria-hidden="true" size={18} /></Link></div>
      </section>
      <footer className="bg-chrome-850 px-5 py-8 text-text-on-dark sm:px-8 lg:h-[92px] lg:px-16 lg:py-0"><div className="mx-auto flex h-full max-w-[1312px] flex-wrap items-center justify-between gap-4"><span className="text-[16px] font-semibold">System Design Copilot</span><span className="text-[13px] text-text-on-dark-secondary">Practice architecture judgment. Keep ownership of the work.</span></div></footer>
    </main>
  );
}

function PublicNavigation() {
  return <header className="border-b border-line bg-background"><div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-16"><Link aria-label="System Design Copilot home" href="/"><BrandMark /></Link><nav aria-label="Public navigation" className="flex items-center gap-3 sm:gap-7"><a className="hidden text-[15px] font-medium text-text-muted hover:text-foreground sm:block" href="#practice-demo">How it works</a><Link className="hidden text-[15px] font-medium text-text-muted hover:text-foreground sm:block" href="/challenges">Challenges</Link><Link className="min-h-11 px-2 py-3 text-[15px] font-medium text-text-muted hover:text-foreground" href="/sign-in">Sign in</Link><Link className="hidden min-h-[42px] items-center bg-signal px-4 text-[15px] font-semibold text-white hover:bg-[#0c655e] md:inline-flex" href="/challenges">Explore Challenges</Link></nav></div></header>;
}

function WorkspacePreview({ activeStage }: { activeStage: number }) {
  const stage = stages[activeStage];
  return <div aria-labelledby={`practice-stage-tab-${activeStage}`} className="mt-6 grid min-h-[510px] overflow-hidden rounded border border-line bg-surface text-foreground lg:h-[510px] lg:grid-cols-[116px_290px_520px_minmax(0,1fr)]" id="practice-stage-panel" role="tabpanel" tabIndex={0}>
    <aside className="hidden border-r border-canvas-line bg-canvas px-3 py-[18px] lg:block"><p className="font-mono text-[10px] text-text-on-dark-secondary">WORKSPACE</p><div className="mt-5 flex flex-col gap-2.5">{stages.map((item, index) => <div className={`flex h-10 items-center gap-2 rounded px-2 text-[12px] ${activeStage === index ? "bg-[#22312e] font-semibold text-text-on-dark" : "text-text-on-dark-secondary"}`} key={item.short}><span className={`h-5 w-[3px] ${activeStage === index ? "bg-signal" : "bg-transparent"}`} />{item.short}</div>)}</div></aside>
    <section className="border-b border-line p-5 lg:border-r lg:border-b-0"><p className="font-mono text-[10px] text-signal">URL SHORTENER · INTERMEDIATE</p><h3 className="mt-4 text-[23px] font-medium leading-tight">Design a reliable URL shortener</h3><p className="mt-4 text-[14px] leading-5 text-text-muted">Handle 100M redirects per day while keeping reads fast and links durable.</p><div className="mt-4"><p className="text-[13px] font-semibold">Current evidence</p>{["p99 redirect < 120 ms", "Links retained for 5 years", "Read-heavy traffic, 100:1"].map((item) => <p className="flex min-h-8 items-center gap-2 border-b border-line text-[12px]" key={item}><Check aria-hidden="true" className="text-signal" size={14} />{item}</p>)}</div></section>
    <section className="min-h-[300px] border-b border-line bg-canvas p-5 text-text-on-dark lg:border-r lg:border-b-0"><div className="flex items-center justify-between text-[13px] font-semibold"><span>Architecture · Revision 3</span><span className="flex items-center gap-1 text-[11px] font-normal text-text-on-dark-secondary"><Check className="text-signal" size={14} />Saved</span></div><div className="mt-4 flex h-[290px] flex-col gap-[18px]"><CanvasNode name="Edge gateway" meta="TLS · rate limit" /><CanvasNode name="Redirect service" meta="stateless · regional" active /><CanvasNode name="Cache + durable store" meta="hot keys · replicated" /></div></section>
    <aside className="bg-surface p-5"><p className="font-mono text-[10px] text-signal">DECISION {String(activeStage + 1).padStart(2, "0")}</p><h3 className="mt-4 text-[21px] font-medium leading-tight">{activeStage === 1 ? "Keep redirect workers stateless" : stage.label}</h3><p className="mt-4 text-[14px] font-semibold">Explain this decision.</p><p className="mt-4 rounded border border-line bg-background p-3 text-[13px] leading-5">Traffic is read-heavy and regional. Stateless workers can scale independently while cache and storage own durability.</p><p className="mt-4 text-[12px] font-semibold text-text-muted">Linked evidence</p><p className="mt-2 font-mono text-[11px] text-signal">REQ-03 · ASM-02 · EST-01</p><div className="mt-4 border-t border-line py-3.5"><p className="text-[11px] text-text-muted">Suggested next action</p><p className="mt-1 text-[13px] font-semibold">Document the cache miss path.</p></div></aside>
  </div>;
}

function CanvasNode({ active = false, meta, name }: { active?: boolean; meta: string; name: string }) { return <div className={`flex h-[68px] shrink-0 items-center justify-between rounded border px-4 ${active ? "border-signal bg-[#183d38]" : "border-[#3c4542] bg-[#1b2220]"}`}><div><p className="text-[14px] font-semibold">{name}</p><p className="mt-1 font-mono text-[10px] text-text-on-dark-secondary">{meta}</p></div><ArrowRight className={active ? "text-signal" : "text-text-on-dark-secondary"} size={17} /></div>; }
function Outcome({ children, number, title }: { children: React.ReactNode; number: string; title: string }) { return <article><p className="font-mono text-[11px] text-text-muted">{number}</p><h3 className="mt-3 font-display text-[24px] font-medium tracking-[-0.03em]">{title}</h3><p className="mt-2 text-[14px] leading-5 text-text-muted">{children}</p></article>; }
function Meta({ label, value }: { label: string; value: string }) { return <span className="hidden lg:block"><span className="block text-[11px] text-text-muted">{label}</span><span className="mt-1 block text-[12px] font-medium">{value}</span></span>; }
