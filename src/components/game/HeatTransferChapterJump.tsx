import * as React from "react";
import type { HtChapterInfo } from "@/game/ht-chapters";
import { cn } from "@/lib/utils";

export interface HeatTransferChapterJumpProps {
  chapters: HtChapterInfo[];
  currentIndex: number;
  currentChapterId: string | undefined;
  psychedelic: boolean;
  onJump: (chapterId: string) => void;
  onContinue: () => void;
}

/**
 * Enoch-Ra / Bananza chapter gate after minigames:
 * jump ahead (skipped cards credited) or return to an earlier chapter, or Continue.
 */
export function HeatTransferChapterJump({
  chapters,
  currentIndex,
  currentChapterId,
  psychedelic,
  onJump,
  onContinue,
}: HeatTransferChapterJumpProps) {
  const ahead = chapters.filter((c) => c.startIndex > currentIndex);
  const behind = chapters.filter(
    (c) => c.startIndex < currentIndex && c.id !== currentChapterId,
  );
  const current = chapters.find((c) => c.id === currentChapterId);

  const btn = (forward: boolean) =>
    cn(
      "rounded-lg border px-4 py-3 text-left font-display text-sm uppercase tracking-[0.14em] transition-colors",
      psychedelic
        ? forward
          ? "border-[#d946ef]/60 bg-[#2a0a33]/70 text-[#f0abfc] hover:bg-[#d946ef]/20"
          : "border-[#a855f7]/45 bg-[#1a0822]/70 text-[#d8b4fe] hover:bg-[#a855f7]/15"
        : forward
          ? "border-[#ff2a2a]/55 bg-deepblue/70 text-[#ff6b6b] hover:bg-[#ff2a2a]/15"
          : "border-[#ff8c1a]/50 bg-deepblue/70 text-[#ffb86b] hover:bg-[#ff8c1a]/15",
    );

  return (
    <div
      className={cn(
        "ht-extreme-shell mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col gap-6 px-4 py-8",
        psychedelic && "ht-enoch-jump",
      )}
    >
      <div className="text-center">
        <p
          className={cn(
            "font-mono text-xs uppercase tracking-[0.35em]",
            psychedelic ? "text-[#d946ef]" : "text-[#ff2a2a]",
          )}
        >
          {psychedelic ? "ENOCH RA · CHAPTER GATE" : "HEAT TRANSFER EXTREME BANANZA"}
        </p>
        <h2
          className={cn(
            "mt-3 font-display text-3xl sm:text-4xl",
            psychedelic ? "text-[#e879f9]" : "text-[#ff2a2a]",
          )}
        >
          {psychedelic ? "Enoch-Ra Chapter Gate" : "Chapter Jump"}
        </h2>
        <p className="mt-3 font-mono text-sm text-muted-foreground">
          Enoch-Ra unlocked (HP over 11). Skip ahead (credited as correct), return to an earlier
          chapter, or continue here.
        </p>
        {current && (
          <p className="mt-2 font-mono text-xs text-amber">
            Current: {current.shortLabel} · Q{currentIndex + 1}
          </p>
        )}
      </div>

      {ahead.length > 0 && (
        <section className="space-y-2">
          <h3
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.28em]",
              psychedelic ? "text-[#e879f9]" : "text-[#ff6b6b]",
            )}
          >
            Skip ahead
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {ahead.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                className={btn(true)}
                onClick={() => onJump(chapter.id)}
              >
                <span className="block">Skip to {chapter.shortLabel}</span>
                <span className="mt-1 block font-mono text-[10px] normal-case tracking-normal text-muted-foreground">
                  Begin at Q{chapter.startIndex + 1} · prior cards credited
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {behind.length > 0 && (
        <section className="space-y-2">
          <h3
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.28em]",
              psychedelic ? "text-[#c084fc]" : "text-[#ffb86b]",
            )}
          >
            Return back
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {behind.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                className={btn(false)}
                onClick={() => onJump(chapter.id)}
              >
                <span className="block">Return to {chapter.shortLabel}</span>
                <span className="mt-1 block font-mono text-[10px] normal-case tracking-normal text-muted-foreground">
                  Replay from Q{chapter.startIndex + 1}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {ahead.length === 0 && behind.length === 0 && (
        <p className="text-center font-mono text-sm text-muted-foreground">
          No other chapters available — continue the run.
        </p>
      )}

      <div className="mt-auto flex flex-col items-center gap-2 pt-6">
        <button
          type="button"
          className={cn(
            "w-full max-w-sm rounded-lg border px-6 py-4 font-display text-base uppercase tracking-[0.28em] transition-colors",
            psychedelic
              ? "border-[#e879f9] bg-[#e879f9]/15 text-[#f5d0fe] hover:bg-[#e879f9]/30"
              : "border-[#ff2a2a] bg-[#ff2a2a]/15 text-[#ffb4b4] hover:bg-[#ff2a2a]/30",
          )}
          onClick={onContinue}
        >
          Continue
        </button>
        <p className="font-mono text-[11px] text-muted-foreground">Resume without jumping</p>
      </div>
    </div>
  );
}
