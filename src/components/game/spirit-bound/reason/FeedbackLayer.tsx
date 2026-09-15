import { AnimatePresence, motion } from "framer-motion";
import { comboLabel } from "@/game/spirit-bound/reason/scoring";
import type { AccessMode } from "@/game/spirit-bound/reason/types";
import type { Feedback } from "@/hooks/useReasonGame";

type Props = {
  feedback: Feedback | null;
  access: AccessMode;
};

export function FeedbackLayer({ feedback, access }: Props) {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          key={feedback.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-10"
        >
          <div
            className="absolute inset-0"
            style={{
              background: feedback.correct ? "rgba(56,192,96,0.22)" : "rgba(232,72,72,0.28)",
              mixBlendMode: "screen",
            }}
          />
          {!feedback.correct && !access.reducedMotion && (
            <div className="absolute inset-0 animate-pulse bg-[repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(232,72,72,0.18)_6px,rgba(232,72,72,0.18)_8px)]" />
          )}
          {feedback.rankUp && (
            <p className="absolute left-1/2 top-8 -translate-x-1/2 border-2 border-game-yellow bg-game-bg px-3 py-2 text-[10px] text-game-yellow">
              {comboLabel(feedback.rankUp)}
            </p>
          )}
          {feedback.legendary && (
            <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[12px] text-game-yellow">
              ▲ LEGENDARY STREAK ▲
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
