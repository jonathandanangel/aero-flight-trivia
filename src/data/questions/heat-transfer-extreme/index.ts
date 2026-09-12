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
import { htBananzaVisualQuestions, htBananzaVisualsByChapter } from "./ht-bananza-visuals";

const CHAPTER_BLOCKS: { id: keyof typeof htBananzaVisualsByChapter; base: Question[] }[] = [
  { id: "ht-ch02-03", base: ht_ch02_03_questions },
  { id: "ht-ch04", base: ht_ch04_questions },
  { id: "ht-ch05", base: ht_ch05_questions },
  { id: "ht-ch06", base: ht_ch06_questions },
  { id: "ht-ch07", base: ht_ch07_questions },
  { id: "ht-ch08", base: ht_ch08_questions },
  { id: "ht-ch09", base: ht_ch09_questions },
  { id: "ht-ch10", base: ht_ch10_questions },
  { id: "ht-ch11", base: ht_ch11_questions },
  { id: "ht-ch12", base: ht_ch12_questions },
  { id: "ht-ch13", base: ht_ch13_questions },
  { id: "ht-ch14", base: ht_ch14_questions },
];

function renumber(questions: Question[]): Question[] {
  return questions.map((question, index) => ({ ...question, globalNumber: index + 1 }));
}

/**
 * Canonical Heat Transfer Extreme Bananza text bank (400 questions).
 * Visual expansion cards are interleaved after each chapter in the full bank.
 */
export const heatTransferExtremeCoreQuestions: Question[] = renumber(
  CHAPTER_BLOCKS.flatMap((block) => block.base),
);

/** Visual Bananza expansion (~50 diagram questions). */
export const heatTransferExtremeExpansionQuestions: Question[] = htBananzaVisualQuestions;

/** Playable Bananza bank: each chapter's text cards followed by its visual cards. */
export const heatTransferExtremeQuestions: Question[] = renumber(
  CHAPTER_BLOCKS.flatMap((block) => [...block.base, ...(htBananzaVisualsByChapter[block.id] ?? [])]),
);

export const HT_CHAPTER_COUNTS = {
  "ht-ch02-03": 65 + (htBananzaVisualsByChapter["ht-ch02-03"]?.length ?? 0),
  "ht-ch04": 12 + (htBananzaVisualsByChapter["ht-ch04"]?.length ?? 0),
  "ht-ch05": 28 + (htBananzaVisualsByChapter["ht-ch05"]?.length ?? 0),
  "ht-ch06": 34 + (htBananzaVisualsByChapter["ht-ch06"]?.length ?? 0),
  "ht-ch07": 56 + (htBananzaVisualsByChapter["ht-ch07"]?.length ?? 0),
  "ht-ch08": 42 + (htBananzaVisualsByChapter["ht-ch08"]?.length ?? 0),
  "ht-ch09": 28 + (htBananzaVisualsByChapter["ht-ch09"]?.length ?? 0),
  "ht-ch10": 24 + (htBananzaVisualsByChapter["ht-ch10"]?.length ?? 0),
  "ht-ch11": 24 + (htBananzaVisualsByChapter["ht-ch11"]?.length ?? 0),
  "ht-ch12": 36 + (htBananzaVisualsByChapter["ht-ch12"]?.length ?? 0),
  "ht-ch13": 20 + (htBananzaVisualsByChapter["ht-ch13"]?.length ?? 0),
  "ht-ch14": 31 + (htBananzaVisualsByChapter["ht-ch14"]?.length ?? 0),
} as const;

export const HT_CORE_TOTAL = heatTransferExtremeCoreQuestions.length;
export const HT_TOTAL = heatTransferExtremeQuestions.length;
export const HT_VISUAL_TOTAL = heatTransferExtremeExpansionQuestions.length;
