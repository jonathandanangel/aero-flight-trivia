import { DIFFICULTY } from "@/game/spirit-bound/shrine/difficulty";
import type { AccessMode, Difficulty, ScoreBreakdown } from "@/game/spirit-bound/shrine/types";
import { cn } from "@/lib/utils";

type Props = {
  puzzleNumber: number;
  difficulty: Difficulty;
  moves: number;
  optimal: number;
  bestMoves: number | null;
  secondsLeft: number;
  timeLimit: number;
  rating: ScoreBreakdown | null;
  access: AccessMode;
  onAccess: (next: AccessMode) => void;
};

function starsLabel(stars: number) {
  if (stars <= 0) return "▵ ▵ ▵";
  if (stars === 1) return "▲ ▵ ▵";
  if (stars === 2) return "▲ ▲ ▵";
  return "▲ ▲ ▲";
}

export function HUD({
  puzzleNumber,
  difficulty,
  moves,
  optimal,
  bestMoves,
  secondsLeft,
  timeLimit,
  rating,
  access,
  onAccess,
}: Props) {
  const urgent = secondsLeft <= 15;
  return (
    <div className="space-y-2 text-[8px] text-[#f8f0c8] sm:text-[9px]">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="PUZZLE" value={`#${puzzleNumber} ${DIFFICULTY[difficulty].label}`} />
        <Stat label="MOVES" value={`${moves}`} />
        <Stat label="BEST PATH" value={`${optimal}`} />
        <Stat label="YOUR BEST" value={bestMoves === null ? "--" : `${bestMoves}`} />
        <Stat label="TIME" value={`${secondsLeft}s / ${timeLimit}s`} warn={urgent} />
        <Stat
          label="RATING"
          value={rating ? `${starsLabel(rating.stars)}  ${rating.total}` : "—"}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        <Toggle
          label="HIGH CONTRAST"
          on={access.highContrast}
          onClick={() => onAccess({ ...access, highContrast: !access.highContrast })}
        />
        <Toggle
          label="COLORBLIND"
          on={access.colorblind}
          onClick={() => onAccess({ ...access, colorblind: !access.colorblind })}
        />
        <Toggle
          label="REDUCED MOTION"
          on={access.reducedMotion}
          onClick={() => onAccess({ ...access, reducedMotion: !access.reducedMotion })}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="border border-[#705018] bg-[#201808] px-2 py-1">
      <div className="text-[7px] text-game-yellow">{label}</div>
      <div className={cn("mt-1 text-[10px]", warn && "text-game-hp")}>{value}</div>
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-2 py-1",
        on ? "border-game-yellow text-game-yellow" : "border-[#705018] text-[#f8f0c8]/70",
      )}
    >
      {label}
    </button>
  );
}
