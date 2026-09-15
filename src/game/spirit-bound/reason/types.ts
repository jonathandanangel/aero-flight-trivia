export type Hue = "gold" | "silver" | "emerald" | "crimson" | "azure";

export type Kind =
  | "relic"
  | "guardian"
  | "sage"
  | "knight"
  | "fairy"
  | "rune"
  | "sigil"
  | "beacon"
  | "youth"
  | "king";

export type Role = "holder" | "item" | "landmark";

export type Col = 0 | 1 | 2;
export type Row = 0 | 1;

export type Rel =
  | "west"
  | "east"
  | "north"
  | "south"
  | "beside"
  | "before"
  | "after"
  | "owns"
  | "stronger";

export type Entity = {
  id: string;
  kind: Kind;
  hue: Hue;
  label: string;
  phrase: string;
  col: Col;
  row: Row;
  power: number;
  arrival: number;
  ownerId?: string;
};

export type SceneEvent = {
  id: string;
  phrase: string;
  time: number;
};

export type Scene = {
  entities: Entity[];
  events: SceneEvent[];
};

export type Atom =
  | { kind: "rel"; rel: Rel; a: string; b: string }
  | { kind: "not"; inner: Atom }
  | { kind: "and"; left: Atom; right: Atom }
  | { kind: "or"; left: Atom; right: Atom }
  | { kind: "neither"; a: string; b: string; rels: [Rel, Rel] }
  | { kind: "notAbsent"; item: string; holder: string }
  | { kind: "cannotDim"; id: string }
  | { kind: "eventOrder"; rel: "before" | "after"; a: string; b: string };

export type Voice = "field" | "passive" | "verse";

export type ReasonTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ChallengeType =
  | "position"
  | "order"
  | "own"
  | "compare"
  | "negation"
  | "compound"
  | "doubleNeg"
  | "mixed"
  | "temporal";

export type Challenge = {
  seed: number;
  index: number;
  tier: ReasonTier;
  type: ChallengeType;
  scene: Scene;
  atom: Atom;
  statement: string;
  source: string;
  answer: boolean;
};

export type ReasonKind = "sprint" | "endless" | "campaign";

export type ComboRank = "none" | "silver" | "gold" | "master";

export type AccessMode = {
  highContrast: boolean;
  colorblind: boolean;
  reducedMotion: boolean;
  dyslexia: boolean;
  textSize: "sm" | "md" | "lg";
  narration: boolean;
};

export type ReasonAchievementId =
  | "truth_seeker"
  | "master_analyst"
  | "perfect_record"
  | "logic_savant"
  | "instant_deduction"
  | "legendary_investigator";

export type ReasonScore = {
  total: number;
  correctBank: number;
  speedBank: number;
  comboBank: number;
  penalty: number;
  accuracy: number;
  combo: number;
  multiplier: number;
  rank: ComboRank;
};

export const SPRINT_SECONDS = 90;
export const ENDLESS_LIVES = 3;
export const CAMPAIGN_CHAPTERS = 7;
export const QUESTIONS_PER_CHAPTER = 5;
export const ACTIVE_POWER = 3;
