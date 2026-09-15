import { finiteOrNone, linspace, listWithNulls } from "./common";
import type { VibrationResult } from "./types";

/** Second-order accurate gradient matching numpy.gradient(..., edge_order=2). */
function gradient(y: number[], t: number[]): number[] {
  const n = y.length;
  const out = new Array<number>(n);
  if (n === 0) return out;
  if (n === 1) {
    out[0] = 0;
    return out;
  }
  // interior
  for (let i = 1; i < n - 1; i += 1) {
    const h1 = t[i]! - t[i - 1]!;
    const h2 = t[i + 1]! - t[i]!;
    out[i] =
      (-(h2 / (h1 * (h1 + h2))) * y[i - 1]! +
        ((h2 - h1) / (h1 * h2)) * y[i]! +
        (h1 / (h2 * (h1 + h2))) * y[i + 1]!);
  }
  // edges, order 2
  {
    const h1 = t[1]! - t[0]!;
    const h2 = t[2]! - t[1]!;
    out[0] =
      (-(2 * h1 + h2) / (h1 * (h1 + h2))) * y[0]! +
      ((h1 + h2) / (h1 * h2)) * y[1]! -
      (h1 / (h2 * (h1 + h2))) * y[2]!;
  }
  {
    const h1 = t[n - 1]! - t[n - 2]!;
    const h2 = t[n - 2]! - t[n - 3]!;
    out[n - 1] =
      (h1 / (h2 * (h1 + h2))) * y[n - 3]! -
      ((h1 + h2) / (h1 * h2)) * y[n - 2]! +
      ((2 * h1 + h2) / (h1 * (h1 + h2))) * y[n - 1]!;
  }
  return out;
}

export function analyzeVibration(
  mode: "free" | "forced",
  mass: number,
  damping: number,
  stiffness: number,
  initialDisplacement: number,
  initialVelocity: number,
  forceAmplitude: number,
  forcingFrequency: number,
  duration: number,
  points: number,
): VibrationResult {
  if (!(mass > 0) || !(stiffness > 0)) {
    throw new Error("Mass and stiffness must be positive.");
  }
  if (points < 3) throw new Error("points must be >= 3.");
  if (duration <= 0) throw new Error("duration must be positive.");

  const naturalFrequency = Math.sqrt(stiffness / mass);
  const naturalFrequencyHz = naturalFrequency / (2 * Math.PI);
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
  const criticalDamping = 2 * Math.sqrt(stiffness * mass);

  const base = {
    parameters: {
      mass,
      damping,
      stiffness,
      criticalDamping,
    },
    naturalFrequency,
    naturalFrequencyHz,
    dampingRatio,
  };

  if (mode === "free") {
    const time = linspace(0, duration, points);
    const tolerance = 1e-10;
    let regime: string;
    let displacement: number[];
    let detail: Record<string, unknown>;

    if (dampingRatio < 1 - tolerance) {
      regime = "underdamped";
      const dampedFrequency = naturalFrequency * Math.sqrt(1 - dampingRatio ** 2);
      const coefficientA = initialDisplacement;
      const coefficientB =
        (initialVelocity + dampingRatio * naturalFrequency * initialDisplacement) /
        dampedFrequency;
      displacement = time.map((t) => {
        const envelope = Math.exp(-dampingRatio * naturalFrequency * t);
        return (
          envelope *
          (coefficientA * Math.cos(dampedFrequency * t) +
            coefficientB * Math.sin(dampedFrequency * t))
        );
      });
      detail = {
        dampedFrequency,
        dampedFrequencyHz: dampedFrequency / (2 * Math.PI),
        coefficientA,
        coefficientB,
      };
    } else if (Math.abs(dampingRatio - 1) <= tolerance) {
      regime = "critically damped";
      const coefficientA = initialDisplacement;
      const coefficientB = initialVelocity + naturalFrequency * initialDisplacement;
      displacement = time.map(
        (t) => (coefficientA + coefficientB * t) * Math.exp(-naturalFrequency * t),
      );
      detail = {
        dampedFrequency: null,
        coefficientA,
        coefficientB,
      };
    } else {
      regime = "overdamped";
      const discriminant = naturalFrequency * Math.sqrt(dampingRatio ** 2 - 1);
      const root1 = -dampingRatio * naturalFrequency + discriminant;
      const root2 = -dampingRatio * naturalFrequency - discriminant;
      const coefficient1 =
        (initialVelocity - root2 * initialDisplacement) / (root1 - root2);
      const coefficient2 = initialDisplacement - coefficient1;
      displacement = time.map(
        (t) => coefficient1 * Math.exp(root1 * t) + coefficient2 * Math.exp(root2 * t),
      );
      detail = {
        dampedFrequency: null,
        characteristicRoots: [root1, root2],
        coefficients: [coefficient1, coefficient2],
      };
    }

    const velocity = gradient(displacement, time);
    const energy = displacement.map(
      (d, i) => 0.5 * mass * velocity[i]! ** 2 + 0.5 * stiffness * d ** 2,
    );

    return {
      ...base,
      mode: "free",
      regime,
      initialConditions: {
        displacement: initialDisplacement,
        velocity: initialVelocity,
      },
      ...(detail as object),
      plot: {
        time,
        displacement: listWithNulls(displacement),
        velocity: listWithNulls(velocity),
        mechanicalEnergy: listWithNulls(energy),
      },
      notes: [
        "The critical and overdamped branches use their exact closed-form solutions.",
        "This replaces the source file's non-underdamped exponential placeholder.",
      ],
    } as VibrationResult;
  }

  const frequencyRatio = forcingFrequency / naturalFrequency;
  const denominator = Math.sqrt(
    (1 - frequencyRatio ** 2) ** 2 + (2 * dampingRatio * frequencyRatio) ** 2,
  );
  const magnification = denominator === 0 ? Number.POSITIVE_INFINITY : 1 / denominator;
  const staticDisplacement = forceAmplitude / stiffness;
  const amplitude = staticDisplacement * magnification;
  const phase =
    denominator === 0
      ? Number.NaN
      : Math.atan2(2 * dampingRatio * frequencyRatio, 1 - frequencyRatio ** 2);

  const ratioGrid = linspace(0, 3, points);
  const magnificationGrid = ratioGrid.map((r) => {
    const den = Math.sqrt((1 - r ** 2) ** 2 + (2 * dampingRatio * r) ** 2);
    return den === 0 ? Number.NaN : 1 / den;
  });
  const phaseGrid = ratioGrid.map((r) =>
    Math.atan2(2 * dampingRatio * r, 1 - r ** 2),
  );
  const warning =
    dampingRatio === 0 && Math.abs(frequencyRatio - 1) < 1e-12
      ? "Undamped resonance is singular at frequency ratio r = 1."
      : null;

  return {
    ...base,
    mode: "forced",
    forcing: {
      forceAmplitude,
      forcingFrequency,
      frequencyRatio,
      staticDisplacement,
    },
    magnification: finiteOrNone(magnification),
    amplitude: finiteOrNone(amplitude),
    phase: finiteOrNone(phase),
    plot: {
      frequencyRatio: ratioGrid,
      magnification: listWithNulls(magnificationGrid),
      phase: listWithNulls(phaseGrid),
    },
    warnings: warning ? [warning] : [],
  };
}
