import { compileExpression } from "./expr";
import { finiteOrNone, linspace, listWithNulls } from "./common";
import type { IntegrationResult, MethodResult } from "./types";

function methodResult(
  value: number | null,
  reference: number | null,
  available: boolean,
  reason: string | null = null,
): MethodResult {
  return {
    available,
    value: finiteOrNone(value),
    absoluteError:
      value !== null && reference !== null ? finiteOrNone(Math.abs(value - reference)) : null,
    reason,
  };
}

/** Adaptive Simpson quadrature (pure TS stand-in for SciPy quad). */
function adaptiveSimpson(
  fn: (x: number) => number,
  a: number,
  b: number,
  tol = 1e-11,
  maxDepth = 20,
): { value: number; estimatedError: number } {
  function simpson(left: number, right: number): number {
    const mid = (left + right) / 2;
    return ((right - left) / 6) * (fn(left) + 4 * fn(mid) + fn(right));
  }

  function recurse(
    left: number,
    right: number,
    whole: number,
    depth: number,
  ): number {
    const mid = (left + right) / 2;
    const leftS = simpson(left, mid);
    const rightS = simpson(mid, right);
    if (depth <= 0 || Math.abs(leftS + rightS - whole) < 15 * tol) {
      return leftS + rightS + (leftS + rightS - whole) / 15;
    }
    return (
      recurse(left, mid, leftS, depth - 1) + recurse(mid, right, rightS, depth - 1)
    );
  }

  const whole = simpson(a, b);
  const value = recurse(a, b, whole, maxDepth);
  return { value, estimatedError: Math.abs(value - whole) };
}

export function compositeIntegration(
  expression: string,
  a: number,
  b: number,
  subintervals: number,
): IntegrationResult {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error("Integration limits must be finite.");
  }
  if (!Number.isInteger(subintervals) || subintervals < 1) {
    throw new Error("Subintervals must be a positive integer.");
  }

  const parsed = compileExpression(expression);
  const fn = (x: number) => parsed.evaluate(x);
  const n = subintervals;
  const step = (b - a) / n;
  const nodes = linspace(a, b, n + 1);
  const nodeValues = nodes.map(fn);
  if (!nodeValues.every(Number.isFinite)) {
    throw new Error("The function is not finite at every integration node.");
  }

  let trapSum = 0.5 * nodeValues[0]! + 0.5 * nodeValues[n]!;
  for (let i = 1; i < n; i += 1) trapSum += nodeValues[i]!;
  const trapezoidal = step * trapSum;

  const midpoints = Array.from({ length: n }, (_, i) => a + step * (i + 0.5));
  const midpointValues = midpoints.map(fn);
  if (!midpointValues.every(Number.isFinite)) {
    throw new Error("The function is not finite at every midpoint.");
  }
  const midpoint = step * midpointValues.reduce((s, v) => s + v, 0);

  let simpsonOneThird: number | null = null;
  if (n % 2 === 0) {
    let sum = nodeValues[0]! + nodeValues[n]!;
    for (let i = 1; i < n; i += 1) {
      sum += (i % 2 === 1 ? 4 : 2) * nodeValues[i]!;
    }
    simpsonOneThird = (step / 3) * sum;
  }

  let simpsonThreeEighths: number | null = null;
  if (n % 3 === 0) {
    let sum = nodeValues[0]! + nodeValues[n]!;
    for (let i = 1; i < n; i += 1) {
      sum += (i % 3 === 0 ? 2 : 3) * nodeValues[i]!;
    }
    simpsonThreeEighths = ((3 * step) / 8) * sum;
  }

  let reference: number | null = null;
  let referenceError: number | null = null;
  let referenceMessage = "Adaptive Simpson quadrature.";
  try {
    const adapt = adaptiveSimpson(fn, a, b, 1e-11, 24);
    if (Number.isFinite(adapt.value)) {
      reference = adapt.value;
      referenceError = Number.isFinite(adapt.estimatedError) ? adapt.estimatedError : null;
    } else {
      throw new Error("non-finite");
    }
  } catch {
    const denseCount = Math.min(Math.max(20_001, n * 20), 100_001);
    const denseX = linspace(a, b, denseCount);
    const denseY = denseX.map(fn);
    if (denseY.every(Number.isFinite)) {
      let denseTrap = 0;
      for (let i = 0; i < denseX.length - 1; i += 1) {
        denseTrap += 0.5 * (denseY[i]! + denseY[i + 1]!) * (denseX[i + 1]! - denseX[i]!);
      }
      reference = denseTrap;
      referenceError = null;
      referenceMessage = "Dense trapezoidal fallback (adaptive quadrature failed).";
    } else {
      reference = null;
      referenceError = null;
      referenceMessage = "Reference estimate unavailable due to non-finite values.";
    }
  }

  const plotX = linspace(a, b, 800);
  const plotY = plotX.map(fn);

  return {
    expression: {
      input: expression,
      normalized: parsed.normalized,
      symbolic: parsed.symbolic,
    },
    interval: { a, b, subintervals: n, step },
    reference: {
      value: finiteOrNone(reference),
      estimatedError: finiteOrNone(referenceError),
      method: referenceMessage,
    },
    methods: {
      trapezoidal: methodResult(trapezoidal, reference, true),
      midpoint: methodResult(midpoint, reference, true),
      simpsonOneThird: methodResult(
        simpsonOneThird,
        reference,
        simpsonOneThird !== null,
        simpsonOneThird !== null ? null : "Requires an even subinterval count.",
      ),
      simpsonThreeEighths: methodResult(
        simpsonThreeEighths,
        reference,
        simpsonThreeEighths !== null,
        simpsonThreeEighths !== null
          ? null
          : "Requires a subinterval count divisible by 3.",
      ),
    },
    nodes: { x: nodes, y: nodeValues },
    midpoints: { x: midpoints, y: midpointValues },
    plot: { x: plotX, y: listWithNulls(plotY) },
  };
}
