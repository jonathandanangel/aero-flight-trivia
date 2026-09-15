import { useEffect } from "react";
import { fadeAmbient, startMusic } from "@/game/spirit-bound/shrine/audio";
import { DIFFICULTY } from "@/game/spirit-bound/shrine/difficulty";
import { SPRINT_SECONDS, useArcadeTree, type ArcadeKind } from "@/hooks/useArcadeTree";
import { loadShrineSave } from "@/storage/spirit-bound/shrine";
import { GameBoard } from "./GameBoard";
import { HUD } from "./HUD";

type Props = {
  kind: ArcadeKind;
  onExit: () => void;
};

export function ArcadeTree({ kind, onExit }: Props) {
  const arcade = useArcadeTree(kind);
  const save = loadShrineSave();
  const best = kind === "sprint" ? save.bestSprint : save.bestEndless;

  useEffect(() => {
    startMusic();
    fadeAmbient(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (arcade.over) return;
      const map: Record<string, 0 | 1 | 2> = { "1": 0, "2": 1, "3": 2 };
      if (e.key in map) {
        e.preventDefault();
        const peg = map[e.key];
        if (peg !== undefined) arcade.trySelect(peg);
      }
      if (e.key === "ArrowLeft") arcade.trySelect(0);
      if (e.key === "ArrowDown") arcade.trySelect(1);
      if (e.key === "ArrowRight") arcade.trySelect(2);
      if (e.key === "Escape") arcade.stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [arcade]);

  const clock =
    kind === "sprint"
      ? `${Math.floor(arcade.sessionLeft / 60)}:${String(arcade.sessionLeft % 60).padStart(2, "0")}`
      : `${Math.floor(arcade.elapsed / 60)}:${String(arcade.elapsed % 60).padStart(2, "0")}`;

  if (arcade.over) {
    return (
      <section className="flex min-h-[420px] flex-col items-center justify-center gap-4 border-4 border-game-yellow bg-game-bg p-6 text-center text-[#f8f0c8] shadow-[0_0_0_4px_#181010]">
        <p className="text-[12px] text-game-yellow">
          {kind === "sprint" ? "TIME" : "LONG GAME"}
        </p>
        <p className="text-[18px] text-game-yellow">{arcade.score} PTS</p>
        <p className="text-[10px] leading-relaxed">
          Cleared {arcade.cleared} mural{arcade.cleared === 1 ? "" : "s"}
          <br />
          Best this machine: {Math.max(best, arcade.score)}
        </p>
        <button
          type="button"
          onClick={onExit}
          className="border-2 border-game-yellow px-4 py-2 text-[11px] text-game-yellow hover:bg-game-yellow hover:text-game-bg"
        >
          TITLE
        </button>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-4 border-game-yellow bg-game-bg p-3 text-[#f8f0c8] shadow-[0_0_0_4px_#181010] sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[9px]">
        <span className="text-game-yellow">
          {kind === "sprint" ? "EXECUTIVE ACUMEN" : "LONG GAME"}
        </span>
        <span className={kind === "sprint" && arcade.sessionLeft <= 15 ? "text-game-hp" : "text-game-yellow"}>
          {kind === "sprint" ? "1:30  " : "LIVE  "}
          {clock}
        </span>
        <span>SCORE {arcade.score}</span>
        <span>CLEAR {arcade.cleared}</span>
        <button type="button" onClick={arcade.stop} className="border border-game-orange px-2 py-1 text-game-orange">
          STOP
        </button>
      </div>

      <HUD
        puzzleNumber={arcade.puzzle.id}
        difficulty={arcade.difficulty}
        moves={arcade.moves}
        optimal={arcade.puzzle.optimal}
        bestMoves={null}
        secondsLeft={kind === "sprint" ? arcade.sessionLeft : DIFFICULTY[arcade.difficulty].timeLimit}
        timeLimit={kind === "sprint" ? SPRINT_SECONDS : DIFFICULTY[arcade.difficulty].timeLimit}
        rating={null}
        access={arcade.access}
        onAccess={arcade.setAccess}
      />

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[8px] text-game-yellow">CURRENT TREE</p>
          <GameBoard
            pegs={arcade.pegs}
            target={false}
            selected={arcade.selected}
            correctMask={arcade.correctMask}
            shakePeg={arcade.shakePeg}
            burstKey={arcade.burstKey}
            burstPeg={arcade.burstPeg}
            access={arcade.access}
            onSelect={arcade.trySelect}
          />
        </div>
        <div>
          <p className="mb-2 text-[8px] text-game-yellow">TARGET MURAL</p>
          <GameBoard
            pegs={arcade.puzzle.target}
            target
            selected={null}
            correctMask={arcade.correctMask}
            shakePeg={null}
            burstKey={0}
            burstPeg={null}
            access={arcade.access}
            onSelect={() => undefined}
          />
        </div>
      </div>
      <p className="mt-3 text-center text-[8px] text-[#f8f0c8]/60">
        Random trees. Climb the ladder. 1 / 2 / 3 to move. ESC or STOP to leave.
      </p>
    </section>
  );
}
