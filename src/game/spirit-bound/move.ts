/** Shared overworld movement — delta-time based for smooth, fast walking. */

import { isDown } from "@/game/spirit-bound/useKeys";

export type Facing = "up" | "down" | "left" | "right";

/** Pixels per second (~35% faster than the old 1.9px/frame @ 60fps). */
export const HERO_SPEED = 155;

/** Clamp frame spikes so movement stays stable. */
export function frameDt(now: number, last: number): number {
  return Math.min(0.05, Math.max(0, (now - last) / 1000));
}

/** Unit axes from held keys; diagonal movement is normalized. */
export function moveFromKeys(held: Set<string>): { ax: number; ay: number; facing: Facing | null } {
  let ax = 0;
  let ay = 0;
  let facing: Facing | null = null;
  if (isDown(held, "ArrowLeft", "a", "A")) {
    ax -= 1;
    facing = "left";
  }
  if (isDown(held, "ArrowRight", "d", "D")) {
    ax += 1;
    facing = "right";
  }
  if (isDown(held, "ArrowUp", "w", "W")) {
    ay -= 1;
    facing = "up";
  }
  if (isDown(held, "ArrowDown", "s", "S")) {
    ay += 1;
    facing = "down";
  }
  const len = Math.hypot(ax, ay);
  if (len > 0) {
    ax /= len;
    ay /= len;
  }
  return { ax, ay, facing };
}

export function isWalking(held: Set<string>): boolean {
  return isDown(
    held,
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "a",
    "A",
    "d",
    "D",
    "w",
    "W",
    "s",
    "S",
  );
}
