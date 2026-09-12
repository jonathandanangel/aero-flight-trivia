import * as React from "react";
import { audio } from "@/game/audio";
import notes1 from "@/assets/class05-notes-1.png";
import notes2 from "@/assets/class05-notes-2.png";
import notes3 from "@/assets/class05-notes-3.png";
import notes4 from "@/assets/class05-notes-4.png";
import nerdBrain from "@/assets/nerd-brain.png";

const SLIDES = [
  {
    url: notes1,
    title: "Class 05 — Airfoil Data and the Lift Curve",
    alt: "Lecture notes: airfoil force coefficients, lift curve, stall, Cl_max, and zero-lift angle of attack",
  },
  {
    url: notes2,
    title: "Class 05 — Wing Geometry, Sweep, and MAC",
    alt: "Lecture notes: aspect ratio, root and tip chord, taper ratio, sweep, and mean aerodynamic chord",
  },
  {
    url: notes3,
    title: "Class 05 — Linear Lift and the Drag Polar",
    alt: "Lecture notes: Cl = Cl_alpha (alpha - alpha_L=0) and the parabolic drag polar",
  },
  {
    url: notes4,
    title: "Class 05 — Pitching Moment and Finite Wings",
    alt: "Lecture notes: moment coefficient about the aerodynamic center and finite-wing geometry",
  },
];

const SECONDS = 30;

export interface ExtremeV2BriefingProps {
  reducedMotion?: boolean;
  onComplete: () => void;
}

type Stage = "slides" | "outro";

export function ExtremeV2Briefing({ reducedMotion, onComplete }: ExtremeV2BriefingProps) {
  const [stage, setStage] = React.useState<Stage>("slides");
  const [index, setIndex] = React.useState(0);
  const [remaining, setRemaining] = React.useState(SECONDS);

  const advance = React.useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= SLIDES.length) {
        setStage("outro");
        return i;
      }
      return i + 1;
    });
  }, []);

  React.useEffect(() => {
    if (stage !== "slides") return;
    audio.play("gunshot");
    setRemaining(SECONDS);
  }, [index, stage]);

  React.useEffect(() => {
    if (stage !== "slides") return;
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
  }, [advance, stage]);

  React.useEffect(() => {
    if (stage !== "outro") return;
    audio.play("whoosh");
    const t = window.setTimeout(onComplete, reducedMotion ? 900 : 2600);
    return () => window.clearTimeout(t);
  }, [stage, onComplete, reducedMotion]);

  const skipBtn =
    "rounded-lg border border-fuchsia-300/60 bg-deepblue/70 px-5 py-2 font-display text-xs uppercase tracking-[0.2em] text-[#e879f9] transition-colors hover:bg-[#e879f9]/20";

  if (stage === "outro") {
    return (
      <div className="relative mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center overflow-hidden px-4">
        <p className="font-display text-2xl uppercase tracking-[0.2em] text-[#e879f9] text-glow">
          Class 05 briefing complete
        </p>
        <img
          src={nerdBrain}
          alt="Study brain flying away"
          width={1024}
          height={1024}
          className={reducedMotion ? "absolute h-40 w-40 opacity-80" : "nerd-brain-flyaway absolute h-40 w-40"}
        />
      </div>
    );
  }

  const slide = SLIDES[index]!;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-6">
      <div className="flex w-full items-center justify-between font-mono text-xs uppercase tracking-[0.25em] text-[#e879f9]">
        <span>
          Extreme V2 Briefing {index + 1} / {SLIDES.length}
        </span>
        <span aria-live="polite" className="text-cyan">
          {remaining}s
        </span>
      </div>

      <h2 className="font-display text-lg uppercase tracking-[0.18em] text-[#e879f9] text-glow sm:text-2xl">
        {slide.title}
      </h2>

      <div className="w-full rounded-xl border border-[#e879f9]/40 bg-white p-3">
        <img src={slide.url} alt={slide.alt} className="mx-auto max-h-[58vh] w-auto max-w-full object-contain" />
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-deepblue/70">
        <div
          className="h-full bg-[#e879f9] transition-[width] duration-1000 ease-linear"
          style={{ width: `${(remaining / SECONDS) * 100}%` }}
        />
      </div>

      <button type="button" className={skipBtn} onClick={advance}>
        {index + 1 >= SLIDES.length ? "Continue" : "Skip"}
      </button>
    </div>
  );
}
