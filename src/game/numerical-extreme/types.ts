/** Shared result types for the Numerical Extreme math engine (camelCase). */

export type ScalarFn = (x: number) => number;
export type NamedFn = (vars: Record<string, number>) => number;

export type NullableNumber = number | null;

export interface ExpressionInfo {
  input: string;
  normalized: string;
  symbolic: string;
  factorized?: string;
  shift?: number;
  shifted?: string;
}

export interface MethodResult {
  available: boolean;
  value: NullableNumber;
  absoluteError: NullableNumber;
  reason: string | null;
}

export interface BisectionHistoryEntry {
  iteration: number;
  left: number;
  right: number;
  midpoint: number;
  residual: NullableNumber;
}

export interface BisectionResult {
  converged: boolean;
  root: NullableNumber;
  residual: NullableNumber;
  iterations: number;
  bracket: [number, number];
  history: BisectionHistoryEntry[];
  message: string;
}

export interface RootIterationHistoryEntry {
  iteration: number;
  x: number;
  y: number;
  residual: number;
  step: number;
  damping?: number;
}

export interface RootSolverResult {
  converged: boolean;
  root: NullableNumber;
  residual: NullableNumber;
  iterations: number;
  history: RootIterationHistoryEntry[];
  message: string;
  seeds?: [number, number];
}

export interface TheoremPoint {
  c: NullableNumber;
  allCandidates: number[];
  residual: NullableNumber;
  chordSlope?: NullableNumber;
  derivativeExpression?: string;
  integral?: NullableNumber;
  average?: NullableNumber;
  estimatedError?: NullableNumber;
  message?: string;
}

export interface TaylorResult {
  degree: number;
  valid: boolean;
  about?: number;
  coefficients: number[];
  polynomial: string | null;
  message: string;
}

export interface IntegrationResult {
  expression: ExpressionInfo;
  interval: { a: number; b: number; subintervals: number; step: number };
  reference: {
    value: NullableNumber;
    estimatedError: NullableNumber;
    method: string;
  };
  methods: {
    trapezoidal: MethodResult;
    midpoint: MethodResult;
    simpsonOneThird: MethodResult;
    simpsonThreeEighths: MethodResult;
  };
  nodes: { x: number[]; y: number[] };
  midpoints: { x: number[]; y: number[] };
  plot: { x: number[]; y: NullableNumber[] };
}

export interface InterpolationResult {
  points: Array<{ x: number; y: number }>;
  query: number;
  newton: {
    value: NullableNumber;
    coefficients: number[];
    dividedDifferenceTable: NullableNumber[][];
    formula: string;
  };
  lagrange: {
    value: NullableNumber;
    formula: string | null;
    evaluation: string;
  };
  naturalCubicSpline: {
    value: NullableNumber;
    segments: Array<{
      left: number;
      right: number;
      a: number;
      b: number;
      c: number;
      d: number;
    }>;
    boundaryCondition: string;
  };
  agreement: {
    newtonVsLagrangeAbsoluteDifference: NullableNumber;
  };
  plot: {
    x: number[];
    polynomial: NullableNumber[];
    spline: NullableNumber[];
  };
  warnings: string[];
}

export interface FunctionAnalysisResult {
  expression: ExpressionInfo;
  plot: { x: number[]; y: NullableNumber[] };
  domain: { a: number; b: number; samples: number; finiteSamples: number };
  ivt: {
    brackets: Array<[number, number]>;
    bisections: BisectionResult[];
    exactGridRoots: number[];
    roots: number[];
  };
  secantPairs: Array<[number, number]>;
  meanValueTheorem: TheoremPoint;
  integralMeanValueTheorem: TheoremPoint;
  taylor: TaylorResult[];
  iterations: {
    coordinateSystem: string;
    shift: number;
    newton: RootSolverResult;
    secant: RootSolverResult[];
    multiStartNewton?: RootSolverResult[];
  };
  warnings: string[];
}

export interface VibrationResult {
  mode: "free" | "forced";
  parameters: {
    mass: number;
    damping: number;
    stiffness: number;
    criticalDamping: number;
  };
  naturalFrequency: number;
  naturalFrequencyHz: number;
  dampingRatio: number;
  regime?: string;
  initialConditions?: { displacement: number; velocity: number };
  dampedFrequency?: number | null;
  dampedFrequencyHz?: number;
  coefficientA?: number;
  coefficientB?: number;
  characteristicRoots?: number[];
  coefficients?: number[];
  forcing?: {
    forceAmplitude: number;
    forcingFrequency: number;
    frequencyRatio: number;
    staticDisplacement: number;
  };
  magnification?: NullableNumber;
  amplitude?: NullableNumber;
  phase?: NullableNumber;
  plot: Record<string, number[] | NullableNumber[]>;
  notes?: string[];
  warnings?: string[];
}

export interface NonlinearTraceRow {
  iteration: number;
  x: NullableNumber[];
  residual: NullableNumber;
  stepNorm?: NullableNumber;
  innerIterations?: number;
  innerResidual?: NullableNumber;
  damping?: number;
}

export interface NonlinearSolverResult {
  method: string;
  converged: boolean;
  estimate: NullableNumber[];
  iterations: number;
  finalResidual: NullableNumber;
  history: NonlinearTraceRow[];
  message: string;
  innerIterationCounts?: number[];
}

export interface NonlinearSystemResult {
  dimension: number;
  variables: string[];
  equations: Array<{ input: string; normalized: string; symbolic: string }>;
  method: {
    jacobian: string[][];
    initialNumericJacobian: number[][];
    jacobiSplit: string;
    innerUpdate: string;
  };
  diagonalNonlinearJacobi: NonlinearSolverResult;
  inexactNewtonJacobi: NonlinearSolverResult;
}

export interface ModifiedCholeskyResult {
  source: string;
  size: number;
  matrix: number[][];
  lowerFactor: number[][];
  permutationZeroBased: number[];
  permutationOneBased: number[];
  diagonalAdditionsFactorOrder: number[];
  diagonalAdditionsOriginalOrder: number[];
  modifiedMatrix: number[][];
  verification: {
    factorizationInfinityError: NullableNumber;
    solveInfinityError: NullableNumber;
    maximumDiagonalAddition: NullableNumber;
    minimumEigenvalueBefore: NullableNumber;
    minimumEigenvalueAfter: NullableNumber;
    positiveDefiniteAfter: boolean;
  };
  solveDemo: { expected: number[]; computed: number[] };
  notes: string[];
}

export interface TalbotResult {
  preset: string;
  description: string;
  time: number;
  value: NullableNumber;
  expected: number;
  absoluteError: NullableNumber;
  errorCode: number;
  parameters: {
    lambda: number;
    sigma: number;
    nu: number;
    quadraturePoints: number;
    decimalDigits: number;
    contourParameter: number;
    singularities: Array<{
      real: number;
      imaginary: number;
      multiplicity: number;
    }>;
  };
  plot: {
    time: number[];
    talbot: NullableNumber[];
    exact: number[];
  };
  plotErrorCodes: number[];
}

export interface ContinuationPoint {
  index: number;
  x: NullableNumber;
  parameter: NullableNumber;
  residual: NullableNumber;
  freeCoordinate: "x" | "parameter";
  adamsOrder: number;
}

export interface ContinuationResult {
  equation: string;
  initial: { x: number; parameter: number };
  initialCorrectionConverged: boolean;
  status: string;
  flag: number;
  message: string;
  pointCount: number;
  points: ContinuationPoint[];
  plot: {
    x: NullableNumber[];
    parameter: NullableNumber[];
    residual: NullableNumber[];
    exactParameter: NullableNumber[];
  };
}
