import type { Question } from "./types";

export type QuestionSeed = Omit<Question, "id" | "globalNumber">;
