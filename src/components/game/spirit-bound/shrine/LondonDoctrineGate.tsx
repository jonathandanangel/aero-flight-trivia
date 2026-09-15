import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generatePuzzle } from "@/game/spirit-bound/shrine/generator";
import { applyMove, canLift, canPlace, placementMask } from "@/game/spirit-bound/shrine/rules";
import { randomSeed } from "@/game/spirit-bound/shrine/rng";
import type { PegIndex, Pegs } from "@/game/spirit-bound/shrine/types";
import { generateChallenge } from "@/game/spirit-bound/reason/generator";
import { playSfx, startDoctrinePuzzleMusic, startGrasslandsMusic } from "@/game/spirit-bound/shrine/audio";
import { cn } from "@/lib/utils";
import { GameBoard } from "@/components/game/spirit-bound/shrine/GameBoard";
import { FeedbackLayer } from "@/components/game/spirit-bound/reason/FeedbackLayer";
import { SceneRenderer } from "@/components/game/spirit-bound/reason/SceneRenderer";
import { StatementCard } from "@/components/game/spirit-bound/reason/StatementCard";

type Props = {
  /** Paper order 1–11 — drives path-length target and music variation. */
  paperOrder: number;
  onSolved: () => void;
  onAbort: () => void;
};

type Phase = "play" | "verbal" | "cleared" | "failed";

const ACCESS = {
  highContrast: false,
  colorblind: false,
  reducedMotion: false,
  dyslexia: false,
  textSize: "sm" as const,
  narration: false,
};

/**
 * Extreme Executive Accumen peg gauntlet, then one easy verbal TRUE/FALSE seal.
 */
export function LondonDoctrineGate({ paperOrder, onSolved, onAbort }: Props) {
  const targetPath = 70 + (paperOrder - 1) * 8;
  const variation = Math.max(0, Math.min(10, paperOrder - 1));

  const [seed, setSeed] = useState(randomSeed);
  const [round, setRound] = useState(1);
  const [pathDone, setPathDone] = useState(0);
  const [phase, setPhase] = useState<Phase>("play");
  const [pegs, setPegs] = useState<Pegs>([[], [], []]);
  const [selected, setSelected] = useState<PegIndex | null>(null);
  const [moves, setMoves] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [shakePeg, setShakePeg] = useState<PegIndex | null>(null);
  const [verbalSeed, setVerbalSeed] = useState(randomSeed);
  const [verbalLocked, setVerbalLocked] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; key: number } | null>(null);
  const movesRef = useRef(0);
  const finished = useRef(false);
  const verbalLockedRef = useRef(false);

  const puzzle = useMemo(
    () => generatePuzzle("extreme", seed ^ (paperOrder * 997) ^ (round * 131), round),
    [seed, paperOrder, round],
  );

  // Single easy watch note after pegs clear.
  const verbalChallenge = useMemo(
    () => generateChallenge(verbalSeed, paperOrder * 17 + 3, 1),
    [verbalSeed, paperOrder],
  );

  useEffect(() => {
    startDoctrinePuzzleMusic(variation);
  }, [variation]);

  useEffect(() => {
    finished.current = false;
    movesRef.current = 0;
    setMoves(0);
    setSelected(null);
    setSecondsLeft(puzzle.timeLimit);
    setPegs(puzzle.start.map((p) => [...p]) as Pegs);
  }, [puzzle]);

  useEffect(() => {
    if (phase !== "play") return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        const next = s - 1;
        if (next <= 10 && next > 0) playSfx("tick");
        if (next <= 0) {
          window.setTimeout(() => {
            if (finished.current) return;
            finished.current = true;
            playSfx("fail");
            setPhase("failed");
            startGrasslandsMusic();
          }, 0);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, puzzle.id]);

  const access = useMemo(
    () => ({
      highContrast: false,
      colorblind: false,
      reducedMotion: false,
    }),
    [],
  );

  const correctMask = useMemo(() => placementMask(pegs, puzzle.target), [pegs, puzzle.target]);

  const advanceOrWin = useCallback(
    (optimal: number) => {
      const nextPath = pathDone + optimal;
      setPathDone(nextPath);
      playSfx("success");
      if (nextPath >= targetPath) {
        setVerbalSeed(randomSeed());
        verbalLockedRef.current = false;
        setVerbalLocked(false);
        setFeedback(null);
        setPhase("verbal");
        return;
      }
      setRound((r) => r + 1);
      setSeed(randomSeed());
    },
    [pathDone, targetPath],
  );

  const answerVerbal = useCallback(
    (saidTrue: boolean) => {
      if (phase !== "verbal" || verbalLockedRef.current) return;
      verbalLockedRef.current = true;
      setVerbalLocked(true);
      const correct = saidTrue === verbalChallenge.answer;
      setFeedback({ correct, key: 1 });
      if (correct) {
        playSfx("success");
        window.setTimeout(() => setPhase("cleared"), 420);
        return;
      }
      playSfx("fail");
      window.setTimeout(() => {
        setPhase("failed");
        startGrasslandsMusic();
      }, 420);
    },
    [phase, verbalChallenge.answer],
  );

  const trySelect = useCallback(
    (peg: PegIndex) => {
      if (phase !== "play" || finished.current) return;
      if (selected === null) {
        if (!canLift(pegs, peg)) {
          playSfx("invalid");
          setShakePeg(peg);
          window.setTimeout(() => setShakePeg(null), 280);
          return;
        }
        playSfx("select");
        setSelected(peg);
        return;
      }
      if (selected === peg) {
        setSelected(null);
        playSfx("select");
        return;
      }
      const next = applyMove(pegs, { from: selected, to: peg });
      if (!next || !canPlace(pegs, peg)) {
        playSfx("invalid");
        setShakePeg(peg);
        window.setTimeout(() => setShakePeg(null), 280);
        return;
      }
      const nextMoves = movesRef.current + 1;
      movesRef.current = nextMoves;
      setPegs(next);
      setMoves(nextMoves);
      setSelected(null);
      playSfx("move");

      const done =
        next[0]!.join(",") === puzzle.target[0]!.join(",") &&
        next[1]!.join(",") === puzzle.target[1]!.join(",") &&
        next[2]!.join(",") === puzzle.target[2]!.join(",");
      if (done) {
        finished.current = true;
        window.setTimeout(() => advanceOrWin(puzzle.optimal), 350);
      }
    },
    [phase, selected, pegs, puzzle, advanceOrWin],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        startGrasslandsMusic();
        onAbort();
        return;
      }
      if (phase === "verbal") {
        if (verbalLocked) return;
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          e.preventDefault();
          answerVerbal(true);
        }
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
          e.preventDefault();
          answerVerbal(false);
        }
        return;
      }
      if (phase !== "play") return;
      const map: Record<string, PegIndex> = { "1": 0, "2": 1, "3": 2 };
      if (e.key in map) {
        e.preventDefault();
        trySelect(map[e.key]!);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        trySelect(0);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        trySelect(1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        trySelect(2);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, trySelect, onAbort, answerVerbal, verbalLocked]);

  if (phase === "cleared") {
    return (
      <section className="flex min-h-[420px] flex-col items-center justify-center gap-4 border-4 border-game-yellow bg-game-bg p-6 text-center font-pixel text-[#f8f0c8] shadow-[0_0_0_4px_#181010]">
        <p className="text-[10px] text-game-yellow">EXECUTIVE ACCUMEN · SEAL BROKEN</p>
        <p className="text-[9px] leading-relaxed">
          Path weight {pathDone}/{targetPath} · watch note verified
          <br />
          Scrap {paperOrder} unseals.
        </p>
        <button
          type="button"
          onClick={onSolved}
          className="border-2 border-game-yellow px-4 py-2 text-[11px] text-game-yellow hover:bg-game-yellow hover:text-game-bg"
        >
          TAKE THE SCRAP
        </button>
      </section>
    );
  }

  if (phase === "failed") {
    return (
      <section className="flex min-h-[420px] flex-col items-center justify-center gap-4 border-4 border-game-yellow bg-game-bg p-6 text-center font-pixel text-[#f8f0c8] shadow-[0_0_0_4px_#181010]">
        <p className="text-[10px] text-game-hp">ROOTS HOLD</p>
        <p className="text-[8px] text-[#a88828]">Extreme murals or the final watch note failed.</p>
        <button
          type="button"
          onClick={onAbort}
          className="border-2 border-game-yellow px-4 py-2 text-[11px] text-game-yellow hover:bg-game-yellow hover:text-game-bg"
        >
          RETURN
        </button>
      </section>
    );
  }

  if (phase === "verbal") {
    return (
      <section className="relative overflow-hidden border-4 border-game-yellow bg-game-bg p-3 font-pixel text-[#f8f0c8] shadow-[0_0_0_4px_#181010] sm:p-4">
        <FeedbackLayer
          feedback={feedback ? { ...feedback, rankUp: null, legendary: false } : null}
          access={ACCESS}
        />
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[9px]">
          <span className="text-game-yellow">FINAL WATCH · EASY</span>
          <span className="text-game-orange">PATH {pathDone}/{targetPath} · 1 NOTE</span>
        </div>
        <p className="mb-2 text-[8px] text-[#a88828]">
          Scrap {paperOrder} · one easy TRUE / FALSE · ← TRUE / → FALSE · ESC abort
        </p>
        <div className={cn(verbalLocked && "pointer-events-none opacity-80")}>
          <StatementCard
            source={verbalChallenge.source}
            statement={verbalChallenge.statement}
            access={ACCESS}
          />
          <div className="mt-3">
            <SceneRenderer
              scene={verbalChallenge.scene}
              access={ACCESS}
              pulse={Boolean(feedback?.correct)}
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={verbalLocked}
            onClick={() => answerVerbal(true)}
            className="flex-1 border-2 border-[#38c060] px-3 py-3 text-[11px] text-[#38c060] hover:bg-[#38c060] hover:text-game-bg disabled:opacity-40"
          >
            TRUE
            <span className="mt-1 block text-[7px]">← / A</span>
          </button>
          <button
            type="button"
            disabled={verbalLocked}
            onClick={() => answerVerbal(false)}
            className="flex-1 border-2 border-game-hp px-3 py-3 text-[11px] text-game-hp hover:bg-game-hp hover:text-game-bg disabled:opacity-40"
          >
            FALSE
            <span className="mt-1 block text-[7px]">→ / D</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-4 border-game-yellow bg-game-bg p-3 font-pixel text-[#f8f0c8] shadow-[0_0_0_4px_#181010] sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[9px]">
        <span className="text-game-yellow">EXTREME · EXECUTIVE ACCUMEN</span>
        <span className={secondsLeft <= 10 ? "animate-pulse text-game-hp" : "text-game-orange"}>
          {secondsLeft}s · PATH {pathDone}/{targetPath} · OPT {puzzle.optimal} · MOVES {moves}
        </span>
      </div>
      <p className="mb-2 text-[8px] text-[#a88828]">
        Scrap {paperOrder} · 20s / 25s alternating · then one easy watch note · ESC abort
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[8px] text-game-yellow">CURRENT TREE</p>
          <GameBoard
            pegs={pegs}
            target={false}
            selected={selected}
            correctMask={correctMask}
            shakePeg={shakePeg}
            burstKey={0}
            burstPeg={null}
            access={access}
            onSelect={trySelect}
          />
        </div>
        <div>
          <p className="mb-2 text-[8px] text-game-yellow">TARGET MURAL</p>
          <GameBoard
            pegs={puzzle.target}
            target
            selected={null}
            correctMask={correctMask}
            shakePeg={null}
            burstKey={0}
            burstPeg={null}
            access={access}
            onSelect={() => undefined}
          />
        </div>
      </div>
      <p className="mt-3 text-center text-[8px] text-[#f8f0c8]/60">
        1 left · 2 spine · 3 right · only a tip relic may move
      </p>
    </section>
  );
}
