import * as React from "react";
import { audio } from "@/game/audio";
import { cn } from "@/lib/utils";
import { HealthBar } from "./HealthBar";

const GRID_PADS = 11;

type Pos = { left: number; top: number };
type Stage = 1 | 2 | 3;
type Phase = "brief" | "watch" | "fadeout" | "input" | "result";

function seeded(seed: number) {
  let state = (seed || 1) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Non-overlapping scatter inside the play field (percentages). */
function scatter(count: number, seed: number): Pos[] {
  const random = seeded(seed);
  const out: Pos[] = [];
  let guard = 0;
  while (out.length < count && guard < 4000) {
    guard += 1;
    const candidate = { left: 12 + random() * 76, top: 14 + random() * 72 };
    const clear = out.every(
      (p) => Math.hypot(p.left - candidate.left, (p.top - candidate.top) * 0.7) > 19,
    );
    if (clear) out.push(candidate);
  }
  while (out.length < count) {
    const i = out.length;
    out.push({ left: 15 + (i % 4) * 23, top: 18 + Math.floor(i / 4) * 27 });
  }
  return out;
}

function gridPositions(count: number): Pos[] {
  return Array.from({ length: count }, (_, i) => ({
    left: 14 + (i % 4) * 24,
    top: 18 + Math.floor(i / 4) * 28,
  }));
}

const STAGE_TITLES: Record<Stage, string> = {
  1: "STAGE 1 · CLASSIC RECALL",
  2: "STAGE 2 · EVOLVED SCATTER",
  3: "STAGE 3 · PATH MEMORY",
};

const STAGE_BLURBS: Record<Stage, string> = {
  1: "Fixed grid. Watch the sequence, then repeat it.",
  2: "Nodes scatter across the lab. Same rules, harder read.",
  3: "Laser links draw a path. Retrace the connections in order.",
};

export interface MemoryGauntletProps {
  reducedMotion: boolean;
  hp: number;
  onOvercharge: () => void;
  onDamage: () => void;
  onComplete: (score: number) => void;
  onAbort: (score: number) => void;
}

/**
 * Three-stage Aerodynamics Extreme memory gauntlet.
 * Stage 1 grid recall, stage 2 scattered recall, stage 3 laser path memory.
 */
export function MemoryGauntlet({
  reducedMotion,
  hp,
  onOvercharge,
  onDamage,
  onComplete,
  onAbort,
}: MemoryGauntletProps) {
  const [stage, setStage] = React.useState<Stage>(1);
  const [attempt, setAttempt] = React.useState(0);
  const [lives, setLives] = React.useState(3);
  const [score, setScore] = React.useState(0);
  const [length, setLength] = React.useState(4);
  const [phase, setPhase] = React.useState<Phase>("brief");
  const [step, setStep] = React.useState(0);
  const [flash, setFlash] = React.useState<number | null>(null);
  const [drawn, setDrawn] = React.useState(0);
  const [won, setWon] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [salt] = React.useState(() => Math.floor(Math.random() * 1_000_000));

  const nodeCount = stage === 3 ? 7 : GRID_PADS;
  const seed = stage * 7919 + attempt * 613 + length * 31;

  const positions = React.useMemo(
    () => (stage === 1 ? gridPositions(GRID_PADS) : scatter(nodeCount, seed)),
    [stage, nodeCount, seed],
  );

  const sequence = React.useMemo(() => {
    const random = seeded(seed + 17);
    const out: number[] = [];
    for (let i = 0; i < length; i += 1) {
      let next = Math.floor(random() * nodeCount);
      if (stage === 3 && out.length && next === out[out.length - 1]) {
        next = (next + 1) % nodeCount;
      }
      out.push(next);
    }
    return out;
  }, [seed, length, nodeCount, stage]);

  const beginStage = () => {
    audio.play("gauntlet-start");
    setStep(0);
    setDrawn(0);
    setPhase("watch");
  };

  // Sequence / path playback.
  React.useEffect(() => {
    if (phase !== "watch") return;
    const timers: number[] = [];
    const gap = stage === 3 ? (reducedMotion ? 340 : 480) : reducedMotion ? 330 : 470;
    let i = 0;
    const run = () => {
      if (i >= sequence.length) {
        timers.push(
          window.setTimeout(() => {
            if (stage === 3) audio.play("path-clear");
            setFlash(null);
            setPhase("input");
          }, gap),
        );
        return;
      }
      const node = sequence[i]!;
      setFlash(node);
      if (stage === 3) {
        setDrawn(i + 1);
        audio.play("path-link", i);
      } else {
        audio.play("recall-note", node);
      }
      timers.push(
        window.setTimeout(() => {
          setFlash(null);
          i += 1;
          timers.push(window.setTimeout(run, gap * 0.3));
        }, gap * 0.6),
      );
    };
    timers.push(window.setTimeout(run, reducedMotion ? 250 : 520));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, sequence, stage, reducedMotion]);

  const finishStage = (success: boolean) => {
    setPhase("result");
    setWon(success);
    if (success) {
      setScore((s) => s + 3);
      audio.play("stage-clear");
      setMessage(stage === 3 ? "PATH LOCKED · +3" : "STAGE CLEAR · +3");
      onOvercharge();
    } else {
      setScore((s) => s - 3);
      audio.play("stage-fail");
      onDamage();
      setLives((l) => l - 1);
      setMessage("TRIAL LOST · -3");
    }
  };

  const press = (node: number) => {
    if (phase !== "input") return;
    setFlash(node);
    window.setTimeout(() => setFlash(null), 150);
    if (stage === 3) {
      audio.play("path-link", step);
      setDrawn(step + 1);
    } else {
      audio.play("recall-note", node);
    }
    if (sequence[step] === node) {
      const next = step + 1;
      setStep(next);
      if (next >= sequence.length) finishStage(true);
    } else {
      finishStage(false);
    }
  };

  const continueAfterResult = () => {
    if (won) {
      if (stage === 3) {
        onComplete(score);
        return;
      }
      setStage((s) => (s + 1) as Stage);
      setLength((l) => l + 1);
      setAttempt((a) => a + 1);
      setPhase("brief");
      setStep(0);
      setDrawn(0);
      return;
    }
    if (lives <= 0) {
      onAbort(score);
      return;
    }
    setLength((l) => Math.max(3, l - 1));
    setAttempt((a) => a + 1);
    setPhase("brief");
    setStep(0);
    setDrawn(0);
  };

  const linkPoints = (count: number) =>
    sequence.slice(0, Math.max(0, count)).map((n) => positions[n] ?? { left: 50, top: 50 });

  // Preview lines draw during watch, then vanish so the player must recall the path.
  const playbackLinks = phase === "watch" ? linkPoints(drawn) : [];
  const tracedLinks = phase === "input" ? linkPoints(step + 1) : [];
  const rainbow = stage === 3 && phase === "input" && !reducedMotion;

  return (
    <div className="panel mx-auto w-full max-w-3xl space-y-4 p-5">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest">
        <span className="text-magenta">Aerodynamics Extreme</span>
        <span className="text-cyan">{STAGE_TITLES[stage]}</span>
        <span className="text-amber">Score {score}</span>
        <span className="text-orange">Lives {Math.max(0, lives)}</span>
        <HealthBar hp={hp} className="ml-auto" />
      </header>

      {phase === "brief" ? (
        <div className="space-y-4 py-8 text-center">
          <h2 className="font-display text-2xl text-cyan text-glow">{STAGE_TITLES[stage]}</h2>
          <p className="font-mono text-sm text-muted-foreground">{STAGE_BLURBS[stage]}</p>
          <p className="font-mono text-xs text-amber">
            Sequence length {length} · clear for +3, fail for -3 and one life
          </p>
          <button
            type="button"
            className="rounded-lg border border-cyan/60 bg-deepblue/70 px-6 py-3 font-display text-sm uppercase tracking-[0.2em] text-cyan hover:bg-cyan/20"
            onClick={beginStage}
          >
            Begin trial
          </button>
        </div>
      ) : (
        <>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {phase === "watch"
              ? stage === 3
                ? "Laser path drawing"
                : "Watch the sequence"
              : phase === "input"
                ? `Reproduce it (${step}/${sequence.length})`
                : won
                  ? "Trial cleared"
                  : "Trial failed"}
          </p>

          <div className={cn("gauntlet-field", stage === 3 && "gauntlet-field-path", rainbow && "gauntlet-rainbow")}>
            {stage === 3 && (
              <svg className="gauntlet-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                {playbackLinks.slice(1).map((point, i) => {
                  const from = playbackLinks[i]!;
                  return (
                    <line
                      key={`p-${i}`}
                      x1={from.left}
                      y1={from.top}
                      x2={point.left}
                      y2={point.top}
                      className="gauntlet-laser"
                    />
                  );
                })}
                {tracedLinks.slice(1).map((point, i) => {
                  const from = tracedLinks[i]!;
                  return (
                    <line
                      key={`t-${i}`}
                      x1={from.left}
                      y1={from.top}
                      x2={point.left}
                      y2={point.top}
                      className="gauntlet-laser gauntlet-laser-traced"
                    />
                  );
                })}
              </svg>
            )}

            {positions.map((pos, i) => (
              <button
                key={i}
                type="button"
                disabled={phase !== "input"}
                onClick={() => press(i)}
                aria-label={stage === 3 ? `Path node ${i + 1}` : `Memory square ${i + 1}`}
                style={
                  {
                    left: `${pos.left}%`,
                    top: `${pos.top}%`,
                    "--node-delay": `${i * -140}ms`,
                  } as React.CSSProperties
                }
                className={cn(
                  "gauntlet-node",
                  stage === 3 ? "gauntlet-node-round" : "gauntlet-node-square",
                  rainbow && "gauntlet-node-rainbow",
                  flash === i && "gauntlet-node-live",
                )}
              >
                <span className="font-mono text-[11px]">{i + 1}</span>
              </button>
            ))}
          </div>

          {phase === "result" && (
            <div className="space-y-3 text-center">
              <p className={cn("font-display text-2xl", won ? "text-mint" : "text-orange")}>{message}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {won
                  ? stage === 3
                    ? "Gauntlet conquered. The curated flight-dynamics run unlocks."
                    : "Next trial gets longer."
                  : lives > 0
                    ? `Retry with a shorter sequence. Lives left ${lives}.`
                    : "No lives left. The run ends here."}
              </p>
              <button
                type="button"
                className="rounded-lg border border-cyan/60 bg-deepblue/70 px-6 py-3 font-display text-sm uppercase tracking-[0.2em] text-cyan hover:bg-cyan/20"
                onClick={continueAfterResult}
              >
                {won ? (stage === 3 ? "Enter the gauntlet" : "Next trial") : lives > 0 ? "Retry trial" : "Exit run"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
