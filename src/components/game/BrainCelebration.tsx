import * as React from "react";
import brainAsset from "@/assets/winged-brain.png.asset.json";
import cyanBrainAsset from "@/assets/winged-brain-cyan.png.asset.json";
import solarBrainAsset from "@/assets/winged-brain-solar.png.asset.json";
import voltBrainAsset from "@/assets/winged-brain-volt.png.asset.json";

const originalVariant = { src: brainAsset.url, theme: "magenta" } as const;
const variants = [
  originalVariant,
  { src: cyanBrainAsset.url, theme: "cyan" },
  { src: solarBrainAsset.url, theme: "solar" },
  { src: voltBrainAsset.url, theme: "volt" },
] as const;

type Flyer = {
  id: number;
  size: number;
  startY: number;
  arc: number;
  duration: number;
  delay: number;
  rotation: number;
  variant: (typeof variants)[number];
};

function selectVariant(index: number): (typeof variants)[number] {
  return variants[index % variants.length] ?? originalVariant;
}

function createFlyers(seed: number): Flyer[] {
  const count = 1 + (seed % 3);

  return Array.from({ length: count }, (_, index) => {
    const n = seed * 47 + index * 83;
    return {
      id: seed * 10 + index,
      size: 112 + (n % 96),
      startY: 16 + ((n * 7) % 58),
      arc: -80 + ((n * 11) % 161),
      duration: 1500 + ((n * 13) % 1050),
      delay: index * 170,
      rotation: -14 + ((n * 17) % 29),
      variant: selectVariant(n + seed + index),
    };
  });
}

export function BrainCelebration({ burst, reducedMotion }: { burst: number; reducedMotion: boolean }) {
  const flyers = React.useMemo(() => createFlyers(burst), [burst]);

  if (burst === 0) return null;

  if (reducedMotion) {
    const variant = selectVariant(burst);
    return (
      <div key={burst} className={`brain-celebration brain-celebration-static brain-theme-${variant.theme}`} aria-hidden>
        <img src={variant.src} alt="" />
      </div>
    );
  }

  return (
    <div key={burst} className="brain-celebration" aria-hidden>
      {flyers.map((flyer) => (
        <img
          key={flyer.id}
          src={flyer.variant.src}
          alt=""
          className={`brain-flyer brain-theme-${flyer.variant.theme}`}
          style={
            {
              "--brain-size": `${flyer.size}px`,
              "--brain-y": `${flyer.startY}vh`,
              "--brain-arc": `${flyer.arc}px`,
              "--brain-duration": `${flyer.duration}ms`,
              "--brain-delay": `${flyer.delay}ms`,
              "--brain-rotation": `${flyer.rotation}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}