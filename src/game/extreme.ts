import { allQuestions } from "@/data/questions";
import type { Question } from "./types";

/** Chapters that make up the Aerodynamics Extreme curated gauntlet. */
const EXTREME_CHAPTERS = ["airfoil", "forces", "mach", "high-speed"];

/**
 * Curated Aerodynamics Extreme bank: airfoil design and geometry, the four
 * flight forces, and Mach-number science (incompressible M < 0.3 through
 * hypersonic, wave drag and shock angles).
 */
export const extremeQuestions: Question[] = allQuestions.filter((q) =>
  EXTREME_CHAPTERS.includes(q.chapterId),
);

export const EXTREME_TOTAL = extremeQuestions.length;
