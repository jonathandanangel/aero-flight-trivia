import * as React from "react";
import brainAsset from "@/assets/brainpic-2.png.asset.json";
import { audio } from "@/game/audio";

/**
 * Memory overcharge flourish: once recall HP passes 11 inside Aerodynamics
 * Extreme the winged brain fills the screen, announces "+3 RECALL!" and
 * detonates, leaving the background permanently psychedelic.
 */
export function BrainOverload({
  burst,
  reducedMotion,
  onDone,
}: {
  burst: number;
  reducedMotion: boolean;
  onDone: () => void;
}) {
  React.useEffect(() => {
    if (burst === 0) return;
    audio.play("brain-overload");
    const timer = window.setTimeout(onDone, reducedMotion ? 900 : 2300);
    return () => window.clearTimeout(timer);
  }, [burst, reducedMotion, onDone]);

  if (burst === 0) return null;

  return (
    <div key={burst} className="brain-overload" role="status" aria-live="polite">
      <img src={brainAsset.url} alt="" className="brain-overload-img" />
      <p className="brain-overload-label">+3 RECALL!</p>
      <span className="brain-overload-blast" aria-hidden />
    </div>
  );
}
