import * as React from "react";
import { allQuestions, aeroQuestions, highSpeedQuestionsOnly, TOTAL_QUESTIONS } from "@/data/questions";
import { audio } from "@/game/audio";
import { isComplete, isCorrect, misconceptionFor, stableShuffle } from "@/game/answer";
import { setTitle } from "@/game/curriculum";
import { nextRecoveryLength, useGame } from "@/game/store";
import type { Question } from "@/game/types";
import { cn } from "@/lib/utils";
import { extremeQuestions } from "@/game/extreme";
import { BrainCelebration } from "./BrainCelebration";
import { BrainOverload } from "./BrainOverload";
import { HealthBar, MAX_HP } from "./HealthBar";
import { MemoryGauntlet } from "./MemoryGauntlet";
import { Diagram } from "./Diagram";
import { ElectricRecall } from "./ElectricRecall";
import { Finale } from "./Finale";
import { Interaction } from "./Interactions";
import { LightCycleGame } from "./LightCycleGame";
import { NeonMazeGame } from "./NeonMazeGame";
import { SettingsPanel } from "./SettingsPanel";
import { TitleScreen } from "./TitleScreen";
import { ValidationPanel } from "./ValidationPanel";
import { WorldBackground } from "./WorldBackground";

type Screen =
  | "title"
  | "play"
  | "settings"
  | "validate"
  | "finale"
  | "gameover"
  | "lightcycle"
  | "maze"
  | "gauntlet";
type Mode = "campaign" | "practice" | "high-speed" | "review" | "mastery" | "extreme";
type Phase = "answering" | "revealed" | "recall";
type IntermissionGame = "lightcycle" | "maze";

interface PendingIntermission {
  correctMilestone: number;
  questionCheckpoint: number;
  game: IntermissionGame;
}

const checkpointForQuestion = (number: number) =>
  number >= 150 && number <= 300 && number % 50 === 0 ? number : 0;

const selectIntermission = (correctMilestone: number, questionCheckpoint: number, questionNumber: number): IntermissionGame => {
  if (questionNumber < 150) return "lightcycle";
  let seed = 2166136261;
  [correctMilestone, questionCheckpoint, questionNumber].forEach((value) => {
    seed = Math.imul(seed ^ value, 16777619);
  });
  return (seed >>> 0) % 2 === 0 ? "lightcycle" : "maze";
};

const btn =
  "rounded-lg border border-cyan/50 bg-deepblue/70 px-4 py-2 font-display text-xs uppercase tracking-[0.2em] text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-40";

function Hud({
  question,
  number,
  total,
  score,
  streak,
  recoveryLength,
  glow,
  onPause,
}: {
  question: Question;
  number: number;
  total: number;
  score: number;
  streak: number;
  recoveryLength: number;
  glow?: boolean;
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
      <HealthBar hp={recoveryLength} glow={glow} />
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
  const [pendingIntermission, setPendingIntermission] = React.useState<PendingIntermission | null>(null);
  const [sceneFading, setSceneFading] = React.useState(false);
  const [reviewIds, setReviewIds] = React.useState<string[]>([]);
  const [extremeScore, setExtremeScore] = React.useState(0);
  const [overloadBurst, setOverloadBurst] = React.useState(0);
  const [psychedelicActive, setPsychedelicActive] = React.useState(false);
  const [gauntletRecovery, setGauntletRecovery] = React.useState(false);

  const awakenBloodMoon = React.useCallback(() => {
    setProgress((current) => current.bloodMoonAwakened ? {} : { bloodMoonAwakened: true });
  }, [setProgress]);

  const list = React.useMemo<Question[]>(() => {
    switch (mode) {
      case "campaign":
        return allQuestions;
      case "practice":
        return stableShuffle(aeroQuestions, "practice");
      case "high-speed":
        return highSpeedQuestionsOnly;
      case "extreme":
        return extremeQuestions;
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

  const beginRun = (nextMode: Mode, ids: string[] = [], resumeMilestone = false) => {
    startAudio();
    setMode(nextMode);
    setReviewIds(ids);
    setLocalIndex(0);
    setAnswer([]);
    setPhase("answering");
    setShowHint(false);
    const currentQuestion = allQuestions[Math.min(progress.index, allQuestions.length - 1)];
    const completedQuestionNumber = currentQuestion && progress.answeredIds.includes(currentQuestion.id)
      ? currentQuestion.globalNumber
      : Math.max(0, (currentQuestion?.globalNumber ?? 1) - 1);
    const dueMilestone = Math.floor(progress.correctCount / 15);
    const dueCheckpoint = [150, 200, 250, 300].filter(
      (value) => value <= completedQuestionNumber && value > progress.intermissionQuestionCheckpoint,
    ).at(-1) ?? 0;
    if (nextMode === "campaign" && resumeMilestone && (dueMilestone > progress.lightCycleMilestone || dueCheckpoint > 0)) {
      const pending = {
        correctMilestone: dueMilestone > progress.lightCycleMilestone ? dueMilestone : 0,
        questionCheckpoint: dueCheckpoint,
        game: selectIntermission(dueMilestone, dueCheckpoint, completedQuestionNumber),
      } satisfies PendingIntermission;
      setPendingIntermission(pending);
      setScreen(pending.game);
    } else {
      setPendingIntermission(null);
      setScreen("play");
    }
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
    if (mode === "extreme") {
      setExtremeScore((value) => value + (ok ? question.points : 0));
      return;
    }
    if (mode !== "campaign") return;
    const nextCorrectCount = progress.correctCount + (ok ? 1 : 0);
    const milestone = Math.floor(nextCorrectCount / 15);
    const correctMilestone = ok && milestone > progress.lightCycleMilestone ? milestone : 0;
    const checkpoint = checkpointForQuestion(question.globalNumber);
    const questionCheckpoint = checkpoint > progress.intermissionQuestionCheckpoint ? checkpoint : 0;
    if (correctMilestone > 0 || questionCheckpoint > 0) {
      setPendingIntermission({
        correctMilestone,
        questionCheckpoint,
        game: selectIntermission(correctMilestone, questionCheckpoint, question.globalNumber),
      });
    }
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

  const enterPendingIntermission = () => {
    if (!pendingIntermission) return;
    if (settings.reducedMotion) {
      setScreen(pendingIntermission.game);
      return;
    }
    setSceneFading(true);
    window.setTimeout(() => {
      setScreen(pendingIntermission.game);
      window.setTimeout(() => setSceneFading(false), 40);
    }, 420);
  };

  const afterReveal = () => {
    if (wasCorrect && mode === "campaign" && pendingIntermission) {
      enterPendingIntermission();
      return;
    }
    if (wasCorrect || (mode !== "campaign" && mode !== "extreme")) {
      advance();
      return;
    }
    if (mode === "extreme") {
      setGauntletRecovery(true);
      setScreen("gauntlet");
      return;
    }
    setPhase("recall");
  };

  const gainRecall = React.useCallback(() => {
    setProgress((p) => {
      const next = Math.min(MAX_HP, p.recoveryLength + 3);
      if (next > 11 && next > p.recoveryLength) setOverloadBurst((burst) => burst + 1);
      return { recoveryLength: next, recallWins: p.recallWins + 1 };
    });
  }, [setProgress]);

  const damageRecall = React.useCallback(() => {
    setProgress((p) => ({
      recoveryLength: Math.max(2, p.recoveryLength - 3),
      recallLosses: p.recallLosses + 1,
    }));
  }, [setProgress]);

  const recallResult = (won: boolean) => {
    const current = progress.recoveryLength;
    if (!won && current <= 2) {
      setProgress((p) => ({ recallLosses: p.recallLosses + 1, gameOver: true }));
      setScreen("gameover");
      return;
    }
    setProgress((p) => {
      const next = nextRecoveryLength(p.recoveryLength, won);
      if (mode === "extreme" && next > 11 && next > p.recoveryLength) setOverloadBurst((burst) => burst + 1);
      return {
        recoveryLength: next,
        recallWins: p.recallWins + (won ? 1 : 0),
        recallLosses: p.recallLosses + (won ? 0 : 1),
      };
    });
    if (pendingIntermission) {
      enterPendingIntermission();
      return;
    }
    advance();
  };

  const exitRecoveryGauntlet = (cleared: boolean) => {
    if (!cleared && progress.recoveryLength <= 2) {
      setProgress((p) => ({ recallLosses: p.recallLosses + 1, gameOver: true }));
      setScreen("gameover");
      return;
    }
    setScreen("play");
    setPhase("answering");
    setAnswer([]);
    setShowHint(false);
  };

  const finishIntermission = () => {
    if (!pendingIntermission) return;
    setProgress((p) => ({
      lightCycleMilestone: Math.max(p.lightCycleMilestone, pendingIntermission.correctMilestone),
      intermissionQuestionCheckpoint: Math.max(p.intermissionQuestionCheckpoint, pendingIntermission.questionCheckpoint),
    }));
    const returnToTrivia = () => {
      advance();
      setPendingIntermission(null);
      setScreen("play");
      audio.setTempoMultiplier(1);
      if (question) audio.setGenre(question.audioGenre, 0.5 + Math.min(0.4, progress.streak * 0.05));
    };
    if (settings.reducedMotion) {
      returnToTrivia();
      return;
    }
    setSceneFading(true);
    window.setTimeout(() => {
      returnToTrivia();
      window.setTimeout(() => setSceneFading(false), 40);
    }, 420);
  };

  if (!hydrated) return null;

  const worldProgress = progress.index / TOTAL_QUESTIONS;

  return (
    <div className={cn("min-h-screen px-4 py-6", progress.bloodMoonAwakened && "blood-moon-active")}>
      <WorldBackground
        progress={worldProgress}
        scanlines={settings.scanlines}
        reducedMotion={settings.reducedMotion}
        bloodMoon={progress.bloodMoonAwakened}
        psychedelic={psychedelicActive}
      />

      <BrainCelebration burst={celebrationBurst} reducedMotion={settings.reducedMotion} />
      <BrainOverload
        burst={overloadBurst}
        reducedMotion={settings.reducedMotion}
        onDone={() => {
          setOverloadBurst(0);
          if (mode === "extreme") setPsychedelicActive(true);
        }}
      />

      {screen === "title" && (
        <TitleScreen
          hasSave={progress.answeredCount > 0 && !progress.gameOver}
          onStart={() => {
            resetCampaign();
            beginRun("campaign");
          }}
          onResume={() => beginRun("campaign", [], true)}
          onPractice={() => beginRun("practice")}
          onHighSpeed={() => beginRun("high-speed")}
          onExtreme={() => {
            startAudio();
            setMode("extreme");
            setReviewIds([]);
            setLocalIndex(0);
            setAnswer([]);
            setPhase("answering");
            setShowHint(false);
            setExtremeScore(0);
            setPendingIntermission(null);
            setGauntletRecovery(false);
            setOverloadBurst(0);
            setPsychedelicActive(false);
            setScreen("gauntlet");
          }}
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

      {screen === "lightcycle" && (
        <LightCycleGame
          key={`cycle-${pendingIntermission?.correctMilestone ?? 0}-${pendingIntermission?.questionCheckpoint ?? 0}`}
          milestone={Math.max(1, pendingIntermission?.correctMilestone ?? Math.floor(progress.correctCount / 15))}
          reducedMotion={settings.reducedMotion}
          onComplete={finishIntermission}
        />
      )}

      {screen === "maze" && (
        <NeonMazeGame
          key={`maze-${pendingIntermission?.correctMilestone ?? 0}-${pendingIntermission?.questionCheckpoint ?? 0}`}
          milestone={Math.max(1, pendingIntermission?.correctMilestone ?? Math.floor(progress.correctCount / 15))}
          reducedMotion={settings.reducedMotion}
          onComplete={finishIntermission}
        />
      )}

      {screen === "gauntlet" && (
        <div className="extreme-shell mx-auto w-full max-w-3xl">
          <MemoryGauntlet
            reducedMotion={settings.reducedMotion}
            hp={progress.recoveryLength}
            onOvercharge={gainRecall}
            onDamage={damageRecall}
            onComplete={(score) => {
              setExtremeScore(score);
              setScreen("play");
            }}
            onAbort={() => setScreen("title")}
          />
        </div>
      )}

      {(screen === "lightcycle" || screen === "maze") && (
        <div className="mx-auto mt-4 w-full max-w-3xl">
          <HealthBar hp={progress.recoveryLength} className="justify-center" />
        </div>
      )}

      {screen === "play" && question && (
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <Hud
            question={question}
            number={mode === "campaign" ? question.globalNumber : index + 1}
            total={mode === "campaign" ? TOTAL_QUESTIONS : list.length}
            score={mode === "extreme" ? extremeScore : progress.score}
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
              questionNumber={question.globalNumber}
              reducedMotion={settings.reducedMotion}
              onEvolved={awakenBloodMoon}
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

      {sceneFading && <div className="scene-fade" aria-hidden />}
    </div>
  );
}
