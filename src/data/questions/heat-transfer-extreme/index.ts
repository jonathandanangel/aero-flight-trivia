import type { Question } from "@/game/types";
import { ht_ch02_03_questions } from "./ht-ch02-03";
import { ht_ch04_questions } from "./ht-ch04";
import { ht_ch05_questions } from "./ht-ch05";
import { ht_ch06_questions } from "./ht-ch06";
import { ht_ch07_questions } from "./ht-ch07";
import { ht_ch08_questions } from "./ht-ch08";
import { ht_ch09_questions } from "./ht-ch09";
import { ht_ch10_questions } from "./ht-ch10";
import { ht_ch11_questions } from "./ht-ch11";
import { ht_ch12_questions } from "./ht-ch12";
import { ht_ch13_questions } from "./ht-ch13";
import { ht_ch14_questions } from "./ht-ch14";

/**
 * Canonical Heat Transfer Extreme Bananza bank (400 questions).
 * Future expansions append to heatTransferExtremeExpansionQuestions without altering this core.
 */
export const heatTransferExtremeCoreQuestions: Question[] = [
  ...ht_ch02_03_questions,
  ...ht_ch04_questions,
  ...ht_ch05_questions,
  ...ht_ch06_questions,
  ...ht_ch07_questions,
  ...ht_ch08_questions,
  ...ht_ch09_questions,
  ...ht_ch10_questions,
  ...ht_ch11_questions,
  ...ht_ch12_questions,
  ...ht_ch13_questions,
  ...ht_ch14_questions,
];

/** Optional future expansion cards — keep empty until you add more. */
export const heatTransferExtremeExpansionQuestions: Question[] = [];

export const heatTransferExtremeQuestions: Question[] = [
  ...heatTransferExtremeCoreQuestions,
  ...heatTransferExtremeExpansionQuestions,
];

export const HT_CHAPTER_COUNTS = {
  "ht-ch02-03": 65,
  "ht-ch04": 12,
  "ht-ch05": 28,
  "ht-ch06": 34,
  "ht-ch07": 56,
  "ht-ch08": 42,
  "ht-ch09": 28,
  "ht-ch10": 24,
  "ht-ch11": 24,
  "ht-ch12": 36,
  "ht-ch13": 20,
  "ht-ch14": 31,
} as const;

export const HT_CORE_TOTAL = heatTransferExtremeCoreQuestions.length;
export const HT_TOTAL = heatTransferExtremeQuestions.length;
