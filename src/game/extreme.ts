import { allQuestions } from "@/data/questions";
import {
  extremeExpansionQuestions,
  EXTREME_EXPANSION_TOTAL,
} from "@/data/questions/extreme-expansion";
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

/** Zero-based index of the first question authored for the 150-card expansion. */
export const EXTREME_EXPANSION_START_INDEX = originalExtremeQuestions.length;

/** The inferno begins with the second half of the 150-card expansion. */
export const EXTREME_INFERNO_START_INDEX =
  EXTREME_EXPANSION_START_INDEX + Math.floor(EXTREME_EXPANSION_TOTAL / 2);
