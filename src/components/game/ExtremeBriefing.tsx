import * as React from "react";
import { audio } from "@/game/audio";
import wingGeometry from "@/assets/wing-geometry.gif.asset.json";
import wingForces from "@/assets/wing-forces-moments.png.asset.json";
import forceVectors from "@/assets/airfoil-force-vectors.jpg.asset.json";
import airfoilGeometry from "@/assets/airfoil-geometry.png.asset.json";

const SLIDES = [
  { url: wingGeometry.url, title: "Wing Geometry Definitions", alt: "NASA wing geometry definitions: chord, span, wing area, camber, dihedral" },
  { url: wingForces.url, title: "Wing Forces and Moments", alt: "Three-dimensional wing with lift, drag and side forces plus roll, pitch and yaw moments" },
  { url: forceVectors.url, title: "Force Vectors on an Airfoil", alt: "Airfoil showing lift, drag and resultant force at the center of pressure" },
  { url: airfoilGeometry.url, title: "Airfoil Geometry", alt: "Airfoil geometry: leading edge, chord line, mean camber line, maximum thickness" },
];

const SECONDS = 30;

export interface ExtremeBriefingProps {
  reducedMotion?: boolean;
  onComplete: () => void;
}

export function ExtremeBriefing({ onComplete }: ExtremeBriefingProps) {
  const [index, setIndex] = React.useState(0);
  const [remaining, setRemaining] = React.useState(SECONDS);
  const done = React.useRef(false);

  const advance = React.useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= SLIDES.length) {
        if (!done.current) {
          done.current = true;
          onComplete();
        }
        return i;
      }
      return i + 1;
    });
  }, [onComplete]);

  // gunshot on each new image
  React.useEffect(() => {
    audio.play("gunshot");
    setRemaining(SECONDS);
  }, [index]);

  React.useEffect(() => {
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
  }, [advance]);

  const slide = SLIDES[index]!;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-6">
      <div className="flex w-full items-center justify-between font-mono text-xs uppercase tracking-[0.25em] text-magenta">
        <span>
          Briefing {index + 1} / {SLIDES.length}
        </span>
        <span aria-live="polite" className="text-cyan">
          {remaining}s
        </span>
      </div>

      <h2 className="font-display text-xl uppercase tracking-[0.18em] text-cyan text-glow sm:text-2xl">
        {slide.title}
      </h2>

      <div className="w-full rounded-xl border border-cyan/40 bg-white p-3">
        <img src={slide.url} alt={slide.alt} className="mx-auto max-h-[58vh] w-auto max-w-full object-contain" />
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-deepblue/70">
        <div
          className="h-full bg-cyan transition-[width] duration-1000 ease-linear"
          style={{ width: `${(remaining / SECONDS) * 100}%` }}
        />
      </div>

      <button
        type="button"
        className="rounded-lg border border-cyan/50 bg-deepblue/70 px-5 py-2 font-display text-xs uppercase tracking-[0.2em] text-cyan transition-colors hover:bg-cyan/20"
        onClick={advance}
      >
        {index + 1 >= SLIDES.length ? "Start Aerodynamics Extreme" : "Skip"}
      </button>
    </div>
  );
}
