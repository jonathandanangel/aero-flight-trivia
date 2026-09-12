import * as React from "react";
import { audio } from "@/game/audio";
import {
  HT_BRIEFING_OUTRO_IMAGE,
  HT_BRIEFING_SLIDES,
} from "@/data/ht-briefing-slides";

const SECONDS = 30;

/** Intro uses the first Chapter-1 briefing slides; Bananza keeps the full deck. */
const INTRO_SLIDE_LIMIT = 8;

export interface HeatTransferIntroBriefingProps {
  reducedMotion?: boolean;
  onComplete: () => void;
}

type Stage = "slides" | "outro";

export function HeatTransferIntroBriefing({
  reducedMotion,
  onComplete,
}: HeatTransferIntroBriefingProps) {
  const slides = HT_BRIEFING_SLIDES.slice(0, Math.min(INTRO_SLIDE_LIMIT, HT_BRIEFING_SLIDES.length));
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
    "rounded-lg border border-orange-400/70 bg-deepblue/70 px-5 py-2 font-display text-xs uppercase tracking-[0.2em] text-[#ff8c1a] transition-colors hover:bg-[#ff8c1a]/20";

  if (stage === "outro") {
    return (
      <div className="relative mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center overflow-hidden px-4">
        <p className="font-display text-2xl uppercase tracking-[0.2em] text-[#ff8c1a] text-glow">
          Heat Transfer Intro briefing complete
        </p>
        <img
          src={HT_BRIEFING_OUTRO_IMAGE}
          alt=""
          className="pointer-events-none absolute inset-0 m-auto max-h-[50vh] opacity-30"
        />
      </div>
    );
  }

  const slide = slides[index];
  return (
    <div className="ht-intro-shell mx-auto flex w-full max-w-4xl flex-col gap-4 px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#ff8c1a]">
          Heat Transfer Intro · Briefing {index + 1}/{Math.max(1, slides.length)} · {remaining}s
        </p>
        <button type="button" className={skipBtn} onClick={() => setStage("outro")}>
          Skip briefing
        </button>
      </div>
      {slide && (
        <figure className="panel overflow-hidden p-2">
          <img src={slide.url} alt={slide.alt} className="mx-auto max-h-[70vh] w-auto object-contain" />
          <figcaption className="mt-2 font-display text-sm text-[#ff8c1a]">{slide.title}</figcaption>
        </figure>
      )}
    </div>
  );
}
