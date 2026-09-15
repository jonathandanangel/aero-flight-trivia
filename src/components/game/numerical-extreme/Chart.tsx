import * as React from "react";
import { formatNumber } from "@/game/numerical-extreme";
import { cn } from "@/lib/utils";

export type ChartSeries = {
  key: string;
  label: string;
  values: Array<number | null>;
  color: string;
};

export interface ChartProps {
  x: number[];
  series: ChartSeries[];
  referenceX?: number[];
  referenceY?: number;
  /** Extra inspect / seed markers drawn on the chart. */
  markers?: Array<{ x: number; y: number; color?: string; label?: string }>;
  /** Snap click to nearest finite sample of the first series and report it. */
  onPointClick?: (point: { x: number; y: number; index: number }) => void;
  height?: number;
  className?: string;
}

function buildPolyline(
  xs: number[],
  ys: Array<number | null>,
  mapX: (v: number) => number,
  mapY: (v: number) => number,
): string[] {
  const segments: string[] = [];
  let current: string[] = [];
  for (let i = 0; i < xs.length; i += 1) {
    const y = ys[i];
    if (y === null || y === undefined || !Number.isFinite(y) || !Number.isFinite(xs[i]!)) {
      if (current.length) {
        segments.push(current.join(" "));
        current = [];
      }
      continue;
    }
    current.push(`${mapX(xs[i]!)},${mapY(y)}`);
  }
  if (current.length) segments.push(current.join(" "));
  return segments;
}

export function Chart({
  x,
  series,
  referenceX = [],
  referenceY,
  markers = [],
  onPointClick,
  height = 280,
  className,
}: ChartProps) {
  const pad = { top: 16, right: 16, bottom: 28, left: 48 };
  const width = 720;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  const finiteX = x.filter((v) => Number.isFinite(v));
  const finiteY = series.flatMap((s) =>
    s.values.filter((v): v is number => v !== null && Number.isFinite(v)),
  );

  const xMin = finiteX.length ? Math.min(...finiteX) : 0;
  const xMax = finiteX.length ? Math.max(...finiteX) : 1;
  let yMin = finiteY.length ? Math.min(...finiteY) : 0;
  let yMax = finiteY.length ? Math.max(...finiteY) : 1;
  if (referenceY !== undefined) {
    yMin = Math.min(yMin, referenceY);
    yMax = Math.max(yMax, referenceY);
  }
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  if (xMin === xMax) {
    // avoid zero span
  }
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;

  const mapX = (v: number) => pad.left + ((v - xMin) / xSpan) * innerW;
  const mapY = (v: number) => pad.top + ((yMax - v) / ySpan) * innerH;

  function handlePointer(event: React.MouseEvent<SVGSVGElement>) {
    if (!onPointClick || !svgRef.current || !series[0]) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    const dataX = xMin + ((px - pad.left) / innerW) * xSpan;
    if (!Number.isFinite(dataX)) return;

    let bestIndex = -1;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < x.length; i += 1) {
      const y = series[0]!.values[i];
      if (y === null || y === undefined || !Number.isFinite(y) || !Number.isFinite(x[i]!)) {
        continue;
      }
      const dist = Math.abs(x[i]! - dataX);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    if (bestIndex < 0) return;
    const y = series[0]!.values[bestIndex];
    if (y === null || y === undefined || !Number.isFinite(y)) return;
    onPointClick({ x: x[bestIndex]!, y, index: bestIndex });
  }

  const xTicks = [xMin, xMin + xSpan / 2, xMax];
  const yTicks = [yMin, yMin + ySpan / 2, yMax];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-cyan/30 bg-deepblue/60",
        className,
      )}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Numerical chart"
        className={cn("block", onPointClick && "cursor-crosshair")}
        onClick={onPointClick ? handlePointer : undefined}
      >
        <defs>
          <linearGradient id="ne-chart-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.08)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>

        <rect
          x={pad.left}
          y={pad.top}
          width={innerW}
          height={innerH}
          fill="url(#ne-chart-fade)"
        />

        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={pad.left}
              x2={pad.left + innerW}
              y1={mapY(tick)}
              y2={mapY(tick)}
              stroke="rgba(34,211,238,0.12)"
              strokeDasharray="3 5"
            />
            <text
              x={pad.left - 8}
              y={mapY(tick) + 3}
              textAnchor="end"
              className="fill-muted-foreground"
              style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}
            >
              {formatNumber(tick, 3)}
            </text>
          </g>
        ))}

        {xTicks.map((tick) => (
          <g key={`x-${tick}`}>
            <line
              x1={mapX(tick)}
              x2={mapX(tick)}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="rgba(34,211,238,0.08)"
              strokeDasharray="3 5"
            />
            <text
              x={mapX(tick)}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}
            >
              {formatNumber(tick, 3)}
            </text>
          </g>
        ))}

        {referenceY !== undefined && (
          <line
            x1={pad.left}
            x2={pad.left + innerW}
            y1={mapY(referenceY)}
            y2={mapY(referenceY)}
            stroke="rgba(148,163,184,0.55)"
            strokeDasharray="4 5"
          />
        )}

        {referenceX.map((rx) =>
          Number.isFinite(rx) ? (
            <line
              key={`rx-${rx}`}
              x1={mapX(rx)}
              x2={mapX(rx)}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="#f59e0b"
              strokeOpacity={0.75}
              strokeDasharray="3 4"
            />
          ) : null,
        )}

        {series.map((item) =>
          buildPolyline(x, item.values, mapX, mapY).map((points, idx) => (
            <polyline
              key={`${item.key}-${idx}`}
              fill="none"
              stroke={item.color}
              strokeWidth={2}
              points={points}
              strokeLinejoin="round"
              strokeLinecap="round"
              pointerEvents="none"
            />
          )),
        )}

        {markers.map((marker, idx) =>
          Number.isFinite(marker.x) && Number.isFinite(marker.y) ? (
            <g key={`mk-${idx}-${marker.x}`} pointerEvents="none">
              <circle
                cx={mapX(marker.x)}
                cy={mapY(marker.y)}
                r={4.5}
                fill={marker.color ?? "#f472b6"}
                stroke="#0b1220"
                strokeWidth={1}
              />
              {marker.label ? (
                <text
                  x={mapX(marker.x) + 6}
                  y={mapY(marker.y) - 6}
                  className="fill-moon"
                  style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}
                >
                  {marker.label}
                </text>
              ) : null}
            </g>
          ) : null,
        )}

        {series.length > 1 &&
          series.map((item, index) => (
            <g key={`leg-${item.key}`} transform={`translate(${pad.left + index * 110}, 10)`}>
              <line x1={0} y1={0} x2={16} y2={0} stroke={item.color} strokeWidth={2} />
              <text
                x={20}
                y={3}
                className="fill-moon"
                style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}
              >
                {item.label}
              </text>
            </g>
          ))}
      </svg>
    </div>
  );
}
