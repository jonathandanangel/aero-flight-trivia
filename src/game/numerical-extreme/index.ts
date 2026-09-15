/**
 * Numerical Analysis Toolbox math engine (TypeScript port).
 *
 * Naming: camelCase throughout. Python backends used snake_case; UI should consume
 * these TypeScript types / keys (e.g. absoluteError, simpsonOneThird).
 */

export {
  ExpressionError,
  normalizeExpression,
  vectorizeExpression,
  compileScalar,
  compileNamed,
  compileExpression,
} from "./expr";
export type { CompiledExpression } from "./expr";

export {
  finiteOrNone,
  listWithNulls,
  linspace,
  centralDerivative,
  adjacentSignChanges,
  deduplicate,
  brentLike,
  rootsFromGrid,
  bisection,
} from "./common";

export { compositeIntegration } from "./integration";
export { interpolate } from "./interpolation";
export { analyzeFunction } from "./function-analysis";
export { analyzeVibration } from "./vibrations";
export { solveNonlinearSystem } from "./nonlinear";

export {
  generateEskowMatrix,
  modifiedCholeskyEskow,
  solveModifiedCholesky,
  runModifiedCholesky,
  talbotParameters,
  talbotSum,
  runTalbot,
  runDerpar,
} from "./algorithms";

export type * from "./types";

/** Format a number for display (null-safe). */
export function formatNumber(
  value: number | null | undefined,
  digits = 8,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  if (Math.abs(value) !== 0 && (Math.abs(value) < 1e-4 || Math.abs(value) >= 1e6)) {
    return value.toExponential(Math.max(1, digits - 1));
  }
  return Number(value.toPrecision(digits)).toString();
}

/** Parse a comma/space/semicolon-separated list of numbers. */
export function parseNumberList(raw: string): number[] {
  const parts = raw
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) {
    throw new Error("Expected at least one number.");
  }
  const values = parts.map((p) => {
    const n = Number(p);
    if (!Number.isFinite(n)) {
      throw new Error(`Invalid number '${p}'.`);
    }
    return n;
  });
  return values;
}

/** Trigger a JSON download in the browser. No-op outside DOM. */
export function downloadJson(filename: string, data: unknown): void {
  if (typeof document === "undefined") {
    throw new Error("downloadJson requires a browser document.");
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
