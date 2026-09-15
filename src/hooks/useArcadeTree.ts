import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adaptDifficulty, nextDifficulty } from "@/game/spirit-bound/shrine/adapt";
import { playSfx } from "@/game/spirit-bound/shrine/audio";
import { DIFFICULTY } from "@/game/spirit-bound/shrine/difficulty";
import { generatePuzzle } from "@/game/spirit-bound/shrine/generator";
import { randomSeed } from "@/game/spirit-bound/shrine/rng";
import { applyMove, canLift, canPlace, placementMask } from "@/game/spirit-bound/shrine/rules";
import { scorePuzzle } from "@/game/spirit-bound/shrine/scoring";
import type { AccessMode, Difficulty, PegIndex, Pegs } from "@/game/spirit-bound/shrine/types";
import { recordArcadeRun } from "@/storage/spirit-bound/shrine";

export type ArcadeKind = "sprint" | "endless";

export const SPRINT_SECONDS = 90;

export function useArcadeTree(kind: ArcadeKind) {
  const [seed, setSeed] = useState(randomSeed);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [puzzleNumber, setPuzzleNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [sessionLeft, setSessionLeft] = useState(kind === "sprint" ? SPRINT_SECONDS : 0);
  const [elapsed, setElapsed] = useState(0);
  const [over, setOver] = useState(false);
  const [selected, setSelected] = useState<PegIndex | null>(null);
  const [shakePeg, setShakePeg] = useState<PegIndex | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [burstPeg, setBurstPeg] = useState<PegIndex | null>(null);
  const [access, setAccess] = useState<AccessMode>({
    highContrast: false,
    colorblind: false,
    reducedMotion: false,
  });

  const puzzle = useMemo(() => generatePuzzle(difficulty, seed, puzzleNumber), [difficulty, seed, puzzleNumber]);
  const [pegs, setPegs] = useState<Pegs>(puzzle.start);
  const [moves, setMoves] = useState(0);
  const finished = useRef(false);
  const elapsedRef = useRef(0);
  const movesRef = useRef(0);
  const sessionRef = useRef(kind === "sprint" ? SPRINT_SECONDS : 0);
  const scoreRef = useRef(0);

  useEffect(() => {
    finished.current = false;
    setPegs(puzzle.start);
    setSelected(null);
    setElapsed(0);
    elapsedRef.current = 0;
    movesRef.current = 0;
    setMoves(0);
  }, [puzzle]);

  useEffect(() => {
    if (over) return;
    const id = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (kind !== "sprint") return;
      sessionRef.current -= 1;
      const left = sessionRef.current;
      setSessionLeft(left);
      if (left <= 10 && left > 0) playSfx("tick");
      if (left <= 0) {
        finished.current = true;
        setOver(true);
        playSfx("fail");
        recordArcadeRun("sprint", scoreRef.current);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [kind, over]);

  const dealNext = useCallback((nextDiff: Difficulty) => {
    finished.current = false;
    setDifficulty(nextDiff);
    setSeed(randomSeed());
    setPuzzleNumber((n) => n + 1);
  }, []);

  const trySelect = useCallback(
    (peg: PegIndex) => {
      if (over || finished.current) return;
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
      movesRef.current += 1;
      setMoves(movesRef.current);
      setPegs(next);
      setSelected(null);
      setBurstPeg(peg);
      setBurstKey((k) => k + 1);
      playSfx("move");
      const solved =
        next[0].join() === puzzle.target[0].join() &&
        next[1].join() === puzzle.target[1].join() &&
        next[2].join() === puzzle.target[2].join();
      if (!solved) return;
      finished.current = true;
      const spent = Math.max(1, elapsedRef.current);
      const band = DIFFICULTY[difficulty];
      const gained = scorePuzzle({
        completed: true,
        moves: movesRef.current,
        optimal: puzzle.optimal,
        secondsLeft: Math.max(0, band.timeLimit - spent),
        timeLimit: band.timeLimit,
      });
      const bonus = difficulty === "expert" ? 120 : difficulty === "hard" ? 80 : difficulty === "medium" ? 50 : 30;
      const bump = gained.total + bonus;
      scoreRef.current += bump;
      setScore(scoreRef.current);
      setCleared((c) => c + 1);
      playSfx("success");
      const nextDiff =
        kind === "sprint"
          ? nextDifficulty(difficulty, 1)
          : adaptDifficulty(difficulty, spent, band.timeLimit);
      window.setTimeout(() => dealNext(nextDiff), 350);
    },
    [over, selected, pegs, puzzle, difficulty, kind, dealNext],
  );

  const stop = useCallback(() => {
    finished.current = true;
    setOver(true);
    playSfx("success");
    recordArcadeRun(kind, scoreRef.current);
  }, [kind]);

  const correctMask = useMemo(() => placementMask(pegs, puzzle.target), [pegs, puzzle.target]);

  return {
    kind,
    puzzle,
    pegs,
    selected,
    shakePeg,
    burstKey,
    burstPeg,
    access,
    setAccess,
    correctMask,
    trySelect,
    score,
    cleared,
    moves,
    difficulty,
    sessionLeft,
    elapsed,
    over,
    stop,
  };
}
