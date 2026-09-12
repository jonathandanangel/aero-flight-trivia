import * as React from "react";
import type { DiagramTarget, DiagramType } from "@/game/types";
import { cn } from "@/lib/utils";

/**
 * Hand-authored parametric SVG diagrams. No external images are required,
 * so every diagram-based question stays playable offline and on keyboard.
 */

const airfoilPath = (camber: number, thickness: number) => {
  // Simple NACA-like outline generated from camber + thickness in viewBox units.
  const pts: string[] = [];
  const upper: string[] = [];
  const lower: string[] = [];
  for (let i = 0; i <= 40; i += 1) {
    const x = i / 40;
    const yt =
      thickness *
      (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4);
    const yc = camber * (x < 0.4 ? (x / 0.4) * (2 - x / 0.4) : ((1 - x) / 0.6) * (1 + x / 0.6));
    const px = 40 + x * 320;
    upper.push(`${px.toFixed(1)},${(110 - (yc + yt) * 240).toFixed(1)}`);
    lower.push(`${px.toFixed(1)},${(110 - (yc - yt) * 240).toFixed(1)}`);
  }
  pts.push(...upper, ...lower.reverse());
  return `M ${pts.join(" L ")} Z`;
};

function Axes() {
  return (
    <g opacity={0.35}>
      <line x1="20" y1="200" x2="380" y2="200" stroke="var(--color-flight)" strokeWidth="1" />
      <line x1="20" y1="200" x2="20" y2="20" stroke="var(--color-flight)" strokeWidth="1" />
    </g>
  );
}

function FlowArrows({ y = 40, count = 4 }: { y?: number; count?: number }) {
  return (
    <g stroke="var(--color-cyan)" strokeWidth="1.5" opacity={0.7}>
      {Array.from({ length: count }).map((_, i) => (
        <g key={i}>
          <line x1="4" y1={y + i * 40} x2="36" y2={y + i * 40} />
          <polyline points={`30,${y + i * 40 - 4} 36,${y + i * 40} 30,${y + i * 40 + 4}`} fill="none" />
        </g>
      ))}
    </g>
  );
}

function Shape({ type }: { type: DiagramType }) {
  const stroke = "var(--color-cyan)";
  switch (type) {
    case "airfoil-geometry":
    case "airfoil-pressure":
    case "airfoil-forces":
    case "airfoil-shear":
    case "airfoil-camber":
    case "aerodynamic-center":
    case "center-of-pressure":
      return (
        <g>
          <FlowArrows />
          <path d={airfoilPath(0.045, 0.12)} fill="var(--color-secondary)" stroke={stroke} strokeWidth="2" />
          <line x1="40" y1="110" x2="360" y2="110" stroke="var(--color-amber)" strokeDasharray="6 5" strokeWidth="1.2" />
          {type === "airfoil-camber" && (
            <path d="M 40 110 Q 160 78 360 110" fill="none" stroke="var(--color-mint)" strokeWidth="1.6" strokeDasharray="4 4" />
          )}
          {type === "airfoil-forces" && (
            <g stroke="var(--color-magenta)" strokeWidth="2" fill="none">
              <line x1="180" y1="100" x2="180" y2="30" />
              <polyline points="174,40 180,28 186,40" />
              <line x1="180" y1="100" x2="270" y2="100" />
              <polyline points="260,94 272,100 260,106" />
            </g>
          )}
          {type === "airfoil-pressure" && (
            <g stroke="var(--color-magenta)" strokeWidth="1.4" opacity={0.85}>
              {[80, 130, 180, 230, 280].map((x, i) => (
                <line key={x} x1={x} y1={92 - i * 4} x2={x} y2={60 - i * 6} />
              ))}
            </g>
          )}
          {type === "airfoil-shear" && (
            <g stroke="var(--color-mint)" strokeWidth="1.4">
              {[90, 140, 190, 240, 290].map((x) => (
                <line key={x} x1={x} y1={96} x2={x + 22} y2={94} />
              ))}
            </g>
          )}
        </g>
      );
    case "airfoil-symmetric":
      return (
        <g>
          <FlowArrows />
          <path d={airfoilPath(0, 0.13)} fill="var(--color-secondary)" stroke={stroke} strokeWidth="2" />
          <line x1="40" y1="110" x2="360" y2="110" stroke="var(--color-amber)" strokeDasharray="6 5" />
        </g>
      );
    case "boundary-layer":
    case "velocity-profile":
      return (
        <g>
          <rect x="30" y="180" width="340" height="16" fill="var(--color-secondary)" stroke={stroke} />
          <path d="M 30 180 Q 200 130 370 108" fill="none" stroke="var(--color-mint)" strokeWidth="2" strokeDasharray="5 4" />
          {[90, 170, 250, 330].map((x, i) => (
            <g key={x} stroke="var(--color-cyan)" strokeWidth="1.3">
              {Array.from({ length: 6 }).map((_, k) => {
                const h = 180 - k * (10 + i * 2);
                const len = 8 + k * (12 + i * 2);
                return <line key={k} x1={x} y1={h} x2={x + len} y2={h} />;
              })}
              <line x1={x} y1={180} x2={x} y2={180 - 5 * (10 + i * 2)} stroke="var(--color-amber)" />
            </g>
          ))}
        </g>
      );
    case "cylinder-flow":
    case "cylinder-separation":
      return (
        <g>
          <FlowArrows y={60} count={3} />
          <circle cx="190" cy="120" r="58" fill="var(--color-secondary)" stroke={stroke} strokeWidth="2" />
          <path d="M 44 60 Q 190 40 360 58" fill="none" stroke="var(--color-cyan)" opacity={0.6} />
          <path d="M 44 180 Q 190 200 360 182" fill="none" stroke="var(--color-cyan)" opacity={0.6} />
          {type === "cylinder-separation" && (
            <g stroke="var(--color-orange)" strokeWidth="1.6" fill="none">
              <path d="M 236 84 Q 300 110 360 96" />
              <path d="M 236 156 Q 300 130 360 146" />
              <circle cx="290" cy="120" r="14" strokeDasharray="4 3" />
              <circle cx="325" cy="126" r="9" strokeDasharray="4 3" />
            </g>
          )}
        </g>
      );
    case "aircraft-forces":
      return (
        <g>
          <g transform="translate(400 0) scale(-1 1)" fill="var(--color-secondary)" stroke={stroke} strokeWidth="2">
            <ellipse cx="200" cy="120" rx="96" ry="16" />
            <path d="M 180 118 L 210 60 L 226 60 L 214 118 Z" />
            <path d="M 170 122 L 150 172 L 168 172 L 200 126 Z" />
            <path d="M 112 112 L 92 82 L 104 82 L 130 110 Z" />
          </g>
          <g stroke="var(--color-magenta)" strokeWidth="2.5" fill="none">
            <line x1="200" y1="104" x2="200" y2="36" />
            <polyline points="193,48 200,34 207,48" />
            <line x1="200" y1="136" x2="200" y2="204" />
            <polyline points="193,192 200,206 207,192" />
            <line x1="296" y1="120" x2="366" y2="120" />
            <polyline points="354,113 368,120 354,127" />
            <line x1="104" y1="120" x2="34" y2="120" />
            <polyline points="46,113 32,120 46,127" />
          </g>
        </g>
      );
    case "stream-tube":
      return (
        <g>
          <path d="M 40 60 Q 190 96 360 84" fill="none" stroke={stroke} strokeWidth="2" />
          <path d="M 40 180 Q 190 148 360 158" fill="none" stroke={stroke} strokeWidth="2" />
          <line x1="40" y1="60" x2="40" y2="180" stroke="var(--color-amber)" strokeDasharray="5 4" />
          <line x1="360" y1="84" x2="360" y2="158" stroke="var(--color-amber)" strokeDasharray="5 4" />
          <FlowArrows y={110} count={1} />
        </g>
      );
    case "mach-cone":
      return (
        <g>
          <line x1="20" y1="120" x2="380" y2="120" stroke="var(--color-flight)" opacity={0.4} />
          <polygon points="300,120 60,40 60,200" fill="var(--color-secondary)" stroke="var(--color-magenta)" strokeWidth="2" />
          <circle cx="300" cy="120" r="8" fill="var(--color-cyan)" />
          {[40, 80, 120, 160].map((r) => (
            <circle key={r} cx={300 - r} cy="120" r={r * 0.72} fill="none" stroke="var(--color-cyan)" opacity={0.35} />
          ))}
        </g>
      );
    case "wing-3d":
      return (
        <g fill="var(--color-secondary)" stroke={stroke} strokeWidth="2">
          <polygon points="60,180 300,120 360,132 120,200" />
          <polyline points="60,180 80,150 320,96 300,120" fill="none" />
          <line x1="80" y1="150" x2="320" y2="96" strokeDasharray="4 4" opacity={0.6} />
        </g>
      );
    case "atmospheric-flight":
      return (
        <g>
          <rect x="20" y="20" width="360" height="180" fill="var(--color-secondary)" opacity={0.35} />
          {[60, 100, 140, 180].map((y, i) => (
            <line key={y} x1="20" y1={y} x2="380" y2={y} stroke="var(--color-cyan)" opacity={0.15 + i * 0.1} />
          ))}
          <g fill="var(--color-cyan)">
            <ellipse cx="180" cy="90" rx="42" ry="7" />
            <path d="M 168 88 L 190 58 L 200 58 L 190 88 Z" />
          </g>
        </g>
      );
    case "ht-solid-contact":
      return (
        <g>
          <rect x="40" y="60" width="140" height="100" fill="color-mix(in srgb, var(--color-orange) 55%, transparent)" stroke={stroke} strokeWidth="2" />
          <rect x="180" y="60" width="140" height="100" fill="color-mix(in srgb, var(--color-cyan) 45%, transparent)" stroke={stroke} strokeWidth="2" />
          <text x="110" y="50" textAnchor="middle" fill="var(--color-amber)" fontSize="11">HOT</text>
          <text x="250" y="50" textAnchor="middle" fill="var(--color-cyan)" fontSize="11">COOL</text>
          <line x1="150" y1="110" x2="210" y2="110" stroke="var(--color-magenta)" strokeWidth="3" />
          <polyline points="200,102 214,110 200,118" fill="none" stroke="var(--color-magenta)" strokeWidth="3" />
        </g>
      );
    case "ht-liquid-convection":
      return (
        <g>
          <rect x="40" y="50" width="320" height="120" fill="color-mix(in srgb, var(--color-cyan) 18%, transparent)" stroke={stroke} />
          <rect x="150" y="80" width="80" height="60" fill="var(--color-secondary)" stroke="var(--color-orange)" strokeWidth="2" />
          <text x="190" y="115" textAnchor="middle" fill="var(--color-amber)" fontSize="10">HOT</text>
          {[70, 100, 130].map((y) => (
            <g key={y} stroke="var(--color-mint)" strokeWidth="1.5">
              <line x1="50" y1={y} x2="140" y2={y} />
              <polyline points={`132,${y - 4} 142,${y} 132,${y + 4}`} fill="none" />
              <line x1="240" y1={y} x2="340" y2={y} />
              <polyline points={`330,${y - 4} 340,${y} 330,${y + 4}`} fill="none" />
            </g>
          ))}
        </g>
      );
    case "ht-air-multimode":
      return (
        <g>
          <rect x="40" y="40" width="320" height="140" fill="none" stroke={stroke} strokeDasharray="6 4" />
          <rect x="160" y="90" width="70" height="50" fill="var(--color-secondary)" stroke="var(--color-orange)" strokeWidth="2" />
          <text x="195" y="120" textAnchor="middle" fill="var(--color-amber)" fontSize="10">HOT</text>
          <path d="M 195 85 Q 210 60 250 55" fill="none" stroke="var(--color-mint)" strokeWidth="2" />
          <text x="258" y="52" fill="var(--color-mint)" fontSize="9">air</text>
          <path d="M 235 100 Q 300 80 330 70" fill="none" stroke="var(--color-magenta)" strokeWidth="2" strokeDasharray="3 3" />
          <text x="300" y="66" fill="var(--color-magenta)" fontSize="9">walls</text>
        </g>
      );
    case "ht-vacuum-radiation":
      return (
        <g>
          <rect x="50" y="40" width="300" height="140" fill="none" stroke={stroke} strokeWidth="2" />
          <text x="200" y="58" textAnchor="middle" fill="var(--color-cyan)" fontSize="10">EVACUATED</text>
          <circle cx="200" cy="115" r="28" fill="var(--color-secondary)" stroke="var(--color-orange)" strokeWidth="2" />
          <text x="200" y="119" textAnchor="middle" fill="var(--color-amber)" fontSize="9">HOT</text>
          {[0, 1, 2, 3].map((i) => {
            const a = (i * Math.PI) / 2;
            const x2 = 200 + Math.cos(a) * 90;
            const y2 = 115 + Math.sin(a) * 55;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * 34}
                y1={115 + Math.sin(a) * 34}
                x2={x2}
                y2={y2}
                stroke="var(--color-magenta)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            );
          })}
        </g>
      );
    case "ht-plane-wall":
      return (
        <g>
          <defs>
            <linearGradient id="htWallGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-orange)" />
              <stop offset="100%" stopColor="var(--color-cyan)" />
            </linearGradient>
          </defs>
          <rect x="80" y="50" width="240" height="120" fill="url(#htWallGrad)" stroke={stroke} strokeWidth="2" />
          <text x="100" y="40" fill="var(--color-amber)" fontSize="10">HIGH T</text>
          <text x="280" y="40" fill="var(--color-cyan)" fontSize="10">LOW T</text>
          <line x1="120" y1="110" x2="280" y2="110" stroke="var(--color-magenta)" strokeWidth="3" />
          <polyline points="268,102 284,110 268,118" fill="none" stroke="var(--color-magenta)" strokeWidth="3" />
          <line x1="280" y1="140" x2="120" y2="140" stroke="var(--color-flight)" strokeWidth="2" opacity={0.5} />
          <line x1="200" y1="70" x2="200" y2="50" stroke="var(--color-mint)" strokeWidth="2" opacity={0.6} />
        </g>
      );
    case "ht-thermal-boundary":
      return (
        <g>
          <rect x="40" y="160" width="320" height="20" fill="var(--color-secondary)" stroke="var(--color-orange)" />
          <text x="200" y="175" textAnchor="middle" fill="var(--color-amber)" fontSize="10">Ts</text>
          <path d="M 40 160 Q 200 90 360 70" fill="none" stroke="var(--color-mint)" strokeWidth="2" />
          <text x="340" y="64" fill="var(--color-cyan)" fontSize="10">T∞</text>
          {[100, 180, 260].map((x) => (
            <g key={x} stroke="var(--color-cyan)" strokeWidth="1.2">
              <line x1={x} y1="150" x2={x + 40} y2="150" />
              <polyline points={`${x + 32},146 ${x + 42},150 ${x + 32},154`} fill="none" />
            </g>
          ))}
        </g>
      );
    case "ht-control-volume":
      return (
        <g>
          <rect x="90" y="55" width="220" height="120" fill="none" stroke="var(--color-amber)" strokeWidth="2" strokeDasharray="7 5" />
          <rect x="130" y="85" width="140" height="70" fill="var(--color-secondary)" stroke={stroke} strokeWidth="2" />
          <text x="200" y="125" textAnchor="middle" fill="var(--color-moon)" fontSize="10">SOLID</text>
          <line x1="50" y1="120" x2="130" y2="120" stroke="var(--color-mint)" strokeWidth="2" />
          <text x="55" y="112" fill="var(--color-mint)" fontSize="9">P_elec</text>
          <path d="M 270 100 Q 330 80 350 60" fill="none" stroke="var(--color-magenta)" strokeWidth="2" />
          <text x="310" y="72" fill="var(--color-magenta)" fontSize="9">q_rad</text>
          <path d="M 270 130 Q 330 140 350 150" fill="none" stroke="var(--color-cyan)" strokeWidth="2" />
          <text x="310" y="158" fill="var(--color-cyan)" fontSize="9">q_conv</text>
          <text x="200" y="48" textAnchor="middle" fill="var(--color-amber)" fontSize="9">T rising</text>
        </g>
      );
    default:
      return (
        <g>
          <circle cx="200" cy="115" r="66" fill="none" stroke={stroke} strokeWidth="2" strokeDasharray="8 6" />
          <path
            d="M 200 70 C 226 104 238 122 238 138 A 38 38 0 0 1 162 138 C 162 122 174 104 200 70 Z"
            fill="var(--color-secondary)"
            stroke="var(--color-mint)"
            strokeWidth="2"
          />
        </g>
      );
  }
}

export interface DiagramProps {
  type: DiagramType;
  targets?: DiagramTarget[];
  /** Highlighted target ids (selected / answered). */
  selected?: string[];
  labels?: Record<string, string>;
  onTargetClick?: ((id: string) => void) | undefined;
  correctId?: string;
  revealed?: boolean;
  className?: string;
}

export function Diagram({
  type,
  targets = [],
  selected = [],
  labels = {},
  onTargetClick,
  correctId,
  revealed = false,
  className,
}: DiagramProps) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-lg border border-border bg-deepblue/60", className)}>
      <svg viewBox="0 0 400 220" className="block w-full" role="img" aria-label={`${type} diagram`}>
        <Axes />
        <Shape type={type} />
      </svg>
      {targets.map((t) => {
        const isSelected = selected.includes(t.id);
        const isCorrect = revealed && correctId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTargetClick?.(t.id)}
            disabled={!onTargetClick}
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
            aria-label={t.label}
            aria-pressed={isSelected}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
              "border-cyan/60 bg-midnight/80 text-cyan",
              isSelected && "border-mint bg-mint/25 text-mint glow-mint",
              isCorrect && "border-mint bg-mint/40 text-moon",
              onTargetClick && "hover:bg-cyan/25",
            )}
          >
            {labels[t.id] ?? "◎"}
          </button>
        );
      })}
    </div>
  );
}
