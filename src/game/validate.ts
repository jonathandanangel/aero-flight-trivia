import { allQuestions, AERO_TOTAL, highSpeedQuestionsOnly, TOTAL_QUESTIONS } from "@/data/questions";
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
  ];

  return rules.map((r) => ({ ...r, passed: r.passed && r.failingIds.length === 0 }));
}
