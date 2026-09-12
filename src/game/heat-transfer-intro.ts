import { stableShuffle } from "@/game/answer";
import {
  heatTransferIntroQuestions as rawQuestions,
  HTI_CORE_TOTAL,
  HTI_TOTAL,
  HTI_STAGE_COUNTS,
  heatTransferIntroCoreQuestions,
  heatTransferIntroExpansionQuestions,
} from "@/data/questions/heat-transfer-intro";
import type { Question } from "@/game/types";

function withShuffledChoices(question: Question): Question {
  if (question.interactionType !== "multiple-choice" || !question.choices) return question;
  return {
    ...question,
    choices: stableShuffle(question.choices, question.id),
  };
}

export const heatTransferIntroQuestions: Question[] = rawQuestions.map(withShuffledChoices);

export {
  heatTransferIntroCoreQuestions,
  heatTransferIntroExpansionQuestions,
  HTI_CORE_TOTAL,
  HTI_TOTAL,
  HTI_STAGE_COUNTS,
};

/** Inferno begins halfway through Heat Transfer Intro (kept mild for Intro). */
export const HTI_INFERNO_START_INDEX = Math.floor(HTI_TOTAL / 2);

export const HTI_QUIZ_TOTAL = HTI_CORE_TOTAL;
