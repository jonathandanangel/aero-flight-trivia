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
import { adaptiveSimpson } from "./integration";
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

/** Secant with residual-decreasing damping (mirrors V15 damped Newton line search). */
function dampedSecant(
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
    const rawStep = -(fCurrent * (current - previous)) / denominator;
    let damping = 1;
    let candidate = current + rawStep;
    let candidateValue = fn(candidate);
    while (
      damping > 1e-4 &&
      (!Number.isFinite(candidateValue) ||
        Math.abs(candidateValue) > (1 - 0.5 * damping) * Math.abs(fCurrent))
    ) {
      damping /= 2;
      candidate = current + damping * rawStep;
      candidateValue = fn(candidate);
    }
    if (!Number.isFinite(candidate) || !Number.isFinite(candidateValue)) {
      message = "Secant line search could not find a finite iterate.";
      break;
    }
    const step = Math.abs(candidate - current);
    history.push({
      iteration,
      x: candidate,
      y: candidate - shift,
      residual: Math.abs(candidateValue),
      step,
      damping,
    });
    if (Math.abs(candidateValue) <= tolerance) {
      current = candidate;
      converged = true;
      message = "Converged by residual tolerance (damped secant).";
      break;
    }
    if (step <= tolerance * (1 + Math.abs(candidate))) {
      current = candidate;
      converged = Math.abs(candidateValue) <= Math.sqrt(tolerance);
      message = converged
        ? "Converged by weighted step tolerance (damped secant)."
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

function mapShiftedSolver(result: RootSolverResult, shift: number): RootSolverResult {
  if (shift === 0) return result;
  const mapped: RootSolverResult = {
    converged: result.converged,
    root: result.root !== null ? result.root + shift : null,
    residual: result.residual,
    iterations: result.iterations,
    history: result.history.map((h) => ({
      ...h,
      x: h.x + shift,
      y: h.x,
    })),
    message: result.message,
  };
  if (result.seeds) {
    mapped.seeds = [result.seeds[0] + shift, result.seeds[1] + shift];
  }
  return mapped;
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

function formatTerm(value: number): string {
  return Number(value.toPrecision(10)).toString();
}

function taylorSeries(fn: ScalarFn, degrees: number[], about: number): TaylorResult[] {
  return degrees.map((degree) => {
    const coefficients: number[] = [];
    let valid = true;
    for (let order = 0; order <= degree; order += 1) {
      const deriv = finiteDifferenceDerivative(fn, about, order);
      const coefficient = deriv / factorial(order);
      if (!Number.isFinite(coefficient)) {
        valid = false;
        break;
      }
      coefficients.push(coefficient);
    }
    let polynomial: string | null = null;
    if (valid) {
      const u = about === 0 ? "x" : `(x-${formatTerm(about)})`;
      const terms = coefficients.map((c, order) => {
        if (order === 0) return formatTerm(c);
        if (order === 1) return `${formatTerm(c)}*${u}`;
        return `${formatTerm(c)}*${u}**${order}`;
      });
      polynomial = terms.join(" + ");
    }
    return {
      degree,
      valid,
      about,
      coefficients: valid ? coefficients : [],
      polynomial,
      message: valid
        ? `Finite-difference Taylor about x = ${formatTerm(about)} (no SymPy).`
        : `The function or a derivative is not finite at x = ${formatTerm(about)}.`,
    };
  });
}

/** V15 shiftExprString: replace bare x with (y+c). */
function shiftExprString(expr: string, c: number): string {
  const cStr = Number(c.toPrecision(12)).toString();
  return expr.replace(/(?<![A-Za-z0-9_])x(?![A-Za-z0-9_])/g, `(y+${cStr})`);
}

/** Synthetic division by (x − r). Returns quotient coeffs + remainder. */
function syntheticDivide(coeffs: number[], root: number): { quotient: number[]; remainder: number } {
  const quotient: number[] = [];
  let acc = 0;
  for (const c of coeffs) {
    acc = c + acc * root;
    quotient.push(acc);
  }
  const remainder = quotient.pop() ?? 0;
  return { quotient, remainder };
}

/**
 * Attempt rational-root factorization for low-degree polynomials recovered by FD at 0.
 */
function tryFactorPolynomial(fn: ScalarFn, normalized: string): string | null {
  const looksPoly = /^[\d\s.+\-*/^()x]+$/i.test(normalized.replace(/\s+/g, ""));
  if (!looksPoly || /sin|cos|exp|log|tan|sqrt|abs|pi/i.test(normalized)) return null;

  const maxDeg = 8;
  const coeffs: number[] = [];
  for (let k = 0; k <= maxDeg; k += 1) {
    const c = finiteDifferenceDerivative(fn, 0, k) / factorial(k);
    if (!Number.isFinite(c)) return null;
    coeffs.push(Math.abs(c) < 1e-10 ? 0 : Number(c.toPrecision(10)));
  }
  while (coeffs.length > 1 && coeffs[coeffs.length - 1] === 0) coeffs.pop();
  const degree = coeffs.length - 1;
  if (degree < 1 || degree > 6) return null;

  let high = [...coeffs].reverse();
  const leading = high[0]!;
  const constant = high[high.length - 1]!;
  const factors: string[] = [];
  const candidateRoots: number[] = [];
  for (let p = 1; p <= Math.max(1, Math.round(Math.abs(constant))); p += 1) {
    for (let q = 1; q <= Math.max(1, Math.round(Math.abs(leading))); q += 1) {
      candidateRoots.push(p / q, -p / q);
    }
  }
  const uniqueRoots = [...new Set(candidateRoots.map((r) => Number(r.toPrecision(8))))];

  for (let guard = 0; guard < 8 && high.length > 2; guard += 1) {
    let found = false;
    for (const r of uniqueRoots) {
      const { quotient, remainder } = syntheticDivide(high, r);
      if (Math.abs(remainder) < 1e-7) {
        factors.push(`(x-${formatTerm(r)})`);
        high = quotient;
        found = true;
        break;
      }
    }
    if (!found) break;
  }

  if (factors.length === 0) return null;
  const rest =
    high.length === 1
      ? formatTerm(high[0]!)
      : high
          .map((c, i) => {
            const power = high.length - 1 - i;
            if (Math.abs(c) < 1e-12) return null;
            if (power === 0) return formatTerm(c);
            if (power === 1) return `${formatTerm(c)}*x`;
            return `${formatTerm(c)}*x^${power}`;
          })
          .filter(Boolean)
          .join(" + ");
  return `${factors.join("*")}${rest && rest !== "1" ? `*(${rest})` : ""}`;
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
  const fn: ScalarFn = (xx) => parsed.evaluate(xx);
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

  const shift = (a + b) / 2;
  const factorized = tryFactorPolynomial(fn, parsed.normalized);
  if (!factorized) {
    warnings.push(
      "No polynomial factorization recovered (non-polynomial or irrational roots); normalized form retained.",
    );
  }
  const shifted = shiftExprString(parsed.normalized, shift);

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
    const adapt = adaptiveSimpson(fn, a, b, Math.min(1e-10, tolerance), 26);
    integral = adapt.value;
    integrationError = adapt.estimatedError;
    average = integral / (b - a);
    integralMessage =
      "Average value via adaptive Simpson (Richardson-style local error estimate).";
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

  let center = shift;
  const successfulBisection = bisections.find((r) => r.converged && r.root !== null);
  if (successfulBisection?.root != null) {
    center = successfulBisection.root;
  }

  const taylorAboutZero = taylorSeries(fn, taylorDegrees, 0);
  const taylorAboutCenter =
    Math.abs(center) > tolerance ? taylorSeries(fn, taylorDegrees, center) : [];
  const taylor = [...taylorAboutZero, ...taylorAboutCenter];

  const algorithmShift = shiftToZero ? center : 0;
  const newtonInitialX =
    rawBrackets.length > 0
      ? (rawBrackets[0]![0] + rawBrackets[0]![1]) / 2
      : (a + b) / 2;

  // When SHIFT_TO_ZERO: iterate on g(y)=f(y+c) then map x = y + c (true V15 y-space).
  const workFn: ScalarFn = shiftToZero ? (yy) => fn(yy + algorithmShift) : fn;
  const workDeriv: ScalarFn = shiftToZero
    ? (yy) => derivative(yy + algorithmShift)
    : derivative;
  const newtonY0 = newtonInitialX - algorithmShift;
  const newton = mapShiftedSolver(
    dampedNewton(workFn, workDeriv, newtonY0, tolerance, maxIterations, 0),
    algorithmShift,
  );

  const secantRuns = pairs.map(([p0, p1]) =>
    mapShiftedSolver(
      dampedSecant(
        workFn,
        p0 - algorithmShift,
        p1 - algorithmShift,
        tolerance,
        maxIterations,
        0,
      ),
      algorithmShift,
    ),
  );

  const multiStart = rawBrackets.slice(0, 6).map(([left, right]) => {
    const mid = (left + right) / 2;
    return mapShiftedSolver(
      dampedNewton(workFn, workDeriv, mid - algorithmShift, tolerance, maxIterations, 0),
      algorithmShift,
    );
  });

  const roots = deduplicate(
    [
      ...exactGridRoots,
      ...bisections
        .filter((r) => r.converged && r.root !== null)
        .map((r) => r.root!),
      ...secantRuns.filter((r) => r.converged && r.root !== null).map((r) => r.root!),
      ...(newton.converged && newton.root !== null ? [newton.root] : []),
      ...multiStart.filter((r) => r.converged && r.root !== null).map((r) => r.root!),
    ],
    tolerance * 10,
  );

  return {
    expression: {
      input: expression,
      normalized: parsed.normalized,
      symbolic: parsed.symbolic,
      factorized: factorized ?? parsed.normalized,
      shift,
      shifted,
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
      coordinateSystem: shiftToZero ? "shifted-y (g(y)=f(y+c))" : "x",
      shift: algorithmShift,
      newton,
      secant: secantRuns,
      multiStartNewton: multiStart,
    },
    warnings,
  };
}
