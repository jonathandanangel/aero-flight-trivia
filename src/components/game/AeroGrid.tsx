import * as React from "react";
import { allQuestions, aeroQuestions, impactArchive, TOTAL_QUESTIONS } from "@/data/questions";
import { audio } from "@/game/audio";
import { isComplete, isCorrect, misconceptionFor, stableShuffle } from "@/game/answer";
import { setTitle } from "@/game/curriculum";
import { nextRecoveryLength, useGame } from "@/game/store";
import type { Question } from "@/game/types";
import { cn } from "@/lib/utils";
import { BrainCelebration } from "./BrainCelebration";
import { Diagram } from "./Diagram";
import { ElectricRecall } from "./ElectricRecall";
import { Finale } from "./Finale";
import { Interaction } from "./Interactions";
import { SettingsPanel } from "./SettingsPanel";
import { TitleScreen } from "./TitleScreen";
import { ValidationPanel } from "./ValidationPanel";
import { WorldBackground } from "./WorldBackground";

type Screen = "title" | "play" | "settings" | "validate" | "finale" | "gameover";
type Mode = "campaign" | "practice" | "archive" | "review" | "mastery";
type Phase = "answering" | "revealed" | "recall";

const btn =
  "rounded-lg border border-cyan/50 bg-deepblue/70 px-4 py-2 font-display text-xs uppercase tracking-[0.2em] text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-40";

function Hud({
  question,
  number,
  total,
  score,
  streak,
  recoveryLength,
  onPause,
}: {
  question: Question;
  number: number;
  total: number;
  score: number;
  streak: number;
  recoveryLength: number;
  onPause: () => void;
}) {
  return (
    <header className="panel flex flex-wrap items-center gap-x-6 gap-y-2 p-3 font-mono text-xs uppercase tracking-widest">
      <span className="text-cyan">
        Question {String(number).padStart(3, "0")} / {total}
      </span>
      <span className="text-amber">Score {score}</span>
      <span className="text-mint">Streak {streak}</span>
      <span className="text-magenta">{question.audioGenre}</span>
      <span className="flex items-center gap-1 text-muted-foreground">
        Recall {recoveryLength}
        {recoveryLength <= 2 && (
          <span className="flex gap-1" aria-label="Two bio-energy plants remaining">
            <span className="size-2 rounded-full bg-mint glow-mint" />
            <span className="size-2 rounded-full bg-mint glow-mint" />
          </span>
        )}
      </span>
      <button type="button" onClick={onPause} className="ml-auto rounded-md border border-border px-3 py-1 text-[10px]">
        Pause
      </button>
    </header>
  );
}

export function AeroGrid() {
  const { settings, progress, setProgress, resetCampaign, hydrated } = useGame();
  const [screen, setScreen] = React.useState<Screen>("title");
  const [mode, setMode] = React.useState<Mode>("campaign");
  const [localIndex, setLocalIndex] = React.useState(0);
  const [answer, setAnswer] = React.useState<string[]>([]);
  const [phase, setPhase] = React.useState<Phase>("answering");
  const [wasCorrect, setWasCorrect] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [wipe, setWipe] = React.useState(false);
  const [celebrationBurst, setCelebrationBurst] = React.useState(0);
  const [reviewIds, setReviewIds] = React.useState<string[]>([]);

  const list = React.useMemo<Question[]>(() => {
    switch (mode) {
      case "campaign":
        return allQuestions;
      case "practice":
        return stableShuffle(aeroQuestions, "practice");
      case "archive":
        return impactArchive;
      case "mastery":
        return stableShuffle(allQuestions, "mastery");
      case "review":
        return allQuestions.filter((q) => reviewIds.includes(q.id));
      default:
        return allQuestions;
    }
  }, [mode, reviewIds]);

  const index = mode === "campaign" ? progress.index : localIndex;
  const question = list[Math.min(index, list.length - 1)];

  React.useEffect(() => {
    if (!question) return;
    audio.setGenre(question.audioGenre, 0.5 + Math.min(0.4, progress.streak * 0.05));
  }, [question, progress.streak]);

  const startAudio = () => {
    audio.init();
    audio.resume();
    audio.startMusic();
  };

  const beginRun = (nextMode: Mode, ids: string[] = []) => {
    startAudio();
    setMode(nextMode);
    setReviewIds(ids);
    setLocalIndex(0);
    setAnswer([]);
    setPhase("answering");
    setShowHint(false);
    setScreen("play");
  };

  const submit = () => {
    if (!question || phase !== "answering" || !isComplete(question, answer)) return;
    const ok = isCorrect(question, answer);
    setWasCorrect(ok);
    setPhase("revealed");
    audio.play(ok ? "correct" : "wrong");
    if (ok) setCelebrationBurst((burst) => burst + 1);
    if (ok && settings.interstitials !== "off") {
      setWipe(true);
      window.setTimeout(() => setWipe(false), settings.interstitials === "full" ? 2000 : 800);
    }
    if (mode !== "campaign") return;
    setProgress((p) => {
      const streak = ok ? p.streak + 1 : 0;
      return {
        score: p.score + (ok ? question.points + Math.min(50, streak * 5) : 0),
        streak,
        bestStreak: Math.max(p.bestStreak, streak),
        correctCount: p.correctCount + (ok ? 1 : 0),
        answeredCount: p.answeredCount + 1,
        answeredIds: [...new Set([...p.answeredIds, question.id])],
        missedIds: ok ? p.missedIds : [...new Set([...p.missedIds, question.id])],
      };
    });
  };

  const advance = () => {
    setAnswer([]);
    setShowHint(false);
    setPhase("answering");
    const last = index + 1 >= list.length;
    if (mode === "campaign") {
      if (last) {
        setProgress({ completed: true });
        setScreen("finale");
        return;
      }
      setProgress((p) => ({ index: p.index + 1 }));
    } else {
      if (last) {
        setScreen("title");
        return;
      }
      setLocalIndex((i) => i + 1);
    }
  };

  const afterReveal = () => {
    if (wasCorrect || mode !== "campaign") {
      advance();
      return;
    }
    setPhase("recall");
  };

  const recallResult = (won: boolean) => {
    const current = progress.recoveryLength;
    if (!won && current <= 2) {
      setProgress((p) => ({ recallLosses: p.recallLosses + 1, gameOver: true }));
      setScreen("gameover");
      return;
    }
    setProgress((p) => ({
      recoveryLength: nextRecoveryLength(p.recoveryLength, won),
      recallWins: p.recallWins + (won ? 1 : 0),
      recallLosses: p.recallLosses + (won ? 0 : 1),
    }));
    advance();
  };

  if (!hydrated) return null;

  const worldProgress = progress.index / TOTAL_QUESTIONS;

  return (
    <div className="min-h-screen px-4 py-6">
      <WorldBackground
        progress={worldProgress}
        scanlines={settings.scanlines}
        reducedMotion={settings.reducedMotion}
      />

      <BrainCelebration burst={celebrationBurst} reducedMotion={settings.reducedMotion} />

      {screen === "title" && (
        <TitleScreen
          hasSave={progress.answeredCount > 0 && !progress.gameOver}
          onStart={() => {
            resetCampaign();
            beginRun("campaign");
          }}
          onResume={() => beginRun("campaign")}
          onPractice={() => beginRun("practice")}
          onArchive={() => beginRun("archive")}
          onSettings={() => setScreen("settings")}
          onValidate={() => setScreen("validate")}
        />
      )}

      {screen === "settings" && <SettingsPanel onBack={() => setScreen("title")} />}
      {screen === "validate" && <ValidationPanel onBack={() => setScreen("title")} />}

      {screen === "finale" && (
        <Finale
          progress={progress}
          total={TOTAL_QUESTIONS}
          reducedMotion={settings.reducedMotion}
          onReviewMissed={() => beginRun("review", progress.missedIds)}
          onMastery={() => beginRun("mastery")}
          onMenu={() => setScreen("title")}
        />
      )}

      {screen === "gameover" && (
        <div className="panel mx-auto w-full max-w-xl p-6 text-center">
          <h2 className="font-display text-3xl text-orange">GAME OVER</h2>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            The bio-energy plants went dark. Score {progress.score} · {progress.correctCount} correct.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className={btn}
              onClick={() => {
                const chapterStart = allQuestions.findIndex((q) => q.chapterId === question?.chapterId);
                setProgress({ index: Math.max(0, chapterStart), gameOver: false, recoveryLength: 5, streak: 0 });
                setScreen("play");
                setPhase("answering");
                setAnswer([]);
              }}
            >
              Restart chapter
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => {
                resetCampaign();
                beginRun("campaign");
              }}
            >
              Restart campaign
            </button>
            <button
              type="button"
              className={btn}
              disabled={!progress.missedIds.length}
              onClick={() => beginRun("review", progress.missedIds)}
            >
              Review missed
            </button>
            <button type="button" className={btn} onClick={() => setScreen("title")}>
              Main menu
            </button>
          </div>
        </div>
      )}

      {screen === "play" && question && (
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <Hud
            question={question}
            number={mode === "campaign" ? question.globalNumber : index + 1}
            total={mode === "campaign" ? TOTAL_QUESTIONS : list.length}
            score={progress.score}
            streak={progress.streak}
            recoveryLength={progress.recoveryLength}
            onPause={() => setPaused(true)}
          />

          {paused && (
            <div className="panel space-y-3 p-5 text-center">
              <h2 className="font-display text-xl text-cyan">PAUSED</h2>
              <div className="flex flex-wrap justify-center gap-3">
                <button type="button" className={btn} onClick={() => setPaused(false)}>
                  Resume
                </button>
                <button type="button" className={btn} onClick={() => { setPaused(false); setScreen("settings"); }}>
                  Settings
                </button>
                <button type="button" className={btn} onClick={() => { setPaused(false); setScreen("title"); }}>
                  Main menu
                </button>
              </div>
            </div>
          )}

          {!paused && phase === "recall" && (
            <ElectricRecall
              key={`${question.id}-recall`}
              length={progress.recoveryLength}
              reducedMotion={settings.reducedMotion}
              onResult={recallResult}
            />
          )}

          {!paused && phase !== "recall" && (
            <section className="panel space-y-5 p-5">
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                <span className="text-cyan">{setTitle(question.setId)}</span>
                {question.category.toLowerCase() !== setTitle(question.setId).toLowerCase() && (
                  <span>{question.category}</span>
                )}
                <span className="text-amber">Difficulty {question.difficulty}</span>
              </div>

              <h1 className="font-display text-xl leading-snug text-moon sm:text-2xl">{question.prompt}</h1>

              {question.diagramType &&
                !["hotspot", "label-placement", "vector-placement"].includes(question.interactionType) && (
                  <Diagram type={question.diagramType} />
                )}

              <Interaction
                question={question}
                answer={answer}
                setAnswer={setAnswer}
                locked={phase !== "answering"}
              />

              {showHint && phase === "answering" && (
                <p className="rounded-md border border-amber/50 bg-amber/10 p-3 text-sm text-amber">
                  Hint: {question.hint}
                </p>
              )}

              {phase === "revealed" && (
                <div
                  className={cn(
                    "space-y-2 rounded-md border p-4 text-sm",
                    wasCorrect ? "border-mint bg-mint/10 text-mint" : "border-orange bg-orange/10 text-orange",
                  )}
                >
                  <p className="font-display text-base">{wasCorrect ? "CORRECT" : "NOT QUITE"}</p>
                  {!wasCorrect && (
                    <p className="text-moon">
                      Answer: <span className="font-mono">{question.correctAnswer.join(" · ")}</span>
                    </p>
                  )}
                  {!wasCorrect && misconceptionFor(question, answer) && (
                    <p className="text-moon">{misconceptionFor(question, answer)}</p>
                  )}
                  <p className="text-moon">{question.explanation}</p>
                  {question.formula && <p className="font-mono text-cyan">{question.formula}</p>}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {phase === "answering" ? (
                  <>
                    <button
                      type="button"
                      className={btn}
                      disabled={!isComplete(question, answer)}
                      onClick={submit}
                    >
                      Submit
                    </button>
                    <button type="button" className={btn} onClick={() => setShowHint(true)} disabled={showHint}>
                      Hint
                    </button>
                    <button type="button" className={btn} onClick={() => setAnswer([])}>
                      Clear
                    </button>
                  </>
                ) : (
                  <button type="button" className={btn} onClick={afterReveal}>
                    {wasCorrect || mode !== "campaign" ? "Continue" : "Electric Recall"}
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {wipe && !settings.reducedMotion && (
        <div
          className="pointer-events-none fixed inset-y-1/2 left-0 z-50 h-1 w-full bg-mint/80"
          style={{ animation: "aerogrid-pass 1.4s ease-in-out", boxShadow: "0 0 30px var(--color-mint)" }}
          aria-hidden
        />
      )}
    </div>
  );
}
