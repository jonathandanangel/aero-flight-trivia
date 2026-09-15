import type { ComboRank, ReasonAchievementId, ReasonScore, ReasonTier } from "./types";

export type { ReasonAchievementId };

export const ACHIEVEMENTS: Record<ReasonAchievementId, string> = {
  truth_seeker: "Truth Seeker",
  master_analyst: "Master Analyst",
  perfect_record: "Perfect Record",
  logic_savant: "Logic Savant",
  instant_deduction: "Instant Deduction",
  legendary_investigator: "Legendary Investigator",
};

export function comboRank(streak: number): ComboRank {
  if (streak >= 20) return "master";
  if (streak >= 10) return "gold";
  if (streak >= 5) return "silver";
  return "none";
}

export function comboLabel(rank: ComboRank): string | null {
  if (rank === "master") return "MASTER REASONER";
  if (rank === "gold") return "GOLD";
  if (rank === "silver") return "SILVER";
  return null;
}

export function comboMultiplier(streak: number): number {
  const rank = comboRank(streak);
  if (rank === "master") return 3;
  if (rank === "gold") return 2;
  if (rank === "silver") return 1.5;
  return 1;
}

export function basePoints(tier: ReasonTier): number {
  return 80 + tier * 20;
}

export function speedBonus(ms: number): number {
  if (ms <= 800) return 70;
  if (ms <= 1200) return 50;
  if (ms <= 2000) return 30;
  if (ms <= 3200) return 12;
  return 0;
}

export function missPenalty(tier: ReasonTier): number {
  return 30 + tier * 5;
}

export function scoreAfterAnswer(input: {
  prev: ReasonScore;
  correct: boolean;
  tier: ReasonTier;
  ms: number;
  answered: number;
  correctCount: number;
}): { score: ReasonScore; instant: boolean; rankUp: ComboRank | null } {
  const combo = input.correct ? input.prev.combo + 1 : 0;
  const mult = comboMultiplier(combo);
  const base = basePoints(input.tier);
  const speed = input.correct ? speedBonus(input.ms) : 0;
  const comboGain = input.correct ? Math.round(base * (mult - 1)) : 0;
  const correctBank = input.prev.correctBank + (input.correct ? base : 0);
  const speedBank = input.prev.speedBank + speed;
  const comboBank = input.prev.comboBank + comboGain;
  const penalty = input.prev.penalty + (input.correct ? 0 : missPenalty(input.tier));
  const accuracy = input.answered <= 0 ? 1 : input.correctCount / input.answered;
  const total = Math.max(
    0,
    Math.round(correctBank * accuracy + speedBank + comboBank - penalty),
  );
  const rank = comboRank(combo);
  const prevRank = comboRank(input.prev.combo);
  return {
    score: {
      total,
      correctBank,
      speedBank,
      comboBank,
      penalty,
      accuracy,
      combo,
      multiplier: mult,
      rank,
    },
    instant: input.correct && input.ms <= 800,
    rankUp: input.correct && rank !== prevRank && rank !== "none" ? rank : null,
  };
}

export const EMPTY_SCORE: ReasonScore = {
  total: 0,
  correctBank: 0,
  speedBank: 0,
  comboBank: 0,
  penalty: 0,
  accuracy: 1,
  combo: 0,
  multiplier: 1,
  rank: "none",
};

export function unlockAchievements(input: {
  correctCount: number;
  answered: number;
  misses: number;
  comboBest: number;
  instant: boolean;
  savant: boolean;
  kind: "sprint" | "endless" | "campaign";
  over: boolean;
}): ReasonAchievementId[] {
  const out: ReasonAchievementId[] = [];
  if (input.correctCount >= 10) out.push("truth_seeker");
  if (input.correctCount >= 20) out.push("master_analyst");
  if (input.instant) out.push("instant_deduction");
  if (input.savant) out.push("logic_savant");
  if (input.comboBest >= 20) out.push("legendary_investigator");
  if (
    input.over &&
    input.kind === "sprint" &&
    input.answered >= 8 &&
    input.misses === 0
  ) {
    out.push("perfect_record");
  }
  return out;
}

export function xpForCorrect(tier: ReasonTier): number {
  return 8 + tier * 2;
}

export function chapterRewardRupees(chapter: number): number {
  return 8 + chapter * 4;
}
