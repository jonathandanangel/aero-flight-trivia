import { useEffect } from "react";
import { fadeAmbient, startAmbient, stopAmbient } from "@/game/spirit-bound/shrine/audio";
import { ACHIEVEMENTS } from "@/game/spirit-bound/shrine/scoring";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useShrinePuzzle } from "@/hooks/useShrinePuzzle";
import { CutscenePlayer } from "./CutscenePlayer";
import { GameBoard } from "./GameBoard";
import { HUD } from "./HUD";

const INTRO = [
  "* The gold door drinks the lantern light.",
  "* A living tree of nine sockets wakes in the stone.",
  "* OLD SAGE: The relics must sit 1 and 2 at the crown, then 3 and 4, 5 and 6, and 7 8 9 at the roots.",
  "* Only a relic with nothing above it may move. One at a time.",
];

const BRIEFING = [
  "* Match the left tree to the mural on the right.",
  "* Left branch holds 7-5-3-1. Right holds 9-6-4-2. The spine holds 8.",
  "* A relic can only lift from a tip. Empty sockets never open a hole in a stack.",
  "* Click a branch, or use keys 1 2 3 for left, spine, right.",
];

const SUCCESS = [
  "* The three roots lock. Gold climbs the doorframe.",
  "* The mural burns, then stills. The way is open.",
];

const FAIL = [
  "* The roots shiver and forget your work.",
  "* OLD SAGE: Again. The king can wait. The pattern cannot.",
];

type Props = {
  onSolved: (reward: { score: number; stars: number }) => void;
};

export function ShrineTrial({ onSolved }: Props) {
  const prefersReduced = usePrefersReducedMotion();
  const shrine = useShrinePuzzle({
    reducedMotionDefault: prefersReduced,
  });

  useEffect(() => {
    startAmbient();
    fadeAmbient(true);
    return () => stopAmbient();
  }, []);

  useEffect(() => {
    fadeAmbient(shrine.phase === "play");
  }, [shrine.phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shrine.phase !== "play") return;
      const map: Record<string, 0 | 1 | 2> = { "1": 0, "2": 1, "3": 2 };
      if (e.key in map) {
        e.preventDefault();
        const peg = map[e.key];
        if (peg !== undefined) shrine.trySelect(peg);
      }
      if (["ArrowLeft"].includes(e.key)) {
        e.preventDefault();
        shrine.trySelect(0);
      }
      if (["ArrowDown"].includes(e.key)) {
        e.preventDefault();
        shrine.trySelect(1);
      }
      if (["ArrowRight"].includes(e.key)) {
        e.preventDefault();
        shrine.trySelect(2);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shrine]);

  return (
    <section
      className="relative overflow-hidden border-4 border-game-yellow bg-game-bg p-3 text-[#f8f0c8] shadow-[0_0_0_4px_#181010] sm:p-4"
      data-high-contrast={shrine.access.highContrast ? "on" : "off"}
    >
      {shrine.phase === "intro" && (
        <CutscenePlayer
          title="THE LIVING ROOTS"
          lines={INTRO}
          zoom
          reducedMotion={shrine.access.reducedMotion}
          onDone={() => shrine.setPhase("briefing")}
        />
      )}
      {shrine.phase === "briefing" && (
        <CutscenePlayer
          title="SHRINE BRIEFING"
          lines={BRIEFING}
          reducedMotion={shrine.access.reducedMotion}
          onDone={() => shrine.setPhase("play")}
        />
      )}
      {shrine.phase === "success" && shrine.result && (
        <CutscenePlayer
          title="THE MURAL SEALS"
          lines={[
            ...SUCCESS,
            `* Score ${shrine.result.total} · ${shrine.result.stars} star${shrine.result.stars === 1 ? "" : "s"}.`,
            ...shrine.newAchievements.map((id) => `* ${ACHIEVEMENTS[id]}.`),
          ]}
          reducedMotion={shrine.access.reducedMotion}
          onDone={() =>
            onSolved({ score: shrine.result?.total ?? 0, stars: shrine.result?.stars ?? 0 })
          }
        />
      )}
      {shrine.phase === "timeout" && (
        <CutscenePlayer
          title="THE ROOTS FORGET"
          lines={FAIL}
          tense
          reducedMotion={shrine.access.reducedMotion}
          onDone={() => {
            shrine.newPuzzle();
            shrine.setPhase("play");
          }}
        />
      )}

      <HUD
        puzzleNumber={shrine.puzzle.id}
        difficulty={shrine.puzzle.difficulty}
        moves={shrine.moves}
        optimal={shrine.puzzle.optimal}
        bestMoves={shrine.savedBest}
        secondsLeft={shrine.secondsLeft}
        timeLimit={shrine.puzzle.timeLimit}
        rating={shrine.result}
        access={shrine.access}
        onAccess={shrine.setAccess}
      />

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[8px] text-game-yellow">CURRENT TREE</p>
          <GameBoard
            pegs={shrine.pegs}
            target={false}
            selected={shrine.selected}
            correctMask={shrine.correctMask}
            shakePeg={shrine.shakePeg}
            burstKey={shrine.burstKey}
            burstPeg={shrine.burstPeg}
            access={shrine.access}
            onSelect={shrine.trySelect}
          />
        </div>
        <div>
          <p className="mb-2 text-[8px] text-game-yellow">TARGET MURAL</p>
          <GameBoard
            pegs={shrine.puzzle.target}
            target
            selected={null}
            correctMask={shrine.correctMask}
            shakePeg={null}
            burstKey={0}
            burstPeg={null}
            access={shrine.access}
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
