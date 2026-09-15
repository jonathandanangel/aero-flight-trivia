import { CAPACITIES, type Move, type PegIndex, type Pegs } from "./types";

export function clonePegs(pegs: Pegs): Pegs {
  return [pegs[0].slice(), pegs[1].slice(), pegs[2].slice()];
}

export function encodePegs(pegs: Pegs): string {
  return `${pegs[0].join(".")}|${pegs[1].join(".")}|${pegs[2].join(".")}`;
}

export function pegsEqual(a: Pegs, b: Pegs): boolean {
  return encodePegs(a) === encodePegs(b);
}

export function topPiece(pegs: Pegs, peg: PegIndex): number | undefined {
  const stack = pegs[peg];
  return stack[stack.length - 1];
}

/** Only the tip of a root can move — nothing may sit on the chosen rune. */
export function canLift(pegs: Pegs, peg: PegIndex): boolean {
  return pegs[peg].length > 0;
}

export function canPlace(pegs: Pegs, to: PegIndex): boolean {
  return pegs[to].length < CAPACITIES[to];
}

export function isLegalMove(pegs: Pegs, move: Move): boolean {
  if (move.from === move.to) return false;
  return canLift(pegs, move.from) && canPlace(pegs, move.to);
}

export function applyMove(pegs: Pegs, move: Move): Pegs | null {
  if (!isLegalMove(pegs, move)) return null;
  const next = clonePegs(pegs);
  const piece = next[move.from].pop();
  if (piece === undefined) return null;
  next[move.to].push(piece);
  return next;
}

export function legalMoves(pegs: Pegs): Move[] {
  const moves: Move[] = [];
  for (let from = 0; from < 3; from++) {
    for (let to = 0; to < 3; to++) {
      const move = { from: from as PegIndex, to: to as PegIndex };
      if (isLegalMove(pegs, move)) moves.push(move);
    }
  }
  return moves;
}

/** A socket is correct when that rune sits on the same root at the same height. */
export function placementMask(current: Pegs, target: Pegs): boolean[] {
  const mask = Array.from({ length: 9 }, () => false);
  for (let peg = 0; peg < 3; peg++) {
    const stack = current[peg as PegIndex];
    const goal = target[peg as PegIndex];
    for (let i = 0; i < stack.length; i++) {
      const id = stack[i];
      if (id === undefined) continue;
      if (goal[i] === id) mask[id] = true;
    }
  }
  return mask;
}
