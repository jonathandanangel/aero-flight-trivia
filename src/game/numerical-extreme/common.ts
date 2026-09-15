import type { BisectionResult, ScalarFn } from "./types";

const MACHINE_EPS = Number.EPSILON;

export function finiteOrNone(value: unknown): number | null {
  try {
    const result = Number(value);
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export function listWithNulls(values: Iterable<unknown>): Array<number | null> {
  return Array.from(values, (value) => finiteOrNone(value));
}

export function linspace(a: number, b: number, count: number): number[] {
  if (count < 2) {
    if (count <= 0) return [];
    return [a];
  }
  const out = new Array<number>(count);
  const step = (b - a) / (count - 1);
  for (let i = 0; i < count; i += 1) {
    out[i] = a + step * i;
  }
  out[count - 1] = b;
  return out;
}

export function centralDerivative(fn: ScalarFn, x: number): number {
  const step = Math.sqrt(MACHINE_EPS) * (1 + Math.abs(x));
  const plus = fn(x + step);
  const minus = fn(x - step);
  if (!Number.isFinite(plus) || !Number.isFinite(minus)) {
    return Number.NaN;
  }
  return (plus - minus) / (2 * step);
}

export function adjacentSignChanges(
  x: number[],
  y: number[],
): Array<[number, number]> {
  const brackets: Array<[number, number]> = [];
  for (let index = 0; index < x.length - 1; index += 1) {
    const leftY = y[index]!;
    const rightY = y[index + 1]!;
    if (!Number.isFinite(leftY) || !Number.isFinite(rightY)) continue;
    if (leftY * rightY < 0) {
      brackets.push([x[index]!, x[index + 1]!]);
    }
  }
  return brackets;
}

export function deduplicate(values: Iterable<number>, tolerance: number): number[] {
  const ordered = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  const result: number[] = [];
  for (const value of ordered) {
    const last = result[result.length - 1];
    if (last === undefined || Math.abs(value - last) > tolerance * (1 + Math.abs(value))) {
      result.push(value);
    }
  }
  return result;
}

/** Brent-like root finder on [left, right] with opposite signs. */
export function brentLike(
  fn: ScalarFn,
  left: number,
  right: number,
  tolerance: number,
  maxIterations = 100,
): number | null {
  let a = left;
  let b = right;
  let fa = fn(a);
  let fb = fn(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb) || fa * fb > 0) {
    return null;
  }
  if (Math.abs(fa) < Math.abs(fb)) {
    [a, b] = [b, a];
    [fa, fb] = [fb, fa];
  }
  let c = a;
  let fc = fa;
  let d = b - a;
  let e = d;
  const xtol = tolerance;
  const rtol = 4 * MACHINE_EPS;

  for (let iter = 0; iter < maxIterations; iter += 1) {
    if (Math.abs(fc) < Math.abs(fb)) {
      a = b;
      b = c;
      c = a;
      fa = fb;
      fb = fc;
      fc = fa;
    }
    const tol = 2 * rtol * Math.abs(b) + 0.5 * xtol;
    const mid = (c - b) / 2;
    if (Math.abs(fb) <= tolerance || Math.abs(mid) <= tol) {
      return b;
    }
    if (Math.abs(e) >= tol && Math.abs(fa) > Math.abs(fb)) {
      const s = fb / fa;
      let p: number;
      let q: number;
      if (a === c) {
        p = 2 * mid * s;
        q = 1 - s;
      } else {
        q = fa / fc;
        const r = fb / fc;
        p = s * (2 * mid * q * (q - r) - (b - a) * (r - 1));
        q = (q - 1) * (r - 1) * (s - 1);
      }
      if (p > 0) q = -q;
      p = Math.abs(p);
      const min1 = 3 * mid * q - Math.abs(tol * q);
      const min2 = Math.abs(e * q);
      if (2 * p < Math.min(min1, min2)) {
        e = d;
        d = p / q;
      } else {
        d = mid;
        e = d;
      }
    } else {
      d = mid;
      e = d;
    }
    a = b;
    fa = fb;
    if (Math.abs(d) > tol) {
      b += d;
    } else {
      b += mid >= 0 ? tol : -tol;
    }
    fb = fn(b);
    if (!Number.isFinite(fb)) return null;
    if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) {
      c = a;
      fc = fa;
      d = b - a;
      e = d;
    }
  }
  return b;
}

export function rootsFromGrid(
  fn: ScalarFn,
  x: number[],
  y: number[],
  tolerance: number,
): number[] {
  const roots: number[] = [];
  for (let index = 0; index < y.length; index += 1) {
    const yi = y[index]!;
    if (Number.isFinite(yi) && Math.abs(yi) <= tolerance) {
      roots.push(x[index]!);
    }
  }
  for (const [left, right] of adjacentSignChanges(x, y)) {
    const root = brentLike(fn, left, right, tolerance);
    if (root === null) continue;
    const residual = fn(root);
    if (Number.isFinite(residual)) {
      roots.push(root);
    }
  }
  return deduplicate(roots, Math.max(tolerance * 10, 1e-10));
}

export function bisection(
  fn: ScalarFn,
  left: number,
  right: number,
  tolerance: number,
  maxIterations: number,
): BisectionResult {
  let fLeft = fn(left);
  const fRight = fn(right);
  const history: BisectionResult["history"] = [];

  if (![fLeft, fRight].every(Number.isFinite)) {
    return {
      converged: false,
      root: null,
      residual: null,
      iterations: 0,
      bracket: [left, right],
      history,
      message: "Bracket endpoints are not finite.",
    };
  }
  if (fLeft === 0) {
    return {
      converged: true,
      root: left,
      residual: 0,
      iterations: 0,
      bracket: [left, left],
      history,
      message: "Left endpoint is an exact root.",
    };
  }
  if (fRight === 0) {
    return {
      converged: true,
      root: right,
      residual: 0,
      iterations: 0,
      bracket: [right, right],
      history,
      message: "Right endpoint is an exact root.",
    };
  }
  if (fLeft * fRight > 0) {
    return {
      converged: false,
      root: null,
      residual: null,
      iterations: 0,
      bracket: [left, right],
      history,
      message: "Endpoints do not bracket a sign change.",
    };
  }

  let lo = left;
  let hi = right;
  let midpoint = (lo + hi) / 2;
  let converged = false;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    midpoint = (lo + hi) / 2;
    const fMid = fn(midpoint);
    history.push({
      iteration,
      left: lo,
      right: hi,
      midpoint,
      residual: finiteOrNone(Math.abs(fMid)),
    });
    if (!Number.isFinite(fMid)) break;
    if (
      Math.abs(fMid) <= tolerance ||
      Math.abs(hi - lo) <= tolerance * (1 + Math.abs(midpoint))
    ) {
      converged = true;
      break;
    }
    if (fLeft * fMid < 0) {
      hi = midpoint;
    } else {
      lo = midpoint;
      fLeft = fMid;
    }
  }

  const residual = fn(midpoint);
  const residualOk =
    Number.isFinite(residual) &&
    Math.abs(residual) <= Math.max(Math.sqrt(tolerance), tolerance);
  converged = converged && residualOk;

  return {
    converged,
    root: finiteOrNone(midpoint),
    residual: finiteOrNone(residual),
    iterations: history.length,
    bracket: [lo, hi],
    history,
    message: converged
      ? "Converged."
      : "Stopped without a small residual; the bracket may contain a discontinuity.",
  };
}
