import {
  formatNumber,
  runDerpar,
  runModifiedCholesky,
  runTalbot,
  type FunctionAnalysisResult,
  type VibrationResult,
} from "@/game/numerical-extreme";

/** V15-style detailed MAIN engine report (sections 1–11). */
export function buildFunctionReport(result: FunctionAnalysisResult): string {
  const lines: string[] = [
    "=== NumericalAnalysisToolbox_V15 · FUNCTION ANALYSIS ===",
    "Algorithms: IVT · Bisection · Newton (damped) · Secant · MVT · Taylor",
    "            Alg 695 Modified Cholesky · Alg 682 Talbot · Alg 502 DERPAR",
    "",
    "=== Function f(x) (numeric) ===",
    result.expression.normalized,
    result.expression.symbolic ? `symbolic: ${result.expression.symbolic}` : "",
    "",
    "1) Factorization attempt:",
    `   ${result.expression.factorized ?? "(no symbolic factorization; normalized form retained)"}`,
    "",
    "2) Shifted representation:",
    `   Using x = y + c, with c = ${formatNumber(result.expression.shift, 12)}`,
    `   g(y) = ${result.expression.shifted ?? "—"}`,
    "",
    `3) IVT scan on [${formatNumber(result.domain.a)}, ${formatNumber(result.domain.b)}] and refined bisection:`,
    `   Grid samples: ${result.domain.samples} · finite: ${result.domain.finiteSamples}`,
    `   Detected ${result.ivt.brackets.length} bracket(s):`,
  ];

  if (result.ivt.brackets.length === 0) {
    lines.push("   No sign-change brackets detected.");
  } else {
    for (const [left, right] of result.ivt.brackets.slice(0, 12)) {
      lines.push(`   [${formatNumber(left, 12)}, ${formatNumber(right, 12)}]`);
    }
    if (result.ivt.brackets.length > 12) {
      lines.push(`   … +${result.ivt.brackets.length - 12} more`);
    }
  }

  for (const bis of result.ivt.bisections.slice(0, 6)) {
    lines.push(
      `   Bisection: root ≈ ${formatNumber(bis.root, 12)}, f≈${formatNumber(bis.residual, 3)}, iters=${bis.iterations}, ${bis.message}`,
    );
  }
  if (result.ivt.roots.length) {
    lines.push(
      `   Collected roots: ${result.ivt.roots.map((r) => formatNumber(r, 12)).join(", ")}`,
    );
  }

  lines.push("", "4) Proposed Secant seed pairs (safer choices):");
  if (!result.secantPairs.length) {
    lines.push("   No suggestions available.");
  } else {
    for (const [i, pair] of result.secantPairs.entries()) {
      lines.push(
        `   ${i + 1}: [${formatNumber(pair[0], 12)}, ${formatNumber(pair[1], 12)}]`,
      );
    }
  }

  lines.push(
    "",
    `5) Mean Value Theorem on [${formatNumber(result.domain.a)}, ${formatNumber(result.domain.b)}]:`,
    `   Find c with f'(c) = (f(b)-f(a))/(b-a)`,
    `   chord slope = ${formatNumber(result.meanValueTheorem.chordSlope, 12)}`,
    `   MVT c ≈ ${formatNumber(result.meanValueTheorem.c, 12)}`,
    `   residual = ${formatNumber(result.meanValueTheorem.residual, 6)}`,
    result.meanValueTheorem.message ? `   note: ${result.meanValueTheorem.message}` : "",
    "",
    `6) MVT for integrals (average value) on [${formatNumber(result.domain.a)}, ${formatNumber(result.domain.b)}]:`,
    `   integral ≈ ${formatNumber(result.integralMeanValueTheorem.integral, 12)}`,
    `   Average(f) = ${formatNumber(result.integralMeanValueTheorem.average, 12)}`,
    `   c with f(c)=average ≈ ${formatNumber(result.integralMeanValueTheorem.c, 12)}`,
    "",
    "7) Taylor polynomials (numeric finite-diff) about x = 0:",
  );

  for (const item of result.taylor) {
    if (item.valid) {
      lines.push(`   Taylor degree ${item.degree}: ${item.polynomial}`);
      lines.push(
        `     coefficients c0..c${item.degree}: [${item.coefficients.map((c) => formatNumber(c, 8)).join(", ")}]`,
      );
    } else {
      lines.push(`   Taylor degree ${item.degree}: ${item.message || "unavailable (possible singularity)"}`);
    }
  }

  const { newton, secant, shift, coordinateSystem } = result.iterations;
  lines.push(
    "",
    "8) Iterations: Newton & Secant (weighted step criterion + damping)",
    `*** ${coordinateSystem} · shift c = ${formatNumber(shift, 12)} ***`,
    "-- Newton (damped) --",
    `   status: ${newton.message}`,
    `   converged=${newton.converged} · iters=${newton.iterations}`,
    `   x ≈ ${formatNumber(newton.root, 12)} · |f(x)|=${formatNumber(newton.residual, 6)}`,
  );
  for (const step of newton.history.slice(0, 24)) {
    lines.push(
      `   k=${String(step.iteration).padStart(3)}: x=${formatNumber(step.x, 12)}  y=${formatNumber(step.y, 12)}  |f|=${formatNumber(step.residual, 3)}  step=${formatNumber(step.step, 3)}  lam=${formatNumber(step.damping ?? 1, 3)}`,
    );
  }
  if (newton.history.length > 24) {
    lines.push(`   … ${newton.history.length - 24} more Newton steps`);
  }

  lines.push("-- Secant --");
  for (const [pidx, run] of secant.entries()) {
    const seeds = run.seeds
      ? `[${formatNumber(run.seeds[0], 12)}, ${formatNumber(run.seeds[1], 12)}]`
      : "(auto)";
    lines.push(
      `   Pair ${pidx + 1}: seeds ${seeds}`,
      `   status: ${run.message} · converged=${run.converged} · iters=${run.iterations}`,
      `   x ≈ ${formatNumber(run.root, 12)} · |f(x)|=${formatNumber(run.residual, 6)}`,
    );
    for (const step of run.history.slice(0, 8)) {
      lines.push(
        `     k=${String(step.iteration).padStart(3)}: x=${formatNumber(step.x, 12)}  |f|=${formatNumber(step.residual, 3)}`,
      );
    }
  }

  // V15 appendices: Alg 695 / 682 / 502 demos with toolbox defaults
  try {
    const chol = runModifiedCholesky(null, 6, -100, -1, 1234);
    lines.push(
      "",
      "9) Modified Cholesky (Alg 695 · Eskow–Schnabel) demo (n=6):",
      `   source = ${chol.source}`,
      `   max(E) = ${formatNumber(chol.verification.maximumDiagonalAddition, 6)}`,
      `   ||x − xtrue||_∞ = ${formatNumber(chol.verification.solveInfinityError, 3)}`,
      `   λmin before/after = ${formatNumber(chol.verification.minimumEigenvalueBefore, 6)} / ${formatNumber(chol.verification.minimumEigenvalueAfter, 6)}`,
      `   PD after = ${chol.verification.positiveDefiniteAfter}`,
    );
  } catch (error) {
    lines.push("", "9) Modified Cholesky demo failed:", `   ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const talbot = runTalbot("demo", 1, 6, 6, 0.1, 3, 40);
    lines.push(
      "",
      "10) Talbot Laplace inversion (Alg 682) demo:",
      `   ${talbot.description}`,
      `   t=${formatNumber(talbot.time, 3)}, f(t)≈ ${formatNumber(talbot.value, 10)} (ier=${talbot.errorCode})`,
      `   exact=${formatNumber(talbot.expected, 10)} · |error|=${formatNumber(talbot.absoluteError, 3)}`,
      `   λ=${formatNumber(talbot.parameters.lambda, 6)}, σ=${formatNumber(talbot.parameters.sigma, 6)}, ν=${formatNumber(talbot.parameters.nu, 6)}, n=${talbot.parameters.quadraturePoints}`,
    );
  } catch (error) {
    lines.push("", "10) Talbot demo failed:", `   ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const derpar = runDerpar(1, 0, 0.05, 0.2, 0.2, 1, -1, 60, 1e-8);
    lines.push(
      "",
      "11) DERPAR continuation (Alg 502 · ADAMS/GAUSE) demo:",
      `   equation: ${derpar.equation}`,
      `   status=${derpar.status} · flag=${derpar.flag} · NOUT=${derpar.pointCount}`,
      `   ${derpar.message}`,
      `   initial correction converged=${derpar.initialCorrectionConverged}`,
    );
    for (const point of derpar.points.slice(0, 8)) {
      lines.push(
        `   ${String(point.index).padStart(2)}: x=${formatNumber(point.x, 6)}  α=${formatNumber(point.parameter, 6)}  SQF=${formatNumber(point.residual, 3)}  free=${point.freeCoordinate}  Adams=${point.adamsOrder}`,
      );
    }
  } catch (error) {
    lines.push("", "11) DERPAR demo failed:", `   ${error instanceof Error ? error.message : String(error)}`);
  }

  if (result.warnings.length) {
    lines.push("", "Warnings:", ...result.warnings.map((w) => `   · ${w}`));
  }

  return lines.filter((line) => line !== undefined).join("\n");
}

export function buildVibrationReport(result: VibrationResult): string {
  const lines = [
    "=== VIBRATIONS OUTPUT (SDOF) ===",
    `mode = ${result.mode}`,
    `m=${formatNumber(result.parameters.mass)}, c=${formatNumber(result.parameters.damping)}, k=${formatNumber(result.parameters.stiffness)}`,
    `critical damping = ${formatNumber(result.parameters.criticalDamping, 10)}`,
    `wn=${formatNumber(result.naturalFrequency, 10)} rad/s (fn=${formatNumber(result.naturalFrequencyHz, 10)} Hz)`,
    `zeta=${formatNumber(result.dampingRatio, 10)}`,
  ];
  if (result.mode === "free") {
    lines.push(`regime = ${result.regime}`);
    lines.push(`wd = ${formatNumber(result.dampedFrequency, 10)} rad/s`);
    if (result.coefficientA !== undefined) {
      lines.push(`A = ${formatNumber(result.coefficientA, 10)}, B = ${formatNumber(result.coefficientB, 10)}`);
    }
  } else {
    lines.push(
      `r = ω/wn · magnification M = ${formatNumber(result.magnification, 10)}`,
      `X = ${formatNumber(result.amplitude, 10)} m · φ = ${formatNumber(result.phase, 10)} rad`,
    );
  }
  if (result.notes?.length) lines.push("", ...result.notes.map((n) => `note: ${n}`));
  if (result.warnings?.length) lines.push("", ...result.warnings.map((w) => `warn: ${w}`));
  return lines.join("\n");
}

/** V15 commented f_sym / demo catalogue — clickable MAIN presets. */
export const FUNCTION_PRESETS: Array<{
  label: string;
  expr: string;
  a: number;
  b: number;
  note?: string;
}> = [
  { label: "x−cos(x)", expr: "x - cos(x)", a: 1e-6, b: 2, note: "simple root ~0.739" },
  { label: "(x−1)³", expr: "(x-1)^3", a: 0, b: 2, note: "multiple root at 1" },
  { label: "quintic A", expr: "x^5 - 2*x + 0.1", a: -2, b: 2, note: "quintic flavor" },
  { label: "quintic B", expr: "x^5 - 5*x^3 - x^2 + 1", a: -3, b: 3 },
  { label: "quart (x−2)⁴", expr: "x^4 - 8*x^3 + 24*x^2 - 32*x + 16", a: 0, b: 4 },
  { label: "x−π−½sin", expr: "x - pi - 0.5*sin(x/2)", a: 0, b: 6 },
  { label: "quintic C", expr: "x^5 + 5*x^3 - x^2 + 1", a: -2, b: 2 },
  {
    label: "exp(1)^ mix",
    expr: "exp(1)^(6*x) + 1.441*exp(1)^(2*x) - 2.079*exp(1)^(4*x) - 0.333",
    a: -1,
    b: 0.5,
  },
  {
    label: "exp mix",
    expr: "exp(6*x) + 1.441*exp(2*x) - 2.079*exp(4*x) - 0.333",
    a: -1,
    b: 0.5,
  },
  {
    label: "log(2) exp",
    expr: "exp(6*x) + 3*(log(2))^2*exp(2*x) - log(8)*exp(4*x) - (log(2))^3",
    a: -1,
    b: 0.5,
    note: "symbolic log(2)/log(8) form without SymPy",
  },
  {
    label: "cos+√2",
    expr: "cos(x + sqrt(2)) + x*(x/2 + sqrt(2))",
    a: -2,
    b: -1,
    note: "cos(x+√2)+x(x/2+√2)=0 on [−2,−1]",
  },
  {
    label: "finance n=3",
    expr: "-20000 + 7000*((((1+x)^3 - 1) / (x*(1+x)^3))) + 8000 / (1+x)^3",
    a: 1e-4,
    b: 1,
    note: "default V15 f(x)",
  },
  {
    label: "damped osc",
    expr:
      "exp(-(0.016316264)*(13.09171215)*x) * ( (0.018)*cos((13.08996939)*x) + (0.000296996)*sin((13.08996939)*x) )",
    a: 0,
    b: 25,
  },
  {
    label: "X(r=0.47)",
    expr: "((30)/(400)) / sqrt( (1 - (0.474341649)^2)^2 + (2*(0.2)*(0.474341649))^2 ) + 0*x",
    a: 0,
    b: 1,
    note: "forced amplitude sample (constant in x)",
  },
  {
    label: "X(r=1)",
    expr: "((30)/(400)) / sqrt( (1 - (1)^2)^2 + (2*(0.2)*(1))^2 ) + 0*x",
    a: 0,
    b: 1,
    note: "resonance-ratio sample",
  },
  {
    label: "T(r) ζ=0.08",
    expr: "sqrt( (1 + (2*(0.08)*x)^2) / ( (1 - x^2)^2 + (2*(0.08)*x)^2 ) )",
    a: 0.05,
    b: 3,
    note: "transmissibility vs frequency ratio",
  },
  {
    label: "step resp",
    expr:
      "(0.2) * ( 1 - exp(-(0.2)*(10)*x) * ( cos((9.797958971)*x) + ((0.2)/sqrt(1 - (0.2)^2)) * sin((9.797958971)*x) ) )",
    a: 0,
    b: 8,
  },
  { label: "0.1x²+0.9", expr: "0.1*x^2 + 0.9", a: -2, b: 2 },
  {
    label: "NPV cash",
    expr: "2000 - 500*((1 + x)^(-1)) - 8100*((1 + x)^(-2)) + 6800*((1 + x)^(-3))",
    a: 1e-4,
    b: 2,
  },
  {
    label: "Sut poly",
    expr: "1.24 - (2.25e-3)*x + (1.6e-6)*x^2 - (4.11e-10)*x^3 - sqrt(x)",
    a: 340,
    b: 1700,
    note: "MPa Sut-style curve with √x term",
  },
  {
    label: "Goodman DE",
    expr:
      "(( ( (2.2 * ( (32*(70)) / (pi*((x)^3)) )) / (210) ) + ( (2.2 * ( (32*(55)) / (pi*((x)^3)) )) / (700) ) )^(-1)) - 2",
    a: 10,
    b: 40,
    note: "simplified Goodman diameter solve",
  },
  {
    label: "Goodman full",
    expr:
      "(( ( ( ( ( (2.2 * ( (32*(70)) / (pi*((x)^3)) ))^2 ) + ( (3)*( ( 1.8 * ( (16)*(45) / ( pi * (x)^3 ) ) )^2 ) ) )^(1/2) ) ) / (210) ) + ( ( ( ( ( (2.2 * ( (32*(55)) / (pi*((x)^3)) ))^2 ) + ( (3) * ( ( 1.8 * ( (16)*(35) / ( pi * (x)^3 ) ) )^2 ) ) )^(1/2) ) ) / (700) ) )^(-1) - 2",
    a: 10,
    b: 45,
    note: "CompletedExampleGoodmanDE",
  },
  {
    label: "finance n=5 A",
    expr: "-30000 + 9000 * (((1+x)^5 - 1) / (x * (1+x)^5)) + 4000 / (1+x)",
    a: 1e-4,
    b: 1,
  },
  {
    label: "finance n=5 B",
    expr:
      "(-30000) + (9000*( ( ((1+x)^5) - 1 ) / ( (x) * ((1 + x)^5) ) ) ) + ( 4000*( ( (1)/( (1+x)^5 ) ) ) )",
    a: 1e-4,
    b: 1,
  },
  {
    label: "finance n=5 C",
    expr:
      "(-21000) + (10000*( ( ((1+x)^5) - 1 ) / ( (x) * ((1 + x)^5) ) ) ) + ( 10000*( ( (1)/( (1+x)^5 ) ) ) )",
    a: 1e-4,
    b: 1,
  },
  {
    label: "finance n=3 B",
    expr:
      "(-62000) + ( (26000)*( ( ( ((1+x)^3) - 1 ) / ( (x) * ((1 + x)^3) ) )  ) ) + ( (7000)*(( (1)/( (1+x)^3 ) )) )",
    a: 1e-4,
    b: 1,
  },
  {
    label: "finance n=3 C",
    expr:
      "(-84000) + ( (65000)*( ( ( ((1+x)^3) - 1 ) / ( (x) * ((1 + x)^3) ) )  ) ) + ( (40000)*(( (1)/( (1+x)^3 ) )) )",
    a: 1e-4,
    b: 1,
  },
];

export const COMPOSITE_FORMULAS = [
  "Composite trapezoidal:",
  "  h = (b−a)/n",
  "  I ≈ h [½f₀ + Σ fᵢ + ½fₙ]",
  "",
  "Composite midpoint:",
  "  I ≈ h Σ f(a + (i+½)h)",
  "",
  "Composite Simpson 1/3 (n even):",
  "  I ≈ (h/3) [f₀ + fₙ + 4 Σ f_odd + 2 Σ f_even]",
  "",
  "Composite Simpson 3/8 (n ÷ 3):",
  "  I ≈ (3h/8) [f₀ + fₙ + 3 Σ f_{i∉3ℤ} + 2 Σ f_{i∈3ℤ}]",
].join("\n");

export function buildMethodFormulation(
  equations: string[],
  initial: string[],
): {
  workflow: string;
  jacobian: string;
  split: string;
  pseudocode: string;
} {
  const n = equations.length;
  if (n !== 2 && n !== 3) {
    throw new Error("Method formulation supports 2×2 or 3×3 only.");
  }
  const variables = (n === 3 ? ["x", "y", "z"] : ["x", "y"]).slice(0, n);
  const varList = variables.join(", ");
  const x0 = initial.slice(0, n).map((v) => v || "0");

  const residualLines = equations.map(
    (eq, i) => `  f${i + 1}(${varList}) = ${eq} = 0`,
  );

  const jacobianMatrix =
    n === 3
      ? [
          "             [ ∂f1/∂x   ∂f1/∂y   ∂f1/∂z ]",
          " J(X^(k)) = [ ∂f2/∂x   ∂f2/∂y   ∂f2/∂z ]",
          "             [ ∂f3/∂x   ∂f3/∂y   ∂f3/∂z ]",
        ]
      : [
          "             [ ∂f1/∂x   ∂f1/∂y ]",
          " J(X^(k)) = [ ∂f2/∂x   ∂f2/∂y ]",
        ];

  const componentForm =
    n === 3
      ? [
          "Component form (3×3):",
          "  s1^(m+1) = (b1 − J12 s2^(m) − J13 s3^(m)) / J11",
          "  s2^(m+1) = (b2 − J21 s1^(m) − J23 s3^(m)) / J22",
          "  s3^(m+1) = (b3 − J31 s1^(m) − J32 s2^(m)) / J33",
        ]
      : [
          "Component form (2×2):",
          "  s1^(m+1) = (b1 − J12 s2^(m)) / J11",
          "  s2^(m+1) = (b2 − J21 s1^(m)) / J22",
        ];

  return {
    workflow: [
      "TWO RELATED NONLINEAR PROCESSES (V11 Neon Method Builder)",
      `Dimension: ${n} unknowns · variables: ${varList}`,
      `Initial approximation: [${x0.join("; ")}]`,
      "",
      "Residual system:",
      ...residualLines,
      "",
      "PROCESS A: NONLINEAR JACOBI / DIAGONAL NEWTON",
      "  Evaluate F(X^(k)) and J(X^(k)).",
      "  Let D_k = diag(diag(J(X^(k)))).",
      "  X^(k+1) = X^(k) − D_k⁻¹ F(X^(k)).",
      "  All components use values from the same outer iterate.",
      "",
      "PROCESS B: INEXACT NEWTON WITH INNER JACOBI",
      "  1. Evaluate F(X^(k))",
      "  2. Set b^(k) = −F(X^(k))",
      "  3. Form J(X^(k))",
      "  4. Approximately solve J s = b with Jacobi",
      "  5. Update X^(k+1) = X^(k) + s (optional damping)",
      "  6. Stop when ||F||_∞ ≤ TOL",
    ].join("\n"),
    jacobian: [
      "JACOBIAN MATRIX STRUCTURE",
      "",
      "The entries are partial derivatives evaluated at X^(k):",
      "",
      ...jacobianMatrix,
      "",
      ...equations.map((eq, i) => `  Row ${i + 1} from: ${eq}`),
      "",
      "Entries are numerical central finite differences in this port",
      "(SymPy symbolic Jacobians in the Octave V15/V11 session).",
    ].join("\n"),
    split: [
      "INNER JACOBI LINEAR SOLVE",
      "",
      "Write J = D + L + U",
      "  D = diagonal of J",
      "  L = strictly lower · U = strictly upper",
      "",
      "Vector form:",
      "  s^(m+1) = −D⁻¹(L+U)s^(m) + D⁻¹ b",
      "",
      ...componentForm,
      "",
      "Inner stop: ||J s − b||_∞ ≤ innerTol",
      "A common justification is ρ(−D⁻¹(L+U)) < 1, or strict diagonal dominance.",
    ].join("\n"),
    pseudocode: [
      "GENERAL PSEUDOCODE",
      "",
      `Choose X^(0) ∈ R^${n}.`,
      "for k = 0,1,2,...",
      "    Fk = F(Xk)",
      "    if norm(Fk,inf) <= outerTol: stop",
      "    Jk = Jacobian(F, Xk)",
      "    b = -Fk",
      "    // PROCESS A: X <- X - diag(J)^(-1) F",
      "    // PROCESS B: Jacobi-solve J s = b; X <- X + s",
      "end",
    ].join("\n"),
  };
}
