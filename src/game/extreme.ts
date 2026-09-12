import { allQuestions } from "@/data/questions";
import { extremeExpansionQuestions } from "@/data/questions/extreme-expansion";
import type { Question } from "./types";

/** Chapters that make up the Aerodynamics Extreme curated gauntlet. */
const EXTREME_CHAPTERS = ["airfoil", "forces", "mach", "high-speed"];

/**
 * Curated Aerodynamics Extreme bank: airfoil design and geometry, the four
 * flight forces, and Mach-number science (incompressible M < 0.3 through
 * hypersonic, wave drag and shock angles).
 */
export const originalExtremeQuestions: Question[] = allQuestions.filter((q) =>
  EXTREME_CHAPTERS.includes(q.chapterId),
);

export const extremeQuestions: Question[] = [
  ...originalExtremeQuestions,
  ...extremeExpansionQuestions,
];

export const EXTREME_TOTAL = extremeQuestions.length;

/** The inferno begins halfway through the entire Aerodynamics Extreme set. */
export const EXTREME_INFERNO_START_INDEX = Math.floor(EXTREME_TOTAL / 2);
