import { cn } from "@/lib/utils";

export const MAX_HP = 14;

/**
 * Shared memory-recall health bar. The same recall value drives every mode,
 * so the player reads one HP gauge across trivia, intermissions and the
 * Aerodynamics Extreme gauntlet.
 */
export function HealthBar({ hp, className }: { hp: number; className?: string }) {
  const clamped = Math.max(0, Math.min(MAX_HP, hp));
  const critical = clamped <= 2;
  const overcharged = clamped > 11;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">HP</span>
      <div
        className="hp-bar"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={MAX_HP}
        aria-valuenow={clamped}
        aria-label={`Memory recall health ${clamped} of ${MAX_HP}`}
      >
        {Array.from({ length: MAX_HP }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "hp-cell",
              i < clamped && (critical ? "hp-cell-critical" : i > 10 ? "hp-cell-over" : "hp-cell-on"),
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
        {clamped}/{MAX_HP}
      </span>
    </div>
  );
}
