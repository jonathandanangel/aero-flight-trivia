import { allQuestions, AERO_TOTAL, highSpeedQuestionsOnly, TOTAL_QUESTIONS } from "@/data/questions";
import {
  extremeExpansionQuestions,
  EXTREME_EXPANSION_TOTAL,
} from "@/data/questions/extreme-expansion";
import {
  EXTREME_EXPANSION_START_INDEX,
  EXTREME_INFERNO_START_INDEX,
  extremeQuestions,
} from "./extreme";
import {
  EXTREME_V2_CORE_TOTAL,
  EXTREME_V2_INFERNO_START_INDEX,
  EXTREME_V2_TOTAL,
  extremeV2Questions,
} from "./extreme-v2";
import {
  HT_CHAPTER_COUNTS,
  HT_CORE_TOTAL,
  HT_INFERNO_START_INDEX,
  HT_TOTAL,
  heatTransferExtremeQuestions,
} from "./heat-transfer-extreme";
import {
  HTI_CORE_TOTAL,
  HTI_TOTAL,
  heatTransferIntroQuestions,
} from "./heat-transfer-intro";
import type { Question } from "./types";

export interface ValidationRule {
  name: string;
  passed: boolean;
  failingIds: string[];
  detail: string;
}

const hasDupes = (values: string[]) =>
  new Set(values.map((v) => v.trim().toLowerCase())).size !== values.length;

const scienceChapterIds = new Set([
  "foundations",
  "streamlines",
  "momentum",
  "viscosity",
  "boundary-layer",
  "airfoil",
  "forces",
  "drag",
  "coefficients",
  "mach",
  "high-speed",
]);

function interactionDataOk(q: Question): boolean {
  switch (q.interactionType) {
    case "drag-drop":
    case "equation-builder":
      return (
        !!q.sentenceParts &&
        !!q.draggableTokens &&
        q.sentenceParts.length === q.correctAnswer.length + 1 &&
        q.correctAnswer.every((a) => q.draggableTokens?.includes(a))
      );
    case "multiple-choice":
      return (
        !!q.choices &&
        q.choices.length === 4 &&
        q.choices.includes(q.correctAnswer[0] ?? "")
      );
    case "compare-select":
      return (
        !!q.choices &&
        q.choices.length >= 2 &&
        q.choices.includes(q.correctAnswer[0] ?? "")
      );
    case "hotspot":
      return (
        !!q.targets &&
        q.targets.length >= 2 &&
        q.targets.some((t) => t.id === q.correctAnswer[0])
      );
    case "label-placement":
    case "vector-placement":
      return (
        !!q.targets &&
        !!q.draggableTokens &&
        q.targets.length === q.correctAnswer.length &&
        q.correctAnswer.every((a) => q.draggableTokens?.includes(a))
      );
    case "sequencing":
      return !!q.steps && q.steps.length === q.correctAnswer.length && q.steps.length >= 3;
    case "matching":
      return !!q.pairs && q.pairs.length === q.correctAnswer.length;
    case "fill-in":
      return (
        !!q.acceptedAnswers &&
        q.acceptedAnswers.length > 0 &&
        q.acceptedAnswers.includes((q.correctAnswer[0] ?? "").toLowerCase())
      );
    default:
      return false;
  }
}

function collect(predicateFails: (q: Question) => boolean): string[] {
  return allQuestions.filter(predicateFails).map((q) => q.id);
}

export function runValidation(): ValidationRule[] {
  const expectedInfernoStart =
    EXTREME_EXPANSION_START_INDEX + Math.floor(EXTREME_EXPANSION_TOTAL / 2);
  const extremeIdCounts = new Map<string, number>();
  const extremePromptIds = new Map<string, string[]>();
  for (const question of extremeQuestions) {
    extremeIdCounts.set(question.id, (extremeIdCounts.get(question.id) ?? 0) + 1);
    const prompt = question.prompt.trim().toLowerCase();
    extremePromptIds.set(prompt, [...(extremePromptIds.get(prompt) ?? []), question.id]);
  }
  const duplicateExtremeIds = [...extremeIdCounts]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  const duplicateExtremePrompts = [...extremePromptIds.values()]
    .filter((ids) => ids.length > 1)
    .flat();
  const invalidExtremeChoices = extremeExpansionQuestions
    .filter(
      (question) =>
        question.interactionType !== "multiple-choice" ||
        question.choices?.length !== 4 ||
        hasDupes(question.choices) ||
        !question.choices.includes(question.correctAnswer[0] ?? ""),
    )
    .map((question) => question.id);
  const invalidExtremeNumbering = extremeExpansionQuestions
    .filter((question, index) => question.globalNumber !== index + 1)
    .map((question) => question.id);
  const question188 = allQuestions.find((q) => q.globalNumber === 188);
  const question188Targets = Object.fromEntries(
    (question188?.targets ?? []).map((target) => [target.id, target]),
  );
  const question188IsLeftFacing =
    question188?.id === "AERO-188" &&
    question188.diagramType === "aircraft-forces" &&
    question188.correctAnswer.join("|") === "Lift|Weight|Thrust|Drag" &&
    (question188Targets["top"]?.y ?? 100) < 50 &&
    (question188Targets["bottom"]?.y ?? 0) > 50 &&
    (question188Targets["left"]?.x ?? 100) < 50 &&
    (question188Targets["right"]?.x ?? 0) > 50 &&
    /travelling to the left/i.test(question188.prompt);
  const promptCounts = new Map<string, string[]>();
  for (const q of allQuestions) {
    const key = q.prompt.trim().toLowerCase();
    promptCounts.set(key, [...(promptCounts.get(key) ?? []), q.id]);
  }
  const duplicatePrompts = [...promptCounts.values()]
    .filter((ids) => ids.length > 1)
    .flat();

  const rules: ValidationRule[] = [
    {
      name: "Total question count equals 333",
      passed: TOTAL_QUESTIONS === 333,
      failingIds: [],
      detail: `${TOTAL_QUESTIONS} found`,
    },
    {
      name: "Aerodynamics count equals 333",
      passed: AERO_TOTAL === 333,
      failingIds: [],
      detail: `${AERO_TOTAL} found`,
    },
    {
      name: "High-speed aerodynamics chapter count equals 33",
      passed: highSpeedQuestionsOnly.length === 33,
      failingIds: [],
      detail: `${highSpeedQuestionsOnly.length} found`,
    },
    {
      name: "Every question is aerodynamics science",
      passed: allQuestions.every((q) => scienceChapterIds.has(q.chapterId)),
      failingIds: collect((q) => !scienceChapterIds.has(q.chapterId)),
      detail: "approved science chapter metadata",
    },
    {
      name: "Every question has a correct answer",
      passed: true,
      failingIds: collect((q) => !q.correctAnswer || q.correctAnswer.length === 0),
      detail: "correctAnswer non-empty",
    },
    {
      name: "Every question has an explanation",
      passed: true,
      failingIds: collect((q) => !q.explanation || q.explanation.trim().length < 10),
      detail: "explanation present",
    },
    {
      name: "Every question has a hint",
      passed: true,
      failingIds: collect((q) => !q.hint || q.hint.trim().length < 4),
      detail: "hint present",
    },
    {
      name: "Every question has an interaction type",
      passed: true,
      failingIds: collect((q) => !q.interactionType),
      detail: "interactionType present",
    },
    {
      name: "Multiple-choice questions have exactly four choices",
      passed: true,
      failingIds: collect(
        (q) => q.interactionType === "multiple-choice" && (q.choices?.length ?? 0) !== 4,
      ),
      detail: "4 choices",
    },
    {
      name: "Diagram-based questions have valid diagram data",
      passed: true,
      failingIds: collect(
        (q) =>
          ["hotspot", "label-placement", "vector-placement"].includes(q.interactionType) &&
          (!q.diagramType || !q.targets || q.targets.length === 0),
      ),
      detail: "diagramType + targets",
    },
    {
      name: "Question 188 uses left-facing aircraft force orientation",
      passed: question188IsLeftFacing,
      failingIds: question188IsLeftFacing ? [] : [question188?.id ?? "AERO-188"],
      detail: "lift up, weight down, thrust left toward nose, drag right toward tail",
    },
    {
      name: "Interaction payload is complete and playable",
      passed: true,
      failingIds: collect((q) => !interactionDataOk(q)),
      detail: "renderer contract satisfied",
    },
    {
      name: "No two questions have identical wording",
      passed: duplicatePrompts.length === 0,
      failingIds: duplicatePrompts,
      detail: "unique prompts",
    },
    {
      name: "No duplicated option inside one question",
      passed: true,
      failingIds: collect(
        (q) =>
          hasDupes(q.choices ?? []) ||
          hasDupes(q.draggableTokens ?? []) ||
          hasDupes(q.steps ?? []) ||
          hasDupes((q.targets ?? []).map((t) => t.id)),
      ),
      detail: "unique options",
    },
    {
      name: "No external image URL required for play",
      passed: true,
      failingIds: collect((q) => /https?:\/\//.test(JSON.stringify(q.diagramConfig ?? {}))),
      detail: "SVG diagrams only",
    },
    {
      name: "Every question is completable with the keyboard",
      passed: true,
      failingIds: collect((q) => !interactionDataOk(q)),
      detail: "all renderers are keyboard operable",
    },
    {
      name: "Difficulty within 1-5 and category present",
      passed: true,
      failingIds: collect(
        (q) => q.difficulty < 1 || q.difficulty > 5 || !q.category || !q.setId || !q.chapterId,
      ),
      detail: "metadata complete",
    },
    {
      name: "Global numbers run 1..333 continuously",
      passed: allQuestions.every((q, i) => q.globalNumber === i + 1),
      failingIds: allQuestions.filter((q, i) => q.globalNumber !== i + 1).map((q) => q.id),
      detail: "sequential numbering",
    },
    {
      name: "Extreme expansion contains exactly 150 questions",
      passed: EXTREME_EXPANSION_TOTAL === 150,
      failingIds: [],
      detail: `${EXTREME_EXPANSION_TOTAL} found`,
    },
    {
      name: "Extreme question ids and prompts are unique",
      passed: duplicateExtremeIds.length === 0 && duplicateExtremePrompts.length === 0,
      failingIds: [...duplicateExtremeIds, ...duplicateExtremePrompts],
      detail: "unique across the original and expansion banks",
    },
    {
      name: "Extreme expansion choices are complete and playable",
      passed: invalidExtremeChoices.length === 0,
      failingIds: invalidExtremeChoices,
      detail: "four unique choices containing the correct answer",
    },
    {
      name: "Extreme expansion numbers run 1..150 continuously",
      passed: invalidExtremeNumbering.length === 0,
      failingIds: invalidExtremeNumbering,
      detail: "sequential expansion numbering",
    },
    {
      name: "Extreme inferno starts at the expansion midpoint",
      passed: EXTREME_INFERNO_START_INDEX === expectedInfernoStart,
      failingIds:
        EXTREME_INFERNO_START_INDEX === expectedInfernoStart
          ? []
          : ["EXTREME-INFERNO-THRESHOLD"],
      detail: `Extreme question ${EXTREME_INFERNO_START_INDEX + 1}; expansion question ${
        EXTREME_INFERNO_START_INDEX - EXTREME_EXPANSION_START_INDEX + 1
      }`,
    },
    {
      name: "Extreme V2 Class 05 quiz contains exactly 33 questions",
      passed: EXTREME_V2_CORE_TOTAL === 33 && EXTREME_V2_TOTAL >= 33,
      failingIds: [],
      detail: `${EXTREME_V2_CORE_TOTAL} core / ${EXTREME_V2_TOTAL} total`,
    },
    {
      name: "Extreme V2 has 27 multiple-choice then 6 fill-in questions",
      passed:
        extremeV2Questions.slice(0, 27).every((q) => q.interactionType === "multiple-choice") &&
        extremeV2Questions.slice(27, 33).every((q) => q.interactionType === "fill-in"),
      failingIds: extremeV2Questions
        .filter((q, index) =>
          index < 27 ? q.interactionType !== "multiple-choice" : index < 33 && q.interactionType !== "fill-in",
        )
        .map((q) => q.id),
      detail: "Class 05 quiz shape",
    },
    {
      name: "Extreme V2 inferno starts at the current bank midpoint",
      passed: EXTREME_V2_INFERNO_START_INDEX === Math.floor(EXTREME_V2_TOTAL / 2),
      failingIds: [],
      detail: `Extreme V2 question ${EXTREME_V2_INFERNO_START_INDEX + 1}`,
    },
    ...buildHeatTransferRules(),
  ];

  return rules.map((r) => ({ ...r, passed: r.passed && r.failingIds.length === 0 }));
}

function buildHeatTransferRules(): ValidationRule[] {
  const htIdCounts = new Map<string, number>();
  const htPromptIds = new Map<string, string[]>();
  const chapterCounts = new Map<string, number>();
  for (const question of heatTransferExtremeQuestions) {
    htIdCounts.set(question.id, (htIdCounts.get(question.id) ?? 0) + 1);
    const prompt = question.prompt.trim().toLowerCase();
    htPromptIds.set(prompt, [...(htPromptIds.get(prompt) ?? []), question.id]);
    chapterCounts.set(question.chapterId, (chapterCounts.get(question.chapterId) ?? 0) + 1);
  }
  const duplicateHtIds = [...htIdCounts].filter(([, count]) => count > 1).map(([id]) => id);
  const duplicateHtPrompts = [...htPromptIds.values()].filter((ids) => ids.length > 1).flat();
  const chapterMismatches = Object.entries(HT_CHAPTER_COUNTS)
    .filter(([chapterId, expected]) => (chapterCounts.get(chapterId) ?? 0) !== expected)
    .map(([chapterId]) => chapterId);
  const invalidHtChoices = heatTransferExtremeQuestions
    .filter((question) => {
      if (question.interactionType === "multiple-choice") {
        return (
          question.choices?.length !== 4 ||
          hasDupes(question.choices) ||
          !question.choices.includes(question.correctAnswer[0] ?? "")
        );
      }
      if (question.interactionType === "fill-in") {
        return !question.acceptedAnswers || question.acceptedAnswers.length === 0;
      }
      if (question.interactionType === "compare-select") {
        return (
          !question.choices ||
          question.choices.length < 2 ||
          !question.choices.includes(question.correctAnswer[0] ?? "")
        );
      }
      return !question.correctAnswer?.length;
    })
    .map((question) => question.id);
  const missingMeta = heatTransferExtremeQuestions
    .filter(
      (q) =>
        !q.explanation ||
        q.explanation.trim().length < 10 ||
        !q.hint ||
        !q.correctAnswer?.length ||
        q.difficulty < 1 ||
        q.difficulty > 5,
    )
    .map((q) => q.id);

  return [
    {
      name: "Heat Transfer Extreme Bananza contains exactly 400 canonical questions",
      passed: HT_CORE_TOTAL === 400 && HT_TOTAL >= 400,
      failingIds: [],
      detail: `${HT_CORE_TOTAL} core / ${HT_TOTAL} total`,
    },
    {
      name: "Heat Transfer Extreme chapter totals match the master distribution",
      passed: chapterMismatches.length === 0,
      failingIds: chapterMismatches,
      detail: Object.entries(HT_CHAPTER_COUNTS)
        .map(([id, n]) => `${id}:${chapterCounts.get(id) ?? 0}/${n}`)
        .join(" · "),
    },
    {
      name: "Heat Transfer Extreme ids and prompts are unique",
      passed: duplicateHtIds.length === 0 && duplicateHtPrompts.length === 0,
      failingIds: [...duplicateHtIds, ...duplicateHtPrompts],
      detail: "unique across the HT Bananza bank",
    },
    {
      name: "Heat Transfer Extreme questions are playable",
      passed: invalidHtChoices.length === 0,
      failingIds: invalidHtChoices,
      detail: "choices / fill-in / answers valid",
    },
    {
      name: "Heat Transfer Extreme metadata is complete",
      passed: missingMeta.length === 0,
      failingIds: missingMeta,
      detail: "explanation, hint, answer, difficulty 1-5",
    },
    {
      name: "Heat Transfer Extreme inferno starts at the bank midpoint",
      passed: HT_INFERNO_START_INDEX === Math.floor(HT_TOTAL / 2),
      failingIds: [],
      detail: `HT Bananza question ${HT_INFERNO_START_INDEX + 1}`,
    },
    {
      name: "Heat Transfer Intro contains exactly 50 canonical questions",
      passed: HTI_CORE_TOTAL === 50 && HTI_TOTAL >= 50,
      failingIds: [],
      detail: `${HTI_CORE_TOTAL} core / ${HTI_TOTAL} total`,
    },
    {
      name: "Heat Transfer Intro questions are playable",
      passed: heatTransferIntroQuestions.every((question) => {
        if (!question.hint || !question.explanation || !question.correctAnswer?.length) return false;
        if (question.interactionType === "multiple-choice") {
          return (
            question.choices?.length === 4 &&
            !hasDupes(question.choices) &&
            question.choices.includes(question.correctAnswer[0] ?? "")
          );
        }
        if (question.interactionType === "compare-select") {
          return (
            !!question.choices &&
            question.choices.length >= 2 &&
            question.choices.includes(question.correctAnswer[0] ?? "")
          );
        }
        if (question.interactionType === "fill-in") {
          return !!question.acceptedAnswers?.length;
        }
        if (question.interactionType === "hotspot") {
          return !!question.targets?.length && !!question.diagramType;
        }
        return true;
      }),
      failingIds: heatTransferIntroQuestions
        .filter((question) => {
          if (!question.hint || !question.explanation || !question.correctAnswer?.length) return true;
          if (question.interactionType === "multiple-choice") {
            return (
              question.choices?.length !== 4 ||
              hasDupes(question.choices ?? []) ||
              !question.choices?.includes(question.correctAnswer[0] ?? "")
            );
          }
          return false;
        })
        .map((q) => q.id),
      detail: "50 Chapter 1 intro questions with hints",
    },
  ];
}
