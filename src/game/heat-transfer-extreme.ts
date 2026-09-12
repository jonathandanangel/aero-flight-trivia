import { stableShuffle } from "@/game/answer";
import {
  heatTransferExtremeQuestions as rawQuestions,
  HT_CORE_TOTAL,
  HT_TOTAL,
  HT_CHAPTER_COUNTS,
  heatTransferExtremeCoreQuestions,
  heatTransferExtremeExpansionQuestions,
} from "@/data/questions/heat-transfer-extreme";
import type { Question } from "@/game/types";

function withShuffledChoices(question: Question): Question {
  if (question.interactionType !== "multiple-choice" || !question.choices) return question;
  return {
    ...question,
    choices: stableShuffle(question.choices, question.id),
  };
}

export const heatTransferExtremeQuestions: Question[] = rawQuestions.map(withShuffledChoices);

export {
  heatTransferExtremeCoreQuestions,
  heatTransferExtremeExpansionQuestions,
  HT_CORE_TOTAL,
  HT_TOTAL,
  HT_CHAPTER_COUNTS,
};

/** Inferno begins halfway through the current Heat Transfer Extreme bank. */
export const HT_INFERNO_START_INDEX = Math.floor(HT_TOTAL / 2);

export const HT_QUIZ_TOTAL = HT_CORE_TOTAL;
