import * as React from "react";
import brainAsset from "@/assets/winged-brain.png.asset.json";

type Flyer = {
  id: number;
  size: number;
  startY: number;
  arc: number;
  duration: number;
  delay: number;
  rotation: number;
  hue: number;
};

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
      hue: index === 0 ? 0 : (n * 19) % 70 - 35,
    };
  });
}

export function BrainCelebration({ burst, reducedMotion }: { burst: number; reducedMotion: boolean }) {
  const flyers = React.useMemo(() => createFlyers(burst), [burst]);

  if (burst === 0) return null;

  if (reducedMotion) {
    return (
      <div key={burst} className="brain-celebration brain-celebration-static" aria-hidden>
        <img src={brainAsset.url} alt="" />
      </div>
    );
  }

  return (
    <div key={burst} className="brain-celebration" aria-hidden>
      {flyers.map((flyer) => (
        <img
          key={flyer.id}
          src={brainAsset.url}
          alt=""
          className="brain-flyer"
          style={
            {
              "--brain-size": `${flyer.size}px`,
              "--brain-y": `${flyer.startY}vh`,
              "--brain-arc": `${flyer.arc}px`,
              "--brain-duration": `${flyer.duration}ms`,
              "--brain-delay": `${flyer.delay}ms`,
              "--brain-rotation": `${flyer.rotation}deg`,
              "--brain-hue": `${flyer.hue}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}