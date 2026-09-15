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
  height = 280,
  className,
}: ChartProps) {
  const pad = { top: 16, right: 16, bottom: 28, left: 48 };
  const width = 720;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

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
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Numerical chart"
        className="block"
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
            />
          )),
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
