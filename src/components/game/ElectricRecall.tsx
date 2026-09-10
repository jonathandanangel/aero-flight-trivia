import * as React from "react";
import { audio } from "@/game/audio";
import { cn } from "@/lib/utils";

const PADS = 11;

type PadPosition = { left: number; top: number };

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function makeEvolvedPositions(seed: number): PadPosition[] {
  const random = seededRandom(seed);
  const slots = Array.from({ length: 15 }, (_, index) => ({
    column: index % 5,
    row: Math.floor(index / 5),
  }));

  for (let i = slots.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(random() * (i + 1));
    const current = slots[i];
    const replacement = slots[swapIndex];
    if (!current || !replacement) continue;
    slots[i] = replacement;
    slots[swapIndex] = current;
  }

  return slots.slice(0, PADS).map(({ column, row }) => ({
    left: 10 + column * 20 + (random() - 0.5) * 7,
    top: 17 + row * 33 + (random() - 0.5) * 8,
  }));
}

/**
 * Electric Recall: repeat the flashed sequence of energy squares.
 * Length is driven by the campaign recovery length (11 -> 8 -> 5 -> 2).
 */
export function ElectricRecall({
  length,
  questionNumber,
  reducedMotion,
  onEvolved,
  onResult,
}: {
  length: number;
  questionNumber: number;
  reducedMotion: boolean;
  onEvolved: () => void;
  onResult: (won: boolean) => void;
}) {
  const evolved = questionNumber >= 150;
  const sequence = React.useMemo(
    () => Array.from({ length }, () => Math.floor(Math.random() * PADS)),
    [length],
  );
  const positions = React.useMemo(
    () => makeEvolvedPositions(questionNumber * 97 + length * 31),
    [questionNumber, length],
  );
  const [phase, setPhase] = React.useState<"splash" | "watch" | "input" | "done">(
    evolved ? "splash" : "watch",
  );
  const [flash, setFlash] = React.useState<number | null>(null);
  const [step, setStep] = React.useState(0);
  const [won, setWon] = React.useState(false);

  React.useEffect(() => {
    if (phase !== "splash") return;
    audio.play("recall-evolved");
    const timer = window.setTimeout(() => {
      onEvolved();
      setPhase("watch");
    }, reducedMotion ? 650 : 1250);
    return () => window.clearTimeout(timer);
  }, [phase, reducedMotion, onEvolved]);

  React.useEffect(() => {
    if (phase !== "watch") return;
    let i = 0;
    const gap = evolved ? (reducedMotion ? 285 : 360) : reducedMotion ? 420 : 620;
    const timers: number[] = [];
    const run = () => {
      if (i >= sequence.length) {
        timers.push(window.setTimeout(() => setPhase("input"), gap));
        return;
      }
      const pad = sequence[i]!;
      setFlash(pad);
      audio.play(evolved ? "recall-note-fast" : "recall-note", pad);
      timers.push(
        window.setTimeout(() => {
          setFlash(null);
          i += 1;
          timers.push(window.setTimeout(run, gap * 0.35));
        }, gap * 0.6),
      );
    };
    timers.push(window.setTimeout(run, evolved ? 350 : 700));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [sequence, reducedMotion, evolved, phase]);

  const press = (pad: number) => {
    if (phase !== "input") return;
    audio.play(evolved ? "recall-note-fast" : "recall-note", pad);
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
    <div className="panel relative mx-auto w-full max-w-2xl overflow-hidden p-5 text-center">
      <h2 className="font-display text-xl text-cyan text-glow">ELECTRIC RECALL</h2>
      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Sequence length {length} ·{" "}
        {phase === "splash" ? "Memory system upgrading" : phase === "watch" ? "Watch the field" : phase === "input" ? `Repeat it (${step}/${length})` : won ? "Complete" : "Failed"}
      </p>
      <div
        className={cn(
          "mt-5",
          evolved ? "recall-evolved-field" : "grid grid-cols-4 gap-3 sm:grid-cols-6",
        )}
      >
        {Array.from({ length: PADS }).map((_, i) => (
          <button
            key={i}
            type="button"
            disabled={phase !== "input"}
            onClick={() => press(i)}
            aria-label={`Energy square ${i + 1}`}
            style={
              evolved
                ? ({
                    left: `${positions[i]?.left ?? 50}%`,
                    top: `${positions[i]?.top ?? 50}%`,
                    "--recall-delay": `${i * -91}ms`,
                  } as React.CSSProperties)
                : undefined
            }
            className={cn(
              "aspect-square rounded-md border transition-colors",
              evolved && "recall-evolved-pad",
              evolved && phase === "input" && "recall-evolved-distracting",
              flash === i
                ? "border-mint bg-mint/70 glow-mint"
                : "border-cyan/40 bg-deepblue/70 hover:bg-cyan/20",
            )}
          >
            <span className="font-mono text-xs text-cyan/70">{i + 1}</span>
          </button>
        ))}
      </div>
      {phase === "splash" && (
        <div className="recall-evolved-splash" role="status" aria-live="assertive">
          <span>EVOLVED!</span>
        </div>
      )}
      {phase === "done" && (
        <p className={cn("mt-5 font-display text-2xl", won ? "text-mint" : "text-orange")}>
          {won ? "AMAZING!" : "RECALL LOST"}
        </p>
      )}
    </div>
  );
}
