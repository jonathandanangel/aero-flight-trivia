import { finiteOrNone, linspace, listWithNulls } from "./common";
import type { InterpolationResult } from "./types";

function newtonDividedDifferences(
  x: number[],
  y: number[],
): { table: number[][]; coefficients: number[] } {
  const count = x.length;
  const table = Array.from({ length: count }, () =>
    Array.from({ length: count }, () => Number.NaN),
  );
  for (let i = 0; i < count; i += 1) {
    table[i]![0] = y[i]!;
  }
  for (let order = 1; order < count; order += 1) {
    for (let row = 0; row < count - order; row += 1) {
      table[row]![order] =
        (table[row + 1]![order - 1]! - table[row]![order - 1]!) /
        (x[row + order]! - x[row]!);
    }
  }
  const coefficients = table[0]!.slice();
  return { table, coefficients };
}

function newtonEvaluate(coefficients: number[], x: number[], query: number): number {
  let value = coefficients[coefficients.length - 1]!;
  for (let index = coefficients.length - 2; index >= 0; index -= 1) {
    value = value * (query - x[index]!) + coefficients[index]!;
  }
  return value;
}

/** Barycentric Lagrange evaluation (weights recomputed each call — fine for small n). */
function barycentricEvaluate(x: number[], y: number[], query: number): number {
  const n = x.length;
  const weights = new Array<number>(n);
  for (let j = 0; j < n; j += 1) {
    let w = 1;
    for (let k = 0; k < n; k += 1) {
      if (k !== j) w /= x[j]! - x[k]!;
    }
    weights[j] = w;
  }
  let num = 0;
  let den = 0;
  for (let j = 0; j < n; j += 1) {
    if (query === x[j]) return y[j]!;
    const term = weights[j]! / (query - x[j]!);
    num += term * y[j]!;
    den += term;
  }
  return num / den;
}

function solveTridiagonal(
  lower: number[],
  diag: number[],
  upper: number[],
  rhs: number[],
): number[] {
  const n = diag.length;
  const a = lower.slice();
  const b = diag.slice();
  const c = upper.slice();
  const d = rhs.slice();
  for (let i = 1; i < n; i += 1) {
    const w = a[i]! / b[i - 1]!;
    b[i] = b[i]! - w * c[i - 1]!;
    d[i] = d[i]! - w * d[i - 1]!;
  }
  const x = new Array<number>(n);
  x[n - 1] = d[n - 1]! / b[n - 1]!;
  for (let i = n - 2; i >= 0; i -= 1) {
    x[i] = (d[i]! - c[i]! * x[i + 1]!) / b[i]!;
  }
  return x;
}

function naturalSpline(x: number[], y: number[]) {
  const count = x.length;
  const widths = Array.from({ length: count - 1 }, (_, i) => x[i + 1]! - x[i]!);
  const diag = new Array<number>(count).fill(0);
  const lower = new Array<number>(count).fill(0);
  const upper = new Array<number>(count).fill(0);
  const rhs = new Array<number>(count).fill(0);
  diag[0] = 1;
  diag[count - 1] = 1;
  for (let index = 1; index < count - 1; index += 1) {
    lower[index] = widths[index - 1]!;
    diag[index] = 2 * (widths[index - 1]! + widths[index]!);
    upper[index] = widths[index]!;
    rhs[index] =
      3 *
      ((y[index + 1]! - y[index]!) / widths[index]! -
        (y[index]! - y[index - 1]!) / widths[index - 1]!);
  }
  const c = solveTridiagonal(lower, diag, upper, rhs);
  const a = y.slice(0, count - 1);
  const b = new Array<number>(count - 1);
  const d = new Array<number>(count - 1);
  for (let index = 0; index < count - 1; index += 1) {
    b[index] =
      (y[index + 1]! - y[index]!) / widths[index]! -
      (widths[index]! * (2 * c[index]! + c[index + 1]!)) / 3;
    d[index] = (c[index + 1]! - c[index]!) / (3 * widths[index]!);
  }
  return { a, b, c, d };
}

function searchSortedRight(x: number[], value: number): number {
  let lo = 0;
  let hi = x.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (value < x[mid]!) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

function splineEvaluate(
  x: number[],
  a: number[],
  b: number[],
  c: number[],
  d: number[],
  query: number,
): number {
  let index = searchSortedRight(x, query) - 1;
  index = Math.max(0, Math.min(index, x.length - 2));
  const local = query - x[index]!;
  return a[index]! + b[index]! * local + c[index]! * local ** 2 + d[index]! * local ** 3;
}

function newtonFormula(coefficients: number[], x: number[]): string {
  const pieces = [`${formatCoeff(coefficients[0]!)}`];
  let product = "";
  for (let index = 1; index < coefficients.length; index += 1) {
    product += `(x - ${formatCoeff(x[index - 1]!)})`;
    pieces.push(`(${formatCoeff(coefficients[index]!)})${product}`);
  }
  return pieces.join(" + ");
}

function formatCoeff(value: number): string {
  return Number(value.toPrecision(8)).toString();
}

function lagrangeFormula(x: number[], y: number[]): string | null {
  if (x.length > 12) return null;
  const pieces: string[] = [];
  for (let row = 0; row < x.length; row += 1) {
    const factors: string[] = [];
    let denominator = 1;
    for (let column = 0; column < x.length; column += 1) {
      if (column === row) continue;
      factors.push(`(x - ${formatCoeff(x[column]!)})`);
      denominator *= x[row]! - x[column]!;
    }
    pieces.push(
      `(${formatCoeff(y[row]!)})*${factors.join("*")}/(${formatCoeff(denominator)})`,
    );
  }
  return pieces.join(" + ");
}

function allFinite(values: number[]): boolean {
  return values.every(Number.isFinite);
}

export function interpolate(
  points: Array<[number, number]>,
  query: number,
  plotPoints: number,
): InterpolationResult {
  if (points.length < 2) {
    throw new Error("At least two interpolation points are required.");
  }
  if (!Number.isInteger(plotPoints) || plotPoints < 2) {
    throw new Error("plotPoints must be an integer >= 2.");
  }

  const ordered = [...points].sort((p, q) => p[0] - q[0]);
  const x = ordered.map((p) => p[0]);
  const y = ordered.map((p) => p[1]);
  if (new Set(x).size !== x.length) {
    throw new Error("All x-values must be distinct.");
  }

  const { table, coefficients } = newtonDividedDifferences(x, y);
  const newtonValue = newtonEvaluate(coefficients, x, query);
  const lagrangeValue = barycentricEvaluate(x, y, query);
  const { a: splineA, b: splineB, c: splineC, d: splineD } = naturalSpline(x, y);
  const splineValue = splineEvaluate(x, splineA, splineB, splineC, splineD, query);

  if (
    ![coefficients, splineA, splineB, splineC, splineD].every((arr) => allFinite(arr))
  ) {
    throw new Error("Interpolation became non-finite; rescale or separate the x-values.");
  }

  const plotX = linspace(x[0]!, x[x.length - 1]!, plotPoints);
  const polynomialY = plotX.map((q) => newtonEvaluate(coefficients, x, q));
  const splineY = plotX.map((q) => splineEvaluate(x, splineA, splineB, splineC, splineD, q));

  const dividedTable = table.map((row) => row.map((v) => finiteOrNone(v)));
  const splineSegments = Array.from({ length: x.length - 1 }, (_, index) => ({
    left: x[index]!,
    right: x[index + 1]!,
    a: splineA[index]!,
    b: splineB[index]!,
    c: splineC[index]!,
    d: splineD[index]!,
  }));

  const warnings: string[] = [];
  if (query < x[0]! || query > x[x.length - 1]!) {
    warnings.push(
      "The query lies outside the data interval; the spline value extrapolates the nearest segment.",
    );
  }
  if (x.length > 15) {
    warnings.push(
      "A high-degree global interpolating polynomial may be poorly conditioned; compare the spline.",
    );
  }

  return {
    points: x.map((xv, i) => ({ x: xv, y: y[i]! })),
    query,
    newton: {
      value: finiteOrNone(newtonValue),
      coefficients,
      dividedDifferenceTable: dividedTable,
      formula: newtonFormula(coefficients, x),
    },
    lagrange: {
      value: finiteOrNone(lagrangeValue),
      formula: lagrangeFormula(x, y),
      evaluation: "Barycentric form is used numerically for improved stability.",
    },
    naturalCubicSpline: {
      value: finiteOrNone(splineValue),
      segments: splineSegments,
      boundaryCondition: "S''(x_0) = S''(x_n) = 0",
    },
    agreement: {
      newtonVsLagrangeAbsoluteDifference: finiteOrNone(
        Math.abs(newtonValue - lagrangeValue),
      ),
    },
    plot: {
      x: plotX,
      polynomial: listWithNulls(polynomialY),
      spline: listWithNulls(splineY),
    },
    warnings,
  };
}
