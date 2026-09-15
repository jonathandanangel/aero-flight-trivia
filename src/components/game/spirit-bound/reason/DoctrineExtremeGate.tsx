import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateChallenge } from "@/game/spirit-bound/reason/generator";
import type { ReasonTier } from "@/game/spirit-bound/reason/types";
import { playSfx, startDoctrinePuzzleMusic, startGrasslandsMusic } from "@/game/spirit-bound/shrine/audio";
import { randomSeed } from "@/game/spirit-bound/shrine/rng";
import { cn } from "@/lib/utils";
import { FeedbackLayer } from "./FeedbackLayer";
import { SceneRenderer } from "./SceneRenderer";
import { StatementCard } from "./StatementCard";

type Props = {
  /** Paper order 1–11 — drives target length and music variation. */
  paperOrder: number;
  onSolved: () => void;
  onAbort: () => void;
};

/** Extreme executive-acumen gate for doctrine scraps — 50+ verifications, tier 7+, increasing. */
export function DoctrineExtremeGate({ paperOrder, onSolved, onAbort }: Props) {
  const target = 50 + (paperOrder - 1) * 5; // 50 … 100
  const variation = Math.max(0, Math.min(10, paperOrder - 1));
  const [seed, setSeed] = useState(randomSeed);
  const [round, setRound] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [lives, setLives] = useState(2);
  const [locked, setLocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [won, setWon] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; key: number } | null>(null);
  const [shownAt, setShownAt] = useState(() => Date.now());
  const lockedRef = useRef(false);

  // Tier climbs with progress: start sealed (5), end temporal cipher (7).
  const tier: ReasonTier = correctCount < 15 ? 5 : correctCount < 30 ? 6 : 7;

  const challenge = useMemo(
    () => generateChallenge(seed, round + paperOrder * 97, tier),
    [seed, round, tier, paperOrder],
  );

  useEffect(() => {
    startDoctrinePuzzleMusic(variation);
  }, [variation]);

  useEffect(() => {
    setShownAt(Date.now());
  }, [challenge]);

  const finishFail = useCallback(() => {
    setFailed(true);
    playSfx("fail");
    startGrasslandsMusic();
  }, []);

  const finishWin = useCallback(() => {
    setWon(true);
    playSfx("success");
  }, []);

  const answer = useCallback(
    (saidTrue: boolean) => {
      if (failed || won || lockedRef.current) return;
      lockedRef.current = true;
      setLocked(true);
      const correct = saidTrue === challenge.answer;
      setAnswered((n) => n + 1);
      setFeedback({ correct, key: answered + 1 });
      if (correct) {
        playSfx("success");
        const next = correctCount + 1;
        setCorrectCount(next);
        if (next >= target) {
          window.setTimeout(() => finishWin(), 400);
          return;
        }
      } else {
        playSfx("invalid");
        const nextLives = lives - 1;
        setLives(nextLives);
        if (nextLives <= 0) {
          window.setTimeout(() => finishFail(), 400);
          return;
        }
      }
      window.setTimeout(() => {
        setFeedback(null);
        lockedRef.current = false;
        setLocked(false);
        setSeed(randomSeed());
        setRound((n) => n + 1);
      }, 480);
    },
    [failed, won, challenge, answered, correctCount, target, lives, finishWin, finishFail],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        startGrasslandsMusic();
        onAbort();
        return;
      }
      if (failed || won || locked) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        answer(true);
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        answer(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, failed, won, locked, onAbort]);

  if (won) {
    return (
      <section className="flex min-h-[420px] flex-col items-center justify-center gap-4 border-4 border-game-yellow bg-game-bg p-6 text-center font-pixel text-[#f8f0c8] shadow-[0_0_0_4px_#181010]">
        <p className="text-[10px] text-game-yellow">DOCTRINE UNSEALED</p>
        <p className="text-[9px] leading-relaxed">
          {correctCount} verifications · scrap {paperOrder}
        </p>
        <button
          type="button"
          onClick={onSolved}
          className="border-2 border-game-yellow px-4 py-2 text-[11px] text-game-yellow hover:bg-game-yellow hover:text-game-bg"
        >
          TAKE THE SCRAP
        </button>
      </section>
    );
  }

  if (failed) {
    return (
      <section className="flex min-h-[420px] flex-col items-center justify-center gap-4 border-4 border-game-yellow bg-game-bg p-6 text-center font-pixel text-[#f8f0c8] shadow-[0_0_0_4px_#181010]">
        <p className="text-[10px] text-game-hp">SEAL HOLDS</p>
        <p className="text-[9px] leading-relaxed">
          Extreme watch failed ({correctCount}/{target}).
          <br />
          The scrap stays bound.
        </p>
        <button
          type="button"
          onClick={onAbort}
          className="border-2 border-game-yellow px-4 py-2 text-[11px] text-game-yellow hover:bg-game-yellow hover:text-game-bg"
        >
          RETURN
        </button>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-4 border-game-yellow bg-game-bg p-3 font-pixel text-[#f8f0c8] shadow-[0_0_0_4px_#181010] sm:p-4">
      <FeedbackLayer
        feedback={feedback ? { ...feedback, rankUp: null, legendary: false } : null}
        access={{
          highContrast: false,
          colorblind: false,
          reducedMotion: false,
          dyslexia: false,
          textSize: "sm",
          narration: false,
        }}
      />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[9px]">
        <span className="text-game-yellow">EXTREME · EXECUTIVE ACUMEN</span>
        <span className="text-game-orange">
          {correctCount}/{target} · LV{tier} · ♥{lives}
        </span>
      </div>
      <p className="mb-2 text-[8px] text-[#a88828]">
        Scrap {paperOrder} · 50+ sealed steps · ← TRUE / → FALSE · ESC abort
      </p>
      <div className={cn(locked && "pointer-events-none opacity-80")}>
        <StatementCard
          source={challenge.source}
          statement={challenge.statement}
          access={{
            highContrast: false,
            colorblind: false,
            reducedMotion: false,
            dyslexia: false,
            textSize: "sm",
            narration: false,
          }}
        />
        <div className="mt-3">
          <SceneRenderer
            scene={challenge.scene}
            access={{
              highContrast: false,
              colorblind: false,
              reducedMotion: false,
              dyslexia: false,
              textSize: "sm",
              narration: false,
            }}
            pulse={Boolean(feedback?.correct)}
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={locked}
          onClick={() => answer(true)}
          className="flex-1 border-2 border-[#38c060] px-3 py-2 text-[10px] text-[#38c060] hover:bg-[#38c060] hover:text-game-bg disabled:opacity-40"
        >
          TRUE
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={() => answer(false)}
          className="flex-1 border-2 border-game-hp px-3 py-2 text-[10px] text-game-hp hover:bg-game-hp hover:text-game-bg disabled:opacity-40"
        >
          FALSE
        </button>
      </div>
      <p className="mt-2 text-[7px] text-[#705018]">shown {Math.max(0, Math.floor((Date.now() - shownAt) / 1000))}s · answered {answered}</p>
    </section>
  );
}
