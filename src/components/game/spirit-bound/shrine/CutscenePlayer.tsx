import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = {
  lines: string[];
  title: string;
  prompt?: string;
  reducedMotion: boolean;
  zoom?: boolean;
  tense?: boolean;
  onDone: () => void;
};

export function CutscenePlayer({
  lines,
  title,
  prompt = "Z / ENTER / TAP",
  reducedMotion,
  zoom,
  tense,
  onDone,
}: Props) {
  const [idx, setIdx] = useState(0);
  const line = lines[idx] ?? "";

  useEffect(() => {
    const advance = (e?: KeyboardEvent) => {
      if (e && !["z", "Z", "Enter", " "].includes(e.key)) return;
      e?.preventDefault();
      if (idx + 1 < lines.length) setIdx(idx + 1);
      else onDone();
    };
    const onKey = (e: KeyboardEvent) => advance(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, lines.length, onDone]);

  return (
    <button
      type="button"
      className="absolute inset-0 z-20 flex flex-col justify-end text-left"
      onClick={() => {
        if (idx + 1 < lines.length) setIdx(idx + 1);
        else onDone();
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: tense ? "#180808" : "#102010" }}
        initial={reducedMotion ? false : { scale: zoom ? 1.4 : 1, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 0.55 }}
        transition={{ duration: reducedMotion ? 0 : 0.8 }}
      />
      {!reducedMotion && zoom && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 text-[72px] text-game-yellow/80"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          ▲
        </motion.div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="relative m-3 border-4 border-game-yellow bg-[#201808] p-4 shadow-[0_0_0_4px_#181010]"
          initial={reducedMotion ? false : { y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reducedMotion ? { opacity: 1 } : { y: 8, opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="mb-2 text-[9px] text-game-yellow">{title}</div>
          <p className="min-h-[3.4em] text-[10px] leading-relaxed text-[#f8f0c8] sm:text-[11px]">
            {line}
          </p>
          <div className="mt-2 text-right text-[8px] text-game-yellow/70">
            {idx + 1}/{lines.length} · {prompt}
          </div>
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
