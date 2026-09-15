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

export const PuzzleNode = memo(function PuzzleNode({
  pieceId,
  correct,
  selected,
  preview,
  access,
}: Props) {
  const piece = PIECES[pieceId];
  if (!piece) return null;

  const fill = selected
    ? "#f8d030"
    : correct
      ? access.highContrast
        ? "#3dff6a"
        : "#2ecc71"
      : access.highContrast
        ? "#ff4d4d"
        : "#e74c3c";
  const text = selected || access.colorblind ? "#102018" : "#f7fff8";
  const r = preview ? 11 : 14;

  return (
    <motion.g
      aria-label={`Relic ${piece.label}${correct ? ", aligned" : ", unaligned"}`}
      animate={
        access.reducedMotion
          ? { scale: 1 }
          : selected
            ? { scale: [1, 1.12, 1] }
            : { scale: 1 }
      }
      transition={
        access.reducedMotion
          ? { duration: 0 }
          : selected
            ? { repeat: Infinity, duration: 0.85, ease: "easeInOut" }
            : { type: "spring", stiffness: 420, damping: 28 }
      }
    >
      {selected ? <circle r={r + 5} fill="none" stroke="#f8d030" strokeWidth="3" /> : null}
      <circle
        r={r}
        fill={fill}
        stroke={selected ? "#fff4b0" : "#0b1c1c"}
        strokeWidth={selected ? 2 : 1.5}
        style={{
          filter: selected
            ? "drop-shadow(0 0 6px #f8d030)"
            : correct
              ? "drop-shadow(0 0 5px #2ecc71)"
              : "drop-shadow(0 0 5px #e74c3c)",
        }}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill={text}
        fontSize={preview ? 9 : 11}
        fontFamily='"Press Start 2P", ui-monospace, monospace'
        style={{ pointerEvents: "none" }}
      >
        {piece.label}
      </text>
    </motion.g>
  );
});
