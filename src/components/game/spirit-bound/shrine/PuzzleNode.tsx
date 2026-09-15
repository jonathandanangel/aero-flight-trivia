import { motion } from "framer-motion";
import { memo } from "react";
import { PIECES, type AccessMode } from "@/game/spirit-bound/shrine/types";

type Props = {
  pieceId: number;
  correct: boolean;
  selected: boolean;
  preview: boolean;
  access: AccessMode;
};

const NEON = ["#ff2d95", "#ffea00", "#39ff14", "#00f5ff", "#bf00ff", "#ff2d95"] as const;
const NEON_HOLD = NEON[0];
const GOLD_FILL = "#f4c430";
const GOLD_DEEP = "#c9a227";
const GOLD_EDGE = "#ffe566";

function trianglePoints(size: number): string {
  const h = size * 1.15;
  return `0,${-h} ${size},${h * 0.55} ${-size},${h * 0.55}`;
}

export const PuzzleNode = memo(function PuzzleNode({
  pieceId,
  correct,
  selected,
  preview,
  access,
}: Props) {
  const piece = PIECES[pieceId];
  if (!piece) return null;

  const size = preview ? 11 : 14;
  const placedFill = correct ? GOLD_FILL : access.highContrast ? "#ff4d4d" : "#e74c3c";
  const placedStroke = correct ? GOLD_DEEP : "#5a1010";
  const text = selected || access.colorblind ? "#1a1200" : correct ? "#2a1a00" : "#f7fff8";

  return (
    <motion.g
      aria-label={`Relic ${piece.label}${correct ? ", aligned" : ", unaligned"}`}
      animate={
        access.reducedMotion
          ? { scale: 1 }
          : selected
            ? { scale: [1, 1.14, 1] }
            : { scale: 1 }
      }
      transition={
        access.reducedMotion
          ? { duration: 0 }
          : selected
            ? { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
            : { type: "spring", stiffness: 420, damping: 28 }
      }
    >
      {selected ? (
        <motion.polygon
          points={trianglePoints(size + 5)}
          fill="none"
          strokeWidth="3"
          animate={access.reducedMotion ? { stroke: NEON_HOLD } : { stroke: [...NEON] }}
          transition={
            access.reducedMotion ? { duration: 0 } : { repeat: Infinity, duration: 1.1, ease: "linear" }
          }
        />
      ) : null}
      <motion.polygon
        points={trianglePoints(size)}
        strokeWidth={selected ? 2.5 : 1.75}
        animate={
          selected
            ? access.reducedMotion
              ? { fill: NEON_HOLD, stroke: "#ffffff" }
              : { fill: [...NEON], stroke: ["#ffffff", GOLD_EDGE, "#00f5ff", "#ffffff"] }
            : {
                fill: placedFill,
                stroke: placedStroke,
              }
        }
        transition={
          selected && !access.reducedMotion
            ? { repeat: Infinity, duration: 1.05, ease: "linear" }
            : { duration: access.reducedMotion ? 0 : 0.18 }
        }
        style={{
          filter: selected
            ? "drop-shadow(0 0 8px #ff2d95) drop-shadow(0 0 6px #00f5ff)"
            : correct
              ? "drop-shadow(0 0 6px #f4c430) drop-shadow(0 0 3px #ffe566)"
              : "drop-shadow(0 0 5px #e74c3c)",
        }}
      />
      {/* Inner gold facet for resting triangles */}
      {!selected && correct ? (
        <polygon
          points={trianglePoints(size * 0.42)}
          fill={GOLD_EDGE}
          opacity={0.55}
          style={{ pointerEvents: "none" }}
        />
      ) : null}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        y={preview ? 2 : 3}
        fill={text}
        fontSize={preview ? 8 : 10}
        fontFamily='"Press Start 2P", ui-monospace, monospace'
        style={{ pointerEvents: "none" }}
      >
        {piece.label}
      </text>
    </motion.g>
  );
});
