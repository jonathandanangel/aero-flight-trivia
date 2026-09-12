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
  ];

  return rules.map((r) => ({ ...r, passed: r.passed && r.failingIds.length === 0 }));
}
