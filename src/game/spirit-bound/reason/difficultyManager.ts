import type { ChallengeType, ReasonTier } from "./types";

export function sprintTier(cleared: number): ReasonTier {
  if (cleared < 3) return 1;
  if (cleared < 6) return 2;
  if (cleared < 10) return 3;
  if (cleared < 14) return 4;
  if (cleared < 18) return 5;
  if (cleared < 22) return 6;
  return 7;
}

export function chapterTier(chapter: number): ReasonTier {
  const n = Math.min(7, Math.max(1, chapter));
  return n as ReasonTier;
}

export function adaptEndless(tier: ReasonTier, correct: boolean, ms: number): ReasonTier {
  if (!correct) return Math.max(1, tier - 1) as ReasonTier;
  if (ms < 1800 && tier < 7) return ((tier + 1) as ReasonTier);
  if (ms > 4500 && tier > 1) return ((tier - 1) as ReasonTier);
  return tier;
}

export function typesForTier(tier: ReasonTier, hasOwn: boolean, hasEvents: boolean): ChallengeType[] {
  const types: ChallengeType[] = ["position", "order", "compare"];
  if (hasOwn) types.push("own");
  if (tier >= 3) types.push("negation");
  if (tier >= 4) types.push("compound");
  if (tier >= 5) types.push("doubleNeg");
  if (tier >= 6) types.push("mixed");
  if (tier >= 7 && hasEvents) types.push("temporal");
  return types;
}

export function chapterFocus(chapter: number): ChallengeType | null {
  if (chapter === 1) return "position";
  if (chapter === 2) return "position";
  if (chapter === 3) return "compare";
  if (chapter === 4) return "negation";
  if (chapter === 5) return "compound";
  if (chapter === 6) return "doubleNeg";
  return null;
}

export function directionalVoice(chapter: number): boolean {
  return chapter === 2;
}

export function tierLabel(tier: ReasonTier): string {
  if (tier === 1) return "WATCH";
  if (tier === 2) return "BRIEFING";
  if (tier === 3) return "OMEN";
  if (tier === 4) return "TWINNED";
  if (tier === 5) return "SEALED";
  if (tier === 6) return "CIPHER";
  return "KING'S EYE";
}
