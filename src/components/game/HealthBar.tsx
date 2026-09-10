import { cn } from "@/lib/utils";

export const MAX_HP = 14;

/** HP can overcharge past the base ceiling, so the meter grows with it. */
const cellsFor = (hp: number) => Math.max(MAX_HP, Math.ceil(hp / 3) * 3);

/**
 * Shared memory-recall health bar. The same recall value drives every mode,
 * so the player reads one HP gauge across trivia, intermissions and the
 * Aerodynamics Extreme gauntlet.
 */
export function HealthBar({ hp, className, glow }: { hp: number; className?: string | undefined; glow?: boolean | undefined }) {
  const clamped = Math.max(0, hp);
  const cells = cellsFor(clamped);
  const critical = clamped <= 2;
  const overcharged = glow && clamped > 11;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">HP</span>
      <div
        className="hp-bar"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={cells}
        aria-valuenow={clamped}
        aria-label={`Memory recall health ${clamped} of ${cells}`}
      >
        {Array.from({ length: cells }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "hp-cell",
              i < clamped && (critical ? "hp-cell-critical" : overcharged ? "hp-cell-over" : "hp-cell-on"),
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          "font-mono text-[10px] tracking-widest",
          critical ? "text-orange" : overcharged ? "text-magenta" : "text-mint",
        )}
      >
        {clamped}/{cells}
      </span>
    </div>
  );
}
