import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Sky that shifts from late afternoon -> night -> sunrise as the campaign
 * progresses, with a neon skyline, moon, drifting clouds and light riders.
 */
export function WorldBackground({
  progress,
  scanlines,
  reducedMotion,
}: {
  progress: number;
  scanlines: boolean;
  reducedMotion: boolean;
}) {
  const phase = Math.min(1, Math.max(0, progress));
  const sky =
    phase < 0.4
      ? "linear-gradient(180deg, #2a1140 0%, #0b1330 55%, #050816 100%)"
      : phase < 0.8
        ? "linear-gradient(180deg, #050816 0%, #071225 60%, #050816 100%)"
        : "linear-gradient(180deg, #12203f 0%, #33224a 45%, #071225 100%)";

  return (
    <div className={cn("pointer-events-none fixed inset-0 -z-10", scanlines && "scanlines")} aria-hidden>
      <div className="absolute inset-0" style={{ background: sky }} />
      <div
        className="absolute right-[12%] top-[10%] h-24 w-24 rounded-full bg-moon/90 blur-[1px]"
        style={{ boxShadow: "0 0 60px rgba(234,247,255,0.45)" }}
      />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute h-8 rounded-full bg-moon/10 blur-md"
          style={{
            width: `${140 + i * 60}px`,
            top: `${18 + i * 9}%`,
            left: `${i * 25}%`,
            animation: reducedMotion ? undefined : `aerogrid-drift ${70 + i * 25}s linear infinite`,
          }}
        />
      ))}
      <svg viewBox="0 0 1200 300" preserveAspectRatio="none" className="absolute bottom-0 h-[38vh] w-full">
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
      {!reducedMotion &&
        [0, 1].map((i) => (
          <div
            key={i}
            className="absolute h-[2px] w-40 bg-cyan/70"
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
