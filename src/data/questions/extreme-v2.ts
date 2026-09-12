import { stableShuffle } from "@/game/answer";
import type { Question } from "@/game/types";

type Mc = {
  prompt: string;
  choices: [string, string, string, string];
  correct: string;
  explanation: string;
  hint: string;
  category: string;
};

type Fill = {
  prompt: string;
  correct: string;
  accepted: string[];
  explanation: string;
  hint: string;
  category: string;
  formula?: string;
};

const multipleChoice: Mc[] = [
  {
    prompt: "Airfoil force and moment coefficients are functions of which three variables?",
    choices: [
      "Altitude, velocity, and density",
      "Angle of attack, Reynolds number, and Mach number",
      "Span, chord, and wing area",
      "Lift, drag, and weight",
    ],
    correct: "Angle of attack, Reynolds number, and Mach number",
    explanation:
      "Airfoil force and moment coefficients depend on angle of attack, Reynolds number, and Mach number.",
    hint: "AoA, Re, and Mach.",
    category: "Airfoil Data",
  },
  {
    prompt: "A lift curve is a graph of which two quantities?",
    choices: [
      "Drag coefficient versus lift coefficient",
      "Lift coefficient versus angle of attack",
      "Moment coefficient versus Reynolds number",
      "Angle of attack versus Mach number",
    ],
    correct: "Lift coefficient versus angle of attack",
    explanation:
      "A lift curve plots lift coefficient, Cl, on the vertical axis and angle of attack, alpha, on the horizontal axis.",
    hint: "Cl versus alpha.",
    category: "Lift Curve",
  },
  {
    prompt: "Before stall, the relationship between lift coefficient and angle of attack is typically:",
    choices: ["Constant", "Exponential", "Approximately linear", "Parabolic"],
    correct: "Approximately linear",
    explanation:
      "Before stall, lift coefficient normally increases approximately linearly as angle of attack increases.",
    hint: "Look at the straight part of the lift curve.",
    category: "Lift Curve",
  },
  {
    prompt: "Which symbol represents the slope of the linear portion of an airfoil's lift curve?",
    choices: ["Cl_alpha", "Cl_max", "Cd", "Cm_ac"],
    correct: "Cl_alpha",
    explanation:
      "Cl_alpha represents the lift-curve slope, or the change in lift coefficient per change in angle of attack.",
    hint: "It is the derivative of Cl with alpha.",
    category: "Lift Curve",
  },
  {
    prompt: "What is the angle of attack at which the lift coefficient equals zero called?",
    choices: ["Stall angle", "Sweep angle", "Zero-lift angle of attack", "Quarter-chord angle"],
    correct: "Zero-lift angle of attack",
    explanation: "The zero-lift angle of attack is the angle at which Cl equals zero.",
    hint: "Cl = 0 there.",
    category: "Lift Curve",
  },
  {
    prompt: "Which plain-text symbol represents the zero-lift angle of attack?",
    choices: ["alpha_stall", "alpha_L=0", "Lambda_LE", "Cl_alpha"],
    correct: "alpha_L=0",
    explanation: "The zero-lift angle of attack is written as alpha_L=0.",
    hint: "The L=0 subscript marks zero lift.",
    category: "Lift Curve",
  },
  {
    prompt: "What does an airfoil reach just before it stalls?",
    choices: ["Zero drag", "Minimum lift", "Maximum lift coefficient", "Maximum aspect ratio"],
    correct: "Maximum lift coefficient",
    explanation: "Just before stall, the airfoil reaches its maximum lift coefficient, Cl_max.",
    hint: "The peak of the lift curve.",
    category: "Stall",
  },
  {
    prompt: "Why does lift decrease after the stall angle is reached?",
    choices: [
      "Reynolds number becomes zero",
      "Wing area decreases",
      "Significant flow separation occurs",
      "Skin-friction drag disappears",
    ],
    correct: "Significant flow separation occurs",
    explanation:
      "After the stall angle, substantial flow separation causes the lift coefficient to decrease.",
    hint: "The flow no longer follows the surface.",
    category: "Stall",
  },
  {
    prompt: "At zero degrees angle of attack, a positively cambered airfoil generally produces:",
    choices: ["Positive lift", "Zero lift", "Negative lift", "No aerodynamic force"],
    correct: "Positive lift",
    explanation:
      "Positive camber allows an airfoil to produce positive lift even at zero degrees angle of attack.",
    hint: "This is useful in aircraft design.",
    category: "Camber",
  },
  {
    prompt: "What is the general effect of increasing Reynolds number on maximum lift and stall?",
    choices: [
      "Maximum lift decreases and stall occurs earlier",
      "Maximum lift increases and stall is delayed",
      "Pressure drag is eliminated",
      "Aspect ratio becomes one",
    ],
    correct: "Maximum lift increases and stall is delayed",
    explanation:
      "Increasing Reynolds number tends to increase maximum lift and delay the onset of stall.",
    hint: "Think about the physics of stall.",
    category: "Reynolds Number",
  },
  {
    prompt: "Which plain-text equation predicts lift coefficient in the linear region?",
    choices: [
      "Cl = Cl_alpha * (alpha - alpha_L=0)",
      "Cl = b^2 / S",
      "Cl = ct / cr",
      "Cl = Cd^2",
    ],
    correct: "Cl = Cl_alpha * (alpha - alpha_L=0)",
    explanation: "The linear lift equation is Cl = Cl_alpha * (alpha - alpha_L=0).",
    hint: "Use the lift-curve slope and the zero-lift angle.",
    category: "Lift Equation",
  },
  {
    prompt: "A drag polar is a graph of:",
    choices: [
      "Lift coefficient versus angle of attack",
      "Drag coefficient versus lift coefficient",
      "Moment coefficient versus angle of attack",
      "Reynolds number versus Mach number",
    ],
    correct: "Drag coefficient versus lift coefficient",
    explanation: "A drag polar shows drag coefficient, Cd, as a function of lift coefficient, Cl.",
    hint: "Cd versus Cl.",
    category: "Drag Polar",
  },
  {
    prompt: "What is the approximate shape of a drag polar?",
    choices: ["Linear", "Circular", "Parabolic", "Constant"],
    correct: "Parabolic",
    explanation: "The relationship between Cd and Cl is approximately parabolic.",
    hint: "It looks like a U opening sideways or a parabola.",
    category: "Drag Polar",
  },
  {
    prompt: "An airfoil's profile drag coefficient includes which two components?",
    choices: [
      "Induced drag and wave drag",
      "Skin-friction drag and pressure drag",
      "Lift and pitching moment",
      "Weight and thrust",
    ],
    correct: "Skin-friction drag and pressure drag",
    explanation: "Profile drag is made up of skin-friction drag and pressure drag.",
    hint: "Shear plus pressure.",
    category: "Profile Drag",
  },
  {
    prompt: "Which type of drag remains present at a small lift coefficient and a small angle of attack?",
    choices: ["Wave drag only", "Induced drag only", "Skin-friction drag", "No drag is present"],
    correct: "Skin-friction drag",
    explanation:
      "Skin-friction drag remains present even when the airfoil is streamlined and pressure drag is relatively small.",
    hint: "The boundary layer is still attached.",
    category: "Profile Drag",
  },
  {
    prompt: "Why does pressure drag become more important at a high angle of attack?",
    choices: [
      "The airfoil appears more streamlined to the airflow",
      "The airfoil behaves more like a blunt body",
      "Wing area becomes zero",
      "Reynolds number disappears",
    ],
    correct: "The airfoil behaves more like a blunt body",
    explanation:
      "At a high angle of attack, the airflow sees the airfoil as a less slender and more blunt body, increasing pressure drag.",
    hint: "The body is no longer slender to the oncoming flow.",
    category: "Profile Drag",
  },
  {
    prompt: "For a positively cambered airfoil, the moment coefficient about the aerodynamic center is generally:",
    choices: ["Positive", "Negative", "Always zero", "Equal to aspect ratio"],
    correct: "Negative",
    explanation:
      "A positively cambered airfoil generally has a negative moment coefficient about the aerodynamic center.",
    hint: "Think nose-down.",
    category: "Moment",
  },
  {
    prompt: "What does a negative moment coefficient about the aerodynamic center indicate?",
    choices: [
      "A pitch-down tendency",
      "A pitch-up tendency",
      "No pitching tendency",
      "A rolling tendency",
    ],
    correct: "A pitch-down tendency",
    explanation:
      "A negative aerodynamic-center moment coefficient corresponds to a pitch-down or nose-down tendency.",
    hint: "Negative Cm_ac means nose down.",
    category: "Moment",
  },
  {
    prompt: "The moment coefficient about the aerodynamic center remains approximately constant as which quantities vary?",
    choices: [
      "Chord and span",
      "Reynolds number and angle of attack",
      "Wing area and aspect ratio",
      "Root chord and tip chord",
    ],
    correct: "Reynolds number and angle of attack",
    explanation:
      "Cm_ac remains approximately constant with changes in Reynolds number and angle of attack.",
    hint: "That is why the AC is useful.",
    category: "Moment",
  },
  {
    prompt: "Earlier two-dimensional airfoil analysis effectively assumes which type of wing?",
    choices: ["A finite-span wing", "An infinite-span wing", "A circular wing", "A vertical wing"],
    correct: "An infinite-span wing",
    explanation: "Two-dimensional airfoil analysis assumes an infinite-span wing without wingtip effects.",
    hint: "No tips in the 2D model.",
    category: "Finite Wings",
  },
  {
    prompt: "Which plain-text equation defines a wing's aspect ratio?",
    choices: ["AR = b^2 / S", "AR = S^2 / b", "AR = ct / cr", "AR = 2S / b^2"],
    correct: "AR = b^2 / S",
    explanation: "Aspect ratio equals wing span squared divided by wing planform area: AR = b^2 / S.",
    hint: "Span squared over area.",
    category: "Wing Geometry",
  },
  {
    prompt: "What does the symbol b represent in the aspect-ratio equation?",
    choices: ["Root chord", "Tip chord", "Wing span", "Wing area"],
    correct: "Wing span",
    explanation: "In AR = b^2 / S, b represents the total wing span.",
    hint: "Tip to tip.",
    category: "Wing Geometry",
  },
  {
    prompt: "What does the symbol S represent in the aspect-ratio equation?",
    choices: ["Wing sweep", "Wing planform area", "Semispan", "Lift-curve slope"],
    correct: "Wing planform area",
    explanation: "In AR = b^2 / S, S represents the wing planform area.",
    hint: "The area seen from above.",
    category: "Wing Geometry",
  },
  {
    prompt: "Which plain-text equation defines taper ratio?",
    choices: ["lambda = cr / ct", "lambda = ct / cr", "lambda = b^2 / S", "lambda = S / b"],
    correct: "lambda = ct / cr",
    explanation: "Taper ratio is tip chord divided by root chord: lambda = ct / cr.",
    hint: "Tip over root.",
    category: "Wing Geometry",
  },
  {
    prompt: "What is the taper ratio of a rectangular wing?",
    choices: ["0", "0.5", "1", "2"],
    correct: "1",
    explanation: "For a rectangular wing, tip chord equals root chord. Therefore, lambda = ct / cr = 1.",
    hint: "Tip and root chords match.",
    category: "Wing Geometry",
  },
  {
    prompt: "Which three reference lines are commonly used to define a wing's sweep angle?",
    choices: [
      "Root, tip, and span lines",
      "Leading edge, quarter-chord line, and mid-chord line",
      "Lift, drag, and moment lines",
      "Upper surface, lower surface, and camber line",
    ],
    correct: "Leading edge, quarter-chord line, and mid-chord line",
    explanation: "Sweep may be specified at the leading edge, quarter-chord line, or mid-chord line.",
    hint: "LE, c/4, and mid-chord.",
    category: "Wing Geometry",
  },
  {
    prompt: "What does the mean aerodynamic chord represent?",
    choices: [
      "The total wing span",
      "A representative chord length for wing forces and moments",
      "The smallest chord on the wing",
      "The angle between the wing and the airflow",
    ],
    correct: "A representative chord length for wing forces and moments",
    explanation:
      "The mean aerodynamic chord, or MAC, is a representative chord length used to analyze forces and moments acting on a wing.",
    hint: "It stands in for the whole wing chord.",
    category: "Wing Geometry",
  },
];

const fillIns: Fill[] = [
  {
    prompt: "Write the plain-text equation used to calculate lift coefficient in the linear region.",
    correct: "Cl = Cl_alpha * (alpha - alpha_L=0)",
    accepted: [
      "Cl=Cl_alpha*(alpha-alpha_L=0)",
      "Cl = Cl_alpha*(alpha - alpha_L=0)",
      "cl = cl_alpha * (alpha - alpha_l=0)",
      "Cl = Cla * (alpha - alpha_L=0)",
    ],
    explanation:
      "Cl_alpha is the lift-curve slope, alpha is the angle of attack, and alpha_L=0 is the zero-lift angle of attack.",
    hint: "Cl_alpha times the angle above zero lift.",
    category: "Lift Equation",
    formula: "Cl = Cl_alpha * (alpha - alpha_L=0)",
  },
  {
    prompt:
      "An airfoil has Cl_alpha = 0.1 per degree, alpha = 6 degrees, and alpha_L=0 = -2 degrees. Calculate Cl.",
    correct: "0.8",
    accepted: ["Cl = 0.8", "cl=0.8", "0.80", "Cl=0.80"],
    explanation:
      "Subtracting negative 2 degrees from 6 degrees gives 8 degrees. Multiplying 8 by 0.1 gives Cl = 0.8.",
    hint: "Cl = 0.1 * (6 - (-2)).",
    category: "Lift Equation",
    formula: "Cl = 0.1 * (6 - (-2)) = 0.8",
  },
  {
    prompt: "Write the plain-text equation for wing aspect ratio.",
    correct: "AR = b^2 / S",
    accepted: ["AR=b^2/S", "AR = b squared divided by S", "AR = b**2 / S", "A = b^2 / S"],
    explanation: "Wing aspect ratio equals the square of the total wing span divided by the wing planform area.",
    hint: "Span squared over area.",
    category: "Wing Geometry",
    formula: "AR = b^2 / S",
  },
  {
    prompt: "A wing has a span of 10 meters and a planform area of 20 square meters. Calculate the aspect ratio.",
    correct: "5",
    accepted: ["AR = 5", "ar=5", "5.0"],
    explanation: "The wing span is squared and divided by the planform area. Aspect ratio is dimensionless.",
    hint: "10^2 / 20.",
    category: "Wing Geometry",
    formula: "AR = 10^2 / 20 = 5",
  },
  {
    prompt: "A wing has a root chord of 5 meters and a tip chord of 2 meters. Calculate the taper ratio.",
    correct: "0.4",
    accepted: ["lambda = 0.4", "lambda=0.4", "0.40", "2/5", "2 / 5"],
    explanation: "Taper ratio equals tip chord divided by root chord.",
    hint: "ct / cr.",
    category: "Wing Geometry",
    formula: "lambda = 2 / 5 = 0.4",
  },
  {
    prompt: "Write the plain-text equation for the mean aerodynamic chord and explain what MAC represents.",
    correct:
      "MAC = (2 / S) * integral from 0 to b/2 of c^2 dy. MAC is a representative chord length used for analyzing the forces and moments acting on a wing.",
    accepted: [
      "MAC = (2 / S) * integral from 0 to b/2 of c^2 dy",
      "c_bar = (2 / S) * integral from 0 to b/2 of c^2 dy",
      "MAC=(2/S)*integral from 0 to b/2 of c^2 dy",
      "c_bar=(2/S)*integral from 0 to b/2 of c^2 dy",
    ],
    explanation:
      "The equation weights the local chord using c squared and integrates from the wing centerline to the wingtip. The factor of 2 accounts for both halves of a symmetric wing.",
    hint: "Integrate c^2 from the root to the tip, then scale by 2/S.",
    category: "Wing Geometry",
    formula: "MAC = (2 / S) * integral from 0 to b/2 of c^2 dy",
  },
];

function asQuestion(
  index: number,
  interactionType: Question["interactionType"],
  card: { prompt: string; explanation: string; hint: string; category: string; formula?: string },
  extra: Partial<Question>,
): Question {
  return {
    id: `EXTREME-V2-${String(index + 1).padStart(3, "0")}`,
    globalNumber: index + 1,
    chapterId: "extreme-v2",
    setId: "Class 05 Practice",
    category: card.category,
    difficulty: index < 27 ? 2 : 3,
    interactionType,
    prompt: card.prompt,
    correctAnswer: extra.correctAnswer ?? [],
    explanation: card.explanation,
    hint: card.hint,
    formula: card.formula ?? null,
    audioGenre: "supersonic",
    points: 1,
    diagramType: null,
    ...extra,
  };
}

const class05Questions: Question[] = [
  ...multipleChoice.map((card, index) =>
    asQuestion(index, "multiple-choice", card, {
      choices: stableShuffle(card.choices, `extreme-v2-mc-${index}`),
      correctAnswer: [card.correct],
    }),
  ),
  ...fillIns.map((card, index) =>
    asQuestion(27 + index, "fill-in", card, {
      correctAnswer: [card.correct],
      acceptedAnswers: card.accepted,
    }),
  ),
];

/** Future Extreme V2 expansions append here without touching Class 05. */
export const extremeV2ExpansionQuestions: Question[] = [];

export const extremeV2CoreQuestions = class05Questions;

export const extremeV2Questions: Question[] = [
  ...extremeV2CoreQuestions,
  ...extremeV2ExpansionQuestions,
];

export const EXTREME_V2_CORE_TOTAL = extremeV2CoreQuestions.length;
export const EXTREME_V2_TOTAL = extremeV2Questions.length;
