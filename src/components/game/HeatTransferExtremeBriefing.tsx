import * as React from "react";
import { audio } from "@/game/audio";
import {
  HT_BRIEFING_OUTRO_IMAGE,
  HT_BRIEFING_SLIDES,
} from "@/data/ht-briefing-slides";

const SECONDS = 30;
const ACCENT = "#ff2a2a";

export interface HeatTransferExtremeBriefingProps {
  reducedMotion?: boolean;
  onComplete: () => void;
}

type Stage = "slides" | "outro";

/**
 * Same briefing UX as Extreme / Extreme V2.
 * Slides come from `HT_BRIEFING_SLIDES` — add PNGs under src/assets/ht-briefing/ to grow the deck.
 */
export function HeatTransferExtremeBriefing({
  reducedMotion,
  onComplete,
}: HeatTransferExtremeBriefingProps) {
  const slides = HT_BRIEFING_SLIDES;
  const [stage, setStage] = React.useState<Stage>("slides");
  const [index, setIndex] = React.useState(0);
  const [remaining, setRemaining] = React.useState(SECONDS);

  const advance = React.useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= slides.length) {
        setStage("outro");
        return i;
      }
      return i + 1;
    });
  }, [slides.length]);

  React.useEffect(() => {
    if (stage !== "slides") return;
    audio.play("gunshot");
    setRemaining(SECONDS);
  }, [index, stage]);

  React.useEffect(() => {
    if (stage !== "slides") return;
    if (slides.length === 0) {
      setStage("outro");
      return;
    }
    const timer = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          advance();
          return SECONDS;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [advance, stage, slides.length]);

  React.useEffect(() => {
    if (stage !== "outro") return;
    audio.play("whoosh");
    const t = window.setTimeout(onComplete, reducedMotion ? 900 : 2600);
    return () => window.clearTimeout(t);
  }, [stage, onComplete, reducedMotion]);

  const skipBtn =
    "rounded-lg border border-red-400/70 bg-deepblue/70 px-5 py-2 font-display text-xs uppercase tracking-[0.2em] text-[#ff2a2a] transition-colors hover:bg-[#ff2a2a]/20";

  if (stage === "outro") {
    return (
      <div className="relative mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center overflow-hidden px-4">
        <p className="font-display text-2xl uppercase tracking-[0.2em] text-[#ff2a2a] text-glow">
          Heat Transfer briefing complete
        </p>
        <img
          src={HT_BRIEFING_OUTRO_IMAGE}
          alt="Study brain flying away"
          width={1024}
          height={1024}
          className={reducedMotion ? "absolute h-40 w-40 opacity-80" : "nerd-brain-flyaway absolute h-40 w-40"}
        />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="mx-auto flex min-h-[40vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-4">
        <p className="font-mono text-sm text-[#ff2a2a]">No briefing slides found yet.</p>
        <button type="button" className={skipBtn} onClick={() => setStage("outro")}>
          Continue
        </button>
      </div>
    );
  }

  const slide = slides[index]!;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-6">
      <div
        className="flex w-full items-center justify-between font-mono text-xs uppercase tracking-[0.25em]"
        style={{ color: ACCENT }}
      >
        <span>
          Heat Transfer Extreme Briefing {index + 1} / {slides.length}
        </span>
        <span aria-live="polite" className="text-cyan">
          {remaining}s
        </span>
      </div>

      <h2
        className="font-display text-lg uppercase tracking-[0.18em] text-glow sm:text-2xl"
        style={{ color: ACCENT }}
      >
        {slide.title}
      </h2>

      <div className="w-full rounded-xl border border-[#ff2a2a]/50 bg-white p-3">
        <img src={slide.url} alt={slide.alt} className="mx-auto max-h-[58vh] w-auto max-w-full object-contain" />
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-deepblue/70">
        <div
          className="h-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${(remaining / SECONDS) * 100}%`, background: ACCENT }}
        />
      </div>

      <button type="button" className={skipBtn} onClick={advance}>
        {index + 1 >= slides.length ? "Continue" : "Skip"}
      </button>
    </div>
  );
}
