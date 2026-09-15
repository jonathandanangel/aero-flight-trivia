export const PEG_COUNT = 3;
/** Left 1-3-5-7, center 8 plus spine sockets, right 2-4-6-9. */
export const CAPACITIES = [4, 4, 4] as const;
export const PIECE_COUNT = 9;

export type PegIndex = 0 | 1 | 2;
export type Pegs = [number[], number[], number[]];

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type Piece = {
  id: number;
  label: number;
  name: string;
};

export const PIECES: Piece[] = [
  { id: 0, label: 1, name: "ONE" },
  { id: 1, label: 2, name: "TWO" },
  { id: 2, label: 3, name: "THREE" },
  { id: 3, label: 4, name: "FOUR" },
  { id: 4, label: 5, name: "FIVE" },
  { id: 5, label: 6, name: "SIX" },
  { id: 6, label: 7, name: "SEVEN" },
  { id: 7, label: 8, name: "EIGHT" },
  { id: 8, label: 9, name: "NINE" },
];

export const PEG_NAMES = ["LEFT BRANCH", "SPINE", "RIGHT BRANCH"] as const;

/**
 * Sealed mural: numbered relics sit on the tree.
 * Left 7-5-3-1, spine 8, right 9-6-4-2. Three empty spine sockets stay open.
 */
export const TARGET_PEGS: Pegs = [
  [6, 4, 2, 0],
  [7],
  [8, 5, 3, 1],
];

export type PuzzleSpec = {
  id: number;
  seed: number;
  difficulty: Difficulty;
  start: Pegs;
  target: Pegs;
  optimal: number;
  timeLimit: number;
};

export type Move = { from: PegIndex; to: PegIndex };

export type Stars = 0 | 1 | 2 | 3;

export type ScoreBreakdown = {
  accuracy: number;
  efficiency: number;
  speed: number;
  total: number;
  stars: Stars;
  completed: boolean;
};

export type AccessMode = {
  highContrast: boolean;
  colorblind: boolean;
  reducedMotion: boolean;
};
