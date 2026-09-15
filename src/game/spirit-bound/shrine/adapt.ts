import type { Difficulty } from "./types";

export const LADDER: Difficulty[] = ["easy", "medium", "hard", "expert"];

export function nextDifficulty(current: Difficulty, dir: 1 | -1 | 0): Difficulty {
  const i = Math.max(0, LADDER.indexOf(current));
  return LADDER[Math.max(0, Math.min(LADDER.length - 1, i + dir))] ?? "medium";
}

/** Faster solves climb. Slow solves ease off. */
export function adaptDifficulty(current: Difficulty, secondsSpent: number, timeLimit: number): Difficulty {
  const ratio = timeLimit > 0 ? secondsSpent / timeLimit : 1;
  if (secondsSpent <= 18 || ratio <= 0.28) return nextDifficulty(current, 1);
  if (secondsSpent >= 50 || ratio >= 0.72) return nextDifficulty(current, -1);
  return current;
}
