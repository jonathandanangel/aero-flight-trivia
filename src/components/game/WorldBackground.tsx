import * as React from "react";
import { cn } from "@/lib/utils";
import moonPortrait from "@/assets/seus-moon.png.asset.json";
import enochRaMoon from "@/assets/enoch-ra-moon.png.asset.json";

/** Futuristic delta-wing jet silhouette with fluid neon light trails. */
function NeonJet({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 260 60"
      className={cn("neon-jet", flip && "neon-jet--flip")}
      aria-hidden
    >
      <defs>
        <linearGradient id="jet-trail-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="0.55" stopColor="#38bdf8" stopOpacity="0.5" />
          <stop offset="1" stopColor="#7dd3fc" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* fluid trailing light lines streaming behind the jet */}
      <g fill="none" strokeLinecap="round">
        <path
          className="jet-trail"
          d="M160 26 C 120 22, 80 32, 2 26"
          stroke="url(#jet-trail-grad)"
          strokeWidth="6"
          opacity="0.35"
        />
        <path
          className="jet-trail"
          d="M160 30 C 115 28, 75 34, 2 30"
          stroke="url(#jet-trail-grad)"
          strokeWidth="3"
        />
        <path
          className="jet-trail"
          d="M160 34 C 120 38, 80 28, 2 34"
          stroke="url(#jet-trail-grad)"
          strokeWidth="2"
          opacity="0.7"
        />
      </g>
      {/* sleek futuristic jet, nose pointing right */}
      <g fill="#9fe6ff" stroke="#e0f6ff" strokeWidth="1">
        <path d="M256 30 L202 24 L160 27 L160 33 L202 36 Z" />
        <path d="M208 28 L180 6 L168 9 L186 28 Z" />
        <path d="M208 32 L180 54 L168 51 L186 32 Z" />
        <path d="M172 27 L160 16 L156 19 L162 27 Z" opacity="0.85" />
      </g>
    </svg>
  );
}


/**
 * Sky that shifts from late afternoon -> night -> sunrise as the campaign
 * progresses, with a neon skyline, moon, drifting clouds and light riders.
 * A futuristic neon jet loops across the sky with fluid light trails,
 * occasionally climbing at 45 degrees. In Aerodynamics Extreme overload the
 * moon becomes the purple Enoch-Ra visage and the scene pulses with
 * psychedelic distortion.
 */
export function WorldBackground({
  progress,
  scanlines,
  reducedMotion,
  bloodMoon,
  psychedelic,
  inferno,
}: {
  progress: number;
  scanlines: boolean;
  reducedMotion: boolean;
  bloodMoon: boolean;
  psychedelic?: boolean;
  /** Aerodynamics Extreme second half: everything burns bright red with lava. */
  inferno?: boolean;
}) {
  const phase = Math.min(1, Math.max(0, progress));
  const sky =
    phase < 0.4
      ? "linear-gradient(180deg, #2a1140 0%, #0b1330 55%, #050816 100%)"
      : phase < 0.8
        ? "linear-gradient(180deg, #050816 0%, #071225 60%, #050816 100%)"
        : "linear-gradient(180deg, #12203f 0%, #33224a 45%, #071225 100%)";

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10",
        bloodMoon && "blood-moon-scene",
        scanlines && "scanlines",
        psychedelic && !reducedMotion && "psychedelic-scene",
        inferno && "inferno-scene",
      )}
      aria-hidden
    >
      <div className="absolute inset-0" style={{ background: sky }} />
      {bloodMoon && <div className="blood-moon-atmosphere absolute inset-0" />}
      {psychedelic && !reducedMotion && (
        <>
          <div className="psychedelic-hue absolute inset-0" />
          <div className="psychedelic-warp absolute inset-0" />
          <div className="psychedelic-trails absolute inset-0" />
        </>
      )}
      <div
        className={cn(
          "moon absolute right-[12%] top-[10%] h-24 w-24 overflow-hidden rounded-full sm:h-28 sm:w-28",
          bloodMoon && "blood-moon",
          bloodMoon && !reducedMotion && "blood-moon-awakening",
          psychedelic && "psycho-moon",
          psychedelic && !reducedMotion && "psycho-moon-shake",
          inferno && "inferno-moon",
        )}
        style={
          bloodMoon || psychedelic || inferno
            ? undefined
            : { boxShadow: "0 0 60px rgba(234,247,255,0.45)" }
        }
      >
        <img
          src={psychedelic ? enochRaMoon.url : moonPortrait.url}
          alt=""
          className={cn(
            "moon-portrait h-full w-full object-cover",
            bloodMoon && "moon-portrait--blood",
            psychedelic && "moon-portrait--psycho",
            inferno && "moon-portrait--inferno",
          )}
        />
      </div>

      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn("absolute h-8 rounded-full bg-moon/10 blur-md", psychedelic && !reducedMotion && "cloud-shift")}
          style={{
            width: `${140 + i * 60}px`,
            top: `${18 + i * 9}%`,
            left: `${i * 25}%`,
            animation: reducedMotion ? undefined : `aerogrid-drift ${70 + i * 25}s linear infinite`,
          }}
        />
      ))}
      <svg viewBox="0 0 1200 300" preserveAspectRatio="none" className={cn("absolute bottom-0 z-[3] h-[38vh] w-full", inferno && "inferno-city")}>
        <g fill="#071225" stroke="var(--color-cyan)" strokeWidth="1.4" opacity="0.85">
          {Array.from({ length: 26 }).map((_, i) => {
            const w = 30 + ((i * 37) % 44);
            const h = 60 + ((i * 71) % 190);
            const x = i * 47;
            return <rect key={i} x={x} y={300 - h} width={w} height={h} />;
          })}
        </g>
        <line x1="0" y1="299" x2="1200" y2="299" stroke="var(--color-magenta)" strokeWidth="2" />
      </svg>
      {inferno && (
        <>
          {/* Neon lava glow rising from the skyline */}
          <div className={cn("inferno-lava absolute inset-x-0 bottom-0 z-[2] h-[40vh]", !reducedMotion && "inferno-lava--flow")} />
          {/* Lava streams running down the buildings */}
          <div className={cn("inferno-lava-streaks absolute inset-x-0 bottom-0 z-[4] h-[38vh]", !reducedMotion && "inferno-lava-streaks--flow")} />
        </>
      )}
      {bloodMoon && <div className="blood-moon-horizon absolute inset-x-0 bottom-0 z-[2] h-[30vh]" />}
      {!reducedMotion && (
        <>
          {/* Futuristic neon jet: left -> right with a 45-degree climb */}
          <div className="jet jet--lr absolute left-0 top-0 z-[2]">
            <NeonJet />
          </div>
          {/* Same jet returning right -> left */}
          <div className="jet jet--rl absolute left-0 top-0 z-[2]">
            <NeonJet flip />
          </div>
        </>
      )}
      {!reducedMotion &&
        [0, 1].map((i) => (
          <div
            key={i}
            className={cn("absolute h-[2px] w-40 bg-cyan/70", psychedelic && "rider-trail")}
            style={{
              bottom: `${8 + i * 5}%`,
              animation: `aerogrid-pass ${9 + i * 5}s linear infinite`,
              animationDelay: `${i * 4}s`,
              boxShadow: "0 0 14px var(--color-cyan)",
            }}
          />
        ))}
    </div>
  );
}
