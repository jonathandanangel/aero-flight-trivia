import { DIFFICULTY } from "./difficulty";
import { applyMove, clonePegs, encodePegs, legalMoves } from "./rules";
import { mulberry32, pickIndex } from "./rng";
import { solvePuzzle } from "./solver";
import { TARGET_PEGS, type Difficulty, type Pegs, type PuzzleSpec } from "./types";

/** First-visit BFS from the mural — each depth is an optimal-distance bucket. */
function statesAtDistance(target: Pegs, min: number, max: number): { state: Pegs; depth: number }[] {
  const hits: { state: Pegs; depth: number }[] = [];
  const seen = new Set<string>([encodePegs(target)]);
  const queue: { state: Pegs; depth: number }[] = [{ state: clonePegs(target), depth: 0 }];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (!cur) break;
    if (cur.depth >= min && cur.depth <= max) hits.push(cur);
    if (cur.depth >= max) continue;
    for (const move of legalMoves(cur.state)) {
      const next = applyMove(cur.state, move);
      if (!next) continue;
      const key = encodePegs(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: next, depth: cur.depth + 1 });
    }
  }
  return hits;
}

export function generatePuzzle(difficulty: Difficulty, seed: number, puzzleNumber = 1): PuzzleSpec {
  const band = DIFFICULTY[difficulty];
  const rng = mulberry32(seed);
  const target = clonePegs(TARGET_PEGS);
  const pool = statesAtDistance(target, band.minMoves, band.maxMoves);
  const choice = pool[pickIndex(rng, pool.length)] ?? pool[0];

  // Extreme: alternate 20s and 25s per mural (even rounds 20, odd rounds 25).
  const timeLimit = difficulty === "extreme" ? (puzzleNumber % 2 === 0 ? 20 : 25) : band.timeLimit;

  if (choice) {
    return {
      id: puzzleNumber,
      seed,
      difficulty,
      start: choice.state,
      target,
      optimal: choice.depth,
      timeLimit,
    };
  }

  const solved = solvePuzzle(target, target);
  return {
    id: puzzleNumber,
    seed,
    difficulty,
    start: clonePegs(target),
    target,
    optimal: solved.length,
    timeLimit,
  };
}
