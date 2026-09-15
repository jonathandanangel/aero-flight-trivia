import { applyMove, encodePegs, legalMoves, pegsEqual } from "./rules";
import type { Move, Pegs } from "./types";

type Node = { prev: string | null; move: Move | null; depth: number };

export type SolveResult = {
  solvable: boolean;
  length: number;
  path: Move[];
};

/**
 * Breadth-first search over legal root-to-root moves.
 * Guarantees the shortest path when one exists.
 */
export function solvePuzzle(start: Pegs, target: Pegs, limit = 22): SolveResult {
  if (pegsEqual(start, target)) return { solvable: true, length: 0, path: [] };

  const startKey = encodePegs(start);
  const queue: Pegs[] = [start];
  const seen = new Map<string, Node>();
  seen.set(startKey, { prev: null, move: null, depth: 0 });

  let head = 0;
  while (head < queue.length) {
    const state = queue[head++];
    if (!state) break;
    const key = encodePegs(state);
    const record = seen.get(key);
    if (!record || record.depth >= limit) continue;

    for (const move of legalMoves(state)) {
      const next = applyMove(state, move);
      if (!next) continue;
      const nextKey = encodePegs(next);
      if (seen.has(nextKey)) continue;
      seen.set(nextKey, { prev: key, move, depth: record.depth + 1 });
      if (pegsEqual(next, target)) {
        return {
          solvable: true,
          length: record.depth + 1,
          path: rebuildPath(seen, nextKey),
        };
      }
      queue.push(next);
    }
  }

  return { solvable: false, length: -1, path: [] };
}

function rebuildPath(seen: Map<string, Node>, endKey: string): Move[] {
  const path: Move[] = [];
  let cursor: string | null = endKey;
  while (cursor) {
    const node = seen.get(cursor);
    if (!node?.move || !node.prev) break;
    path.push(node.move);
    cursor = node.prev;
  }
  path.reverse();
  return path;
}

export function optimalLength(start: Pegs, target: Pegs): number {
  return solvePuzzle(start, target).length;
}
