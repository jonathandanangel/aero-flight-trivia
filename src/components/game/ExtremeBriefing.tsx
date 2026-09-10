import * as React from "react";
import { audio } from "@/game/audio";
import wingGeometry from "@/assets/wing-geometry.gif.asset.json";
import wingForces from "@/assets/wing-forces-moments.png.asset.json";
import forceVectors from "@/assets/airfoil-force-vectors.jpg.asset.json";
import airfoilGeometry from "@/assets/airfoil-geometry.png.asset.json";
import notes1 from "@/assets/notes-122932.png.asset.json";
import notes2 from "@/assets/notes-122942.png.asset.json";
import notes3 from "@/assets/notes-122957.png.asset.json";
import notes4 from "@/assets/notes-123007.png.asset.json";
import notes5 from "@/assets/notes-123014.png.asset.json";
import notes6 from "@/assets/notes-123020.png.asset.json";
import basicAerodynamics from "@/assets/basic-aerodynamics.png.asset.json";
import lectureB1 from "@/assets/lecture-b1.png.asset.json";
import lectureB2 from "@/assets/lecture-b2.png.asset.json";
import lectureB3 from "@/assets/lecture-b3.png.asset.json";
import lectureB4 from "@/assets/lecture-b4.png.asset.json";
import lectureB5 from "@/assets/lecture-b5.png.asset.json";
import lectureB6 from "@/assets/lecture-b6.png.asset.json";
import lectureB7 from "@/assets/lecture-b7.png.asset.json";
import lectureB8 from "@/assets/lecture-b8.png.asset.json";
import lectureB9 from "@/assets/lecture-b9.png.asset.json";
import lectureB10 from "@/assets/lecture-b10.png.asset.json";
import lectureVideo from "@/assets/briefing-lecture.mp4.asset.json";
import nerdBrain from "@/assets/nerd-brain.png.asset.json";
import rudderSheet from "@/assets/vertical-stabilizer-rudder.png.asset.json";

const SLIDES = [
  { url: wingGeometry.url, title: "Wing Geometry Definitions", alt: "NASA wing geometry definitions: chord, span, wing area, camber, dihedral" },
  { url: wingForces.url, title: "Wing Forces and Moments", alt: "Three-dimensional wing with lift, drag and side forces plus roll, pitch and yaw moments" },
  { url: forceVectors.url, title: "Force Vectors on an Airfoil", alt: "Airfoil showing lift, drag and resultant force at the center of pressure" },
  { url: airfoilGeometry.url, title: "Airfoil Geometry", alt: "Airfoil geometry: leading edge, chord line, mean camber line, maximum thickness" },
  { url: basicAerodynamics.url, title: "Review of Basic Aerodynamics", alt: "Lecture notes reviewing lift, drag, thrust, weight and flowfield properties" },
  { url: lectureB1.url, title: "Flow Point Properties", alt: "Lecture notes defining flow pressure, density, temperature and velocity" },
  { url: lectureB2.url, title: "Steady Flow, Units & Perfect Gas", alt: "Lecture notes covering steady flow, physical units and the perfect-gas equation of state" },
  { url: lectureB3.url, title: "Compressibility & Bernoulli's Equation", alt: "Lecture notes covering incompressible and compressible flow and Bernoulli's equation" },
  { url: lectureB4.url, title: "Momentum, Speed of Sound & Mach Number", alt: "Lecture notes covering momentum, speed of sound and Mach number" },
  { url: lectureB5.url, title: "Mach Regimes & Standard Atmosphere", alt: "Lecture notes covering Mach regimes, dynamic pressure and the standard atmosphere" },
  { url: lectureB6.url, title: "Standard Atmosphere Ratios", alt: "Lecture notes defining theta, sigma and delta standard-atmosphere ratios" },
  { url: lectureB7.url, title: "Fundamentals of Airfoils", alt: "Class 03 notes on two-dimensional infinite wings, pressure and shear stress" },
  { url: lectureB8.url, title: "Lift Force & Pressure Distributions", alt: "Lecture notes explaining lift force and pressure distributions around an airfoil" },
  { url: lectureB9.url, title: "Bernoulli Lift & Skin Friction Drag", alt: "Lecture notes explaining the Bernoulli lift mechanism and skin-friction drag" },
  { url: lectureB10.url, title: "Skin Friction & Pressure Drag", alt: "Lecture notes covering skin-friction drag coefficient, pressure drag and flow separation" },
  { url: notes1.url, title: "Notes 1 — Profile Drag & Airfoil Terminology", alt: "Lecture notes: profile drag, chord line, mean camber line, max camber" },
  { url: notes2.url, title: "Notes 2 — Thickness, AoA & Coefficients", alt: "Lecture notes: thickness, angle of attack, lift drag and moment coefficients" },
  { url: notes3.url, title: "Notes 3 — Coefficient Definitions", alt: "Lecture notes: CL, CD, CM definitions and per unit span coefficients" },
  { url: notes4.url, title: "Notes 4 — Center of Pressure", alt: "Lecture notes: pressure distribution, aerodynamic moment and center of pressure" },
  { url: notes5.url, title: "Notes 5 — Aerodynamic Center", alt: "Lecture notes: center of pressure versus aerodynamic center at quarter chord" },
  { url: notes6.url, title: "Notes 6 — Moment About the AC", alt: "Lecture notes: aerodynamic moment about the aerodynamic center stays constant" },
  { url: rudderSheet.url, title: "Vertical Stabilizer — Rudder", alt: "NASA reference sheet: vertical stabilizer and rudder, side force, distance from center of gravity and yawing motion" },
];

const SECONDS = 30;

export interface ExtremeBriefingProps {
  reducedMotion?: boolean;
  onComplete: () => void;
}

type Stage = "slides" | "video" | "outro";

export function ExtremeBriefing({ reducedMotion, onComplete }: ExtremeBriefingProps) {
  const [stage, setStage] = React.useState<Stage>("slides");
  const [index, setIndex] = React.useState(0);
  const [remaining, setRemaining] = React.useState(SECONDS);

  const advance = React.useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= SLIDES.length) {
        setStage("video");
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

  // outro: nerd brain flies away, then the mode starts
  React.useEffect(() => {
    if (stage !== "outro") return;
    audio.play("whoosh");
    const t = window.setTimeout(onComplete, reducedMotion ? 900 : 2600);
    return () => window.clearTimeout(t);
  }, [stage, onComplete, reducedMotion]);

  const skipBtn =
    "rounded-lg border border-cyan/50 bg-deepblue/70 px-5 py-2 font-display text-xs uppercase tracking-[0.2em] text-cyan transition-colors hover:bg-cyan/20";

  if (stage === "outro") {
    return (
      <div className="relative mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center overflow-hidden px-4">
        <p className="font-display text-2xl uppercase tracking-[0.2em] text-magenta text-glow">Study complete</p>
        <img
          src={nerdBrain.url}
          alt="Study brain flying away"
          width={1024}
          height={1024}
          className={reducedMotion ? "absolute h-40 w-40 opacity-80" : "nerd-brain-flyaway absolute h-40 w-40"}
        />
      </div>
    );
  }

  if (stage === "video") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-6">
        <h2 className="font-display text-xl uppercase tracking-[0.18em] text-cyan text-glow sm:text-2xl">
          Lecture Recording
        </h2>
        <video
          src={lectureVideo.url}
          className="w-full rounded-xl border border-cyan/40 bg-black"
          controls
          autoPlay
          playsInline
          onEnded={() => setStage("outro")}
        />
        <button type="button" className={skipBtn} onClick={() => setStage("outro")}>
          Skip video
        </button>
      </div>
    );
  }

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

      <h2 className="font-display text-lg uppercase tracking-[0.18em] text-cyan text-glow sm:text-2xl">
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

      <button type="button" className={skipBtn} onClick={advance}>
        {index + 1 >= SLIDES.length ? "Continue to recording" : "Skip"}
      </button>
    </div>
  );
}
