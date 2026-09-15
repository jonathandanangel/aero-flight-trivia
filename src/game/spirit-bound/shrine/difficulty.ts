import type { Difficulty } from "./types";

export type DifficultyBand = {
  id: Difficulty;
  label: string;
  minMoves: number;
  maxMoves: number;
  timeLimit: number;
  scramble: number;
};

export const DIFFICULTY: Record<Difficulty, DifficultyBand> = {
  easy: { id: "easy", label: "EASY", minMoves: 3, maxMoves: 5, timeLimit: 75, scramble: 6 },
  medium: { id: "medium", label: "MEDIUM", minMoves: 6, maxMoves: 9, timeLimit: 90, scramble: 12 },
  hard: { id: "hard", label: "HARD", minMoves: 10, maxMoves: 14, timeLimit: 120, scramble: 18 },
  expert: { id: "expert", label: "EXPERT", minMoves: 15, maxMoves: 20, timeLimit: 150, scramble: 26 },
};

/** Story shrine rolls a random easy–hard mural. Expert stays available to the generator. */
export const STORY_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
