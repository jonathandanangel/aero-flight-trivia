import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generatePuzzle } from "@/game/spirit-bound/shrine/generator";
import { applyMove, canLift, canPlace, placementMask } from "@/game/spirit-bound/shrine/rules";
import { randomSeed } from "@/game/spirit-bound/shrine/rng";
import type { PegIndex, Pegs } from "@/game/spirit-bound/shrine/types";
import { playSfx, startDoctrinePuzzleMusic, startGrasslandsMusic } from "@/game/spirit-bound/shrine/audio";
import { GameBoard } from "@/components/game/spirit-bound/shrine/GameBoard";

type Props = {
  /** Paper order 1–11 — drives path-length target and music variation. */
  paperOrder: number;
  onSolved: () => void;
  onAbort: () => void;
};

type Phase = "play" | "cleared" | "failed";

/**
 * Extreme London Task (living-tree peg puzzle) gate for doctrine scraps.
 * Single mural maxes ~19 optimal moves, so we chain extreme puzzles until
 * cumulative optimal path length reaches 50+ (scales with scrap order).
 */
export function LondonDoctrineGate({ paperOrder, onSolved, onAbort }: Props) {
  const targetPath = 50 + (paperOrder - 1) * 5; // 50 … 100
  const variation = Math.max(0, Math.min(10, paperOrder - 1));

  const [seed, setSeed] = useState(randomSeed);
  const [round, setRound] = useState(1);
  const [pathDone, setPathDone] = useState(0);
  const [phase, setPhase] = useState<Phase>("play");
  const [pegs, setPegs] = useState<Pegs>([[], [], []]);
  const [selected, setSelected] = useState<PegIndex | null>(null);
  const [moves, setMoves] = useState(0);
  const [shakePeg, setShakePeg] = useState<PegIndex | null>(null);
  const movesRef = useRef(0);
  const finished = useRef(false);

  const puzzle = useMemo(
    () => generatePuzzle("extreme", seed ^ (paperOrder * 997) ^ (round * 131), round),
    [seed, paperOrder, round],
  );

  useEffect(() => {
    startDoctrinePuzzleMusic(variation);
  }, [variation]);

  useEffect(() => {
    finished.current = false;
    movesRef.current = 0;
    setMoves(0);
    setSelected(null);
    setPegs(puzzle.start.map((p) => [...p]) as Pegs);
  }, [puzzle]);

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
        setPhase("cleared");
        return;
      }
      setRound((r) => r + 1);
      setSeed(randomSeed());
    },
    [pathDone, targetPath],
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
  }, [phase, trySelect, onAbort]);

  if (phase === "cleared") {
    return (
      <section className="flex min-h-[420px] flex-col items-center justify-center gap-4 border-4 border-game-yellow bg-game-bg p-6 text-center font-pixel text-[#f8f0c8] shadow-[0_0_0_4px_#181010]">
        <p className="text-[10px] text-game-yellow">LONDON TASK · SEAL BROKEN</p>
        <p className="text-[9px] leading-relaxed">
          Path weight {pathDone}/{targetPath}
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

  return (
    <section className="relative overflow-hidden border-4 border-game-yellow bg-game-bg p-3 font-pixel text-[#f8f0c8] shadow-[0_0_0_4px_#181010] sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[9px]">
        <span className="text-game-yellow">EXTREME · LONDON TASK</span>
        <span className="text-game-orange">
          PATH {pathDone}/{targetPath} · OPT {puzzle.optimal} · MOVES {moves}
        </span>
      </div>
      <p className="mb-2 text-[8px] text-[#a88828]">
        Scrap {paperOrder} · chain extreme peg murals until path ≥ {targetPath} · ESC abort
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
