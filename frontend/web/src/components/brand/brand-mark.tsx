type BrandMarkProps = {
  compact?: boolean;
  tone?: "paper" | "chrome";
};

export function BrandMark({ compact = false, tone = "paper" }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="System Design Copilot">
      <img
        alt=""
        aria-hidden="true"
        className="size-6 shrink-0"
        height="29"
        src="/brand/Structural%20Four-Stage%20Mark.png"
        width="29"
      />
      {!compact ? (
        <span className={`whitespace-nowrap font-display text-[20px] font-semibold leading-none tracking-[-0.04em] ${tone === "chrome" ? "text-text-on-dark" : "text-foreground"}`}>
          System Design Copilot
        </span>
      ) : null}
    </span>
  );
}
