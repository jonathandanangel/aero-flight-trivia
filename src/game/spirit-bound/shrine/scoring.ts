import type { ScoreBreakdown, Stars } from "./types";

export function rateStars(completed: boolean, moves: number, optimal: number): Stars {
  if (!completed) return 0;
  if (optimal <= 0) return 1;
  if (moves <= Math.ceil(optimal * 1.05) || moves <= optimal + 1) return 3;
  if (moves <= Math.ceil(optimal * 1.25)) return 2;
  return 1;
}

export function scorePuzzle(input: {
  completed: boolean;
  moves: number;
  optimal: number;
  secondsLeft: number;
  timeLimit: number;
}): ScoreBreakdown {
  const { completed, moves, optimal, secondsLeft, timeLimit } = input;
  const stars = rateStars(completed, moves, optimal);
  const accuracy = completed ? 500 : 0;
  const efficiency = completed && moves > 0 && optimal > 0
    ? Math.round(300 * Math.min(1.15, optimal / moves))
    : 0;
  const speed = completed && timeLimit > 0
    ? Math.round(200 * Math.max(0, Math.min(1, secondsLeft / timeLimit)))
    : 0;
  return {
    accuracy,
    efficiency,
    speed,
    total: accuracy + efficiency + speed,
    stars,
    completed,
  };
}

export const ACHIEVEMENTS = {
  first_clear: "Sealed the mural",
  three_stars: "Near-perfect alignment",
  optimal_path: "Walked the shortest path",
  speed_run: "Finished with time to spare",
  patient: "Held the last heartbeat",
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;

export function unlockAchievements(input: {
  completed: boolean;
  stars: Stars;
  moves: number;
  optimal: number;
  secondsLeft: number;
}): AchievementId[] {
  if (!input.completed) return [];
  const unlocked: AchievementId[] = ["first_clear"];
  if (input.stars === 3) unlocked.push("three_stars");
  if (input.moves <= input.optimal) unlocked.push("optimal_path");
  if (input.secondsLeft >= 45) unlocked.push("speed_run");
  if (input.secondsLeft > 0 && input.secondsLeft <= 5) unlocked.push("patient");
  return unlocked;
}
