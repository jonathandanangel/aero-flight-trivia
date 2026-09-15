import * as React from "react";
import { Chart } from "@/components/game/numerical-extreme/Chart";
import { BrainOverload } from "@/components/game/BrainOverload";
import {
  EquationBox,
  ErrorBanner,
  Field,
  GhostButton,
  Metric,
  NumberInput,
  NumericalComputeContext,
  Panel,
  RunButton,
  Select,
  TextArea,
  TextInput,
} from "@/components/game/numerical-extreme/ui";
import {
  analyzeFunction,
  analyzeVibration,
  buildFunctionReport,
  buildMethodFormulation,
  buildVibrationReport,
  compileScalar,
  compositeIntegration,
  COMPOSITE_FORMULAS,
  downloadJson,
  formatNumber,
  formatNumerologyReport,
  FUNCTION_PRESETS,
  interpolate,
  parseNumberList,
  runDerpar,
  runModifiedCholesky,
  runTalbot,
  solveNonlinearSystem,
  TOOLBOX_REFERENCES,
  vectorizeExpression,
  wordToNumerology,
  type FunctionAnalysisResult,
  type IntegrationResult,
  type InterpolationResult,
  type NonlinearSystemResult,
  type NumerologyResult,
  type VibrationResult,
} from "@/game/numerical-extreme";
import { audio } from "@/game/audio";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";

type Mode =
  | "main"
  | "vector"
  | "method"
  | "composite"
  | "diff"
  | "algorithms"
  | "numerology"
  | "references";

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "main", label: "MAIN" },
  { id: "vector", label: "VECTOR" },
  { id: "method", label: "METHOD" },
  { id: "composite", label: "COMPOSITE" },
  { id: "diff", label: "DIFF" },
  { id: "algorithms", label: "ALGORITHMS" },
  { id: "numerology", label: "NUMEROLOGY" },
  { id: "references", label: "REFS" },
];

export interface NumericalExtremeGameProps {
  onMenu: () => void;
}

function MainPanel() {
  const [expression, setExpression] = React.useState(FUNCTION_PRESETS[0]!.expr);
  const [a, setA] = React.useState(FUNCTION_PRESETS[0]!.a);
  const [b, setB] = React.useState(FUNCTION_PRESETS[0]!.b);
  const [tolerance, setTolerance] = React.useState(1e-6);
  const [maxIterations, setMaxIterations] = React.useState(200);
  const [gridPoints, setGridPoints] = React.useState(400);
  const [degrees, setDegrees] = React.useState("2, 5");
  const [shift, setShift] = React.useState(true);
  const [seedOne, setSeedOne] = React.useState("");
  const [seedTwo, setSeedTwo] = React.useState("");
  const [clickMode, setClickMode] = React.useState<"off" | "inspect" | "secant">("inspect");
  const [seedStage, setSeedStage] = React.useState(0);
  const [clickedPoints, setClickedPoints] = React.useState<Array<{ x: number; y: number }>>([]);

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
  const compute = React.useContext(NumericalComputeContext);

  function appendClickLog(line: string) {
    setLog((prev) => `${prev}\n${line}`);
  }

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
      setVibrationResult(null);
      setActiveOutput("function");
      setClickedPoints([]);
      setSeedStage(0);
      setLog(buildFunctionReport(result));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    }
  }

  function runVibration() {
    setError("");
    compute?.();
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
      setClickedPoints([]);
      setLog((prev) => {
        const block = buildVibrationReport(result);
        if (prev.startsWith("(output") || prev.startsWith("(output cleared)")) return block;
        return `${prev}\n\n${block}`;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Vibration analysis failed.");
    }
  }

  function clearOutput() {
    setFunctionResult(null);
    setVibrationResult(null);
    setActiveOutput(null);
    setClickedPoints([]);
    setSeedStage(0);
    setLog("(output cleared)");
    setError("");
  }

  function handleChartClick(point: { x: number; y: number }) {
    if (clickMode === "off") return;
    setClickedPoints((prev) => [...prev, point]);
    appendClickLog(
      `Clicked point: x=${formatNumber(point.x, 12)}, y=${formatNumber(point.y, 12)}`,
    );
    if (clickMode === "secant" && activeOutput === "function") {
      if (seedStage === 0) {
        setSeedOne(String(point.x));
        setSeedStage(1);
        appendClickLog(`Secant seed 1 ← ${formatNumber(point.x, 12)}`);
      } else {
        const first = Number(seedOne);
        const pair = [first, point.x].sort((u, v) => u - v);
        setSeedOne(String(pair[0]));
        setSeedTwo(String(pair[1]));
        setSeedStage(0);
        appendClickLog(
          `Secant seeds ← [${formatNumber(pair[0]!, 12)}, ${formatNumber(pair[1]!, 12)}]`,
        );
      }
    }
  }

  const seedMarkers =
    clickMode === "secant"
      ? [
          seedOne.trim() && Number.isFinite(Number(seedOne))
            ? { x: Number(seedOne), y: 0, color: "#f59e0b", label: "s0" }
            : null,
          seedTwo.trim() && Number.isFinite(Number(seedTwo))
            ? { x: Number(seedTwo), y: 0, color: "#f59e0b", label: "s1" }
            : null,
        ].filter(Boolean) as Array<{ x: number; y: number; color: string; label: string }>
      : [];

  const chart = React.useMemo(() => {
    const inspectMarkers = clickedPoints.map((p) => ({
      x: p.x,
      y: p.y,
      color: "#f472b6",
      label: `(${formatNumber(p.x, 4)}, ${formatNumber(p.y, 4)})`,
    }));
    const clickProps =
      clickMode === "off"
        ? {}
        : {
            onPointClick: (point: { x: number; y: number; index: number }) => {
              handleChartClick(point);
            },
          };

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
          referenceX={[
            ...functionResult.ivt.roots,
            ...seedMarkers.map((m) => m.x),
          ]}
          referenceY={0}
          markers={inspectMarkers}
          {...clickProps}
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
          markers={inspectMarkers}
          {...clickProps}
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
          markers={inspectMarkers}
          {...clickProps}
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
  }, [
    activeOutput,
    functionResult,
    vibrationResult,
    clickMode,
    clickedPoints,
    seedMarkers,
    seedOne,
    seedStage,
  ]);

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
          <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
            {FUNCTION_PRESETS.map((preset) => (
              <GhostButton
                key={preset.label}
                type="button"
                title={preset.note ? `${preset.expr}\n${preset.note}` : preset.expr}
                onClick={() => {
                  setExpression(preset.expr);
                  setA(preset.a);
                  setB(preset.b);
                }}
              >
                {preset.label}
              </GhostButton>
            ))}
          </div>
          <p className="font-mono text-[9px] text-muted-foreground">
            {FUNCTION_PRESETS.length} V15 demo f(x) samples · hover for expression
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="a">
              <NumberInput value={a} step="any" onChange={(e) => setA(Number(e.target.value))} />
            </Field>
            <Field label="b">
              <NumberInput value={b} step="any" onChange={(e) => setB(Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Plot click mode">
            <Select
              value={clickMode}
              onChange={(e) => {
                setClickMode(e.target.value as "off" | "inspect" | "secant");
                setSeedStage(0);
              }}
            >
              <option value="off">Off</option>
              <option value="inspect">Inspect (snap + log)</option>
              <option value="secant">Pick Secant seeds</option>
            </Select>
          </Field>
          <Field label="Secant seeds" hint={clickMode === "secant" ? "click plot twice" : "blank = auto"}>
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
            Shift-to-zero (y = x − c)
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
        <div className="grid grid-cols-2 gap-2">
          <GhostButton type="button" onClick={clearOutput} className="w-full">
            Clear output
          </GhostButton>
          <GhostButton
            type="button"
            className="w-full"
            onClick={() => {
              setClickedPoints([]);
              appendClickLog("Clicked points cleared.");
            }}
          >
            Clear clicks
          </GhostButton>
        </div>
        {error && <ErrorBanner message={error} />}
      </aside>

      <div className="min-w-0 space-y-3">
        {chart}
        <Panel title="Engine log" eyebrow="V15 telemetry · sections 1–11">
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
  const [inspect, setInspect] = React.useState<Array<{ x: number; y: number }>>([]);
  const [status, setStatus] = React.useState(
    "READY | Paste an equation, vectorize it, then plot.",
  );
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
      setInspect([]);
      setStatus("VECTORIZATION COMPLETE | Output is ready.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Vectorization failed.");
    }
  }

  function plotPreview() {
    if (!result) return;
    setError("");
    try {
      const fn = compileScalar(result.cleaned);
      const n = 400;
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
      setInspect([]);
      setStatus(
        `PLOT COMPLETE | ${ys.filter((v) => v !== null).length} finite real samples.`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Preview failed.");
    }
  }

  async function copy(name: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(name);
      setStatus(`OUTPUT COPIED (${name})`);
      window.setTimeout(() => setCopied(""), 1200);
    } catch {
      setError("Clipboard unavailable.");
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <form onSubmit={vectorize} className="space-y-3">
        <Panel title="Equation conversion matrix" eyebrow="VECTOR lab">
          <div className="space-y-3">
            <Field label="Paste raw algebraic equation" hint="implicit products cleaned">
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
            <p className="font-mono text-[10px] text-mint/80">{status}</p>
          </div>
        </Panel>
      </form>

      <div className="space-y-3">
        {!result ? (
          <Panel title="Ready" eyebrow="VECTOR">
            <p className="font-mono text-xs text-muted-foreground">
              Turn handwritten algebra into cleaned, Python, and Octave forms, then sample with the
              local scalar compiler. Click the plot to inspect nearest samples (V15 inspect mode).
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
                <div className="grid grid-cols-2 gap-2">
                  <GhostButton type="button" onClick={plotPreview} className="w-full">
                    Plot clean equation
                  </GhostButton>
                  <GhostButton
                    type="button"
                    className="w-full"
                    onClick={() => {
                      setInspect([]);
                      setStatus("Inspection points cleared.");
                    }}
                  >
                    Clear dots
                  </GhostButton>
                </div>
              </div>
            </Panel>
            {previewX.length > 0 && (
              <Chart
                x={previewX}
                series={[
                  { key: "f", label: "f(x)", values: previewY, color: "#e879f9" },
                ]}
                referenceY={0}
                markers={inspect.map((p) => ({
                  x: p.x,
                  y: p.y,
                  color: "#22d3ee",
                  label: `(${formatNumber(p.x, 4)}, ${formatNumber(p.y, 4)})`,
                }))}
                onPointClick={(point) => {
                  setInspect((prev) => [...prev, { x: point.x, y: point.y }]);
                  setStatus(
                    `INSPECT | x=${formatNumber(point.x, 12)}, y=${formatNumber(point.y, 12)}`,
                  );
                }}
                height={280}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MethodPanel() {
  const [systemSize, setSystemSize] = React.useState<2 | 3>(3);
  const [eq1, setEq1] = React.useState("5*x + sin(y) + z^2 - 1");
  const [eq2, setEq2] = React.useState("x^2 + 6*y - cos(z)");
  const [eq3, setEq3] = React.useState("x - y + 4*z - 2");
  const [initial, setInitial] = React.useState("0, 0, 0");
  const [outerTol, setOuterTol] = React.useState(1e-8);
  const [outerMax, setOuterMax] = React.useState(30);
  const [innerTol, setInnerTol] = React.useState(1e-10);
  const [innerMax, setInnerMax] = React.useState(100);
  const [page, setPage] = React.useState<"workflow" | "jacobian" | "split" | "pseudo" | "solve">(
    "workflow",
  );
  const [result, setResult] = React.useState<NonlinearSystemResult | null>(null);
  const [error, setError] = React.useState("");

  const equations =
    systemSize === 3 ? [eq1, eq2, eq3] : [eq1, eq2];
  const guessParts = initial.split(/[,;\s]+/).filter(Boolean);
  const formulation = buildMethodFormulation(equations, guessParts);

  function applySize(next: 2 | 3) {
    setSystemSize(next);
    setResult(null);
    setPage("workflow");
    if (next === 3) {
      setEq1("5*x + sin(y) + z^2 - 1");
      setEq2("x^2 + 6*y - cos(z)");
      setEq3("x - y + 4*z - 2");
      setInitial("0, 0, 0");
    } else {
      setEq1("5*x + sin(y) - 1");
      setEq2("x^2 + 6*y - 1");
      setEq3("x - y + 4*z - 2");
      setInitial("0, 0");
    }
  }

  function run(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPage("solve");
    try {
      const guess = parseNumberList(initial);
      if (guess.length !== systemSize) {
        throw new Error(`Initial vector must contain exactly ${systemSize} values.`);
      }
      const system =
        systemSize === 3 ? [eq1, eq2, eq3] : [eq1, eq2];
      setResult(
        solveNonlinearSystem(system, guess, outerTol, outerMax, innerTol, innerMax),
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
  const varHint = systemSize === 3 ? "x, y, z" : "x, y";

  const pages = [
    ["workflow", "WORKFLOW"],
    ["jacobian", "JACOBIAN"],
    ["split", "JACOBI SPLIT"],
    ["pseudo", "PSEUDOCODE"],
    ["solve", "ANALYSIS"],
  ] as const;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <form onSubmit={run} className="space-y-3">
        <Panel title="Problem input" eyebrow="Newton–Jacobi method builder">
          <div className="space-y-3">
            <Field label="System size">
              <Select
                value={String(systemSize)}
                onChange={(e) => applySize(Number(e.target.value) as 2 | 3)}
              >
                <option value="3">3 × 3</option>
                <option value="2">2 × 2</option>
              </Select>
            </Field>
            <Field label={`f₁(${varHint}) = 0`}>
              <TextInput value={eq1} onChange={(e) => setEq1(e.target.value)} spellCheck={false} />
            </Field>
            <Field label={`f₂(${varHint}) = 0`}>
              <TextInput value={eq2} onChange={(e) => setEq2(e.target.value)} spellCheck={false} />
            </Field>
            {systemSize === 3 && (
              <Field label="f₃(x, y, z) = 0">
                <TextInput
                  value={eq3}
                  onChange={(e) => setEq3(e.target.value)}
                  spellCheck={false}
                />
              </Field>
            )}
            <Field
              label="Initial X⁽⁰⁾"
              hint={systemSize === 3 ? "three values, comma-separated" : "two values, comma-separated"}
            >
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
            <div className="grid grid-cols-2 gap-2">
              <GhostButton
                type="button"
                onClick={() => {
                  applySize(3);
                  setPage("workflow");
                }}
              >
                Load 3×3 (problem 3)
              </GhostButton>
              <GhostButton
                type="button"
                onClick={() => {
                  setSystemSize(2);
                  setResult(null);
                  setEq1("4*x + sin(y) - 1");
                  setEq2("x^2 + 5*y - 1");
                  setInitial("0, 0");
                  setPage("workflow");
                }}
              >
                Load 2×2
              </GhostButton>
            </div>
            <RunButton>Run optional analysis</RunButton>
            {error && <ErrorBanner message={error} />}
          </div>
        </Panel>
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {pages.map(([id, label]) => (
            <GhostButton
              key={id}
              type="button"
              className={cn(page === id && "border-cyan text-cyan")}
              onClick={() => setPage(id)}
            >
              {label}
            </GhostButton>
          ))}
        </div>

        {page === "workflow" && (
          <Panel title="Workflow" eyebrow={`${systemSize} × ${systemSize} formulation`}>
            <EquationBox>{formulation.workflow}</EquationBox>
          </Panel>
        )}
        {page === "jacobian" && (
          <Panel title="Jacobian structure" eyebrow="∂F/∂X">
            <EquationBox>{formulation.jacobian}</EquationBox>
          </Panel>
        )}
        {page === "split" && (
          <Panel title="Inner Jacobi split" eyebrow="J = D + L + U">
            <EquationBox>{formulation.split}</EquationBox>
          </Panel>
        )}
        {page === "pseudo" && (
          <Panel title="Pseudocode" eyebrow="No auto-solve on this tab">
            <EquationBox>{formulation.pseudocode}</EquationBox>
          </Panel>
        )}
        {page === "solve" &&
          (!result ? (
            <Panel title="Optional analysis" eyebrow="METHOD">
              <p className="font-mono text-xs text-muted-foreground">
                Build the method tabs first, then press Run optional analysis for residual history
                on the selected {systemSize}×{systemSize} system.
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
              <Panel title="Estimates" eyebrow={`${result.dimension}×${result.dimension} · X*`}>
                <pre className="font-mono text-[11px] text-mint whitespace-pre-wrap">
                  {`variables: ${result.variables.join(", ")}\nJacobi:  [${(jacobi?.estimate ?? []).map((v) => formatNumber(v, 8)).join(", ")}]\nNewton:  [${(newton?.estimate ?? []).map((v) => formatNumber(v, 8)).join(", ")}]\n\n${jacobi?.message ?? ""}\n${newton?.message ?? ""}`}
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
          ))}
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
        <Panel title="Function & interval" eyebrow="Composite integration lab">
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
            <EquationBox>{COMPOSITE_FORMULAS}</EquationBox>
            <RunButton>Compute area</RunButton>
            {error && <ErrorBanner message={error} />}
          </div>
        </Panel>
      </form>

      <div className="space-y-3">
        {!result ? (
          <Panel title="Ready" eyebrow="COMPOSITE">
            <p className="font-mono text-xs text-muted-foreground">
              Compare trapezoidal, midpoint, and Simpson composite rules against a dense reference —
              formulas shown in the control panel (V11 Neon Composite Lab).
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
            <Panel title="Method comparison" eyebrow="Nodes + residuals">
              <pre className="max-h-40 overflow-auto font-mono text-[11px] text-mint whitespace-pre-wrap">
                {[
                  `Integral on [${formatNumber(result.interval.a)}, ${formatNumber(result.interval.b)}], n=${result.interval.subintervals}`,
                  `Reference (${result.reference.method}): ${formatNumber(result.reference.value, 14)}`,
                  "",
                  ...methods.map(([name, method]) =>
                    method.available
                      ? `${name.padEnd(14)} = ${formatNumber(method.value, 14)}   |error|=${formatNumber(method.absoluteError, 3)}`
                      : `${name.padEnd(14)} = unavailable (${method.reason ?? "n/a"})`,
                  ),
                ].join("\n")}
              </pre>
            </Panel>
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

function formatDividedDifferenceTable(table: Array<Array<number | null>>): string {
  const width = Math.max(
    10,
    ...table.flatMap((row) => row.map((cell) => (cell == null ? 1 : formatNumber(cell, 6).length))),
  );
  const header = ["f[x]", ...table.slice(1).map((_, i) => `Δ^${i + 1}`)]
    .map((label) => label.padEnd(width))
    .join(" ");
  const body = table
    .map((row, rowIndex) =>
      row
        .map((cell, colIndex) => {
          if (colIndex > table.length - 1 - rowIndex) return "".padEnd(width);
          return (cell == null ? "—" : formatNumber(cell, 6)).padEnd(width);
        })
        .join(" "),
    )
    .join("\n");
  return `${header}\n${body}`;
}

function formatSplineSegments(
  segments: InterpolationResult["naturalCubicSpline"]["segments"],
): string {
  return segments
    .map((segment, index) => {
      const a = formatNumber(segment.a, 8);
      const b = formatNumber(segment.b, 8);
      const c = formatNumber(segment.c, 8);
      const d = formatNumber(segment.d, 8);
      return [
        `Segment ${index + 1}: [${formatNumber(segment.left)}, ${formatNumber(segment.right)}]`,
        `  t = x − ${formatNumber(segment.left)}`,
        `  S(t) = ${a} + (${b})·t + (${c})·t² + (${d})·t³`,
      ].join("\n");
    })
    .join("\n\n");
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
      const next = interpolate(parsePoints(rawPoints), query, 500);
      setResult(next);
      audio.play("numeric-result");
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

        <Panel title="Three coordinated views" eyebrow="Same data · different forms">
          <ul className="space-y-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
            <li>Newton: triangular divided-difference table and nested evaluation.</li>
            <li>Lagrange: readable basis form, evaluated with stable barycentric weights.</li>
            <li>Natural spline: piecewise cubics with zero endpoint second derivatives.</li>
          </ul>
        </Panel>
      </form>

      <div className="space-y-3">
        {!result ? (
          <Panel title="Ready" eyebrow="DIFF">
            <p className="font-mono text-xs text-muted-foreground">
              Newton, Lagrange, and natural cubic spline evaluation with agreement checks. Built
              equations appear here after Interpolate.
            </p>
          </Panel>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
              <Metric label="Newton P(q)" value={result.newton.value} />
              <Metric label="Lagrange L(q)" value={result.lagrange.value} accent="magenta" />
              <Metric label="Spline S(q)" value={result.naturalCubicSpline.value} accent="amber" />
              <Metric
                label="|P−L|"
                value={result.agreement.newtonVsLagrangeAbsoluteDifference}
                accent="moon"
              />
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
              referenceX={[query, ...result.points.map((point) => point.x)]}
              height={260}
            />

            <Panel
              title="Newton divided differences"
              eyebrow={`Triangular table · query x = ${formatNumber(result.query)}`}
            >
              <div className="space-y-3">
                <EquationBox label="Divided-difference table">
                  {formatDividedDifferenceTable(result.newton.dividedDifferenceTable)}
                </EquationBox>
                <EquationBox label="Newton nested form P(x)">
                  {`P(x) = ${result.newton.formula}`}
                </EquationBox>
                <EquationBox label="Coefficients f[x₀…xₖ]">
                  {result.newton.coefficients.map((c, i) => `a${i} = ${formatNumber(c, 10)}`).join("\n")}
                </EquationBox>
              </div>
            </Panel>

            <Panel title="Lagrange representation" eyebrow="Equivalent global polynomial">
              <div className="space-y-3">
                <p className="font-mono text-[11px] text-muted-foreground">{result.lagrange.evaluation}</p>
                <EquationBox label="L(x)">
                  {result.lagrange.formula
                    ? `L(x) = ${result.lagrange.formula}`
                    : "(Expanded readable form omitted above 12 points — barycentric weights still used numerically.)"}
                </EquationBox>
              </div>
            </Panel>

            <Panel
              title="Natural cubic segments"
              eyebrow={result.naturalCubicSpline.boundaryCondition}
            >
              <EquationBox label="Piecewise cubics Sᵢ(t)">
                {formatSplineSegments(result.naturalCubicSpline.segments)}
              </EquationBox>
            </Panel>

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
        const result = runTalbot(preset, time, digits, 6, 0.1, 5, 80);
        setLog(
          [
            "=== TALBOT INVERSION (Alg 682) ===",
            result.description,
            `t = ${formatNumber(result.time)}`,
            `value = ${formatNumber(result.value)}`,
            `exact = ${formatNumber(result.expected)}`,
            `|error| = ${formatNumber(result.absoluteError)}`,
            `λ=${formatNumber(result.parameters.lambda)}  σ=${formatNumber(result.parameters.sigma)}  ν=${formatNumber(result.parameters.nu)}`,
            `H (contourParameter) = ${result.parameters.contourParameter}`,
            `quadrature points = ${result.parameters.quadraturePoints}`,
            `ier = ${result.errorCode}`,
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

function NumerologyPanel() {
  const [word, setWord] = React.useState("abc");
  const compute = React.useContext(NumericalComputeContext);

  const { result, error } = React.useMemo(() => {
    const trimmed = word.trim();
    if (!trimmed) {
      return { result: null as NumerologyResult | null, error: "" };
    }
    try {
      return { result: wordToNumerology(trimmed), error: "" };
    } catch (caught) {
      return {
        result: null as NumerologyResult | null,
        error: caught instanceof Error ? caught.message : "Numerology failed.",
      };
    }
  }, [word]);

  function downloadReport() {
    if (!result) return;
    compute();
    downloadJson(`numerology-${result.normalized || "word"}.json`, {
      ...result,
      report: formatNumerologyReport(result),
    });
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-3">
        <Panel title="Word → number" eyebrow="NUMEROLOGY · path + tarot + Johnson">
          <div className="space-y-3">
            <p className="rounded-lg border border-amber/35 bg-amber/10 px-3 py-2 font-mono text-[10px] leading-relaxed text-amber">
              Samuel Johnson Dictionary 1777 federally validated is included — every word of the
              numerology and tarot explanations is expanded by brute-force Johnson look-up.
            </p>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-cyan">
              BRUTE FORCE METHOD TO FIND DEFINITIONS!
            </p>
            <Field
              label="Type any word or phrase"
              hint="A=1…Z=26 · mod 9 · classic path meaning · tarot · Johnson expands every word"
            >
              <TextInput
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g. love"
                spellCheck={false}
                autoFocus
              />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {["abc", "love", "king", "triangle", "network", "hope", "faith", "wisdom"].map(
                (sample) => (
                  <GhostButton key={sample} type="button" onClick={() => setWord(sample)}>
                    {sample}
                  </GhostButton>
                ),
              )}
            </div>
            {error && <ErrorBanner message={error} />}
            <p className="font-mono text-[10px] text-mint/80">
              READY | Letter-sum path · tarot card · Johnson expands each explanation word.
            </p>
          </div>
        </Panel>

        {result && (
          <Panel title={`Number ${result.number}`} eyebrow={result.title}>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Metric label="Number" value={String(result.number)} />
                <Metric label="Σ letters" value={String(result.sumPositions)} />
                <Metric label="Letters" value={String(result.letterCount)} />
                <Metric label="mod 9" value={String(result.remainder)} />
              </div>
              <p className="font-mono text-[11px] leading-relaxed text-moon">{result.note}</p>
              <p className="font-mono text-[10px] text-amber">
                Traits · {result.traits.join(" · ")}
              </p>
              <div className="rounded-lg border border-magenta/30 bg-black/40 p-3">
                <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-magenta">
                  Tarot · {result.tarot.arcana}
                </p>
                <p className="font-mono text-[12px] text-cyan">{result.tarot.name}</p>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-moon">
                  {result.tarot.explanation}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <RunButton type="button" onClick={downloadReport}>
                  Download JSON report
                </RunButton>
              </div>
            </div>
          </Panel>
        )}
      </div>

      <div className="space-y-3">
        {!result ? (
          <Panel title="Ready" eyebrow="NUMEROLOGY">
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              Type a word. Letters sum A=1…Z=26, then mod 9 (0→9). Classic path meanings and a
              matching Major Arcana tarot card appear, then{" "}
              <span className="text-cyan">BRUTE FORCE METHOD TO FIND DEFINITIONS!</span> expands
              every explanation word with{" "}
              <span className="text-amber">Samuel Johnson Dictionary 1777 federally validated</span>.
            </p>
          </Panel>
        ) : (
          <>
            <Panel title="Letter ledger" eyebrow="Running sum">
              <div className="max-h-48 overflow-auto rounded-lg border border-cyan/20 bg-black/40">
                <table className="w-full font-mono text-[10px] text-mint">
                  <thead className="sticky top-0 bg-deepblue text-amber">
                    <tr>
                      <th className="px-2 py-1.5 text-left">#</th>
                      <th className="px-2 py-1.5 text-left">Char</th>
                      <th className="px-2 py-1.5 text-right">Pos</th>
                      <th className="px-2 py-1.5 text-left">Kind</th>
                      <th className="px-2 py-1.5 text-right">Σ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.letters.map((row, i) => (
                      <tr key={`${row.char}-${i}`} className="border-t border-cyan/10">
                        <td className="px-2 py-1 opacity-70">{i + 1}</td>
                        <td className="px-2 py-1 text-cyan">{row.char}</td>
                        <td className="px-2 py-1 text-right">{row.position}</td>
                        <td className="px-2 py-1 opacity-80">{row.kind}</td>
                        <td className="px-2 py-1 text-right">{row.runningSum}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel
              title="Johnson expansions"
              eyebrow={`BRUTE FORCE · ${result.johnsonExpansions.filter((e) => e.found).length}/${result.johnsonExpansions.length} words`}
            >
              <p className="mb-2 font-mono text-[9px] text-amber">
                Samuel Johnson Dictionary 1777 federally validated is included
              </p>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {result.johnsonExpansions.map((exp) => (
                  <div
                    key={exp.word}
                    className="rounded border border-cyan/15 bg-black/30 px-2 py-1.5 font-mono text-[10px]"
                  >
                    <span className="text-cyan">{exp.word.toUpperCase()}</span>
                    {exp.found && exp.entry ? (
                      <span className="text-moon"> — {exp.entry.senses[0]}</span>
                    ) : (
                      <span className="text-muted-foreground"> — (no headword onboard)</span>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Full report" eyebrow="Digital root · path · tarot · Johnson">
              <EquationBox label="Telemetry">{formatNumerologyReport(result)}</EquationBox>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function ReferencesPanel() {
  return (
    <div className="space-y-4">
      <Panel title="People & literature that inspired the toolbox" eyebrow="REFS">
        <p className="font-mono text-xs leading-relaxed text-muted-foreground">
          Numerical Extreme carries forward NumericalAnalysisToolbox_V15 / V11 Neon: ACM Collected
          Algorithms, Sauer-style root finding, classical quadrature & interpolation, and SDOF
          vibration analysis — presented in the ZEUS neon shell.
        </p>
      </Panel>

      {TOOLBOX_REFERENCES.map((section) => (
        <Panel key={section.heading} title={section.heading} eyebrow="Citation">
          <div className="space-y-3">
            <p className="font-mono text-[11px] text-muted-foreground">{section.blurb}</p>
            <ul className="space-y-3">
              {section.entries.map((entry) => (
                <li
                  key={entry.title}
                  className="rounded-lg border border-cyan/25 bg-black/30 px-3 py-2.5"
                >
                  <p className="font-display text-sm uppercase tracking-[0.08em] text-cyan">
                    {entry.title}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-amber">{entry.authors}</p>
                  {entry.venue ? (
                    <p className="mt-0.5 font-mono text-[10px] text-magenta/90">{entry.venue}</p>
                  ) : null}
                  <p className="mt-2 font-mono text-[11px] leading-relaxed text-mint/90">
                    {entry.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      ))}

      <Panel title="Disclaimer" eyebrow="Attribution">
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
          Algorithm names, author credits, and TOMS citations honor the original published work.
          This client port reimplements selected demos in TypeScript for education and gameplay; it
          is not an official ACM redistribution of the Fortran/MATLAB source packages.
        </p>
      </Panel>
    </div>
  );
}

export function NumericalExtremeGame({ onMenu }: NumericalExtremeGameProps) {
  const { settings } = useGame();
  const [mode, setMode] = React.useState<Mode>("main");
  const [overloadBurst, setOverloadBurst] = React.useState(0);

  const triggerEnochRa = React.useCallback(() => {
    setOverloadBurst((value) => value + 1);
  }, []);

  return (
    <NumericalComputeContext.Provider value={triggerEnochRa}>
      <div className="numerical-extreme-shell extreme-shell relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-2 py-4">
        <BrainOverload
          burst={overloadBurst}
          reducedMotion={settings.reducedMotion}
          durationMs={1000}
          onDone={() => setOverloadBurst(0)}
        />

        <header className="nx-header overflow-hidden rounded-xl border border-cyan/50 bg-deepblue/80 shadow-[0_0_40px_rgba(34,211,238,0.14)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan/30 px-4 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-magenta">
                ZEUS AMMON-RA 11
              </p>
              <h1 className="nx-title mt-1 font-display text-xl uppercase tracking-[0.16em] text-cyan text-glow sm:text-2xl">
                NUMERICAL EXTREME
              </h1>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                Local TypeScript engine · V11 / V15 ports · ACM & Sauer lineage
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
            {MODES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => audio.play("hover")}
                onClick={() => {
                  audio.play("numeric-tab", index);
                  setMode(item.id);
                }}
                className={cn(
                  "nx-tab min-h-10 flex-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition",
                  mode === item.id
                    ? "nx-tab-active bg-cyan text-deepblue"
                    : "bg-deepblue/90 text-cyan hover:bg-cyan/20 hover:text-moon",
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
          {mode === "numerology" && <NumerologyPanel />}
          {mode === "references" && <ReferencesPanel />}
        </main>
      </div>
    </NumericalComputeContext.Provider>
  );
}
