import * as React from "react";
import brainUrl from "@/assets/brainpic-2.png";
import { audio } from "@/game/audio";
import { cn } from "@/lib/utils";

/**
 * Memory overcharge flourish: once recall HP passes 11 the winged brain
 * fills the screen, announces "+3 RECALL!" and detonates, leaving the
 * background permanently psychedelic (Enoch-Ra).
 */
export function BrainOverload({
  burst,
  reducedMotion,
  onDone,
  /** Snappier expand for Bananza / Enoch-Ra (ms). Default matches CSS 2300. */
  durationMs,
}: {
  burst: number;
  reducedMotion: boolean;
  onDone: () => void;
  durationMs?: number;
}) {
  const onDoneRef = React.useRef(onDone);
  React.useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const duration = reducedMotion ? Math.min(900, durationMs ?? 900) : (durationMs ?? 2300);

  React.useEffect(() => {
    if (burst === 0) return;
    audio.play("brain-overload");
    const timer = window.setTimeout(() => onDoneRef.current(), duration);
    return () => window.clearTimeout(timer);
  }, [burst, duration]);

  if (burst === 0) return null;

  const snap = !reducedMotion && durationMs != null && durationMs < 2000;

  return (
    <div
      key={burst}
      className={cn("brain-overload", snap && "brain-overload--snap")}
      role="status"
      aria-live="polite"
      style={snap ? ({ "--brain-overload-ms": `${duration}ms` } as React.CSSProperties) : undefined}
    >
      <img src={brainUrl} alt="" className="brain-overload-img" />
      <p className="brain-overload-label">+3 RECALL!</p>
      <span className="brain-overload-blast" aria-hidden />
    </div>
  );
}
