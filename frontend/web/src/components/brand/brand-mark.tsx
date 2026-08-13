type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
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
        <span className="whitespace-nowrap font-display text-[20px] font-semibold leading-none tracking-[-0.04em]">System Design Copilot</span>
      ) : null}
    </span>
  );
}
