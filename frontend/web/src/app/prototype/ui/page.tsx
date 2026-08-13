"use client";

import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Database,
  Layers3,
  MessageSquareText,
  Moon,
  Network,
  PanelRight,
  Plus,
  RotateCcw,
  RotateCw,
  Search,
  Square,
  Sun,
  Triangle,
} from "lucide-react";
import { useState } from "react";

type Stage = "clarify" | "design" | "stress" | "feedback";
type Rail = "palette" | "inspector" | null;

const stages: Array<{ id: Stage; label: string; glyph: string }> = [
  { id: "clarify", label: "Clarify", glyph: "01" },
  { id: "design", label: "Design", glyph: "02" },
  { id: "stress", label: "Stress-test", glyph: "03" },
  { id: "feedback", label: "Feedback", glyph: "04" },
];

const navItems = ["Practice", "Challenges", "Progress"];

export default function UiPrototypePage() {
  const [stage, setStage] = useState<Stage>("design");
  const [rail, setRail] = useState<Rail>(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [dark, setDark] = useState(false);

  const activeStage = stages.find((item) => item.id === stage) ?? stages[0];

  return (
    <main
      className={dark ? "prototype-shell prototype-dark" : "prototype-shell"}
      style={{
        fontFamily: "var(--font-body-family), Arial, sans-serif",
        ["--prototype-display" as string]: "var(--font-display-family), Georgia, serif",
      }}
    >
      <div className="prototype-warning">
        <span>PROTOTYPE - NOT PRODUCTION</span>
        <span>Core workshop shell review</span>
      </div>

      <nav aria-label="Prototype global navigation" className="prototype-global-nav">
        <span className="prototype-wordmark">SDC</span>
        <div className="prototype-nav-links">
          {navItems.map((item, index) => (
            <button className={index === 0 ? "is-active" : ""} key={item} type="button">
              {item}
            </button>
          ))}
        </div>
        <div className="prototype-nav-end">
          <button aria-label="Toggle theme" onClick={() => setDark((current) => !current)} type="button">
            {dark ? <Sun aria-hidden="true" size={14} /> : <Moon aria-hidden="true" size={14} />}
          </button>
          <button type="button">Account</button>
        </div>
      </nav>

      <div className="prototype-workspace">
        <aside aria-label="Workspace stages" className="prototype-stage-rail">
          <button aria-label="Open global navigation" className="prototype-menu-trigger" type="button">
            <span />
            <span />
            <span />
          </button>
          <div className="prototype-stage-list">
            {stages.map((item) => (
              <button
                aria-current={item.id === stage ? "step" : undefined}
                className={item.id === stage ? "prototype-stage is-active" : "prototype-stage"}
                key={item.id}
                onClick={() => {
                  setStage(item.id);
                  setRail(null);
                }}
                type="button"
              >
                <StageIcon stage={item.id} />
                <span className="prototype-stage-number">{item.glyph}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="prototype-content">
          <header className="prototype-toolbar">
            <div className="prototype-workspace-name">
              <span className="prototype-meta">WORKSPACE</span>
              <strong>URL Shortener</strong>
            </div>
            <div className="prototype-toolbar-tools">
              <button aria-label="Undo" type="button">
                <RotateCcw aria-hidden="true" size={14} />
              </button>
              <button aria-label="Redo" type="button">
                <RotateCw aria-hidden="true" size={14} />
              </button>
              {stage === "design" ? <span className="prototype-zoom">100%</span> : null}
              <button className="prototype-review-button" type="button">
                Review design
              </button>
            </div>
          </header>

          <div className="prototype-stage-body">
            <div className={stage === "design" ? "prototype-document is-canvas-document" : "prototype-document"}>
              <div className="prototype-document-header">
                <div>
                  <span className="prototype-meta">STAGE {activeStage.glyph} / {activeStage.label.toUpperCase()}</span>
                  <h1>{stageTitle(stage)}</h1>
                </div>
                <button
                  aria-label={rail ? "Close contextual rail" : "Open contextual rail"}
                  className="prototype-rail-trigger"
                  onClick={() => setRail((current) => (current ? null : stage === "design" ? "inspector" : "palette"))}
                  type="button"
                >
                  <PanelRight aria-hidden="true" size={16} />
                </button>
              </div>

              {stage === "clarify" ? <ClarifyDocument /> : null}
              {stage === "design" ? <DesignDocument onSelect={() => setRail("inspector")} /> : null}
              {stage === "stress" ? <StressDocument /> : null}
              {stage === "feedback" ? <FeedbackDocument /> : null}
            </div>

            <div className="prototype-context-column">
              {rail ? <ContextRail mode={rail} onClose={() => setRail(null)} onModeChange={setRail} /> : null}
              {!rail ? (
                <div className={copilotOpen ? "prototype-copilot is-open" : "prototype-copilot"}>
                  <button className="prototype-copilot-summary" onClick={() => setCopilotOpen((current) => !current)} type="button">
                    <MessageSquareText aria-hidden="true" size={15} />
                    <span>Copilot</span>
                    <span className="prototype-copilot-question">{copilotQuestion(stage)}</span>
                    <span className="prototype-copilot-state">Saved</span>
                    <ChevronRight aria-hidden="true" className={copilotOpen ? "rotate-90" : ""} size={15} />
                  </button>
                  {copilotOpen ? (
                    <div className="prototype-copilot-panel">
                      <span className="prototype-meta">REASONING COMPANION</span>
                      <p>{copilotQuestion(stage)}</p>
                      <div className="prototype-copilot-actions">
                        <button type="button">Consider this</button>
                        <button type="button">Dismiss</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <nav aria-label="Mobile workspace stages" className="prototype-mobile-stage-nav">
            {stages.map((item) => (
              <button className={item.id === stage ? "is-active" : ""} key={item.id} onClick={() => setStage(item.id)} type="button">
                <span>{item.glyph}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </section>
      </div>
    </main>
  );
}

function ClarifyDocument() {
  return (
    <div className="prototype-flow">
      <section className="prototype-brief">
        <span className="prototype-meta">PROBLEM BRIEF</span>
        <p className="prototype-brief-title">Design a service that shortens URLs and redirects users to the original destination.</p>
        <p className="prototype-muted">High read throughput, click analytics, custom short codes. Consider availability, throughput, and the read/write ratio.</p>
      </section>

      <RuleLabel label="Requirements" />
      <Requirement label="Generate unique short codes for submitted URLs" kind="FR" priority="Must" active />
      <Requirement label="Redirect short-code requests to the original URL" kind="FR" priority="Must" />
      <Requirement label="Handle 10k redirects/sec at peak" kind="NFR" priority="Should" />
      <button className="prototype-text-action" type="button">+ Add requirement</button>

      <RuleLabel label="Assumptions and estimates" />
      <div className="prototype-inline-grid">
        <div>
          <span className="prototype-meta">TRAFFIC</span>
          <p>100M new URLs / month</p>
        </div>
        <div>
          <span className="prototype-meta">READ : WRITE</span>
          <p>100 : 1 redirect ratio</p>
        </div>
      </div>

      <RuleLabel label="Unresolved question" />
      <button className="prototype-question" type="button">
        <CircleHelp aria-hidden="true" size={15} />
        Do short codes need to be guess-proof, or is random sufficient?
      </button>
    </div>
  );
}

function DesignDocument({ onSelect }: { onSelect: () => void }) {
  return (
    <div className="prototype-canvas-wrap">
      <div className="prototype-canvas-toolbar">
        <span className="prototype-meta">SCHEMATIC / 4 COMPONENTS / 3 CONNECTIONS</span>
        <button type="button">Fit view</button>
      </div>
      <div className="prototype-canvas" onClick={onSelect} role="img" aria-label="Architecture schematic with Service, Cache, Database, and Client components">
        <div className="prototype-boundary">
          <span>us-east-1 / primary region</span>
        </div>
        <div className="prototype-edge edge-one" />
        <div className="prototype-edge edge-two" />
        <div className="prototype-edge edge-three" />
        <CanvasNode className="node-client" icon={<Network aria-hidden="true" size={22} />} type="Client" label="Browser / App" />
        <CanvasNode className="node-service is-selected" icon={<Layers3 aria-hidden="true" size={22} />} type="Service" label="Shortener API" />
        <CanvasNode className="node-cache" icon={<Square aria-hidden="true" size={22} />} type="Cache" label="Redirect Cache" />
        <CanvasNode className="node-db" icon={<Database aria-hidden="true" size={22} />} type="Relational DB" label="URL Store" />
        <span className="prototype-canvas-hint">Select a Component to inspect it</span>
      </div>
      <div className="prototype-canvas-footer">
        <span>Selection: Shortener API</span>
        <span className="prototype-signal-text">Blue marks the current interaction only</span>
      </div>
    </div>
  );
}

function CanvasNode({ className, icon, label, type }: { className: string; icon: React.ReactNode; label: string; type: string }) {
  return (
    <button className={`prototype-node ${className}`} type="button">
      <span className="prototype-node-symbol">{icon}</span>
      <span className="prototype-node-type">{type}</span>
      <strong>{label}</strong>
    </button>
  );
}

function StageIcon({ stage }: { stage: Stage }) {
  if (stage === "clarify") return <CircleHelp aria-hidden="true" size={18} />;
  if (stage === "design") return <Square aria-hidden="true" size={18} />;
  if (stage === "stress") return <Triangle aria-hidden="true" size={18} />;
  return <Check aria-hidden="true" size={18} />;
}

function StressDocument() {
  return (
    <div className="prototype-flow">
      <section className="prototype-scenario">
        <span className="prototype-meta prototype-signal-text">SCENARIO 01 / GROWTH</span>
        <h2>A viral marketing campaign drives 50x normal traffic.</h2>
        <p className="prototype-muted">500k redirects/sec for popular short codes. Users expect less than 50ms latency. The primary database shows CPU saturation above 80%.</p>
      </section>
      <RuleLabel label="Your response" />
      <p className="prototype-prompt">How do you adapt the Architecture Document?</p>
      <div className="prototype-response">Use the redirect cache as a read-through layer. Increase capacity and TTL for popular codes. Add a circuit breaker on the database and scale the Shortener API horizontally.</div>
      <RuleLabel label="Related Decision" />
      <p>Use Redis as a read-through cache with 24h TTL. Fall back to PostgreSQL for cold data.</p>
      <button className="prototype-text-action" type="button">Save response and continue <ArrowRight aria-hidden="true" size={14} /></button>
    </div>
  );
}

function FeedbackDocument() {
  return (
    <div className="prototype-flow">
      <section className="prototype-interpretation">
        <span className="prototype-meta prototype-evidence-text">REVIEW COMPLETED / REVISION 02</span>
        <p>Your design captures the core redirect path and makes a clear read/write split. Cache invalidation and single-region deployment remain risks worth addressing.</p>
      </section>
      <RuleLabel label="Strengths" tone="evidence" />
      <Finding title="Clear read / write separation" description="The Shortener API handles writes; redirect traffic flows through the cache." />
      <Finding title="Explicit caching decision" description="24h TTL with Redis is recorded with a clear rationale." />
      <RuleLabel label="Risks" tone="signal" />
      <Finding title="No cache invalidation strategy" description="Edited URLs could serve stale redirects for the full TTL period." />
      <Finding title="Single region deployment" description="A regional outage would take down the entire service." />
      <RuleLabel label="Next action" />
      <button className="prototype-next-action" type="button">
        <span>01</span>
        Define a cache invalidation strategy for edited or deleted URLs
        <ArrowRight aria-hidden="true" size={14} />
      </button>
    </div>
  );
}

function Finding({ description, title }: { description: string; title: string }) {
  return (
    <div className="prototype-finding">
      <Check aria-hidden="true" size={14} />
      <div>
        <strong>{title}</strong>
        <p className="prototype-muted">{description}</p>
      </div>
    </div>
  );
}

function Requirement({ active = false, kind, label, priority }: { active?: boolean; kind: string; label: string; priority: string }) {
  return (
    <div className={active ? "prototype-requirement is-active" : "prototype-requirement"}>
      <span className={kind === "FR" ? "prototype-signal-text prototype-mono" : "prototype-mono"}>[{kind}]</span>
      <span>{label}</span>
      <span className="prototype-priority">{priority}</span>
    </div>
  );
}

function RuleLabel({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "evidence" | "signal" }) {
  return (
    <div className="prototype-rule-label">
      <span className={`prototype-meta prototype-${tone}-text`}>{label.toUpperCase()}</span>
    </div>
  );
}

function ContextRail({ mode, onClose, onModeChange }: { mode: Exclude<Rail, null>; onClose: () => void; onModeChange: (mode: Rail) => void }) {
  const isPalette = mode === "palette";
  return (
    <aside aria-label="Contextual tools" className="prototype-context-rail">
      <header>
        <span className="prototype-meta">{isPalette ? "COMPONENT PALETTE" : "INSPECTOR"}</span>
        <button aria-label="Close contextual tools" onClick={onClose} type="button">×</button>
      </header>
      <div className="prototype-rail-switcher">
        <button className={isPalette ? "is-active" : ""} onClick={() => onModeChange("palette")} type="button">Palette</button>
        <button className={!isPalette ? "is-active" : ""} onClick={() => onModeChange("inspector")} type="button">Inspector</button>
      </div>
      {isPalette ? (
        <>
          <div className="prototype-search"><Search aria-hidden="true" size={14} /> Search components</div>
          {[
            ["Client", Network],
            ["Service", Layers3],
            ["Cache", Square],
            ["Relational DB", Database],
          ].map(([label, Icon]) => {
            const ComponentIcon = Icon as typeof Network;
            return <button className="prototype-palette-row" key={label as string} type="button"><ComponentIcon aria-hidden="true" size={14} />{label as string}<Plus aria-hidden="true" size={13} /></button>;
          })}
        </>
      ) : (
        <div className="prototype-inspector-content">
          <span className="prototype-meta">SELECTED COMPONENT</span>
          <h2>Shortener API</h2>
          <span className="prototype-node-type"><Layers3 aria-hidden="true" size={14} /> Service</span>
          <RuleLabel label="Label" />
          <p>Shortener API</p>
          <RuleLabel label="Description" />
          <p className="prototype-muted">Handles URL creation and redirect resolution.</p>
          <RuleLabel label="Decision evidence" tone="evidence" />
          <p className="prototype-evidence-text">Read/write split · Decision 03</p>
        </div>
      )}
    </aside>
  );
}

function stageTitle(stage: Stage) {
  switch (stage) {
    case "clarify":
      return "What are you building, and why?";
    case "design":
      return "Make the system visible.";
    case "stress":
      return "Can your design survive this?";
    case "feedback":
      return "See the evidence behind the Review.";
  }
}

function copilotQuestion(stage: Stage) {
  switch (stage) {
    case "clarify":
      return "What read-to-write ratio are you planning for? That choice will influence caching and persistence.";
    case "design":
      return "Have you considered a circuit breaker between the API and database?";
    case "stress":
      return "If the cache also fails, what is your fallback strategy for the top 1% of redirects?";
    case "feedback":
      return "Would you like help drafting a cache invalidation Decision?";
  }
}
