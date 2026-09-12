import {
  extremeV2Questions,
  EXTREME_V2_CORE_TOTAL,
  EXTREME_V2_TOTAL,
} from "@/data/questions/extreme-v2";

export {
  extremeV2CoreQuestions,
  extremeV2ExpansionQuestions,
  extremeV2Questions,
  EXTREME_V2_CORE_TOTAL,
  EXTREME_V2_TOTAL,
} from "@/data/questions/extreme-v2";

/** Inferno begins halfway through the current Extreme V2 bank. */
export const EXTREME_V2_INFERNO_START_INDEX = Math.floor(EXTREME_V2_TOTAL / 2);

export const EXTREME_V2_QUIZ_TOTAL = EXTREME_V2_CORE_TOTAL;

export type ExtremeFamilyMode = "extreme" | "extreme-v2" | "ht-extreme" | "ht-intro";

export function isExtremeFamily(mode: string): mode is ExtremeFamilyMode {
  return (
    mode === "extreme" ||
    mode === "extreme-v2" ||
    mode === "ht-extreme" ||
    mode === "ht-intro"
  );
}
