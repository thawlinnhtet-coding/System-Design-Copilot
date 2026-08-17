type BrandMarkProps = {
  compact?: boolean;
  tone?: "paper" | "chrome";
};

export function BrandMark({ compact = false, tone = "paper" }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-3" aria-label="System Design Copilot">
      <img
        alt=""
        aria-hidden="true"
        className="size-[34px] shrink-0"
        height="34"
        src="/brand/Structural%20Four-Stage%20Mark.png"
        width="34"
      />
      {!compact ? (
        <span className="flex flex-col gap-px whitespace-nowrap">
          <span className={`font-display text-[17px] font-semibold leading-normal ${tone === "chrome" ? "text-text-on-dark" : "text-foreground"}`}>
            System Design
          </span>
          <span className={`font-mono text-[9px] font-semibold leading-normal tracking-[1.6px] ${tone === "chrome" ? "text-text-on-dark-secondary" : "text-text-muted"}`}>
            COPILOT
          </span>
        </span>
      ) : null}
    </span>
  );
}
