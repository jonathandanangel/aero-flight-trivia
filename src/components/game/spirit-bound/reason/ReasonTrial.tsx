import { useEffect } from "react";
import { CHAPTERS } from "@/game/spirit-bound/reason/catalog";
import { ACHIEVEMENTS } from "@/game/spirit-bound/reason/scoring";
import { QUESTIONS_PER_CHAPTER, SPRINT_SECONDS, type ReasonKind } from "@/game/spirit-bound/reason/types";
import { fadeAmbient, startMusic } from "@/game/spirit-bound/shrine/audio";
import { useReasonGame } from "@/hooks/useReasonGame";
import { loadReasonSave } from "@/storage/spirit-bound/reason";
import { cn } from "@/lib/utils";
import { FeedbackLayer } from "./FeedbackLayer";
import { SceneRenderer } from "./SceneRenderer";
import { ScoreHUD } from "./ScoreHUD";
import { StatementCard } from "./StatementCard";
import { Timer } from "./Timer";

type Props = {
  kind: ReasonKind;
  onExit: () => void;
};

const TITLES: Record<ReasonKind, string> = {
  sprint: "WATCH NOTES",
  endless: "FIELD WATCH",
  campaign: "SEVEN BRIEFINGS",
};

export function ReasonTrial({ kind, onExit }: Props) {
  const game = useReasonGame(kind);
  const save = loadReasonSave();
  const best = kind === "sprint" ? save.bestSprint : kind === "endless" ? save.bestEndless : save.campaignChapter;
  const chapterMeta = CHAPTERS[game.chapter - 1] ?? CHAPTERS[0];
  const font = game.access.dyslexia ? "font-dyslexia" : "font-pixel";
  const textPad = game.access.textSize === "lg" ? "text-[10px]" : "text-[8px]";

  useEffect(() => {
    startMusic();
    fadeAmbient(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (game.over) return;
      if (e.key === "Escape") {
        e.preventDefault();
        game.stop();
        return;
      }
      if (game.chapterClear) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        game.answer(true);
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        game.answer(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game]);

  if (game.over) {
    const unlocked = save.achievements.map((id) => ACHIEVEMENTS[id]);
    return (
      <section className={cn("flex min-h-[420px] flex-col items-center justify-center gap-4 border-4 border-game-yellow bg-game-bg p-6 text-center text-[#f8f0c8] shadow-[0_0_0_4px_#181010]", font)}>
        <p className="text-[12px] text-game-yellow">{TITLES[kind]}</p>
        <p className="text-[18px] text-game-yellow">{game.score.total} PTS</p>
        <p className={cn("leading-relaxed", textPad)}>
          Verified {game.correctCount}/{game.answered}
          <br />
          {kind === "campaign" ? `Chapter reached ${save.campaignChapter}` : `Best this machine: ${Math.max(best, game.score.total)}`}
          <br />
          +{game.xpEarned} XP · Greenvale watch +{game.correctCount}
        </p>
        {unlocked.length > 0 && (
          <p className="max-w-sm text-[8px] text-game-orange">{unlocked.join(" · ")}</p>
        )}
        <button
          type="button"
          onClick={onExit}
          className="border-2 border-game-yellow px-4 py-2 text-[11px] text-game-yellow hover:bg-game-yellow hover:text-game-bg"
        >
          TITLE
        </button>
      </section>
    );
  }

  if (game.chapterClear && chapterMeta) {
    const relic = save.collectibles[save.collectibles.length - 1];
    return (
      <section className={cn("flex min-h-[420px] flex-col items-center justify-center gap-4 border-4 border-game-yellow bg-game-bg p-6 text-center text-[#f8f0c8] shadow-[0_0_0_4px_#181010]", font)}>
        <p className="text-[10px] text-game-orange">BRIEFING SEALED</p>
        <p className="text-[12px] text-game-yellow">{chapterMeta.title}</p>
        <p className="text-[9px] leading-relaxed">{chapterMeta.blurb}</p>
        {relic && <p className="text-[8px] text-[#38c060]">Relic recovered: {relic}</p>}
        <button
          type="button"
          onClick={game.continueCampaign}
          className="border-2 border-game-yellow px-4 py-2 text-[11px] text-game-yellow hover:bg-game-yellow hover:text-game-bg"
        >
          NEXT BRIEFING
        </button>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden border-4 border-game-yellow bg-game-bg p-3 text-[#f8f0c8] shadow-[0_0_0_4px_#181010] sm:p-4",
        font,
      )}
    >
      <FeedbackLayer feedback={game.feedback} access={game.access} />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[9px]">
        <span className="text-game-yellow">{TITLES[kind]}</span>
        <Timer
          seconds={kind === "sprint" ? game.sessionLeft : game.elapsed}
          urgent={kind === "sprint" && game.sessionLeft <= 15}
          live={kind !== "sprint"}
        />
        <button type="button" onClick={game.stop} className="border border-game-orange px-2 py-1 text-game-orange">
          STOP
        </button>
      </div>

      <ScoreHUD
        kind={kind}
        score={game.score}
        round={game.round}
        tier={game.tier}
        sessionLeft={game.sessionLeft}
        elapsed={game.elapsed}
        lives={game.lives}
        chapter={game.chapter}
        chapterRound={game.chapterRound}
        chapterTotal={QUESTIONS_PER_CHAPTER}
        access={game.access}
        onAccess={game.setAccess}
      />

      <div className="mt-3 space-y-3">
        <StatementCard source={game.challenge.source} statement={game.challenge.statement} access={game.access} />
        <SceneRenderer
          scene={game.challenge.scene}
          access={game.access}
          pulse={Boolean(game.feedback?.correct)}
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={game.locked}
            onClick={() => game.answer(true)}
            className="border-2 border-[#38c060] px-3 py-4 text-[12px] text-[#38c060] hover:bg-[#38c060] hover:text-game-bg disabled:opacity-40"
          >
            TRUE
            <span className="mt-1 block text-[7px]">← / A</span>
          </button>
          <button
            type="button"
            disabled={game.locked}
            onClick={() => game.answer(false)}
            className="border-2 border-game-hp px-3 py-4 text-[12px] text-game-hp hover:bg-game-hp hover:text-game-bg disabled:opacity-40"
          >
            FALSE
            <span className="mt-1 block text-[7px]">→ / D</span>
          </button>
        </div>
      </div>
      <p className="mt-3 text-center text-[7px] text-[#f8f0c8]/60">
        {kind === "sprint" ? `${SPRINT_SECONDS}s to verify the watch.` : kind === "endless" ? "Three mistakes and the watch goes dark." : chapterMeta?.blurb}
        {" "}
        Read the green. Confirm or reject the report.
      </p>
    </section>
  );
}
