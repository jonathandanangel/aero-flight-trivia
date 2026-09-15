import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";

type Props = {
  burstKey: number;
  reducedMotion: boolean;
};

export const ParticleBurst = memo(function ParticleBurst({ burstKey, reducedMotion }: Props) {
  if (reducedMotion) return null;
  const crumbs = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <AnimatePresence>
      <div key={burstKey} className="pointer-events-none absolute inset-0 overflow-hidden">
        {crumbs.map((i) => (
          <motion.span
            key={`${burstKey}-${i}`}
            className="absolute left-1/2 top-1/2 text-[8px] text-game-yellow"
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos((i / 8) * Math.PI * 2) * 28,
              y: Math.sin((i / 8) * Math.PI * 2) * 22,
              scale: 0.3,
            }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            ▲
          </motion.span>
        ))}
      </div>
    </AnimatePresence>
  );
});
