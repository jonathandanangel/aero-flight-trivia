import * as React from "react";
import { audio } from "@/game/audio";
import { cn } from "@/lib/utils";

const PADS = 11;

/**
 * Electric Recall: repeat the flashed sequence of energy squares.
 * Length is driven by the campaign recovery length (11 -> 8 -> 5 -> 2).
 */
export function ElectricRecall({
  length,
  reducedMotion,
  onResult,
}: {
  length: number;
  reducedMotion: boolean;
  onResult: (won: boolean) => void;
}) {
  const sequence = React.useMemo(
    () => Array.from({ length }, () => Math.floor(Math.random() * PADS)),
    [length],
  );
  const [phase, setPhase] = React.useState<"watch" | "input" | "done">("watch");
  const [flash, setFlash] = React.useState<number | null>(null);
  const [step, setStep] = React.useState(0);
  const [won, setWon] = React.useState(false);

  React.useEffect(() => {
    let i = 0;
    const gap = reducedMotion ? 420 : 620;
    const timers: number[] = [];
    const run = () => {
      if (i >= sequence.length) {
        timers.push(window.setTimeout(() => setPhase("input"), gap));
        return;
      }
      const pad = sequence[i]!;
      setFlash(pad);
      audio.play("recall-note", pad);
      timers.push(
        window.setTimeout(() => {
          setFlash(null);
          i += 1;
          timers.push(window.setTimeout(run, gap * 0.35));
        }, gap * 0.6),
      );
    };
    timers.push(window.setTimeout(run, 700));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [sequence, reducedMotion]);

  const press = (pad: number) => {
    if (phase !== "input") return;
    audio.play("recall-note", pad);
    setFlash(pad);
    window.setTimeout(() => setFlash(null), 160);
    if (sequence[step] === pad) {
      const next = step + 1;
      setStep(next);
      if (next >= sequence.length) {
        setPhase("done");
        setWon(true);
        audio.play("recall-win");
        window.setTimeout(() => onResult(true), 1400);
      }
    } else {
      setPhase("done");
      setWon(false);
      audio.play("recall-fail");
      window.setTimeout(() => onResult(false), 1400);
    }
  };

  return (
    <div className="panel mx-auto w-full max-w-2xl p-5 text-center">
      <h2 className="font-display text-xl text-cyan text-glow">ELECTRIC RECALL</h2>
      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Sequence length {length} ·{" "}
        {phase === "watch" ? "Watch the grid" : phase === "input" ? `Repeat it (${step}/${length})` : won ? "Complete" : "Failed"}
      </p>
      <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6">
        {Array.from({ length: PADS }).map((_, i) => (
          <button
            key={i}
            type="button"
            disabled={phase !== "input"}
            onClick={() => press(i)}
            aria-label={`Energy square ${i + 1}`}
            className={cn(
              "aspect-square rounded-md border transition-colors",
              flash === i
                ? "border-mint bg-mint/70 glow-mint"
                : "border-cyan/40 bg-deepblue/70 hover:bg-cyan/20",
            )}
          >
            <span className="font-mono text-xs text-cyan/70">{i + 1}</span>
          </button>
        ))}
      </div>
      {phase === "done" && (
        <p className={cn("mt-5 font-display text-2xl", won ? "text-mint" : "text-orange")}>
          {won ? "AMAZING!" : "RECALL LOST"}
        </p>
      )}
    </div>
  );
}
