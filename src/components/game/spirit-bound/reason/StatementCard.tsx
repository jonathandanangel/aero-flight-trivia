import { motion } from "framer-motion";
import type { AccessMode } from "@/game/spirit-bound/reason/types";
import { cn } from "@/lib/utils";

type Props = {
  source: string;
  statement: string;
  access: AccessMode;
};

export function StatementCard({ source, statement, access }: Props) {
  const size =
    access.textSize === "sm" ? "text-[10px] sm:text-[11px]" : access.textSize === "lg" ? "text-[13px] sm:text-[15px]" : "text-[11px] sm:text-[13px]";
  return (
    <motion.article
      key={statement}
      initial={access.reducedMotion ? false : { y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.22 }}
      className={cn(
        "border-4 px-4 py-4 shadow-[0_0_0_4px_#181010]",
        access.highContrast
          ? "border-white bg-black text-white"
          : "border-game-yellow bg-[#1a1208] text-[#f8f0c8]",
        access.dyslexia && "tracking-wide",
      )}
    >
      <p className="mb-2 text-[8px] tracking-[0.28em] text-game-orange">FIELD REPORT</p>
      <p className={cn("leading-relaxed", size)}>{statement}</p>
      <p className="mt-3 text-[7px] text-[#f8f0c8]/50">{source.replace(/[:.]$/, "")}</p>
    </motion.article>
  );
}
