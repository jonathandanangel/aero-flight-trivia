import * as React from "react";
import { audio } from "@/game/audio";
import type { Progress } from "@/game/store";

export function Finale({
  progress,
  total,
  reducedMotion,
  onReviewMissed,
  onMastery,
  onMenu,
}: {
  progress: Progress;
  total: number;
  reducedMotion: boolean;
  onReviewMissed: () => void;
  onMastery: () => void;
  onMenu: () => void;
}) {
  const [launched, setLaunched] = React.useState(reducedMotion);

  React.useEffect(() => {
    audio.play("launch");
    const t = window.setTimeout(() => setLaunched(true), reducedMotion ? 0 : 3200);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

  const accuracy = progress.answeredCount
    ? Math.round((progress.correctCount / progress.answeredCount) * 100)
    : 0;

  const exportSummary = () => {
    const text = [
      "ZEUS AMMON-RA 11 — Mission Summary",
      `Score: ${progress.score}`,
      `Answered: ${progress.answeredCount} / ${total}`,
      `Correct: ${progress.correctCount} (${accuracy}%)`,
      `Best streak: ${progress.bestStreak}`,
      `Recall wins/losses: ${progress.recallWins}/${progress.recallLosses}`,
      `Missed: ${progress.missedIds.join(", ") || "none"}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "zeus-ammon-ra-11-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const btn =
    "rounded-lg border border-cyan/50 bg-deepblue/70 px-4 py-2 font-display text-xs uppercase tracking-[0.2em] text-cyan hover:bg-cyan/20";

  return (
    <div className="panel mx-auto w-full max-w-2xl p-6 text-center">
      <div className="relative mx-auto h-48 w-24">
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ animation: reducedMotion ? undefined : "aerogrid-rise 3.2s ease-in forwards" }}
        >
          <svg viewBox="0 0 60 140" className="mx-auto h-40">
            <path d="M30 4 C46 30 48 70 44 100 L16 100 C12 70 14 30 30 4 Z" fill="var(--color-secondary)" stroke="var(--color-cyan)" strokeWidth="2" />
            <circle cx="30" cy="44" r="7" fill="var(--color-mint)" />
            <path d="M16 100 L4 126 L16 118 Z M44 100 L56 126 L44 118 Z" fill="var(--color-magenta)" />
            <path d="M22 102 Q30 138 38 102 Z" fill="var(--color-amber)" />
          </svg>
        </div>
      </div>
      <h2 className="mt-2 font-display text-3xl text-mint text-glow">MISSION SUCCESS</h2>
      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        All {total} questions cleared
      </p>
      {launched && (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-left font-mono text-sm sm:grid-cols-3">
            {[
              ["Score", progress.score],
              ["Correct", `${progress.correctCount}/${progress.answeredCount}`],
              ["Accuracy", `${accuracy}%`],
              ["Best streak", progress.bestStreak],
              ["Recall wins", progress.recallWins],
              ["Recall losses", progress.recallLosses],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-md border border-border bg-deepblue/60 p-3">
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
                <dd className="text-lg text-cyan">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className={btn} onClick={onReviewMissed} disabled={!progress.missedIds.length}>
              Review missed ({progress.missedIds.length})
            </button>
            <button type="button" className={btn} onClick={onMastery}>
              Mastery mode
            </button>
            <button type="button" className={btn} onClick={exportSummary}>
              Export summary
            </button>
            <button type="button" className={btn} onClick={onMenu}>
              Main menu
            </button>
          </div>
        </>
      )}
    </div>
  );
}
