export type InteractionType =
  | "drag-drop"
  | "equation-builder"
  | "multiple-choice"
  | "compare-select"
  | "hotspot"
  | "label-placement"
  | "vector-placement"
  | "sequencing"
  | "matching"
  | "fill-in";

export type DiagramType =
  | "atmospheric-flight"
  | "airfoil-geometry"
  | "airfoil-camber"
  | "airfoil-symmetric"
  | "airfoil-pressure"
  | "airfoil-forces"
  | "airfoil-shear"
  | "boundary-layer"
  | "center-of-pressure"
  | "aerodynamic-center"
  | "wing-3d"
  | "cylinder-flow"
  | "cylinder-separation"
  | "aircraft-forces"
  | "stream-tube"
  | "velocity-profile"
  | "mach-cone"
  | "ht-solid-contact"
  | "ht-liquid-convection"
  | "ht-air-multimode"
  | "ht-vacuum-radiation"
  | "ht-plane-wall"
  | "ht-thermal-boundary"
  | "ht-control-volume"
  | "ht-conductivity-bars"
  | "ht-composite-wall"
  | "ht-isotherms-2d"
  | "ht-buried-pipe"
  | "ht-lumped-sphere"
  | "ht-biot-contrast"
  | "ht-transient-wall"
  | "ht-semi-infinite"
  | "ht-bl-dual"
  | "ht-flat-plate"
  | "ht-cylinder-crossflow"
  | "ht-pipe-flow"
  | "ht-hydraulic-diameter"
  | "ht-free-plume"
  | "ht-cavity-free"
  | "ht-boiling-nucleate"
  | "ht-boiling-curve"
  | "ht-boiling-film"
  | "ht-condensation-film"
  | "ht-hx-counterflow"
  | "ht-hx-parallel"
  | "ht-blackbody"
  | "ht-irradiation"
  | "ht-view-factor"
  | "ht-enclosure-tri"
  | "ht-radiation-shield"
  | "ht-fick-diffusion"
  | "ht-heat-mass-analogy"
  | "ht-mass-fraction"
  | "ht-evaporation-bl";

export type AudioGenre =
  | "synthwave"
  | "chiptune"
  | "ambient-space"
  | "breakbeat"
  | "retro-funk"
  | "supersonic";

export interface DiagramTarget {
  /** Stable id for the hotspot / label slot. */
  id: string;
  /** Human readable name of the point, region or term. */
  label: string;
  /** Percentage coordinates inside the diagram stage (0-100). */
  x: number;
  y: number;
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface Question {
  id: string;
  globalNumber: number;
  chapterId: string;
  setId: string;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  interactionType: InteractionType;
  prompt: string;
  /**
   * drag-drop / equation-builder: n+1 text fragments; blanks sit between them.
   * The number of blanks must equal correctAnswer.length.
   */
  sentenceParts?: string[];
  /** multiple-choice: exactly 4. compare-select: 2-4. */
  choices?: string[];
  /** drag-drop / equation-builder / label-placement / vector-placement token pool. */
  draggableTokens?: string[];
  /** hotspot: clickable points. label-placement / vector-placement: slots. */
  targets?: DiagramTarget[];
  /** sequencing: the correct order of events. */
  steps?: string[];
  /** matching: left terms to right meanings. */
  pairs?: MatchPair[];
  /**
   * Canonical answer.
   * drag-drop/equation-builder: tokens in blank order.
   * multiple-choice/compare-select: the correct choice text.
   * hotspot: the target id.
   * label/vector placement: labels in target order.
   * sequencing: steps in correct order.
   * matching: right values in pair order.
   * fill-in: the primary accepted answer.
   */
  correctAnswer: string[];
  explanation: string;
  formula?: string | null;
  diagramType?: DiagramType | null;
  diagramConfig?: Record<string, unknown>;
  hint: string;
  /** Wrong token / choice -> targeted feedback. */
  misconceptionFeedback?: Record<string, string>;
  /** fill-in: case-insensitive synonyms that are also accepted. */
  acceptedAnswers?: string[];
  audioGenre: AudioGenre;
  points: number;
}

export interface Chapter {
  id: string;
  title: string;
  blurb: string;
  setIds: string[];
}

export interface LearningSet {
  id: string;
  chapterId: string;
  title: string;
}
