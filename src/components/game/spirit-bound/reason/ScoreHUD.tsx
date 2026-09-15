import { comboLabel } from "@/game/spirit-bound/reason/scoring";
import { SPRINT_SECONDS, type AccessMode, type ReasonKind, type ReasonScore, type ReasonTier } from "@/game/spirit-bound/reason/types";
import { tierLabel } from "@/game/spirit-bound/reason/difficultyManager";
import { cn } from "@/lib/utils";

type Props = {
  kind: ReasonKind;
  score: ReasonScore;
  round: number;
  tier: ReasonTier;
  sessionLeft: number;
  elapsed: number;
  lives: number;
  chapter: number;
  chapterRound: number;
  chapterTotal: number;
  access: AccessMode;
  onAccess: (next: AccessMode) => void;
};

export function ScoreHUD({
  kind,
  score,
  round,
  tier,
  sessionLeft,
  elapsed,
  lives,
  chapter,
  chapterRound,
  chapterTotal,
  access,
  onAccess,
}: Props) {
  const clock =
    kind === "sprint"
      ? `${Math.floor(sessionLeft / 60)}:${String(sessionLeft % 60).padStart(2, "0")}`
      : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  const urgent = kind === "sprint" && sessionLeft <= 15;
  const rank = comboLabel(score.rank);
  const accuracy = `${Math.round(score.accuracy * 100)}%`;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        <Stat label="SCORE" value={`${score.total}`} />
        <Stat label="COMBO" value={`${score.combo}${rank ? ` · ${rank}` : ""}`} warn={score.rank === "master"} />
        <Stat label="MULT" value={`${score.multiplier.toFixed(1)}x`} />
        <Stat
          label={kind === "sprint" ? "TIME" : kind === "endless" ? "WATCH" : "CHAPTER"}
          value={kind === "campaign" ? `${chapter} · ${chapterRound}/${chapterTotal}` : clock}
          warn={urgent}
        />
        <Stat label="ROUND" value={`${round} · ${tierLabel(tier)}`} />
        <Stat label="ACCURACY" value={accuracy} />
      </div>
      {kind === "endless" && (
        <p className="text-[8px] text-game-orange">STRIKES LEFT {lives}</p>
      )}
      {kind === "sprint" && (
        <p className="text-[7px] text-[#f8f0c8]/50">{SPRINT_SECONDS}s field window</p>
      )}
      <div className="flex flex-wrap gap-1">
        <Toggle label="HIGH CONTRAST" on={access.highContrast} onClick={() => onAccess({ ...access, highContrast: !access.highContrast })} />
        <Toggle label="COLORBLIND" on={access.colorblind} onClick={() => onAccess({ ...access, colorblind: !access.colorblind })} />
        <Toggle label="REDUCED MOTION" on={access.reducedMotion} onClick={() => onAccess({ ...access, reducedMotion: !access.reducedMotion })} />
        <Toggle label="DYSLEXIA FONT" on={access.dyslexia} onClick={() => onAccess({ ...access, dyslexia: !access.dyslexia })} />
        <Toggle label="NARRATE" on={access.narration} onClick={() => onAccess({ ...access, narration: !access.narration })} />
        <button
          type="button"
          onClick={() =>
            onAccess({
              ...access,
              textSize: access.textSize === "sm" ? "md" : access.textSize === "md" ? "lg" : "sm",
            })
          }
          className="border border-[#705018] px-2 py-1 text-[7px] text-[#f8f0c8]/80"
        >
          TEXT {access.textSize.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="border border-[#705018] bg-[#201808] px-2 py-1">
      <div className="text-[7px] text-game-yellow">{label}</div>
      <div className={cn("mt-1 text-[9px] leading-tight", warn && "text-game-hp")}>{value}</div>
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-2 py-1 text-[7px]",
        on ? "border-game-yellow text-game-yellow" : "border-[#705018] text-[#f8f0c8]/70",
      )}
    >
      {label}
    </button>
  );
}
