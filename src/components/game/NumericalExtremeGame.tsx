import * as React from "react";
import { Chart } from "@/components/game/numerical-extreme/Chart";
import {
  ErrorBanner,
  Field,
  GhostButton,
  Metric,
  NumberInput,
  Panel,
  RunButton,
  Select,
  TextArea,
  TextInput,
} from "@/components/game/numerical-extreme/ui";
import {
  analyzeFunction,
  analyzeVibration,
  compileScalar,
  compositeIntegration,
  downloadJson,
  formatNumber,
  interpolate,
  parseNumberList,
  runDerpar,
  runModifiedCholesky,
  runTalbot,
  solveNonlinearSystem,
  vectorizeExpression,
  type FunctionAnalysisResult,
  type IntegrationResult,
  type InterpolationResult,
  type NonlinearSystemResult,
  type VibrationResult,
} from "@/game/numerical-extreme";
import { cn } from "@/lib/utils";

type Mode = "main" | "vector" | "method" | "composite" | "diff" | "algorithms";

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "main", label: "MAIN" },
  { id: "vector", label: "VECTOR" },
  { id: "method", label: "METHOD" },
  { id: "composite", label: "COMPOSITE" },
  { id: "diff", label: "DIFF" },
  { id: "algorithms", label: "ALGORITHMS" },
];

export interface NumericalExtremeGameProps {
  onMenu: () => void;
}

function functionLog(result: FunctionAnalysisResult): string {
  return [
    "=== FUNCTION ANALYSIS ===",
    result.expression.normalized,
    "",
    "1) Factorization",
    `   ${result.expression.factorized ?? "—"}`,
    "",
    "2) Shifted representation",
    `   x = y + ${formatNumber(result.expression.shift, 10)}`,
    `   g(y) = ${result.expression.shifted ?? "—"}`,
    "",
    `3) IVT scan on [${result.domain.a}, ${result.domain.b}]`,
    `   Brackets detected: ${result.ivt.brackets.length}`,
    `   Roots: ${result.ivt.roots.map((r) => formatNumber(r, 12)).join(", ") || "none"}`,
    "",
    "4) Proposed secant pairs",
    ...result.secantPairs.map(
      (pair, i) =>
        `   ${i + 1}: [${formatNumber(pair[0], 9)}, ${formatNumber(pair[1], 9)}]`,
    ),
    "",
    "5) Mean Value Theorem",
    `   slope = ${formatNumber(result.meanValueTheorem.chordSlope, 10)}`,
    `   c = ${formatNumber(result.meanValueTheorem.c, 10)}`,
    "",
    "6) Integral Mean Value Theorem",
    `   integral = ${formatNumber(result.integralMeanValueTheorem.integral, 10)}`,
    `   average = ${formatNumber(result.integralMeanValueTheorem.average, 10)}`,
    `   c = ${formatNumber(result.integralMeanValueTheorem.c, 10)}`,
    "",
    "7) Taylor polynomials at x = 0",
    ...result.taylor.map((item) =>
      item.valid
        ? `   degree ${item.degree}: ${item.polynomial}`
        : `   degree ${item.degree}: unavailable`,
    ),
    "",
    "8) Iterative solvers",
    `   Newton: x = ${formatNumber(result.iterations.newton.root, 12)}, residual = ${formatNumber(
      result.iterations.newton.residual,
      6,
    )}, iterations = ${result.iterations.newton.iterations}`,
    ...result.iterations.secant.slice(0, 4).map(
      (run, i) =>
        `   Secant ${i + 1}: x = ${formatNumber(run.root, 12)}, residual = ${formatNumber(
          run.residual,
          6,
        )}, iterations = ${run.iterations}`,
    ),
  ].join("\n");
}

function vibrationLog(result: VibrationResult): string {
  const lines = [
    "=== VIBRATION ANALYSIS ===",
    `mode = ${result.mode}`,
    `natural frequency = ${formatNumber(result.naturalFrequency, 10)} rad/s`,
    `natural frequency = ${formatNumber(result.naturalFrequencyHz, 10)} Hz`,
    `damping ratio = ${formatNumber(result.dampingRatio, 10)}`,
  ];
  if (result.mode === "free") {
    lines.push(`regime = ${result.regime}`);
    lines.push(`damped frequency = ${formatNumber(result.dampedFrequency, 10)} rad/s`);
  } else {
    lines.push(`magnification = ${formatNumber(result.magnification, 10)}`);
    lines.push(`amplitude = ${formatNumber(result.amplitude, 10)} m`);
    lines.push(`phase = ${formatNumber(result.phase, 10)} rad`);
  }
  return lines.join("\n");
}

function MainPanel() {
  const [expression, setExpression] = React.useState("x - cos(x)");
  const [a, setA] = React.useState(1e-6);
  const [b, setB] = React.useState(2);
  const [tolerance, setTolerance] = React.useState(1e-6);
  const [maxIterations, setMaxIterations] = React.useState(200);
  const [gridPoints, setGridPoints] = React.useState(400);
  const [degrees, setDegrees] = React.useState("2, 5");
  const [shift, setShift] = React.useState(true);
  const [seedOne, setSeedOne] = React.useState("");
  const [seedTwo, setSeedTwo] = React.useState("");

  const [vibrationMode, setVibrationMode] = React.useState<"free" | "forced">("free");
  const [mass, setMass] = React.useState(1);
  const [damping, setDamping] = React.useState(0.4);
  const [stiffness, setStiffness] = React.useState(4);
  const [x0, setX0] = React.useState(0.866025403784);
  const [v0, setV0] = React.useState(0);
  const [force, setForce] = React.useState(0.866025403784);
  const [omega, setOmega] = React.useState(3);
  const [duration, setDuration] = React.useState(25);

  const [functionResult, setFunctionResult] = React.useState<FunctionAnalysisResult | null>(null);
  const [vibrationResult, setVibrationResult] = React.useState<VibrationResult | null>(null);
  const [activeOutput, setActiveOutput] = React.useState<"function" | "vibration" | null>(null);
  const [log, setLog] = React.useState("(output will appear here)");
  const [error, setError] = React.useState("");

  function runFunction(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const seeds =
        seedOne.trim() && seedTwo.trim()
          ? ([Number(seedOne), Number(seedTwo)] as [number, number])
          : null;
      const result = analyzeFunction(
        expression,
        a,
        b,
        tolerance,
        maxIterations,
        gridPoints,
        shift,
        parseNumberList(degrees).map(Math.round),
        seeds,
      );
      setFunctionResult(result);
      setActiveOutput("function");
      setLog(functionLog(result));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    }
  }

  function runVibration() {
    setError("");
    try {
      const result = analyzeVibration(
        vibrationMode,
        mass,
        damping,
        stiffness,
        x0,
        v0,
        force,
        omega,
        duration,
        1200,
      );
      setVibrationResult(result);
      setActiveOutput("vibration");
      setLog(vibrationLog(result));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Vibration analysis failed.");
    }
  }

  function clearOutput() {
    setFunctionResult(null);
    setVibrationResult(null);
    setActiveOutput(null);
    setLog("(output cleared)");
    setError("");
  }

  const chart = React.useMemo(() => {
    if (activeOutput === "function" && functionResult) {
      return (
        <Chart
          x={functionResult.plot.x}
          series={[
            {
              key: "function",
              label: "f(x)",
              values: functionResult.plot.y,
              color: "#22d3ee",
            },
          ]}
          referenceX={functionResult.ivt.roots}
          referenceY={0}
          height={300}
        />
      );
    }
    if (
      activeOutput === "vibration" &&
      vibrationResult?.mode === "free" &&
      Array.isArray(vibrationResult.plot["time"]) &&
      Array.isArray(vibrationResult.plot["displacement"])
    ) {
      return (
        <Chart
          x={vibrationResult.plot["time"] as number[]}
          series={[
            {
              key: "displacement",
              label: "x(t)",
              values: vibrationResult.plot["displacement"] as Array<number | null>,
              color: "#22d3ee",
            },
          ]}
          referenceY={0}
          height={300}
        />
      );
    }
    if (
      activeOutput === "vibration" &&
      vibrationResult?.mode === "forced" &&
      Array.isArray(vibrationResult.plot["frequencyRatio"]) &&
      Array.isArray(vibrationResult.plot["magnification"])
    ) {
      return (
        <Chart
          x={vibrationResult.plot["frequencyRatio"] as number[]}
          series={[
            {
              key: "magnification",
              label: "M(r)",
              values: vibrationResult.plot["magnification"] as Array<number | null>,
              color: "#22d3ee",
            },
          ]}
          height={300}
        />
      );
    }
    return (
      <div className="grid h-[300px] place-items-center rounded-lg border border-dashed border-cyan/25 bg-deepblue/40 text-center">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
            No plot data
          </p>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground/70">
            Run analysis or vibration.
          </p>
        </div>
      </div>
    );
  }, [activeOutput, functionResult, vibrationResult]);

  return (
    <form
      onSubmit={runFunction}
      className="grid gap-3 xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]"
    >
      <aside className="space-y-4 rounded-xl border border-cyan/35 bg-deepblue/60 p-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber">Inputs</p>
        <div className="space-y-2">
          <Field label="f(x)">
            <TextInput
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              spellCheck={false}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="a">
              <NumberInput value={a} step="any" onChange={(e) => setA(Number(e.target.value))} />
            </Field>
            <Field label="b">
              <NumberInput value={b} step="any" onChange={(e) => setB(Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Secant seeds" hint="blank = auto">
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                value={seedOne}
                placeholder="x0"
                step="any"
                onChange={(e) => setSeedOne(e.target.value)}
              />
              <NumberInput
                value={seedTwo}
                placeholder="x1"
                step="any"
                onChange={(e) => setSeedTwo(e.target.value)}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="TOL">
              <NumberInput
                value={tolerance}
                step="any"
                onChange={(e) => setTolerance(Number(e.target.value))}
              />
            </Field>
            <Field label="MAXIT">
              <NumberInput
                value={maxIterations}
                onChange={(e) => setMaxIterations(Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="GRIDN">
              <NumberInput
                value={gridPoints}
                onChange={(e) => setGridPoints(Number(e.target.value))}
              />
            </Field>
            <Field label="Taylor degs">
              <TextInput value={degrees} onChange={(e) => setDegrees(e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-cyan/30 bg-deepblue/80 px-3 py-2 font-mono text-[10px] text-moon/80">
            <input
              type="checkbox"
              checked={shift}
              onChange={(e) => setShift(e.target.checked)}
              className="accent-cyan"
            />
            Shift y = x − c
          </label>
        </div>

        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber">
          Vibrations (SDOF)
        </p>
        <div className="space-y-2">
          <Field label="Mode">
            <Select
              value={vibrationMode}
              onChange={(e) => setVibrationMode(e.target.value as "free" | "forced")}
            >
              <option value="free">Free response</option>
              <option value="forced">Forced steady-state</option>
            </Select>
          </Field>
          {(
            [
              ["m (kg)", mass, setMass],
              ["c (N·s/m)", damping, setDamping],
              ["k (N/m)", stiffness, setStiffness],
              ["x0 (m)", x0, setX0],
              ["v0 (m/s)", v0, setV0],
              ["F0 (N)", force, setForce],
              ["ω", omega, setOmega],
              ["tEnd (s)", duration, setDuration],
            ] as const
          ).map(([label, value, setter]) => (
            <Field key={label} label={label}>
              <NumberInput
                value={value}
                step="any"
                onChange={(e) => setter(Number(e.target.value))}
              />
            </Field>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <RunButton>Run analysis</RunButton>
          <GhostButton type="button" onClick={runVibration} className="w-full py-2.5">
            Run vibration
          </GhostButton>
        </div>
        <GhostButton type="button" onClick={clearOutput} className="w-full">
          Clear output
        </GhostButton>
        {error && <ErrorBanner message={error} />}
      </aside>

      <div className="min-w-0 space-y-3">
        {chart}
        <Panel title="Engine log" eyebrow="Monospace telemetry">
          <pre className="max-h-80 overflow-auto rounded-lg border border-cyan/20 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-mint whitespace-pre-wrap">
            {log}
          </pre>
        </Panel>
      </div>
    </form>
  );
}

function VectorPanel() {
  const [raw, setRaw] = React.useState(
    "-20000 + 7000*((((1+x)^3 - 1) / (x*(1+x)^3))) + 8000 / (1+x)^3",
  );
  const [a, setA] = React.useState(-2);
  const [b, setB] = React.useState(2);
  const [result, setResult] = React.useState<{
    cleaned: string;
    python: string;
    octave: string;
  } | null>(null);
  const [previewX, setPreviewX] = React.useState<number[]>([]);
  const [previewY, setPreviewY] = React.useState<Array<number | null>>([]);
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState("");

  function vectorize(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = vectorizeExpression(raw);
      setResult(data);
      setPreviewX([]);
      setPreviewY([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Vectorization failed.");
    }
  }

  function plotPreview() {
    if (!result) return;
    setError("");
    try {
      const fn = compileScalar(result.cleaned);
      const n = 240;
      const xs: number[] = [];
      const ys: Array<number | null> = [];
      for (let i = 0; i < n; i += 1) {
        const x = a + ((b - a) * i) / (n - 1);
        xs.push(x);
        try {
          const y = fn(x);
          ys.push(Number.isFinite(y) ? y : null);
        } catch {
          ys.push(null);
        }
      }
      setPreviewX(xs);
      setPreviewY(ys);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Preview failed.");
    }
  }

  async function copy(name: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(name);
      window.setTimeout(() => setCopied(""), 1200);
    } catch {
      setError("Clipboard unavailable.");
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <form onSubmit={vectorize} className="space-y-3">
        <Panel title="Raw algebra" eyebrow="Equation studio">
          <div className="space-y-3">
            <Field label="Paste an equation" hint="implicit products cleaned">
              <TextArea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Lower x">
                <NumberInput value={a} step="any" onChange={(e) => setA(Number(e.target.value))} />
              </Field>
              <Field label="Upper x">
                <NumberInput value={b} step="any" onChange={(e) => setB(Number(e.target.value))} />
              </Field>
            </div>
            <RunButton>Vectorize & clean</RunButton>
            {error && <ErrorBanner message={error} />}
          </div>
        </Panel>
      </form>

      <div className="space-y-3">
        {!result ? (
          <Panel title="Ready" eyebrow="VECTOR">
            <p className="font-mono text-xs text-muted-foreground">
              Turn handwritten algebra into cleaned, Python, and Octave forms, then sample with the
              local scalar compiler.
            </p>
          </Panel>
        ) : (
          <>
            <Panel title="Conversion matrix" eyebrow="Portable forms">
              <div className="space-y-3">
                {(
                  [
                    ["Readable", result.cleaned],
                    ["Python", result.python],
                    ["Octave / MATLAB", result.octave],
                  ] as const
                ).map(([name, value]) => (
                  <div key={name}>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan">
                        {name}
                      </p>
                      <GhostButton type="button" onClick={() => copy(name, value)}>
                        {copied === name ? "Copied" : "Copy"}
                      </GhostButton>
                    </div>
                    <pre className="overflow-x-auto rounded-lg border border-cyan/20 bg-black/40 p-2.5 font-mono text-[11px] text-mint">
                      {value}
                    </pre>
                  </div>
                ))}
                <GhostButton type="button" onClick={plotPreview} className="w-full">
                  Compile & sample preview
                </GhostButton>
              </div>
            </Panel>
            {previewX.length > 0 && (
              <Chart
                x={previewX}
                series={[
                  { key: "f", label: "f(x)", values: previewY, color: "#e879f9" },
                ]}
                referenceY={0}
                height={260}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MethodPanel() {
  const [eq1, setEq1] = React.useState("4*x + sin(y) - 1");
  const [eq2, setEq2] = React.useState("x^2 + 5*y - 1");
  const [initial, setInitial] = React.useState("0, 0");
  const [outerTol, setOuterTol] = React.useState(1e-8);
  const [outerMax, setOuterMax] = React.useState(30);
  const [innerTol, setInnerTol] = React.useState(1e-10);
  const [innerMax, setInnerMax] = React.useState(100);
  const [result, setResult] = React.useState<NonlinearSystemResult | null>(null);
  const [error, setError] = React.useState("");

  function run(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const guess = parseNumberList(initial);
      if (guess.length !== 2) throw new Error("Initial vector must contain exactly 2 values.");
      setResult(
        solveNonlinearSystem([eq1, eq2], guess, outerTol, outerMax, innerTol, innerMax),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "System solve failed.");
    }
  }

  const jacobi = result?.diagonalNonlinearJacobi;
  const newton = result?.inexactNewtonJacobi;
  const traceLen = result
    ? Math.max(jacobi?.history.length ?? 0, newton?.history.length ?? 0)
    : 0;
  const traceX = Array.from({ length: traceLen }, (_, i) => i);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <form onSubmit={run} className="space-y-3">
        <Panel title="2-equation system" eyebrow="Nonlinear method lab">
          <div className="space-y-3">
            <Field label="f₁(x,y) = 0">
              <TextInput value={eq1} onChange={(e) => setEq1(e.target.value)} spellCheck={false} />
            </Field>
            <Field label="f₂(x,y) = 0">
              <TextInput value={eq2} onChange={(e) => setEq2(e.target.value)} spellCheck={false} />
            </Field>
            <Field label="Initial X⁽⁰⁾" hint="comma-separated">
              <TextInput value={initial} onChange={(e) => setInitial(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Outer TOL">
                <NumberInput
                  value={outerTol}
                  step="any"
                  onChange={(e) => setOuterTol(Number(e.target.value))}
                />
              </Field>
              <Field label="Outer MAX">
                <NumberInput
                  value={outerMax}
                  onChange={(e) => setOuterMax(Number(e.target.value))}
                />
              </Field>
              <Field label="Inner TOL">
                <NumberInput
                  value={innerTol}
                  step="any"
                  onChange={(e) => setInnerTol(Number(e.target.value))}
                />
              </Field>
              <Field label="Inner MAX">
                <NumberInput
                  value={innerMax}
                  onChange={(e) => setInnerMax(Number(e.target.value))}
                />
              </Field>
            </div>
            <RunButton>Solve system</RunButton>
            {error && <ErrorBanner message={error} />}
          </div>
        </Panel>
      </form>

      <div className="space-y-3">
        {!result ? (
          <Panel title="Ready" eyebrow="METHOD">
            <p className="font-mono text-xs text-muted-foreground">
              Diagonal nonlinear Jacobi vs inexact Newton–Jacobi on a 2×2 residual system.
            </p>
          </Panel>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Metric
                label="Jacobi residual"
                value={jacobi?.finalResidual}
                detail={`${jacobi?.iterations ?? 0} iters · ${jacobi?.converged ? "ok" : "stop"}`}
              />
              <Metric
                label="Newton residual"
                value={newton?.finalResidual}
                detail={`${newton?.iterations ?? 0} iters · ${newton?.converged ? "ok" : "stop"}`}
                accent="magenta"
              />
            </div>
            <Panel title="Estimates" eyebrow="X*">
              <pre className="font-mono text-[11px] text-mint whitespace-pre-wrap">
                {`Jacobi:  [${(jacobi?.estimate ?? []).map((v) => formatNumber(v, 8)).join(", ")}]\nNewton:  [${(newton?.estimate ?? []).map((v) => formatNumber(v, 8)).join(", ")}]`}
              </pre>
            </Panel>
            {traceLen > 0 && (
              <Chart
                x={traceX}
                series={[
                  {
                    key: "jacobi",
                    label: "Jacobi residual",
                    values: traceX.map((_, i) => jacobi?.history[i]?.residual ?? null),
                    color: "#22d3ee",
                  },
                  {
                    key: "newton",
                    label: "Newton residual",
                    values: traceX.map((_, i) => newton?.history[i]?.residual ?? null),
                    color: "#e879f9",
                  },
                ]}
                height={260}
              />
            )}
            <GhostButton
              type="button"
              onClick={() => downloadJson("nonlinear-system.json", result)}
            >
              Export JSON
            </GhostButton>
          </>
        )}
      </div>
    </div>
  );
}

function CompositePanel() {
  const [expression, setExpression] = React.useState("sin(x) + x^2");
  const [a, setA] = React.useState(0);
  const [b, setB] = React.useState(2);
  const [subintervals, setSubintervals] = React.useState(12);
  const [result, setResult] = React.useState<IntegrationResult | null>(null);
  const [error, setError] = React.useState("");

  function run(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      setResult(compositeIntegration(expression, a, b, subintervals));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Integration failed.");
    }
  }

  const methods = result
    ? [
        ["Trapezoidal", result.methods.trapezoidal],
        ["Midpoint", result.methods.midpoint],
        ["Simpson 1/3", result.methods.simpsonOneThird],
        ["Simpson 3/8", result.methods.simpsonThreeEighths],
      ] as const
    : [];

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <form onSubmit={run} className="space-y-3">
        <Panel title="Quadrature controls" eyebrow="Composite lab">
          <div className="space-y-3">
            <Field label="Integrand f(x)">
              <TextInput
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                spellCheck={false}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["Polynomial", "x^2", 0, 3],
                  ["Oscillatory", "sin(5*x)*exp(-x/3)", 0, 6],
                  ["Gaussian", "exp(-x^2)", -3, 3],
                ] as const
              ).map(([label, expr, lo, hi]) => (
                <GhostButton
                  key={label}
                  type="button"
                  onClick={() => {
                    setExpression(expr);
                    setA(lo);
                    setB(hi);
                  }}
                >
                  {label}
                </GhostButton>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Lower a">
                <NumberInput value={a} step="any" onChange={(e) => setA(Number(e.target.value))} />
              </Field>
              <Field label="Upper b">
                <NumberInput value={b} step="any" onChange={(e) => setB(Number(e.target.value))} />
              </Field>
            </div>
            <Field label="Subintervals n" hint="even for 1/3 · ÷3 for 3/8">
              <NumberInput
                value={subintervals}
                min={1}
                onChange={(e) => setSubintervals(Number(e.target.value))}
              />
            </Field>
            <RunButton>Compute all methods</RunButton>
            {error && <ErrorBanner message={error} />}
          </div>
        </Panel>
      </form>

      <div className="space-y-3">
        {!result ? (
          <Panel title="Ready" eyebrow="COMPOSITE">
            <p className="font-mono text-xs text-muted-foreground">
              Compare trapezoidal, midpoint, and Simpson composite rules against a dense reference.
            </p>
          </Panel>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Reference" value={result.reference.value} accent="amber" />
              <Metric label="Step h" value={result.interval.step} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {methods.map(([name, method]) => (
                <Metric
                  key={name}
                  label={name}
                  value={method.available ? method.value : "n/a"}
                  detail={
                    method.available
                      ? `|err| ${formatNumber(method.absoluteError, 4)}`
                      : method.reason ?? "unavailable"
                  }
                />
              ))}
            </div>
            <Chart
              x={result.plot.x}
              series={[
                {
                  key: "f",
                  label: "f(x)",
                  values: result.plot.y,
                  color: "#22d3ee",
                },
              ]}
              height={240}
            />
          </>
        )}
      </div>
    </div>
  );
}

const INTERP_PRESETS = {
  sample: "1, 2\n2, 3\n3, 5\n4, 4",
  runge: "-1, 0.0384615\n-0.5, 0.137931\n0, 1\n0.5, 0.137931\n1, 0.0384615",
  smooth: "0, 0\n1, 0.841471\n2, 0.909297\n3, 0.14112\n4, -0.756802",
};

function parsePoints(raw: string): Array<[number, number]> {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const values = line
        .replace(/[()]/g, "")
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map(Number);
      if (values.length !== 2 || values.some((v) => !Number.isFinite(v))) {
        throw new Error(`Each row must contain exactly two finite values: "${line}"`);
      }
      return [values[0]!, values[1]!] as [number, number];
    });
}

function DiffPanel() {
  const [rawPoints, setRawPoints] = React.useState(INTERP_PRESETS.sample);
  const [query, setQuery] = React.useState(2.5);
  const [result, setResult] = React.useState<InterpolationResult | null>(null);
  const [error, setError] = React.useState("");

  function run(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      setResult(interpolate(parsePoints(rawPoints), query, 500));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Interpolation failed.");
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <form onSubmit={run} className="space-y-3">
        <Panel title="Point data" eyebrow="DIFF laboratory">
          <div className="space-y-3">
            <Field label="One x, y pair per line" hint="distinct x">
              <TextArea
                value={rawPoints}
                onChange={(e) => setRawPoints(e.target.value)}
                rows={8}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <GhostButton type="button" onClick={() => setRawPoints(INTERP_PRESETS.sample)}>
                Sample
              </GhostButton>
              <GhostButton
                type="button"
                onClick={() => {
                  setRawPoints(INTERP_PRESETS.runge);
                  setQuery(0.25);
                }}
              >
                Runge
              </GhostButton>
              <GhostButton
                type="button"
                onClick={() => {
                  setRawPoints(INTERP_PRESETS.smooth);
                  setQuery(1.5);
                }}
              >
                Smooth
              </GhostButton>
            </div>
            <Field label="Query x">
              <NumberInput
                value={query}
                step="any"
                onChange={(e) => setQuery(Number(e.target.value))}
              />
            </Field>
            <RunButton>Interpolate</RunButton>
            {error && <ErrorBanner message={error} />}
          </div>
        </Panel>
      </form>

      <div className="space-y-3">
        {!result ? (
          <Panel title="Ready" eyebrow="DIFF">
            <p className="font-mono text-xs text-muted-foreground">
              Newton, Lagrange, and natural cubic spline evaluation with agreement checks.
            </p>
          </Panel>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Newton" value={result.newton.value} />
              <Metric label="Lagrange" value={result.lagrange.value} accent="magenta" />
              <Metric label="Spline" value={result.naturalCubicSpline.value} accent="amber" />
            </div>
            <Chart
              x={result.plot.x}
              series={[
                {
                  key: "poly",
                  label: "Newton/Lagrange",
                  values: result.plot.polynomial,
                  color: "#22d3ee",
                },
                {
                  key: "spline",
                  label: "Cubic spline",
                  values: result.plot.spline,
                  color: "#f59e0b",
                },
              ]}
              referenceX={[query]}
              height={260}
            />
            {result.warnings.length > 0 && (
              <ErrorBanner message={result.warnings.join(" · ")} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AlgorithmsPanel() {
  const [algo, setAlgo] = React.useState<"cholesky" | "talbot" | "derpar">("cholesky");
  const [log, setLog] = React.useState("(select an algorithm and run)");
  const [error, setError] = React.useState("");
  const [chartX, setChartX] = React.useState<number[]>([]);
  const [chartSeries, setChartSeries] = React.useState<
    Array<{ key: string; label: string; values: Array<number | null>; color: string }>
  >([]);

  // Cholesky
  const [size, setSize] = React.useState(6);
  const [low, setLow] = React.useState(-100);
  const [high, setHigh] = React.useState(-1);
  const [seed, setSeed] = React.useState(1234);

  // Talbot
  const [preset, setPreset] = React.useState("exponential");
  const [time, setTime] = React.useState(1);
  const [digits, setDigits] = React.useState(8);

  // Derpar
  const [initX, setInitX] = React.useState(0.5);
  const [initParam, setInitParam] = React.useState(0.5);
  const [step, setStep] = React.useState(0.05);
  const [maxPoints, setMaxPoints] = React.useState(80);

  function run() {
    setError("");
    try {
      if (algo === "cholesky") {
        const result = runModifiedCholesky(null, size, low, high, seed);
        setLog(
          [
            "=== MODIFIED CHOLESKY (ESKOW) ===",
            `source = ${result.source}`,
            `size = ${result.size}`,
            `factorization ∞-error = ${formatNumber(result.verification.factorizationInfinityError)}`,
            `solve ∞-error = ${formatNumber(result.verification.solveInfinityError)}`,
            `max diagonal addition = ${formatNumber(result.verification.maximumDiagonalAddition)}`,
            `λmin before = ${formatNumber(result.verification.minimumEigenvalueBefore)}`,
            `λmin after = ${formatNumber(result.verification.minimumEigenvalueAfter)}`,
            `PD after = ${result.verification.positiveDefiniteAfter}`,
          ].join("\n"),
        );
        setChartX(result.permutationOneBased);
        setChartSeries([
          {
            key: "add",
            label: "Diagonal additions",
            values: result.diagonalAdditionsOriginalOrder,
            color: "#f59e0b",
          },
        ]);
      } else if (algo === "talbot") {
        const result = runTalbot(preset, time, digits, 0, 0.1, 5, 80);
        setLog(
          [
            "=== TALBOT INVERSION ===",
            result.description,
            `t = ${formatNumber(result.time)}`,
            `value = ${formatNumber(result.value)}`,
            `exact = ${formatNumber(result.expected)}`,
            `|error| = ${formatNumber(result.absoluteError)}`,
            `quadrature points = ${result.parameters.quadraturePoints}`,
          ].join("\n"),
        );
        setChartX(result.plot.time);
        setChartSeries([
          {
            key: "talbot",
            label: "Talbot",
            values: result.plot.talbot,
            color: "#22d3ee",
          },
          {
            key: "exact",
            label: "Exact",
            values: result.plot.exact,
            color: "#f59e0b",
          },
        ]);
      } else {
        const result = runDerpar(initX, initParam, step, 0.5, 0.5, 1, 1, maxPoints, 1e-8);
        setLog(
          [
            "=== DERPAR CONTINUATION ===",
            result.equation,
            `status = ${result.status}`,
            `flag = ${result.flag}`,
            result.message,
            `points = ${result.pointCount}`,
            `initial correction = ${result.initialCorrectionConverged ? "converged" : "failed"}`,
          ].join("\n"),
        );
        const xs = result.plot.x.map((v, i) => (v !== null ? v : i));
        setChartX(xs as number[]);
        setChartSeries([
          {
            key: "param",
            label: "α(x)",
            values: result.plot.parameter,
            color: "#22d3ee",
          },
          {
            key: "exact",
            label: "1 − x²",
            values: result.plot.exactParameter,
            color: "#f59e0b",
          },
        ]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Algorithm failed.");
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
      <Panel title="Algorithm suite" eyebrow="V15 ports">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-cyan/30 p-1">
            {(
              [
                ["cholesky", "Chol"],
                ["talbot", "Talbot"],
                ["derpar", "DERPAR"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setAlgo(id)}
                className={cn(
                  "rounded-md px-2 py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition",
                  algo === id
                    ? "bg-cyan text-deepblue"
                    : "text-cyan hover:bg-cyan/15",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {algo === "cholesky" && (
            <div className="space-y-2">
              <Field label="Size">
                <NumberInput value={size} min={1} max={40} onChange={(e) => setSize(Number(e.target.value))} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="λ low">
                  <NumberInput value={low} step="any" onChange={(e) => setLow(Number(e.target.value))} />
                </Field>
                <Field label="λ high">
                  <NumberInput value={high} step="any" onChange={(e) => setHigh(Number(e.target.value))} />
                </Field>
              </div>
              <Field label="Seed">
                <NumberInput value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
              </Field>
            </div>
          )}

          {algo === "talbot" && (
            <div className="space-y-2">
              <Field label="Preset">
                <Select value={preset} onChange={(e) => setPreset(e.target.value)}>
                  <option value="exponential">Exponential</option>
                  <option value="sine">Sine</option>
                  <option value="v15">V15 demo</option>
                </Select>
              </Field>
              <Field label="Time t">
                <NumberInput value={time} step="any" onChange={(e) => setTime(Number(e.target.value))} />
              </Field>
              <Field label="Decimal digits">
                <NumberInput value={digits} min={2} max={16} onChange={(e) => setDigits(Number(e.target.value))} />
              </Field>
            </div>
          )}

          {algo === "derpar" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label="x₀">
                  <NumberInput value={initX} step="any" onChange={(e) => setInitX(Number(e.target.value))} />
                </Field>
                <Field label="α₀">
                  <NumberInput value={initParam} step="any" onChange={(e) => setInitParam(Number(e.target.value))} />
                </Field>
              </div>
              <Field label="Step">
                <NumberInput value={step} step="any" onChange={(e) => setStep(Number(e.target.value))} />
              </Field>
              <Field label="Max points">
                <NumberInput value={maxPoints} min={5} onChange={(e) => setMaxPoints(Number(e.target.value))} />
              </Field>
            </div>
          )}

          <RunButton type="button" onClick={run}>
            Run {algo}
          </RunButton>
          {error && <ErrorBanner message={error} />}
        </div>
      </Panel>

      <div className="space-y-3">
        {chartX.length > 0 && chartSeries.length > 0 && (
          <Chart x={chartX} series={chartSeries} height={280} />
        )}
        <Panel title="Engine log" eyebrow="Algorithms">
          <pre className="max-h-72 overflow-auto rounded-lg border border-cyan/20 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-mint whitespace-pre-wrap">
            {log}
          </pre>
        </Panel>
      </div>
    </div>
  );
}

export function NumericalExtremeGame({ onMenu }: NumericalExtremeGameProps) {
  const [mode, setMode] = React.useState<Mode>("main");

  return (
    <div className="numerical-extreme-shell extreme-shell mx-auto flex w-full max-w-6xl flex-col gap-4 px-2 py-4">
      <header className="overflow-hidden rounded-xl border border-cyan/50 bg-deepblue/80 shadow-[0_0_40px_rgba(34,211,238,0.14)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan/30 px-4 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-magenta">
              ZEUS AMMON-RA 11
            </p>
            <h1 className="mt-1 font-display text-xl uppercase tracking-[0.16em] text-cyan text-glow sm:text-2xl">
              NUMERICAL EXTREME
            </h1>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              Local TypeScript engine · V11 / V15 ports
            </p>
          </div>
          <button
            type="button"
            onClick={onMenu}
            className="rounded-lg border border-amber/50 bg-deepblue/70 px-4 py-2 font-display text-xs uppercase tracking-[0.2em] text-amber transition hover:bg-amber/15"
          >
            Main menu
          </button>
        </div>
        <nav className="flex flex-wrap gap-px bg-cyan/15 p-px">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={cn(
                "min-h-10 flex-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition",
                mode === item.id
                  ? "bg-cyan text-deepblue"
                  : "bg-deepblue/90 text-cyan hover:bg-cyan/20",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="min-w-0">
        {mode === "main" && <MainPanel />}
        {mode === "vector" && <VectorPanel />}
        {mode === "method" && <MethodPanel />}
        {mode === "composite" && <CompositePanel />}
        {mode === "diff" && <DiffPanel />}
        {mode === "algorithms" && <AlgorithmsPanel />}
      </main>
    </div>
  );
}
