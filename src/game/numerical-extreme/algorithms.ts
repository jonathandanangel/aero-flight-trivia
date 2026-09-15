/**
 * Algorithm ports: Eskow modified Cholesky, Talbot inversion presets, DERPAR continuation.
 * Pure TypeScript — plain nested arrays (no numpy/scipy).
 */

import { finiteOrNone, linspace, listWithNulls } from "./common";
import type {
  ContinuationPoint,
  ContinuationResult,
  ModifiedCholeskyResult,
  TalbotResult,
} from "./types";

const MACHINE_EPS = Number.EPSILON;
const FLOAT_TINY = Number.MIN_VALUE;
const FLOAT_MAX = Number.MAX_VALUE;

// ——— Linear algebra helpers ———

function zeros(n: number, m = n): number[][] {
  return Array.from({ length: n }, () => new Array<number>(m).fill(0));
}

function cloneMatrix(a: number[][]): number[][] {
  return a.map((row) => row.slice());
}

function matMul(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const m = b[0]!.length;
  const k = b.length;
  const out = zeros(n, m);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < m; j += 1) {
      let sum = 0;
      for (let t = 0; t < k; t += 1) sum += a[i]![t]! * b[t]![j]!;
      out[i]![j] = sum;
    }
  }
  return out;
}

function transpose(a: number[][]): number[][] {
  const n = a.length;
  const m = a[0]!.length;
  const out = zeros(m, n);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < m; j += 1) out[j]![i] = a[i]![j]!;
  }
  return out;
}

function diag(values: number[]): number[][] {
  const n = values.length;
  const out = zeros(n);
  for (let i = 0; i < n; i += 1) out[i]![i] = values[i]!;
  return out;
}

function tril(a: number[][]): number[][] {
  const n = a.length;
  const out = zeros(n);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) out[i]![j] = a[i]![j]!;
  }
  return out;
}

function matVec(a: number[][], x: number[]): number[] {
  return a.map((row) => row.reduce((s, v, j) => s + v * x[j]!, 0));
}

function infNormVec(v: number[]): number {
  return v.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
}

function infNormMat(a: number[][]): number {
  return a.reduce((m, row) => Math.max(m, infNormVec(row)), 0);
}

function isSymmetric(a: number[][], rtol = 1e-10, atol = 1e-12): boolean {
  const n = a.length;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const diff = Math.abs(a[i]![j]! - a[j]![i]!);
      if (diff > atol + rtol * Math.max(Math.abs(a[i]![j]!), Math.abs(a[j]![i]!))) {
        return false;
      }
    }
  }
  return true;
}

/** Seeded mulberry32 PRNG. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomNormal(rng: () => number): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Thin QR via modified Gram-Schmidt. */
function qr(a: number[][]): { q: number[][]; r: number[][] } {
  const n = a.length;
  const q = cloneMatrix(a);
  const r = zeros(n);
  for (let j = 0; j < n; j += 1) {
    let norm = 0;
    for (let i = 0; i < n; i += 1) norm += q[i]![j]! ** 2;
    norm = Math.sqrt(norm);
    r[j]![j] = norm;
    if (norm > 0) {
      for (let i = 0; i < n; i += 1) q[i]![j]! /= norm;
    }
    for (let k = j + 1; k < n; k += 1) {
      let dot = 0;
      for (let i = 0; i < n; i += 1) dot += q[i]![j]! * q[i]![k]!;
      r[j]![k] = dot;
      for (let i = 0; i < n; i += 1) q[i]![k]! -= dot * q[i]![j]!;
    }
  }
  return { q, r };
}

/** Jacobi eigenvalue algorithm for symmetric matrices (sorted ascending). */
function eigvalsh(input: number[][]): number[] {
  const n = input.length;
  const a = cloneMatrix(input);
  const maxIter = 100 * n * n;
  for (let iter = 0; iter < maxIter; iter += 1) {
    let p = 0;
    let q = 1;
    let max = Math.abs(a[0]![1] ?? 0);
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const v = Math.abs(a[i]![j]!);
        if (v > max) {
          max = v;
          p = i;
          q = j;
        }
      }
    }
    if (max < 1e-14 * (1 + infNormMat(a))) break;
    const app = a[p]![p]!;
    const aqq = a[q]![q]!;
    const apq = a[p]![q]!;
    const tau = (aqq - app) / (2 * apq);
    const t =
      Math.sign(tau || 1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
    const c = 1 / Math.sqrt(1 + t * t);
    const s = t * c;
    a[p]![p] = app - t * apq;
    a[q]![q] = aqq + t * apq;
    a[p]![q] = 0;
    a[q]![p] = 0;
    for (let i = 0; i < n; i += 1) {
      if (i === p || i === q) continue;
      const aip = a[i]![p]!;
      const aiq = a[i]![q]!;
      a[i]![p] = c * aip - s * aiq;
      a[p]![i] = a[i]![p]!;
      a[i]![q] = s * aip + c * aiq;
      a[q]![i] = a[i]![q]!;
    }
  }
  return a.map((row, i) => row[i]!).sort((x, y) => x - y);
}

function forwardSolve(L: number[][], b: number[]): number[] {
  const n = L.length;
  const x = new Array<number>(n);
  for (let i = 0; i < n; i += 1) {
    let sum = b[i]!;
    for (let j = 0; j < i; j += 1) sum -= L[i]![j]! * x[j]!;
    x[i] = sum / L[i]![i]!;
  }
  return x;
}

function backSolve(U: number[][], b: number[]): number[] {
  const n = U.length;
  const x = new Array<number>(n);
  for (let i = n - 1; i >= 0; i -= 1) {
    let sum = b[i]!;
    for (let j = i + 1; j < n; j += 1) sum -= U[i]![j]! * x[j]!;
    x[i] = sum / U[i]![i]!;
  }
  return x;
}

// ——— Modified Cholesky (Eskow) ———

export function generateEskowMatrix(
  size: number,
  low: number,
  high: number,
  seed: number,
): number[][] {
  const rng = mulberry32(seed);
  const raw = zeros(size);
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) raw[i]![j] = randomNormal(rng);
  }
  const { q: orthogonal } = qr(raw);
  const eigenvalues = Array.from(
    { length: size },
    () => low + (high - low) * rng(),
  );
  const matrix = matMul(matMul(orthogonal, diag(eigenvalues)), transpose(orthogonal));
  const sym = zeros(size);
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) {
      sym[i]![j] = 0.5 * (matrix[i]![j]! + matrix[j]![i]!);
    }
  }
  return sym;
}

function symmetricSwap(matrix: number[][], first: number, second: number, start: number): void {
  if (first === second) return;
  if (start > 0) {
    for (let j = 0; j < start; j += 1) {
      const tmp = matrix[first]![j]!;
      matrix[first]![j] = matrix[second]![j]!;
      matrix[second]![j] = tmp;
    }
  }
  const size = matrix.length;
  const trailing = zeros(size - start);
  for (let i = start; i < size; i += 1) {
    for (let j = start; j < size; j += 1) {
      trailing[i - start]![j - start] = matrix[i]![j]!;
    }
  }
  const lf = first - start;
  const ls = second - start;
  // swap rows
  for (let j = 0; j < trailing[0]!.length; j += 1) {
    const tmp = trailing[lf]![j]!;
    trailing[lf]![j] = trailing[ls]![j]!;
    trailing[ls]![j] = tmp;
  }
  // swap cols
  for (let i = 0; i < trailing.length; i += 1) {
    const tmp = trailing[i]![lf]!;
    trailing[i]![lf] = trailing[i]![ls]!;
    trailing[i]![ls] = tmp;
  }
  for (let i = start; i < size; i += 1) {
    for (let j = start; j < size; j += 1) {
      matrix[i]![j] = trailing[i - start]![j - start]!;
    }
  }
}

function gershgorinBounds(matrix: number[][], start: number): number[] {
  const size = matrix.length;
  const bounds = new Array<number>(size).fill(0);
  for (let row = start; row < size; row += 1) {
    let active = 0;
    for (let j = start; j < row; j += 1) active += Math.abs(matrix[row]![j]!);
    for (let i = row + 1; i < size; i += 1) active += Math.abs(matrix[i]![row]!);
    bounds[row] = active - matrix[row]![row]!;
  }
  return bounds;
}

function choleskyStep(matrix: number[][], column: number): void {
  const pivot = matrix[column]![column]!;
  if (!Number.isFinite(pivot) || pivot <= 0) {
    throw new Error("Modified Cholesky produced a non-positive pivot.");
  }
  const root = Math.sqrt(pivot);
  matrix[column]![column] = root;
  if (column + 1 === matrix.length) return;
  const factors: number[] = [];
  for (let i = column + 1; i < matrix.length; i += 1) {
    factors.push(matrix[i]![column]! / root);
    matrix[i]![column] = factors[factors.length - 1]!;
  }
  for (let i = 0; i < factors.length; i += 1) {
    for (let j = 0; j < factors.length; j += 1) {
      matrix[column + 1 + i]![column + 1 + j]! -= factors[i]! * factors[j]!;
    }
  }
}

function finishTwoByTwo(
  matrix: number[][],
  additions: number[],
  tauTwo: number,
  deltaIn: number,
  gamma: number,
): number {
  const size = matrix.length;
  const first = size - 2;
  const trace = matrix[first]![first]! + matrix[size - 1]![size - 1]!;
  const difference = matrix[first]![first]! - matrix[size - 1]![size - 1]!;
  const spread = Math.sqrt(difference ** 2 + 4 * matrix[size - 1]![first]! ** 2);
  const lambdaLow = (trace - spread) / 2;
  const lambdaHigh = (trace + spread) / 2;
  let candidate = (lambdaHigh - lambdaLow) / (1 - tauTwo);
  candidate = Math.max(candidate, gamma);
  candidate = tauTwo * candidate - lambdaLow;
  let delta = Math.max(deltaIn, Math.max(0, candidate));
  if (delta > 0) {
    matrix[first]![first]! += delta;
    matrix[size - 1]![size - 1]! += delta;
    additions[first] = delta;
    additions[size - 1] = delta;
  }
  choleskyStep(matrix, first);
  const finalPivot = matrix[size - 1]![size - 1]!;
  if (finalPivot <= 0 || !Number.isFinite(finalPivot)) {
    throw new Error("Final modified Cholesky pivot is not positive.");
  }
  matrix[size - 1]![size - 1] = Math.sqrt(finalPivot);
  return delta;
}

export function modifiedCholeskyEskow(
  inputMatrix: number[][],
  tauOne?: number,
  tauTwo?: number,
): { lower: number[][]; permutation: number[]; additions: number[] } {
  const matrix = cloneMatrix(inputMatrix);
  const size = matrix.length;
  if (matrix.some((row) => row.length !== size)) {
    throw new Error("Matrix must be square.");
  }
  if (matrix.flat().some((v) => !Number.isFinite(v))) {
    throw new Error("Matrix entries must be finite.");
  }
  if (!isSymmetric(matrix)) {
    throw new Error("Modified Cholesky requires a symmetric matrix.");
  }
  for (let i = 0; i < size; i += 1) {
    for (let j = i + 1; j < size; j += 1) {
      const avg = 0.5 * (matrix[i]![j]! + matrix[j]![i]!);
      matrix[i]![j] = avg;
      matrix[j]![i] = avg;
    }
  }

  const t1 = tauOne ?? MACHINE_EPS ** (1 / 3);
  const t2 = tauTwo ?? MACHINE_EPS ** (1 / 3);
  const permutation = Array.from({ length: size }, (_, i) => i);
  const additions = new Array<number>(size).fill(0);
  let gamma = Math.max(...Array.from({ length: size }, (_, i) => Math.abs(matrix[i]![i]!)));
  if (gamma === 0 && matrix.flat().every((v) => v === 0)) gamma = 1;
  let phaseOne = Array.from({ length: size }, (_, i) => matrix[i]![i]!).every((d) => d >= 0);
  let delta = 0;
  const threshold = t1 * gamma;
  let bounds = phaseOne ? new Array<number>(size).fill(0) : gershgorinBounds(matrix, 0);

  if (size === 1) {
    delta = Math.max(0, t2 * Math.abs(matrix[0]![0]!) - matrix[0]![0]!);
    if (matrix[0]![0] === 0) delta = t2;
    additions[0] = delta;
    matrix[0]![0] = Math.sqrt(matrix[0]![0]! + delta);
    return { lower: tril(matrix), permutation, additions };
  }

  for (let column = 0; column < size - 1; column += 1) {
    if (phaseOne) {
      const diagonal = Array.from(
        { length: size - column },
        (_, i) => matrix[column + i]![column + i]!,
      );
      let pivot = column;
      let best = diagonal[0]!;
      for (let i = 1; i < diagonal.length; i += 1) {
        if (diagonal[i]! > best) {
          best = diagonal[i]!;
          pivot = column + i;
        }
      }
      if (pivot !== column) {
        symmetricSwap(matrix, column, pivot, column);
        const tmp = permutation[column]!;
        permutation[column] = permutation[pivot]!;
        permutation[pivot] = tmp;
      }

      const pivotValue = matrix[column]![column]!;
      if (pivotValue > 0) {
        let minimum = Number.POSITIVE_INFINITY;
        for (let i = column + 1; i < size; i += 1) {
          const candidate =
            matrix[i]![i]! - (matrix[i]![column]! ** 2) / pivotValue;
          if (candidate < minimum) minimum = candidate;
        }
        if (minimum < threshold) phaseOne = false;
      } else {
        phaseOne = false;
      }

      if (phaseOne) {
        choleskyStep(matrix, column);
        if (column === size - 2) {
          const finalPivot = matrix[size - 1]![size - 1]!;
          if (finalPivot <= 0) {
            throw new Error("Positive-definite phase produced a bad pivot.");
          }
          matrix[size - 1]![size - 1] = Math.sqrt(finalPivot);
        }
        continue;
      }
      bounds = gershgorinBounds(matrix, column);
    }

    if (column === size - 2) {
      delta = finishTwoByTwo(matrix, additions, t2, delta, gamma);
      break;
    }

    let pivot = column;
    let bestBound = bounds[column]!;
    for (let i = column + 1; i < size; i += 1) {
      if (bounds[i]! < bestBound) {
        bestBound = bounds[i]!;
        pivot = i;
      }
    }
    if (pivot !== column) {
      symmetricSwap(matrix, column, pivot, column);
      const tmpP = permutation[column]!;
      permutation[column] = permutation[pivot]!;
      permutation[pivot] = tmpP;
      const tmpB = bounds[column]!;
      bounds[column] = bounds[pivot]!;
      bounds[pivot] = tmpB;
    }

    let columnNorm = 0;
    for (let i = column + 1; i < size; i += 1) columnNorm += Math.abs(matrix[i]![column]!);
    const candidate = Math.max(0, Math.max(columnNorm, threshold) - matrix[column]![column]!);
    delta = Math.max(delta, candidate);
    additions[column] = delta;
    matrix[column]![column]! += delta;

    if (!approxEqual(matrix[column]![column]!, columnNorm)) {
      const multiplier = columnNorm / matrix[column]![column]! - 1;
      for (let i = column + 1; i < size; i += 1) {
        bounds[i]! += Math.abs(matrix[i]![column]!) * multiplier;
      }
    }
    choleskyStep(matrix, column);
  }

  return { lower: tril(matrix), permutation, additions };
}

function approxEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-12 + 1e-9 * Math.max(Math.abs(a), Math.abs(b));
}

export function solveModifiedCholesky(
  lower: number[][],
  permutation: number[],
  rightHandSide: number[],
): number[] {
  const permutedRhs = permutation.map((i) => rightHandSide[i]!);
  const forward = forwardSolve(lower, permutedRhs);
  const upper = transpose(lower);
  const permutedSolution = backSolve(upper, forward);
  const solution = new Array<number>(permutation.length);
  for (let i = 0; i < permutation.length; i += 1) {
    solution[permutation[i]!] = permutedSolution[i]!;
  }
  return solution;
}

export function runModifiedCholesky(
  matrix: number[][] | null,
  size: number,
  low: number,
  high: number,
  seed: number,
): ModifiedCholeskyResult {
  const source =
    matrix !== null ? cloneMatrix(matrix) : generateEskowMatrix(size, low, high, seed);
  const { lower, permutation, additions } = modifiedCholeskyEskow(source);

  const permutedSource = zeros(source.length);
  for (let i = 0; i < permutation.length; i += 1) {
    for (let j = 0; j < permutation.length; j += 1) {
      permutedSource[i]![j] = source[permutation[i]!]![permutation[j]!]!;
    }
  }
  const modifiedPermuted = cloneMatrix(permutedSource);
  for (let i = 0; i < additions.length; i += 1) {
    modifiedPermuted[i]![i]! += additions[i]!;
  }
  const reconstruction = matMul(lower, transpose(lower));
  const factorizationError = infNormMat(
    reconstruction.map((row, i) =>
      row.map((v, j) => v - modifiedPermuted[i]![j]!),
    ),
  );

  const originalAdditions = new Array<number>(source.length).fill(0);
  for (let i = 0; i < permutation.length; i += 1) {
    originalAdditions[permutation[i]!] = additions[i]!;
  }
  const modifiedOriginal = cloneMatrix(source);
  for (let i = 0; i < originalAdditions.length; i += 1) {
    modifiedOriginal[i]![i]! += originalAdditions[i]!;
  }
  const expected = Array.from({ length: source.length }, (_, i) => i + 1);
  const rightHandSide = matVec(modifiedOriginal, expected);
  const solved = solveModifiedCholesky(lower, permutation, rightHandSide);
  const solveError = infNormVec(solved.map((v, i) => v - expected[i]!));
  const eigenvaluesBefore = eigvalsh(source);
  const eigenvaluesAfter = eigvalsh(modifiedOriginal);

  return {
    source: matrix !== null ? "custom" : "seeded Eskow-Schnabel demo matrix",
    size: source.length,
    matrix: source,
    lowerFactor: lower,
    permutationZeroBased: permutation,
    permutationOneBased: permutation.map((p) => p + 1),
    diagonalAdditionsFactorOrder: additions,
    diagonalAdditionsOriginalOrder: originalAdditions,
    modifiedMatrix: modifiedOriginal,
    verification: {
      factorizationInfinityError: finiteOrNone(factorizationError),
      solveInfinityError: finiteOrNone(solveError),
      maximumDiagonalAddition: finiteOrNone(Math.max(...additions)),
      minimumEigenvalueBefore: finiteOrNone(eigenvaluesBefore[0]!),
      minimumEigenvalueAfter: finiteOrNone(eigenvaluesAfter[0]!),
      positiveDefiniteAfter: eigenvaluesAfter[0]! > 0,
    },
    solveDemo: {
      expected,
      computed: solved,
    },
    notes: [
      "The factorization satisfies A[P,P] + diag(E) = L L^T.",
      "Gershgorin bounds are computed on the active Schur complement; this corrects the source port's inclusion of already-factorized columns.",
    ],
  };
}

// ——— Talbot ———

type ComplexTransform = (s: { re: number; im: number }) => { re: number; im: number };

export function talbotParameters(
  time: number,
  decimalDigits: number,
  singularityReal: number[],
  singularityImaginary: number[],
  multiplicities: number[],
  contourParameter: number,
): [number, number, number, number] {
  let omega = 0.4 * (contourParameter + 1);
  let sigmaZero = 0;
  const largestReal = Math.max(...singularityReal);
  let largestMultiplicityIndex = 0;
  for (let i = 1; i < multiplicities.length; i += 1) {
    if (multiplicities[i]! > multiplicities[largestMultiplicityIndex]!) {
      largestMultiplicityIndex = i;
    }
  }
  sigmaZero = Math.max(sigmaZero, largestReal);

  let radius = 0;
  let selectedImaginary = 0;
  let selectedAngle = Math.PI;
  let selectedIndex = 0;
  let realSingularitiesOnly = true;
  for (let index = 0; index < singularityImaginary.length; index += 1) {
    const imaginary = singularityImaginary[index]!;
    if (imaginary <= 0) continue;
    realSingularitiesOnly = false;
    const eta = Math.atan2(-singularityReal[index]! + sigmaZero, imaginary);
    const angle = eta + Math.PI / 2;
    const candidateRadius = imaginary / angle;
    if (radius < candidateRadius) {
      radius = candidateRadius;
      selectedAngle = angle;
      selectedIndex = index;
    }
  }

  let contourScale: number;
  let contourShift: number;
  let contourShape: number;

  if (realSingularitiesOnly) {
    contourScale = omega / time;
    contourShift = sigmaZero;
    contourShape = 1;
  } else {
    selectedImaginary = singularityImaginary[selectedIndex]!;
    const scaledImaginary = selectedImaginary * time;
    omega = Math.min(omega + scaledImaginary / 2, (2 * (contourParameter + 1)) / 3);
    if (1.8 * scaledImaginary <= omega * selectedAngle) {
      contourScale = omega / time;
      contourShift = sigmaZero;
      contourShape = 1;
    } else {
      const pk = 1.6 + 12 / (scaledImaginary + 25);
      const fi = 1.05 + 1050 / Math.max(553, 800 - scaledImaginary);
      const mu =
        (omega / time + sigmaZero - largestReal) / (pk / fi - 1 / Math.tan(fi));
      contourScale = (pk * mu) / fi;
      contourShift = largestReal - mu / Math.tan(fi);
      contourShape = selectedImaginary / mu;
    }
  }

  const scaledAccuracy = (2.3 * decimalDigits + omega) / (contourScale * time);
  let rho: number;
  if (scaledAccuracy <= 4.4) {
    rho = (16 + 4.3 * scaledAccuracy) / (24.8 - 2.5 * scaledAccuracy);
  } else if (scaledAccuracy <= 10) {
    rho = (50 + 3 * scaledAccuracy) / (129 / scaledAccuracy - 4);
  } else {
    rho = (44 + 19 * scaledAccuracy) / (256 / scaledAccuracy + 0.4);
  }
  const firstCount =
    Math.floor(contourScale * time * (rho + (contourShape - 1) / 2)) + 1;

  let secondCount: number;
  if (selectedImaginary !== 0) {
    const multiplicity = multiplicities[selectedIndex]!;
    const adjustedDigits =
      decimalDigits + 2 * Math.min(multiplicity - 1, 1) + Math.floor(multiplicity / 4);
    const gamma = (contourShift - sigmaZero) / contourScale;
    const scaled = (selectedImaginary * time) / 1000;
    let eta = Math.min(1.78, 1.236 + 0.0064 * 1.78 ** adjustedDigits);
    eta *= 1.09 - scaled * (0.92 - 0.8 * scaled);
    secondCount =
      Math.floor(
        (eta * contourShape * (2.3 * adjustedDigits + omega)) /
          (3 + 4 * gamma + Math.exp(-gamma)),
      ) + 1;
  } else {
    const multiplicity = multiplicities[largestMultiplicityIndex]!;
    const adjustedDigits =
      decimalDigits + 2 * Math.min(multiplicity - 1, 1) + Math.floor(multiplicity / 4);
    secondCount = Math.floor((2.3 * adjustedDigits + omega) / 2) + 1;
  }
  const pointCount = Math.max(1, firstCount, secondCount);
  return [contourScale, contourShift, contourShape, pointCount];
}

export function talbotSum(
  transform: ComplexTransform,
  contourScale: number,
  contourShift: number,
  contourShape: number,
  pointCount: number,
  time: number,
): [number | null, number] {
  const underflowLog = Math.log(FLOAT_TINY);
  const overflowLog = Math.log(FLOAT_MAX);
  const tau = contourScale * time;
  const psi = (Math.PI / pointCount) * tau * contourShape;
  const cosine = Math.cos(psi);
  let br = 0;
  let bi = 0;
  let dbr = 0;
  let dbi = 0;
  let final = 0;
  const remaining = pointCount - 1;

  if (remaining) {
    let recurrence: number;
    let signs: number;
    if (cosine <= 0) {
      recurrence = 4 * Math.cos(psi / 2) ** 2;
      signs = -1;
    } else {
      recurrence = -4 * Math.sin(psi / 2) ** 2;
      signs = 1;
    }
    for (let index = remaining; index > 0; index -= 1) {
      const theta = index * (Math.PI / pointCount);
      const alpha = (theta * Math.cos(theta)) / Math.sin(theta);
      const beta = theta + (alpha * (alpha - 1)) / theta;
      const contour = {
        re: contourScale * alpha + contourShift,
        im: contourScale * contourShape * theta,
      };
      const transformed = transform(contour);
      const exponential = alpha * tau <= underflowLog ? 0 : Math.exp(alpha * tau);
      if (signs < 0) {
        br = dbr - br;
        bi = dbi - bi;
        dbr =
          recurrence * br -
          dbr +
          exponential * (transformed.re * contourShape - transformed.im * beta);
        dbi =
          recurrence * bi -
          dbi +
          exponential * (transformed.im * contourShape + transformed.re * beta);
      } else {
        br = dbr + br;
        bi = dbi + bi;
        dbr =
          recurrence * br +
          dbr +
          exponential * (transformed.re * contourShape - transformed.im * beta);
        dbi =
          recurrence * bi +
          dbi +
          exponential * (transformed.im * contourShape + transformed.re * beta);
      }
    }
    if (signs < 0) {
      br = dbr - br;
      bi = dbi - bi;
      dbr = recurrence * br - dbr;
    } else {
      br = dbr + br;
      bi = dbi + bi;
      dbr = recurrence * br + dbr;
    }
    final = dbr - (br * recurrence) / 2 - bi * Math.sin(psi);
  }

  const realContour = contourScale + contourShift;
  final +=
    (contourShape * Math.exp(tau) * transform({ re: realContour, im: 0 }).re) / 2;
  const scaled = (contourScale * final) / Math.max(1, pointCount);
  if (scaled === 0) return [0, 0];
  const exponent = contourShift * time + Math.log(Math.abs(scaled));
  if (exponent > overflowLog) return [null, 1];
  const value = Math.sign(final) * Math.exp(exponent);
  return [finiteOrNone(value), 0];
}

function talbotPreset(name: string): {
  transform: ComplexTransform;
  singularReal: number[];
  singularImaginary: number[];
  multiplicities: number[];
  exact: (t: number) => number;
  description: string;
} {
  if (name === "exponential") {
    return {
      transform: (s) => {
        const den = { re: s.re + 2, im: s.im };
        const mag2 = den.re ** 2 + den.im ** 2;
        return { re: den.re / mag2, im: -den.im / mag2 };
      },
      singularReal: [-2],
      singularImaginary: [0],
      multiplicities: [1],
      exact: (t) => Math.exp(-2 * t),
      description: "F(s)=1/(s+2), f(t)=exp(-2t)",
    };
  }
  if (name === "sine") {
    return {
      transform: (s) => {
        // 1/(s^2+1)
        const s2re = s.re ** 2 - s.im ** 2 + 1;
        const s2im = 2 * s.re * s.im;
        const mag2 = s2re ** 2 + s2im ** 2;
        return { re: s2re / mag2, im: -s2im / mag2 };
      },
      singularReal: [0],
      singularImaginary: [1],
      multiplicities: [1],
      exact: Math.sin,
      description: "F(s)=1/(s^2+1), f(t)=sin(t)",
    };
  }
  // V15 demo
  return {
    transform: (s) => {
      // (1/(s+2) + 2*(s-1)/(4 + s*(s-2))) / 3
      const den1 = { re: s.re + 2, im: s.im };
      const mag1 = den1.re ** 2 + den1.im ** 2;
      const t1 = { re: den1.re / mag1, im: -den1.im / mag1 };
      const num2 = { re: 2 * (s.re - 1), im: 2 * s.im };
      const ss = {
        re: s.re * (s.re - 2) - s.im * s.im + 4,
        im: s.re * s.im + s.im * (s.re - 2),
      };
      const mag2 = ss.re ** 2 + ss.im ** 2;
      const t2 = {
        re: (num2.re * ss.re + num2.im * ss.im) / mag2,
        im: (num2.im * ss.re - num2.re * ss.im) / mag2,
      };
      return { re: (t1.re + t2.re) / 3, im: (t1.im + t2.im) / 3 };
    },
    singularReal: [-2, 1],
    singularImaginary: [0, Math.sqrt(3)],
    multiplicities: [1, 1],
    exact: (t) =>
      (Math.exp(-2 * t) + 2 * Math.exp(t) * Math.cos(Math.sqrt(3) * t)) / 3,
    description: "V15 Algorithm 682 demonstration transform",
  };
}

export function runTalbot(
  preset: string,
  time: number,
  decimalDigits: number,
  contourParameter: number,
  plotStart: number,
  plotEnd: number,
  plotPoints: number,
): TalbotResult {
  const {
    transform,
    singularReal,
    singularImaginary,
    multiplicities,
    exact,
    description,
  } = talbotPreset(preset);

  const evaluate = (atTime: number) => {
    const parameters = talbotParameters(
      atTime,
      decimalDigits,
      singularReal,
      singularImaginary,
      multiplicities,
      contourParameter,
    );
    const [value, errorCode] = talbotSum(transform, ...parameters, atTime);
    return { value, errorCode, parameters };
  };

  const { value, errorCode, parameters } = evaluate(time);
  const expected = exact(time);
  const times = linspace(plotStart, plotEnd, plotPoints);
  const inverted: Array<number | null> = [];
  const errorCodes: number[] = [];
  for (const atTime of times) {
    const est = evaluate(atTime);
    inverted.push(est.value);
    errorCodes.push(est.errorCode);
  }
  const [contourScale, contourShift, contourShape, pointCount] = parameters;
  return {
    preset,
    description,
    time,
    value,
    expected,
    absoluteError: value !== null ? finiteOrNone(Math.abs(value - expected)) : null,
    errorCode,
    parameters: {
      lambda: contourScale,
      sigma: contourShift,
      nu: contourShape,
      quadraturePoints: pointCount,
      decimalDigits,
      contourParameter,
      singularities: singularReal.map((real, i) => ({
        real,
        imaginary: singularImaginary[i]!,
        multiplicity: multiplicities[i]!,
      })),
    },
    plot: {
      time: times,
      talbot: listWithNulls(inverted),
      exact: times.map((t) => exact(t)),
    },
    plotErrorCodes: errorCodes,
  };
}

// ——— DERPAR continuation ———

function demoFunction(vector: number[]): { residual: number[]; jacobian: number[][] } {
  const x = vector[0]!;
  const parameter = vector[1]!;
  return {
    residual: [x * x + parameter - 1],
    jacobian: [[2 * x, 1]],
  };
}

function gause(
  equationCount: number,
  coefficients: number[][],
  rightHandSide: number[],
  preferences: number[],
): {
  success: boolean;
  particular: number[];
  tangentCoefficients: number[];
  freeColumn: number;
} {
  const variableCount = equationCount + 1;
  const matrix = coefficients.slice(0, equationCount).map((row) => row.slice(0, variableCount));
  const rhs = rightHandSide.slice();
  const pivotColumnForRow = new Array<number>(equationCount).fill(-1);

  for (let _ = 0; _ < equationCount; _ += 1) {
    let best = 0;
    let pivotRow = -1;
    let pivotColumn = -1;
    for (let row = 0; row < equationCount; row += 1) {
      if (pivotColumnForRow[row]! >= 0) continue;
      for (let column = 0; column < variableCount; column += 1) {
        const candidate = preferences[column]! * Math.abs(matrix[row]![column]!);
        if (candidate > best) {
          best = candidate;
          pivotRow = row;
          pivotColumn = column;
        }
      }
    }
    if (best === 0 || pivotRow < 0) {
      return {
        success: false,
        particular: new Array(variableCount).fill(0),
        tangentCoefficients: new Array(variableCount).fill(0),
        freeColumn: 0,
      };
    }
    pivotColumnForRow[pivotRow] = pivotColumn;
    for (let row = 0; row < equationCount; row += 1) {
      if (row === pivotRow || matrix[row]![pivotColumn] === 0) continue;
      const multiplier = matrix[row]![pivotColumn]! / matrix[pivotRow]![pivotColumn]!;
      for (let c = 0; c < variableCount; c += 1) {
        matrix[row]![c]! -= multiplier * matrix[pivotRow]![c]!;
      }
      matrix[row]![pivotColumn] = 0;
      rhs[row]! -= multiplier * rhs[pivotRow]!;
    }
  }

  const particular = new Array<number>(variableCount).fill(0);
  const usedColumns = new Array<boolean>(variableCount).fill(false);
  for (let row = 0; row < equationCount; row += 1) {
    const column = pivotColumnForRow[row]!;
    particular[column] = rhs[row]! / matrix[row]![column]!;
    usedColumns[column] = true;
  }
  let freeColumn = variableCount - 1;
  for (let c = 0; c < variableCount; c += 1) {
    if (!usedColumns[c]) {
      freeColumn = c;
      break;
    }
  }

  const tangentCoefficients = new Array<number>(variableCount).fill(0);
  for (let row = 0; row < equationCount; row += 1) {
    const column = pivotColumnForRow[row]!;
    tangentCoefficients[column] = -matrix[row]![freeColumn]! / matrix[row]![column]!;
  }
  particular[freeColumn] = 0;
  tangentCoefficients[freeColumn] = 0;
  return { success: true, particular, tangentCoefficients, freeColumn };
}

function adamsBashforth(
  derivative: number[],
  order: number,
  step: number,
  value: number[],
  maxOrder: number,
  history: number[][],
): { value: number[]; order: number; history: number[][] } {
  history[3] = history[2]!.slice();
  history[2] = history[1]!.slice();
  history[1] = history[0]!.slice();
  history[0] = derivative.slice();
  const nextOrder = Math.min(order + 1, maxOrder, 4);
  let increment: number[];
  if (nextOrder === 1) {
    increment = history[0]!;
  } else if (nextOrder === 2) {
    increment = history[0]!.map((h0, i) => (3 * h0 - history[1]![i]!) / 2);
  } else if (nextOrder === 3) {
    increment = history[0]!.map(
      (h0, i) => (23 * h0 - 16 * history[1]![i]! + 5 * history[2]![i]!) / 12,
    );
  } else {
    increment = history[0]!.map(
      (h0, i) =>
        (55 * h0 - 59 * history[1]![i]! + 37 * history[2]![i]! - 9 * history[3]![i]!) /
        24,
    );
  }
  return {
    value: value.map((v, i) => v + step * increment[i]!),
    order: nextOrder,
    history,
  };
}

export function runDerpar(
  initialX: number,
  initialParameter: number,
  stepSize: number,
  maxStepX: number,
  maxStepParameter: number,
  directionX: number,
  directionParameter: number,
  maxPoints: number,
  tolerance: number,
): ContinuationResult {
  const equationCount = 1;
  let value = [initialX, initialParameter];
  const lower = [-10, -2];
  const upper = [10, 1];
  const weights = [1, 1];
  const maxSteps = [maxStepX, maxStepParameter];
  const preferences = [0.2, 0.1];
  const directions = [directionX, directionParameter];
  const initialIterations = 10;
  const correctionLimit = 5;
  const closeTolerance = 1e-2;
  const maxAdamsOrder = 4;

  let initialConverged = false;
  for (let _ = 0; _ < initialIterations; _ += 1) {
    const { residual, jacobian } = demoFunction(value);
    const g = gause(equationCount, jacobian, residual, preferences);
    if (!g.success) {
      return {
        equation: "x^2 + alpha - 1 = 0",
        initial: { x: initialX, parameter: initialParameter },
        initialCorrectionConverged: false,
        status: "singular-jacobian",
        flag: -3,
        message: "Initial correction failed because GAUSE found no pivot.",
        pointCount: 0,
        points: [],
        plot: { x: [], parameter: [], residual: [], exactParameter: [] },
      };
    }
    value = value.map((v, i) => v - g.particular[i]!);
    const weightedStep = g.particular.reduce(
      (s, c, i) => s + Math.abs(c) * weights[i]!,
      0,
    );
    if (weightedStep <= tolerance) {
      initialConverged = true;
      break;
    }
  }

  const path: ContinuationPoint[] = [];
  let adamsOrder = 0;
  let correctionCount = 1;
  let previousFreeColumn = -1;
  let derivativeHistory = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ];
  let closeGuardIndex = 0;
  let flag = maxPoints;
  let status = "max-points";
  let message = "Requested continuation point count reached.";
  let safetyIterations = 0;

  while (path.length < maxPoints) {
    safetyIterations += 1;
    if (safetyIterations > maxPoints * (correctionLimit + 5)) {
      flag = -4;
      status = "safety-stop";
      message = "Continuation safety limit reached.";
      break;
    }
    const { residual, jacobian } = demoFunction(value);
    const g = gause(equationCount, jacobian, residual, preferences);
    if (!g.success) {
      flag = -3;
      status = "singular-jacobian";
      message = "GAUSE found no usable pivot.";
      break;
    }
    if (previousFreeColumn !== g.freeColumn) {
      adamsOrder = 0;
      previousFreeColumn = g.freeColumn;
    }

    const weightedCorrection = g.particular.reduce(
      (s, c, i) => s + weights[i]! * Math.abs(c),
      0,
    );
    if (weightedCorrection > tolerance && correctionCount < correctionLimit) {
      value = value.map((v, i) => v - g.particular[i]!);
      correctionCount += 1;
      continue;
    }
    correctionCount = 1;
    value = value.map((v, i) => v - g.particular[i]!);
    const correctedResidual = Math.hypot(...demoFunction(value).residual);
    path.push({
      index: path.length + 1,
      x: finiteOrNone(value[0]),
      parameter: finiteOrNone(value[1]),
      residual: finiteOrNone(correctedResidual),
      freeCoordinate: g.freeColumn === 0 ? "x" : "parameter",
      adamsOrder,
    });

    if (value.some((v, i) => v < lower[i]! || v > upper[i]!)) {
      flag = -2;
      status = "bounds-reached";
      message = "A continuation variable left its configured bounds.";
      break;
    }
    if (path.length > 3) {
      const distanceToStart =
        weights[0]! * Math.abs(value[0]! - path[0]!.x!) +
        weights[1]! * Math.abs(value[1]! - path[0]!.parameter!);
      if (distanceToStart <= closeTolerance) {
        flag = -1;
        status = "closed-curve";
        message = "The path returned near its first reported point.";
        break;
      }
    }

    const tangentScale =
      1 + g.tangentCoefficients.reduce((s, c) => s + c * c, 0);
    const derivative = [0, 0];
    derivative[g.freeColumn] =
      Math.sign(directions[g.freeColumn]! || 1) / Math.sqrt(tangentScale);
    for (let index = 0; index < 2; index += 1) {
      if (index !== g.freeColumn) {
        derivative[index] =
          g.tangentCoefficients[index]! * derivative[g.freeColumn]!;
      }
      directions[index] = derivative[index]! < 0 ? -1 : 1;
    }

    let step = stepSize;
    for (let index = 0; index < 2; index += 1) {
      const projected = step * Math.abs(derivative[index]!);
      if (projected > maxSteps[index]!) {
        adamsOrder = 0;
        step = maxSteps[index]! / Math.max(1e-12, Math.abs(derivative[index]!));
      }
    }

    if (path.length > closeGuardIndex + 3) {
      const startCoordinate =
        g.freeColumn === 0 ? path[0]!.x! : path[0]!.parameter!;
      const currentCoordinate = value[g.freeColumn]!;
      if (
        step * Math.abs(derivative[g.freeColumn]!) >
          0.8 * Math.abs(currentCoordinate - startCoordinate) &&
        (startCoordinate - currentCoordinate) * directions[g.freeColumn]! > 0
      ) {
        adamsOrder = 0;
        step =
          Math.abs(currentCoordinate - startCoordinate) /
          Math.max(1e-12, Math.abs(derivative[g.freeColumn]!));
        closeGuardIndex = path.length;
      }
    }

    const next = adamsBashforth(
      derivative,
      adamsOrder,
      step,
      value,
      maxAdamsOrder,
      derivativeHistory,
    );
    value = next.value;
    adamsOrder = next.order;
    derivativeHistory = next.history;
  }

  const xValues = path.map((p) => p.x);
  const parameterValues = path.map((p) => p.parameter);
  const residuals = path.map((p) => p.residual);
  return {
    equation: "x^2 + alpha - 1 = 0",
    initial: { x: initialX, parameter: initialParameter },
    initialCorrectionConverged: initialConverged,
    status,
    flag,
    message,
    pointCount: path.length,
    points: path,
    plot: {
      x: xValues,
      parameter: parameterValues,
      residual: residuals,
      exactParameter: xValues.map((xv) =>
        xv !== null ? finiteOrNone(1 - xv ** 2) : null,
      ),
    },
  };
}
