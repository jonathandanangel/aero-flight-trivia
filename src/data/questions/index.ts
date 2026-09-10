import type { Question } from "@/game/types";
import type { QuestionSeed } from "@/game/seed";
import { chapterAQuestions } from "./a-foundations";
import { chapterBQuestions } from "./b-streamlines";
import { chapterCQuestions } from "./c-momentum";
import { chapterDQuestions } from "./d-viscosity";
import { chapterEQuestions } from "./e-boundary-layer";
import { chapterFQuestions } from "./f-airfoil";
import { chapterGQuestions } from "./g-forces";
import { chapterHQuestions } from "./h-drag";
import { chapterIQuestions } from "./i-coefficients";
import { chapterJQuestions } from "./j-mach";
import { highSpeedQuestions } from "./k-high-speed";

const pad = (n: number, width: number) => String(n).padStart(width, "0");

const aeroSeeds: QuestionSeed[] = [
  ...chapterAQuestions,
  ...chapterBQuestions,
  ...chapterCQuestions,
  ...chapterDQuestions,
  ...chapterEQuestions,
  ...chapterFQuestions,
  ...chapterGQuestions,
  ...chapterHQuestions,
  ...chapterIQuestions,
  ...chapterJQuestions,
  ...highSpeedQuestions,
];

const aero: Question[] = aeroSeeds.map((seed, i) => ({
  ...seed,
  id: `AERO-${pad(i + 1, 3)}`,
  globalNumber: i + 1,
}));

export const aeroQuestions = aero;
export const highSpeedQuestionsOnly = aero.filter((q) => q.chapterId === "high-speed");
export const allQuestions: Question[] = aero;

export const TOTAL_QUESTIONS = allQuestions.length;
export const AERO_TOTAL = aero.length;

export const questionsByChapter = (chapterId: string) =>
  allQuestions.filter((q) => q.chapterId === chapterId);

export const questionsBySet = (setId: string) =>
  allQuestions.filter((q) => q.setId === setId);

export const questionById = (id: string) =>
  allQuestions.find((q) => q.id === id);
