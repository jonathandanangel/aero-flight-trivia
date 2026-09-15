import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STORY_DIFFICULTIES } from "@/game/spirit-bound/shrine/difficulty";
import { generatePuzzle } from "@/game/spirit-bound/shrine/generator";
import { applyMove, canLift, canPlace, placementMask } from "@/game/spirit-bound/shrine/rules";
import { randomSeed } from "@/game/spirit-bound/shrine/rng";
import { unlockAchievements, scorePuzzle, type AchievementId } from "@/game/spirit-bound/shrine/scoring";
import type { AccessMode, Difficulty, PegIndex, Pegs, ScoreBreakdown } from "@/game/spirit-bound/shrine/types";
import { playSfx } from "@/game/spirit-bound/shrine/audio";
import { recordShrineResult, loadShrineSave } from "@/storage/spirit-bound/shrine";

export type ShrinePhase = "intro" | "briefing" | "play" | "success" | "timeout";

function rollDifficulty(): Difficulty {
  return STORY_DIFFICULTIES[Math.floor(Math.random() * STORY_DIFFICULTIES.length)] ?? "medium";
}

export function useShrinePuzzle(options: { reducedMotionDefault: boolean }) {
  const save = useMemo(() => loadShrineSave(), []);
  const [seed, setSeed] = useState(randomSeed);
  const [difficulty, setDifficulty] = useState<Difficulty>(rollDifficulty);
  const [puzzleNumber, setPuzzleNumber] = useState(() => save.completedPuzzles + 1);
  const [phase, setPhase] = useState<ShrinePhase>("intro");

  const puzzle = useMemo(
    () => generatePuzzle(difficulty, seed, puzzleNumber),
    [difficulty, seed, puzzleNumber],
  );

  const [pegs, setPegs] = useState<Pegs>(puzzle.start);
  const [selected, setSelected] = useState<PegIndex | null>(null);
  const [moves, setMoves] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(puzzle.timeLimit);
  const [shakePeg, setShakePeg] = useState<PegIndex | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [burstPeg, setBurstPeg] = useState<PegIndex | null>(null);
  const [result, setResult] = useState<ScoreBreakdown | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementId[]>([]);
  const [access, setAccess] = useState<AccessMode>({
    highContrast: false,
    colorblind: false,
    reducedMotion: options.reducedMotionDefault,
  });
  const finished = useRef(false);
  const movesRef = useRef(0);

  useEffect(() => {
    setAccess((a) => ({ ...a, reducedMotion: options.reducedMotionDefault || a.reducedMotion }));
  }, [options.reducedMotionDefault]);

  const syncBoard = useCallback((next: typeof puzzle) => {
    finished.current = false;
    setPegs(next.start);
    setSelected(null);
    movesRef.current = 0;
    setMoves(0);
    setSecondsLeft(next.timeLimit);
    setResult(null);
    setNewAchievements([]);
    setShakePeg(null);
  }, []);

  useEffect(() => {
    syncBoard(puzzle);
  }, [puzzle, syncBoard]);

  const resetBoard = useCallback(() => {
    syncBoard(puzzle);
  }, [puzzle, syncBoard]);

  const newPuzzle = useCallback(() => {
    setSeed(randomSeed());
    setDifficulty(rollDifficulty());
    setPuzzleNumber((n) => n + 1);
  }, []);

  const finish = useCallback(
    (completed: boolean, moveCount: number, timeLeft: number) => {
      if (finished.current) return;
      finished.current = true;
      const scored = scorePuzzle({
        completed,
        moves: moveCount,
        optimal: puzzle.optimal,
        secondsLeft: timeLeft,
        timeLimit: puzzle.timeLimit,
      });
      setResult(scored);
      if (completed) {
        const unlocked = unlockAchievements({
          completed,
          stars: scored.stars,
          moves: moveCount,
          optimal: puzzle.optimal,
          secondsLeft: timeLeft,
        });
        recordShrineResult({
          score: scored.total,
          moves: moveCount,
          stars: scored.stars,
          achievements: unlocked,
        });
        setNewAchievements(unlocked);
        playSfx("success");
        setPhase("success");
      } else {
        playSfx("fail");
        setPhase("timeout");
      }
    },
    [puzzle.optimal, puzzle.timeLimit],
  );

  useEffect(() => {
    if (phase !== "play") return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        const next = s - 1;
        if (next <= 10 && next > 0) playSfx("tick");
        if (next <= 0) {
          window.setTimeout(() => finish(false, movesRef.current, 0), 0);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, finish]);

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
      setBurstPeg(peg);
      setBurstKey((k) => k + 1);
      playSfx("move");
      const solved =
        next[0].join() === puzzle.target[0].join() &&
        next[1].join() === puzzle.target[1].join() &&
        next[2].join() === puzzle.target[2].join();
      if (solved) finish(true, nextMoves, secondsLeft);
    },
    [phase, selected, pegs, puzzle.target, secondsLeft, finish],
  );

  const correctMask = useMemo(() => placementMask(pegs, puzzle.target), [pegs, puzzle.target]);

  return {
    puzzle,
    phase,
    setPhase,
    pegs,
    selected,
    moves,
    secondsLeft,
    shakePeg,
    burstKey,
    burstPeg,
    result,
    newAchievements,
    access,
    setAccess,
    correctMask,
    trySelect,
    resetBoard,
    newPuzzle,
    savedBest: save.bestMoves,
    savedScore: save.bestScore,
  };
}
