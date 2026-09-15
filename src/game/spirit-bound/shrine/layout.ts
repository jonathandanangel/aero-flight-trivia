import { CAPACITIES, type PegIndex } from "./types";

export const TREE_W = 200;
export const TREE_H = 180;

/** Named sockets: 1-2 top, 3-4, 5-6, then 7-8-9 on the base. */
export const SLOT_LABEL: readonly [readonly number[], readonly number[], readonly number[]] = [
  [7, 5, 3, 1],
  [8, 0, 0, 0],
  [9, 6, 4, 2],
];

type Point = { x: number; y: number };

const LEFT_X = 58;
const RIGHT_X = 142;
const SPINE_X = 100;
const ROW_Y = [148, 108, 68, 28] as const;
const BASE_Y = 148;

export function slotPoint(peg: PegIndex, height: number): Point {
  if (peg === 0) return { x: LEFT_X, y: ROW_Y[height] ?? BASE_Y };
  if (peg === 2) return { x: RIGHT_X, y: ROW_Y[height] ?? BASE_Y };
  if (height === 0) return { x: SPINE_X, y: BASE_Y };
  return { x: SPINE_X, y: ROW_Y[height] ?? BASE_Y };
}

export function pegAtLabel(label: number): { peg: PegIndex; height: number } | null {
  for (let peg = 0; peg < 3; peg++) {
    const row = SLOT_LABEL[peg as PegIndex];
    const height = row.indexOf(label);
    if (height >= 0) return { peg: peg as PegIndex, height };
  }
  return null;
}

export function allSockets(): { peg: PegIndex; height: number; label: number }[] {
  const out: { peg: PegIndex; height: number; label: number }[] = [];
  for (let peg = 0; peg < 3; peg++) {
    const cap = CAPACITIES[peg as PegIndex];
    for (let height = 0; height < cap; height++) {
      const label = SLOT_LABEL[peg as PegIndex][height] ?? 0;
      out.push({ peg: peg as PegIndex, height, label });
    }
  }
  return out;
}
