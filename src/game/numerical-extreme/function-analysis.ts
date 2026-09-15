import { compileExpression } from "./expr";
import {
  adjacentSignChanges,
  bisection,
  centralDerivative,
  deduplicate,
  finiteOrNone,
  linspace,
  listWithNulls,
  rootsFromGrid,
} from "./common";
import type {
  FunctionAnalysisResult,
  RootSolverResult,
  ScalarFn,
  TaylorResult,
  TheoremPoint,
} from "./types";

const MACHINE_EPS = Number.EPSILON;

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
}

/** nth derivative at x0 via recursive central finite differences. */
function finiteDifferenceDerivative(
  fn: ScalarFn,
  x0: number,
  order: number,
): number {
  if (order === 0) return fn(x0);
  if (order === 1) return centralDerivative(fn, x0);
  const h = Math.pow(MACHINE_EPS, 1 / (order + 2)) * (1 + Math.abs(x0));
  const plus = finiteDifferenceDerivative((x) => fn(x), x0 + h, order - 1);
  const minus = finiteDifferenceDerivative((x) => fn(x), x0 - h, order - 1);
  return (plus - minus) / (2 * h);
}

function dampedNewton(
  fn: ScalarFn,
  derivative: ScalarFn,
  initial: number,
  tolerance: number,
  maxIterations: number,
  shift: number,
): RootSolverResult {
  let x = initial;
  const history: RootSolverResult["history"] = [];
  let message = "Maximum iterations reached.";
  let converged = false;

  const initialResidual = fn(x);
  if (Number.isFinite(initialResidual) && Math.abs(initialResidual) <= tolerance) {
    converged = true;
    message = "Initial estimate satisfies the residual tolerance.";
  }

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    if (converged) break;
    const value = fn(x);
    const slope = derivative(x);
    if (!Number.isFinite(value) || !Number.isFinite(slope)) {
      message = "Function or derivative became non-finite.";
      break;
    }
    if (Math.abs(slope) <= MACHINE_EPS * (1 + Math.abs(x))) {
      message = "Derivative is zero or numerically unreliable.";
      break;
    }
    const rawStep = -value / slope;
    let damping = 1;
    let candidate = x + rawStep;
    let candidateValue = fn(candidate);
    while (
      damping > 1e-4 &&
      (!Number.isFinite(candidateValue) ||
        Math.abs(candidateValue) > (1 - 0.5 * damping) * Math.abs(value))
    ) {
      damping /= 2;
      candidate = x + damping * rawStep;
      candidateValue = fn(candidate);
    }
    if (!Number.isFinite(candidateValue)) {
      message = "Line search could not find a finite iterate.";
      break;
    }
    const step = Math.abs(candidate - x);
    history.push({
      iteration,
      x: candidate,
      y: candidate - shift,
      residual: Math.abs(candidateValue),
      step,
      damping,
    });
    x = candidate;
    if (Math.abs(candidateValue) <= tolerance) {
      converged = true;
      message = "Converged by residual tolerance.";
      break;
    }
    if (step <= tolerance * (1 + Math.abs(x))) {
      converged = Math.abs(candidateValue) <= Math.sqrt(tolerance);
      message = converged
        ? "Converged by weighted step tolerance."
        : "Step stagnated before reaching a small residual.";
      break;
    }
  }

  return {
    converged,
    root: finiteOrNone(x),
    residual: finiteOrNone(fn(x)),
    iterations: history.length,
    history,
    message,
  };
}

function secant(
  fn: ScalarFn,
  first: number,
  second: number,
  tolerance: number,
  maxIterations: number,
  shift: number,
): RootSolverResult {
  let previous = first;
  let current = second;
  const history: RootSolverResult["history"] = [];
  let converged = false;
  let message = "Maximum iterations reached.";

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const fPrevious = fn(previous);
    const fCurrent = fn(current);
    const denominator = fCurrent - fPrevious;
    if (![fPrevious, fCurrent, denominator].every(Number.isFinite)) {
      message = "Function or secant denominator became non-finite.";
      break;
    }
    if (
      Math.abs(denominator) <=
      MACHINE_EPS * Math.max(1, Math.abs(fCurrent), Math.abs(fPrevious))
    ) {
      message = "Secant denominator is zero or numerically unreliable.";
      break;
    }
    const candidate = current - (fCurrent * (current - previous)) / denominator;
    const candidateValue = fn(candidate);
    if (!Number.isFinite(candidate) || !Number.isFinite(candidateValue)) {
      message = "Secant iterate became non-finite.";
      break;
    }
    const step = Math.abs(candidate - current);
    history.push({
      iteration,
      x: candidate,
      y: candidate - shift,
      residual: Math.abs(candidateValue),
      step,
    });
    if (Math.abs(candidateValue) <= tolerance) {
      current = candidate;
      converged = true;
      message = "Converged by residual tolerance.";
      break;
    }
    if (step <= tolerance * (1 + Math.abs(candidate))) {
      current = candidate;
      converged = Math.abs(candidateValue) <= Math.sqrt(tolerance);
      message = converged
        ? "Converged by weighted step tolerance."
        : "Step stagnated before reaching a small residual.";
      break;
    }
    previous = current;
    current = candidate;
  }

  return {
    seeds: [first, second],
    converged,
    root: finiteOrNone(current),
    residual: finiteOrNone(fn(current)),
    iterations: history.length,
    history,
    message,
  };
}

function secantPairs(
  x: number[],
  y: number[],
  refined: Array<[number, number]>,
  userSeeds: [number, number] | null,
): Array<[number, number]> {
  const pairs: Array<[number, number]> = refined.map((p) => [p[0], p[1]]);
  if (userSeeds && userSeeds[0] !== userSeeds[1]) {
    pairs.push([Math.min(userSeeds[0], userSeeds[1]), Math.max(userSeeds[0], userSeeds[1])]);
  }

  const finiteIndices: number[] = [];
  for (let i = 0; i < y.length; i += 1) {
    if (Number.isFinite(y[i]!)) finiteIndices.push(i);
  }
  finiteIndices.sort((i, j) => Math.abs(y[i]!) - Math.abs(y[j]!));
  const ranked = finiteIndices.slice(0, 12);
  const candidates = [...new Set(ranked.map((i) => x[i]!))].sort((a, b) => a - b);
  for (let i = 0; i < candidates.length - 1; i += 1) {
    pairs.push([candidates[i]!, candidates[i + 1]!]);
  }

  const unique: Array<[number, number]> = [];
  const seen = new Set<string>();
  for (const [left, right] of pairs) {
    const pair: [number, number] = [Math.min(left, right), Math.max(left, right)];
    const key = `${pair[0].toFixed(12)}:${pair[1].toFixed(12)}`;
    if (pair[0] !== pair[1] && !seen.has(key)) {
      seen.add(key);
      unique.push(pair);
    }
    if (unique.length === 8) break;
  }
  return unique;
}

function theoremPoint(fn: ScalarFn, x: number[], tolerance: number): TheoremPoint {
  const values = x.map((v) => fn(v));
  const roots = rootsFromGrid(fn, x, values, tolerance);
  const first = roots[0];
  return {
    c: first !== undefined ? finiteOrNone(first) : null,
    allCandidates: roots,
    residual: first !== undefined ? finiteOrNone(fn(first)) : null,
  };
}

function taylorSeries(fn: ScalarFn, degrees: number[]): TaylorResult[] {
  return degrees.map((degree) => {
    const coefficients: number[] = [];
    let valid = true;
    for (let order = 0; order <= degree; order += 1) {
      const deriv = finiteDifferenceDerivative(fn, 0, order);
      const coefficient = deriv / factorial(order);
      if (!Number.isFinite(coefficient)) {
        valid = false;
        break;
      }
      coefficients.push(coefficient);
    }
    let polynomial: string | null = null;
    if (valid) {
      const terms = coefficients.map((c, order) => {
        if (order === 0) return formatTerm(c);
        if (order === 1) return `${formatTerm(c)}*x`;
        return `${formatTerm(c)}*x**${order}`;
      });
      polynomial = terms.join(" + ");
    }
    return {
      degree,
      valid,
      coefficients: valid ? coefficients : [],
      polynomial,
      message: valid
        ? "Computed from finite-difference derivatives at x = 0 (no SymPy)."
        : "The function or a derivative is not finite at x = 0.",
    };
  });
}

function formatTerm(value: number): string {
  return Number(value.toPrecision(10)).toString();
}

function shiftedExpressionNote(normalized: string, shift: number): string {
  return `(${normalized}) with x → y + ${shift} (numeric shift around midpoint; no symbolic expand)`;
}

export function analyzeFunction(
  expression: string,
  a: number,
  b: number,
  tolerance: number,
  maxIterations: number,
  gridPoints: number,
  shiftToZero: boolean,
  taylorDegrees: number[],
  secantSeeds: [number, number] | null = null,
): FunctionAnalysisResult {
  if (!(b > a)) throw new Error("Require b > a.");
  if (gridPoints < 2) throw new Error("gridPoints must be >= 2.");

  const parsed = compileExpression(expression);
  const fn: ScalarFn = (x) => parsed.evaluate(x);
  const x = linspace(a, b, gridPoints + 1);
  const y = x.map(fn);
  const finiteCount = y.filter(Number.isFinite).length;
  const warnings: string[] = [];
  if (finiteCount !== y.length) {
    warnings.push(
      `${y.length - finiteCount} sampled values were non-finite and are shown as plot gaps.`,
    );
  }
  warnings.push(
    "Numerical scans suggest theorem candidates but cannot prove continuity or differentiability.",
  );
  warnings.push(
    "SymPy factorization / symbolic Taylor unavailable — factorized returns the normalized expression; Taylor uses finite differences.",
  );

  const shift = (a + b) / 2;
  const rawBrackets = adjacentSignChanges(x, y).slice(0, 50);
  const bisections = rawBrackets.map(([left, right]) =>
    bisection(fn, left, right, tolerance, Math.min(maxIterations, 200)),
  );
  const refinedPairs: Array<[number, number]> = bisections
    .filter((r) => r.root !== null && r.bracket[0] !== r.bracket[1])
    .map((r) => r.bracket);

  const exactGridRoots = deduplicate(
    x.filter((_, i) => Number.isFinite(y[i]!) && Math.abs(y[i]!) <= tolerance),
    tolerance * 10,
  );
  const pairs = secantPairs(x, y, refinedPairs, secantSeeds);

  const derivative: ScalarFn = (value) => centralDerivative(fn, value);
  const endpointA = fn(a);
  const endpointB = fn(b);
  const chordSlope =
    Number.isFinite(endpointA) && Number.isFinite(endpointB)
      ? (endpointB - endpointA) / (b - a)
      : Number.NaN;

  const derivativeMvt: TheoremPoint = Number.isFinite(chordSlope)
    ? {
        ...theoremPoint((value) => derivative(value) - chordSlope, x, tolerance),
        chordSlope: finiteOrNone(chordSlope),
        derivativeExpression: "central finite-difference f'(x)",
      }
    : {
        c: null,
        allCandidates: [],
        residual: null,
        chordSlope: null,
        derivativeExpression: "central finite-difference f'(x)",
      };

  let average = Number.NaN;
  let integrationError = Number.NaN;
  let integral = Number.NaN;
  let integralMessage = "Average value could not be computed.";
  try {
    // Composite Simpson with high n as adaptive stand-in
    const n = Math.min(Math.max(2000, gridPoints * 4), 20000);
    const evenN = n % 2 === 0 ? n : n + 1;
    const h = (b - a) / evenN;
    const nodes = linspace(a, b, evenN + 1);
    const vals = nodes.map(fn);
    if (!vals.every(Number.isFinite)) throw new Error("non-finite");
    let sum = vals[0]! + vals[evenN]!;
    for (let i = 1; i < evenN; i += 1) {
      sum += (i % 2 === 1 ? 4 : 2) * vals[i]!;
    }
    integral = (h / 3) * sum;
    average = integral / (b - a);
    integrationError = Number.NaN;
    integralMessage = "Average value computed by high-n composite Simpson.";
  } catch {
    integral = Number.NaN;
  }

  const integralMvt: TheoremPoint = Number.isFinite(average)
    ? {
        ...theoremPoint((value) => fn(value) - average, x, tolerance),
        integral: finiteOrNone(integral),
        average: finiteOrNone(average),
        estimatedError: finiteOrNone(integrationError),
        message: integralMessage,
      }
    : {
        c: null,
        allCandidates: [],
        residual: null,
        integral: null,
        average: null,
        estimatedError: null,
        message: integralMessage,
      };

  const taylor = taylorSeries(fn, taylorDegrees);

  let center = shift;
  const successfulBisection = bisections.find((r) => r.converged && r.root !== null);
  if (successfulBisection?.root != null) {
    center = successfulBisection.root;
  }
  const algorithmShift = shiftToZero ? center : 0;
  const newtonInitial =
    rawBrackets.length > 0
      ? (rawBrackets[0]![0] + rawBrackets[0]![1]) / 2
      : (a + b) / 2;
  const newton = dampedNewton(
    fn,
    derivative,
    newtonInitial,
    tolerance,
    maxIterations,
    algorithmShift,
  );
  const secantRuns = pairs.map(([p0, p1]) =>
    secant(fn, p0, p1, tolerance, maxIterations, algorithmShift),
  );

  const roots = deduplicate(
    [
      ...exactGridRoots,
      ...bisections
        .filter((r) => r.converged && r.root !== null)
        .map((r) => r.root!),
      ...secantRuns.filter((r) => r.converged && r.root !== null).map((r) => r.root!),
      ...(newton.converged && newton.root !== null ? [newton.root] : []),
    ],
    tolerance * 10,
  );

  return {
    expression: {
      input: expression,
      normalized: parsed.normalized,
      symbolic: parsed.symbolic,
      factorized: parsed.normalized,
      shift,
      shifted: shiftedExpressionNote(parsed.normalized, shift),
    },
    plot: { x, y: listWithNulls(y) },
    domain: {
      a,
      b,
      samples: x.length,
      finiteSamples: finiteCount,
    },
    ivt: {
      brackets: rawBrackets,
      bisections,
      exactGridRoots,
      roots,
    },
    secantPairs: pairs,
    meanValueTheorem: derivativeMvt,
    integralMeanValueTheorem: integralMvt,
    taylor,
    iterations: {
      coordinateSystem: shiftToZero ? "shifted-y" : "x",
      shift: algorithmShift,
      newton,
      secant: secantRuns,
    },
    warnings,
  };
}
