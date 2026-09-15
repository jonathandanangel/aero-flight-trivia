import { motion } from "framer-motion";
import { memo } from "react";
import { allSockets, slotPoint, TREE_H, TREE_W } from "@/game/spirit-bound/shrine/layout";
import type { AccessMode, PegIndex, Pegs } from "@/game/spirit-bound/shrine/types";
import { ParticleBurst } from "./Effects";
import { PuzzleNode } from "./PuzzleNode";

type Props = {
  pegs: Pegs;
  target: boolean;
  selected: PegIndex | null;
  correctMask: boolean[];
  shakePeg: PegIndex | null;
  burstKey: number;
  burstPeg: PegIndex | null;
  access: AccessMode;
  onSelect: (peg: PegIndex) => void;
};

const LINE = "#2f6b6b";
const EMPTY_TRI = "0,-10 10,6 -10,6";

export const GameBoard = memo(function GameBoard({
  pegs,
  target,
  selected,
  correctMask,
  shakePeg,
  burstKey,
  burstPeg,
  access,
  onSelect,
}: Props) {
  return (
    <motion.svg
      viewBox={`0 0 ${TREE_W} ${TREE_H}`}
      className="h-auto w-full max-h-[280px] bg-[#071616]"
      role={target ? "img" : "group"}
      aria-label={target ? "Target tree mural" : "Current relic tree"}
      animate={
        !access.reducedMotion && shakePeg !== null
          ? { x: [0, -4, 4, -3, 3, 0] }
          : { x: 0 }
      }
      transition={{ duration: access.reducedMotion ? 0 : 0.28 }}
    >
      <line x1="100" y1="12" x2="100" y2="166" stroke={LINE} strokeWidth="6" strokeLinecap="square" />
      <line x1="58" y1="28" x2="142" y2="28" stroke={LINE} strokeWidth="6" strokeLinecap="square" />
      <line x1="58" y1="68" x2="142" y2="68" stroke={LINE} strokeWidth="6" strokeLinecap="square" />
      <line x1="58" y1="108" x2="142" y2="108" stroke={LINE} strokeWidth="6" strokeLinecap="square" />
      <line x1="34" y1="148" x2="166" y2="148" stroke={LINE} strokeWidth="6" strokeLinecap="square" />
      <line x1="100" y1="166" x2="100" y2="174" stroke={LINE} strokeWidth="6" />

      {allSockets().map(({ peg, height, label }) => {
        const pt = slotPoint(peg, height);
        const stack = pegs[peg];
        const pieceId = stack[height];
        const isTip = pieceId !== undefined && height === stack.length - 1;
        const occupied = pieceId !== undefined;
        return (
          <g
            key={`${peg}-${height}`}
            transform={`translate(${pt.x} ${pt.y})`}
            onClick={() => {
              if (!target) onSelect(peg);
            }}
            style={{ cursor: target ? "default" : "pointer" }}
          >
            {!occupied ? (
              <polygon
                points={EMPTY_TRI}
                fill="#071616"
                stroke={selected === peg ? "#ff2d95" : LINE}
                strokeWidth="2"
                {...(label === 0 ? { strokeDasharray: "2 2" } : {})}
              />
            ) : (
              <PuzzleNode
                pieceId={pieceId}
                correct={target ? true : Boolean(correctMask[pieceId])}
                selected={!target && selected === peg && isTip}
                preview={target}
                access={access}
              />
            )}
            {!target && burstPeg === peg && isTip ? (
              <foreignObject x={-16} y={-16} width="32" height="32">
                <ParticleBurst burstKey={burstKey} reducedMotion={access.reducedMotion} />
              </foreignObject>
            ) : null}
          </g>
        );
      })}
    </motion.svg>
  );
});
