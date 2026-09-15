import { compileExpression } from "./expr";
import { finiteOrNone } from "./common";
import type { NonlinearSolverResult, NonlinearSystemResult, NonlinearTraceRow } from "./types";

const MACHINE_EPS = Number.EPSILON;

type VectorFn = (x: number[]) => number[];

function infNorm(vector: number[]): number {
  let max = 0;
  for (const v of vector) {
    const a = Math.abs(v);
    if (a > max) max = a;
  }
  return max;
}

function numericalJacobian(fn: VectorFn, x: number[]): number[][] {
  const count = x.length;
  const jacobian = Array.from({ length: count }, () => new Array<number>(count).fill(0));
  for (let column = 0; column < count; column += 1) {
    const step = Math.sqrt(MACHINE_EPS) * (1 + Math.abs(x[column]!));
    const plus = x.slice();
    const minus = x.slice();
    plus[column]! += step;
    minus[column]! -= step;
    const fp = fn(plus);
    const fm = fn(minus);
    for (let row = 0; row < count; row += 1) {
      jacobian[row]![column] = (fp[row]! - fm[row]!) / (2 * step);
    }
  }
  return jacobian;
}

function traceRow(
  iteration: number,
  x: number[],
  residual: number,
  extra: Partial<NonlinearTraceRow> = {},
): NonlinearTraceRow {
  return {
    iteration,
    x: x.map((v) => finiteOrNone(v)),
    residual: finiteOrNone(residual),
    ...extra,
  };
}

function diagonalNonlinearJacobi(
  fn: VectorFn,
  initial: number[],
  tolerance: number,
  maxIterations: number,
): NonlinearSolverResult {
  let x = initial.slice();
  let residual = infNorm(fn(x));
  const history = [traceRow(0, x, residual)];
  let converged = residual <= tolerance;
  let message = converged
    ? "Initial approximation satisfies the residual tolerance."
    : "Maximum outer iterations reached.";

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    if (converged) break;
    const values = fn(x);
    const jacobian = numericalJacobian(fn, x);
    const diagonal = jacobian.map((row, i) => row[i]!);
    const threshold = Math.sqrt(MACHINE_EPS) * Math.max(1, infNorm(jacobian.flat()));
    if (diagonal.some((d) => !Number.isFinite(d) || Math.abs(d) <= threshold)) {
      message = "Stopped: zero or unreliable Jacobian diagonal.";
      break;
    }
    const candidate = x.map((xi, i) => xi - values[i]! / diagonal[i]!);
    if (candidate.some((v) => !Number.isFinite(v)) || infNorm(candidate) > 1e10) {
      message = "Stopped: iterate diverged or became non-finite.";
      break;
    }
    const candidateResidual = infNorm(fn(candidate));
    const stepNorm = infNorm(candidate.map((v, i) => v - x[i]!));
    history.push(traceRow(iteration, candidate, candidateResidual, { stepNorm }));
    x = candidate;
    if (candidateResidual <= tolerance) {
      converged = true;
      message = "Converged by residual tolerance.";
      break;
    }
    if (stepNorm <= tolerance * (1 + infNorm(candidate))) {
      converged = candidateResidual <= Math.sqrt(tolerance);
      message = converged
        ? "Converged by step tolerance."
        : "Stopped by step tolerance before the residual was small.";
      break;
    }
  }

  return {
    method: "diagonal-nonlinear-jacobi",
    converged,
    estimate: x.map((v) => finiteOrNone(v)),
    iterations: history.length - 1,
    finalResidual: finiteOrNone(infNorm(fn(x))),
    history,
    message,
  };
}

function matVec(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) =>
    row.reduce((sum, a, j) => sum + a * vector[j]!, 0),
  );
}

function innerJacobi(
  matrix: number[][],
  rightHandSide: number[],
  tolerance: number,
  maxIterations: number,
): { step: number[]; info: { converged: boolean; iterations: number; residual: number | null; message: string } } {
  const n = rightHandSide.length;
  let x = new Array<number>(n).fill(0);
  const diagonal = matrix.map((row, i) => row[i]!);
  const remainder = matrix.map((row, i) =>
    row.map((v, j) => (i === j ? 0 : v)),
  );
  const threshold = Math.sqrt(MACHINE_EPS) * Math.max(1, infNorm(matrix.flat()));
  if (
    matrix.flat().some((v) => !Number.isFinite(v)) ||
    diagonal.some((d) => Math.abs(d) <= threshold)
  ) {
    return {
      step: x,
      info: {
        converged: false,
        iterations: 0,
        residual: null,
        message: "has a zero or unreliable diagonal.",
      },
    };
  }

  let residual = infNorm(matVec(matrix, x).map((v, i) => v - rightHandSide[i]!));
  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const rem = matVec(remainder, x);
    const candidate = rightHandSide.map((b, i) => (b - rem[i]!) / diagonal[i]!);
    if (candidate.some((v) => !Number.isFinite(v)) || infNorm(candidate) > 1e12) {
      return {
        step: x,
        info: {
          converged: false,
          iterations: iteration,
          residual: finiteOrNone(residual),
          message: "diverged.",
        },
      };
    }
    residual = infNorm(matVec(matrix, candidate).map((v, i) => v - rightHandSide[i]!));
    x = candidate;
    if (residual <= tolerance * Math.max(1, infNorm(rightHandSide))) {
      return {
        step: x,
        info: {
          converged: true,
          iterations: iteration,
          residual,
          message: "converged.",
        },
      };
    }
  }
  return {
    step: x,
    info: {
      converged: false,
      iterations: maxIterations,
      residual: finiteOrNone(residual),
      message: "did not converge within inner MAXIT.",
    },
  };
}

function inexactNewtonJacobi(
  fn: VectorFn,
  initial: number[],
  outerTolerance: number,
  outerMaxIterations: number,
  innerTolerance: number,
  innerMaxIterations: number,
): NonlinearSolverResult {
  let x = initial.slice();
  let residual = infNorm(fn(x));
  const history = [traceRow(0, x, residual, { innerIterations: 0, damping: 1 })];
  const innerCounts: number[] = [];
  let converged = residual <= outerTolerance;
  let message = converged
    ? "Initial approximation satisfies the residual tolerance."
    : "Maximum outer iterations reached.";

  for (let iteration = 1; iteration <= outerMaxIterations; iteration += 1) {
    if (converged) break;
    const values = fn(x);
    const jacobian = numericalJacobian(fn, x);
    const { step, info: inner } = innerJacobi(
      jacobian,
      values.map((v) => -v),
      innerTolerance,
      innerMaxIterations,
    );
    innerCounts.push(inner.iterations);
    if (!inner.converged) {
      message = `Stopped: inner Jacobi ${inner.message}`;
      break;
    }

    let damping = 1;
    const baseResidual = infNorm(values);
    let candidate = x.map((xi, i) => xi + step[i]!);
    let candidateResidual = infNorm(fn(candidate));
    while (damping > 1 / 1024 && candidateResidual > baseResidual) {
      damping /= 2;
      candidate = x.map((xi, i) => xi + damping * step[i]!);
      candidateResidual = infNorm(fn(candidate));
    }
    if (candidate.some((v) => !Number.isFinite(v)) || infNorm(candidate) > 1e10) {
      message = "Stopped: outer iterate diverged.";
      break;
    }
    const stepNorm = infNorm(candidate.map((v, i) => v - x[i]!));
    history.push(
      traceRow(iteration, candidate, candidateResidual, {
        innerIterations: inner.iterations,
        innerResidual: inner.residual,
        damping,
        stepNorm,
      }),
    );
    x = candidate;
    if (candidateResidual <= outerTolerance) {
      converged = true;
      message = "Converged by residual tolerance.";
      break;
    }
    if (damping <= 1 / 1024 && candidateResidual >= baseResidual) {
      message = "Stopped: damping could not reduce the residual.";
      break;
    }
  }

  return {
    method: "inexact-newton-with-inner-jacobi",
    converged,
    estimate: x.map((v) => finiteOrNone(v)),
    iterations: history.length - 1,
    innerIterationCounts: innerCounts,
    finalResidual: finiteOrNone(infNorm(fn(x))),
    history,
    message,
  };
}

export function solveNonlinearSystem(
  equations: string[],
  initial: number[],
  outerTolerance: number,
  outerMaxIterations: number,
  innerTolerance: number,
  innerMaxIterations: number,
): NonlinearSystemResult {
  const count = equations.length;
  if (count !== 2 && count !== 3) {
    throw new Error("Nonlinear system must have 2 or 3 equations.");
  }
  if (initial.length !== count) {
    throw new Error("Initial guess dimension must match equation count.");
  }
  const variableNames = count === 2 ? ["x", "y"] : ["x", "y", "z"];
  const parsed = equations.map((eq) => compileExpression(eq, variableNames));

  const fn: VectorFn = (vector) => {
    const values = parsed.map((item) => item.evaluate(...vector));
    if (values.length !== count || values.some((v) => !Number.isFinite(v))) {
      throw new Error("System returned non-finite or incorrectly sized values.");
    }
    return values;
  };

  // No SymPy: report that Jacobian is numerical only.
  const symbolicJacobian = parsed.map((item) =>
    variableNames.map(
      (v) => `∂(${item.normalized})/∂${v} (numerical FD)`,
    ),
  );
  const initialNumericJacobian = numericalJacobian(fn, initial);
  const diagonal = diagonalNonlinearJacobi(
    fn,
    initial,
    outerTolerance,
    outerMaxIterations,
  );
  const inexact = inexactNewtonJacobi(
    fn,
    initial,
    outerTolerance,
    outerMaxIterations,
    innerTolerance,
    innerMaxIterations,
  );

  return {
    dimension: count,
    variables: variableNames,
    equations: equations.map((source, i) => ({
      input: source,
      normalized: parsed[i]!.normalized,
      symbolic: parsed[i]!.symbolic,
    })),
    method: {
      jacobian: symbolicJacobian,
      initialNumericJacobian,
      jacobiSplit: "J = D + L + U",
      innerUpdate: "s^(m+1) = D^(-1) [b - (L+U)s^(m)]",
    },
    diagonalNonlinearJacobi: diagonal,
    inexactNewtonJacobi: inexact,
  };
}
