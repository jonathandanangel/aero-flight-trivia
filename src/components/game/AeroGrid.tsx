import * as React from "react";
import { allQuestions, aeroQuestions, highSpeedQuestionsOnly, TOTAL_QUESTIONS } from "@/data/questions";
import { audio } from "@/game/audio";
import { isComplete, isCorrect, misconceptionFor, stableShuffle } from "@/game/answer";
import { setTitle } from "@/game/curriculum";
import { nextRecoveryLength, useGame } from "@/game/store";
import type { Question } from "@/game/types";
import { cn } from "@/lib/utils";
import { extremeQuestions, EXTREME_INFERNO_START_INDEX } from "@/game/extreme";
import {
  EXTREME_V2_INFERNO_START_INDEX,
  extremeV2Questions,
  isExtremeFamily,
} from "@/game/extreme-v2";
import {
  HT_INFERNO_START_INDEX,
  heatTransferExtremeQuestions,
} from "@/game/heat-transfer-extreme";
import {
  heatTransferIntroQuestions,
} from "@/game/heat-transfer-intro";
import { BrainCelebration } from "./BrainCelebration";
import { BrainOverload } from "./BrainOverload";
import { HealthBar } from "./HealthBar";
import { MemoryGauntlet } from "./MemoryGauntlet";
import { ExtremeBriefing } from "./ExtremeBriefing";
import { ExtremeV2Briefing } from "./ExtremeV2Briefing";
import { ExtremeV2Review, type ExtremeV2LogEntry } from "./ExtremeV2Review";
import { HeatTransferExtremeBriefing } from "./HeatTransferExtremeBriefing";
import { HeatTransferExtremeReview, type HtLogEntry } from "./HeatTransferExtremeReview";
import { HeatTransferIntroBriefing } from "./HeatTransferIntroBriefing";
import { HeatTransferIntroReview, type HtIntroLogEntry } from "./HeatTransferIntroReview";
import { HeatTransferChapterJump } from "./HeatTransferChapterJump";
import { getHtBananzaChapters, htChapterAtIndex } from "@/game/ht-chapters";
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
  | "gauntlet"
  | "briefing"
  | "v2-review"
  | "ht-review"
  | "hti-review"
  | "ht-chapter-jump";
type Mode =
  | "campaign"
  | "practice"
  | "high-speed"
  | "review"
  | "mastery"
  | "extreme"
  | "extreme-v2"
  | "ht-extreme"
  | "ht-intro";
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
  const [v2Log, setV2Log] = React.useState<ExtremeV2LogEntry[]>([]);
  const [htLog, setHtLog] = React.useState<HtLogEntry[]>([]);
  const [htiLog, setHtiLog] = React.useState<HtIntroLogEntry[]>([]);
  const [extremeCorrectCount, setExtremeCorrectCount] = React.useState(0);
  const [htJumpNeedsAdvance, setHtJumpNeedsAdvance] = React.useState(false);
  const [enochGatePending, setEnochGatePending] = React.useState(false);

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
      case "extreme-v2":
        return extremeV2Questions;
      case "ht-extreme":
        return heatTransferExtremeQuestions;
      case "ht-intro":
        return heatTransferIntroQuestions;
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
    if (screen === "title") {
      audio.stopHeatTransferBed();
      audio.stopWindEscalation();
      audio.stopThermalAmbience();
      audio.stopMusic();
      audio.setTempoMultiplier(1);
      audio.startTitlePlaylist();
      return () => {
        audio.stopTitlePlaylist();
      };
    }
    return undefined;
  }, [screen]);

  // Keep HT Intro / Bananza beds continuous across questions, gauntlets, and briefings.
  const htAudioSession =
    (mode === "ht-intro" || mode === "ht-extreme") &&
    screen !== "title" &&
    screen !== "settings" &&
    screen !== "validate"
      ? mode
      : null;

  // Open Enoch-Ra chapter gate once overload finishes (wait out an active gauntlet).
  React.useEffect(() => {
    if (!enochGatePending || mode !== "ht-extreme") return;
    if (screen === "gauntlet" || screen === "ht-chapter-jump") return;
    setEnochGatePending(false);
    setHtJumpNeedsAdvance(false);
    setScreen("ht-chapter-jump");
  }, [enochGatePending, screen, mode]);

  React.useEffect(() => {
    if (!htAudioSession) return undefined;
    audio.stopTitlePlaylist();
    if (htAudioSession === "ht-intro") {
      audio.startHeatTransferBed("intro");
      audio.stopWindEscalation();
      audio.stopThermalAmbience();
    } else {
      audio.startHeatTransferBed("bananza");
      audio.startWindEscalation();
      audio.startThermalAmbience();
    }
    return () => {
      audio.stopHeatTransferBed();
      audio.stopWindEscalation();
      audio.stopThermalAmbience();
      audio.setTempoMultiplier(1);
    };
  }, [htAudioSession]);

  React.useEffect(() => {
    if (htAudioSession !== "ht-extreme") return;
    const windLevel = Math.min(9, Math.floor(localIndex / 10));
    audio.setWindTrack(windLevel);
    audio.setTempoMultiplier(1 + windLevel * 0.08);
  }, [htAudioSession, localIndex]);

  React.useEffect(() => {
    if (screen === "title" || screen === "settings" || screen === "validate") {
      return undefined;
    }
    if (mode === "ht-intro" || mode === "ht-extreme") {
      return undefined;
    }
    if (isExtremeFamily(mode)) {
      // Every 3 completed questions the turbulent track rotates and escalates.
      const stage = Math.floor(localIndex / 3);
      const track = stage % 5;
      const cycle = Math.floor(stage / 5);
      audio.setGenre("supersonic", 1);
      audio.setExtremeTrack(track);
      audio.setTempoMultiplier(Math.min(2.6, 1.3 + track * 0.16 + cycle * 0.12));
      return () => {
        audio.setTempoMultiplier(1);
        audio.setExtremeTrack(0);
      };
    }
    if (!question) return undefined;
    audio.setGenre(question.audioGenre, 0.5 + Math.min(0.4, progress.streak * 0.05));
    return undefined;
  }, [question, progress.streak, mode, localIndex, screen]);


  const startAudio = () => {
    audio.init();
    audio.resume();
    audio.stopTitlePlaylist();
    audio.startMusic();
  };

  const unlockTitleAudio = () => {
    audio.init();
    audio.resume();
    audio.startTitlePlaylist();
  };

  const beginRun = (nextMode: Mode, ids: string[] = [], resumeMilestone = false) => {
    startAudio();
    setMode(nextMode);
    setReviewIds(ids);
    setLocalIndex(0);
    setAnswer([]);
    setPhase("answering");
    setShowHint(false);
    setGauntletRecovery(false);
    setOverloadBurst(0);
    setPsychedelicActive(false);
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
    if (isExtremeFamily(mode)) {
      setExtremeScore((value) => value + (ok ? question.points : 0));
      if (mode === "extreme" && ok) {
        setExtremeCorrectCount((value) => value + 1);
      }
      if (mode === "extreme-v2") {
        setV2Log((entries) => [
          ...entries.filter((entry) => entry.id !== question.id),
          { id: question.id, given: answer.join(" · "), ok },
        ]);
      }
      if (mode === "ht-extreme") {
        setHtLog((entries) => [
          ...entries.filter((entry) => entry.id !== question.id),
          { id: question.id, given: answer.join(" · "), ok },
        ]);
      }
      if (mode === "ht-intro") {
        setHtiLog((entries) => [
          ...entries.filter((entry) => entry.id !== question.id),
          { id: question.id, given: answer.join(" · "), ok },
        ]);
      }
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
        if (isExtremeFamily(mode)) {
          setScreen("finale");
          return;
        }
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
    if (wasCorrect || (mode !== "campaign" && !isExtremeFamily(mode))) {
      advance();
      return;
    }
    if (isExtremeFamily(mode)) {
      setGauntletRecovery(true);
      setScreen("gauntlet");
      return;
    }
    setPhase("recall");
  };

  const gainRecall = React.useCallback(() => {
    setProgress((p) => {
      const next = p.recoveryLength + 3;
      if (next > 11) setOverloadBurst((burst) => burst + 1);
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
      if (isExtremeFamily(mode) && next > 11 && next > p.recoveryLength) setOverloadBurst((burst) => burst + 1);
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
    setGauntletRecovery(false);
    if (!cleared && progress.recoveryLength <= 2) {
      setProgress((p) => ({ recallLosses: p.recallLosses + 1, gameOver: true }));
      setScreen("gameover");
      return;
    }
    setScreen("play");
    advance();
  };

  const openHtChapterGate = (needsAdvance: boolean) => {
    setHtJumpNeedsAdvance(needsAdvance);
    setEnochGatePending(false);
    setAnswer([]);
    setShowHint(false);
    setPhase("answering");
    setScreen("ht-chapter-jump");
  };

  const continueHtChapterGate = () => {
    if (htJumpNeedsAdvance) {
      setHtJumpNeedsAdvance(false);
      setScreen("play");
      advance();
      return;
    }
    setHtJumpNeedsAdvance(false);
    setAnswer([]);
    setShowHint(false);
    setPhase("answering");
    setScreen("play");
  };

  const jumpToHtChapter = (chapterId: string) => {
    const target = getHtBananzaChapters().find((chapter) => chapter.id === chapterId);
    if (!target) return;
    const start = target.startIndex;
    const bank = heatTransferExtremeQuestions;

    if (start > localIndex) {
      const skipped = bank.slice(localIndex, start);
      setHtLog((entries) => {
        const known = new Set(entries.map((entry) => entry.id));
        let gained = 0;
        const next = [...entries];
        for (const question of skipped) {
          if (!known.has(question.id)) {
            next.push({ id: question.id, given: "(chapter jump · credited)", ok: true });
            gained += question.points;
          }
        }
        if (gained > 0) {
          setExtremeScore((value) => value + gained);
        }
        return next;
      });
    } else if (start < localIndex) {
      const replayIds = new Set(bank.slice(start).map((question) => question.id));
      setHtLog((entries) => {
        const removedPoints = entries
          .filter((entry) => replayIds.has(entry.id) && entry.ok)
          .reduce((sum, entry) => {
            const question = bank.find((item) => item.id === entry.id);
            return sum + (question?.points ?? 0);
          }, 0);
        if (removedPoints > 0) {
          setExtremeScore((value) => Math.max(0, value - removedPoints));
        }
        return entries.filter((entry) => !replayIds.has(entry.id));
      });
    }

    setHtJumpNeedsAdvance(false);
    setEnochGatePending(false);
    setLocalIndex(start);
    setAnswer([]);
    setShowHint(false);
    setPhase("answering");
    setScreen("play");
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
  const infernoActive =
    (mode === "extreme" && index >= EXTREME_INFERNO_START_INDEX) ||
    (mode === "extreme-v2" && index >= EXTREME_V2_INFERNO_START_INDEX) ||
    (mode === "ht-extreme" && index >= HT_INFERNO_START_INDEX);
  // Heat Transfer Intro stays visually calm — no inferno escalation.

  return (
    <div className={cn("min-h-screen px-4 py-6", progress.bloodMoonAwakened && "blood-moon-active")}>
      <WorldBackground
        progress={worldProgress}
        scanlines={settings.scanlines}
        reducedMotion={settings.reducedMotion}
        bloodMoon={progress.bloodMoonAwakened}
        psychedelic={psychedelicActive}
        inferno={infernoActive}
      />

      <BrainCelebration burst={celebrationBurst} reducedMotion={settings.reducedMotion} />
      <BrainOverload
        burst={overloadBurst}
        reducedMotion={settings.reducedMotion}
        onDone={() => {
          setOverloadBurst(0);
          if (isExtremeFamily(mode)) setPsychedelicActive(true);
          // Every Enoch-Ra trigger in Bananza arms the chapter gate (skip ahead or return).
          if (mode === "ht-extreme") setEnochGatePending(true);
        }}
      />

      {screen === "title" && (
        <TitleScreen
          hasSave={progress.answeredCount > 0 && !progress.gameOver}
          onUnlockAudio={unlockTitleAudio}
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
            setExtremeCorrectCount(0);
            setV2Log([]);
            setHtLog([]);
            setHtiLog([]);
            setPendingIntermission(null);
            setGauntletRecovery(false);
            setOverloadBurst(0);
            setPsychedelicActive(false);
            setScreen("briefing");
          }}
          onExtremeV2={() => {
            startAudio();
            setMode("extreme-v2");
            setReviewIds([]);
            setLocalIndex(0);
            setAnswer([]);
            setPhase("answering");
            setShowHint(false);
            setExtremeScore(0);
            setExtremeCorrectCount(0);
            setV2Log([]);
            setHtLog([]);
            setHtiLog([]);
            setPendingIntermission(null);
            setGauntletRecovery(false);
            setOverloadBurst(0);
            setPsychedelicActive(false);
            setScreen("briefing");
          }}
          onHeatTransferIntro={() => {
            startAudio();
            setMode("ht-intro");
            setReviewIds([]);
            setLocalIndex(0);
            setAnswer([]);
            setPhase("answering");
            setShowHint(false);
            setExtremeScore(0);
            setExtremeCorrectCount(0);
            setV2Log([]);
            setHtLog([]);
            setHtiLog([]);
            setPendingIntermission(null);
            setGauntletRecovery(false);
            setOverloadBurst(0);
            setPsychedelicActive(false);
            setScreen("briefing");
          }}
          onHeatTransferExtreme={() => {
            startAudio();
            setMode("ht-extreme");
            setReviewIds([]);
            setLocalIndex(0);
            setAnswer([]);
            setPhase("answering");
            setShowHint(false);
            setExtremeScore(0);
            setExtremeCorrectCount(0);
            setV2Log([]);
            setHtLog([]);
            setHtiLog([]);
            setPendingIntermission(null);
            setGauntletRecovery(false);
            setOverloadBurst(0);
            setPsychedelicActive(false);
            setEnochGatePending(false);
            setHtJumpNeedsAdvance(false);
            setScreen("briefing");
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
          total={isExtremeFamily(mode) ? list.length : TOTAL_QUESTIONS}
          reducedMotion={settings.reducedMotion}
          onReviewMissed={() => beginRun("review", progress.missedIds)}
          onMastery={() => beginRun("mastery")}
          onMenu={() => setScreen("title")}
          {...(mode === "extreme"
            ? {
                extremeMission: {
                  title: "Aerodynamics Extreme",
                  score: extremeScore,
                  correct: extremeCorrectCount,
                  total: list.length,
                  continueLabel: "Main menu",
                  onContinue: () => setScreen("title"),
                },
              }
            : mode === "extreme-v2"
              ? {
                  extremeMission: {
                    title: "Aerodynamics Extreme V2",
                    score: v2Log.filter((entry) => entry.ok).length,
                    correct: v2Log.filter((entry) => entry.ok).length,
                    total: list.length,
                    continueLabel: "Open review",
                    onContinue: () => setScreen("v2-review"),
                  },
                }
              : mode === "ht-extreme"
                ? {
                    extremeMission: {
                      title: "Heat Transfer Extreme Bananza",
                      score: htLog.filter((entry) => entry.ok).length,
                      correct: htLog.filter((entry) => entry.ok).length,
                      total: list.length,
                      continueLabel: "Open review",
                      onContinue: () => setScreen("ht-review"),
                    },
                  }
                : mode === "ht-intro"
                  ? {
                      extremeMission: {
                        title: "Heat Transfer Intro",
                        score: htiLog.filter((entry) => entry.ok).length,
                        correct: htiLog.filter((entry) => entry.ok).length,
                        total: list.length,
                        continueLabel: "Open review",
                        onContinue: () => setScreen("hti-review"),
                      },
                    }
                  : {})}
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

      {screen === "briefing" && mode === "extreme" && (
        <ExtremeBriefing
          reducedMotion={settings.reducedMotion}
          onComplete={() => setScreen("gauntlet")}
        />
      )}

      {screen === "briefing" && mode === "extreme-v2" && (
        <ExtremeV2Briefing
          reducedMotion={settings.reducedMotion}
          onComplete={() => setScreen("gauntlet")}
        />
      )}

      {screen === "briefing" && mode === "ht-extreme" && (
        <HeatTransferExtremeBriefing
          reducedMotion={settings.reducedMotion}
          onComplete={() => setScreen("gauntlet")}
        />
      )}

      {screen === "briefing" && mode === "ht-intro" && (
        <HeatTransferIntroBriefing
          reducedMotion={settings.reducedMotion}
          onComplete={() => setScreen("gauntlet")}
        />
      )}

      {screen === "v2-review" && (
        <ExtremeV2Review
          questions={extremeV2Questions}
          log={v2Log}
          score={v2Log.filter((entry) => entry.ok).length}
          onRestart={() => {
            startAudio();
            setMode("extreme-v2");
            setLocalIndex(0);
            setAnswer([]);
            setPhase("answering");
            setShowHint(false);
            setExtremeScore(0);
            setExtremeCorrectCount(0);
            setV2Log([]);
            setGauntletRecovery(false);
            setOverloadBurst(0);
            setPsychedelicActive(false);
            setScreen("briefing");
          }}
          onMenu={() => setScreen("title")}
        />
      )}

      {screen === "ht-review" && (
        <HeatTransferExtremeReview
          questions={heatTransferExtremeQuestions}
          log={htLog}
          score={htLog.filter((entry) => entry.ok).length}
          onRestart={() => {
            startAudio();
            setMode("ht-extreme");
            setLocalIndex(0);
            setAnswer([]);
            setPhase("answering");
            setShowHint(false);
            setExtremeScore(0);
            setExtremeCorrectCount(0);
            setHtLog([]);
            setGauntletRecovery(false);
            setOverloadBurst(0);
            setPsychedelicActive(false);
            setEnochGatePending(false);
            setHtJumpNeedsAdvance(false);
            setScreen("briefing");
          }}
          onMenu={() => setScreen("title")}
        />
      )}

      {screen === "hti-review" && (
        <HeatTransferIntroReview
          questions={heatTransferIntroQuestions}
          log={htiLog}
          score={htiLog.filter((entry) => entry.ok).length}
          onRestart={() => {
            startAudio();
            setMode("ht-intro");
            setLocalIndex(0);
            setAnswer([]);
            setPhase("answering");
            setShowHint(false);
            setExtremeScore(0);
            setExtremeCorrectCount(0);
            setHtiLog([]);
            setGauntletRecovery(false);
            setOverloadBurst(0);
            setPsychedelicActive(false);
            setScreen("briefing");
          }}
          onContinueExtreme={() => {
            startAudio();
            setMode("ht-extreme");
            setLocalIndex(0);
            setAnswer([]);
            setPhase("answering");
            setShowHint(false);
            setExtremeScore(0);
            setExtremeCorrectCount(0);
            setHtLog([]);
            setHtiLog([]);
            setGauntletRecovery(false);
            setOverloadBurst(0);
            setPsychedelicActive(false);
            setEnochGatePending(false);
            setHtJumpNeedsAdvance(false);
            setScreen("briefing");
          }}
          onMenu={() => setScreen("title")}
        />
      )}

      {screen === "ht-chapter-jump" && mode === "ht-extreme" && (
        <HeatTransferChapterJump
          chapters={getHtBananzaChapters()}
          currentIndex={localIndex}
          currentChapterId={htChapterAtIndex(localIndex)?.id}
          psychedelic={psychedelicActive}
          onJump={jumpToHtChapter}
          onContinue={continueHtChapterGate}
        />
      )}

      {screen === "gauntlet" && (
        <div
          className={cn(
            "mx-auto w-full max-w-3xl",
            mode === "ht-intro"
              ? "ht-intro-shell"
              : mode === "ht-extreme"
              ? "ht-extreme-shell"
              : mode === "extreme-v2"
                ? "extreme-v2-shell"
                : "extreme-shell",
          )}
        >
          <MemoryGauntlet
            key={`gauntlet-${gauntletRecovery ? "recovery" : "entry"}-${localIndex}`}
            reducedMotion={settings.reducedMotion}
            hp={progress.recoveryLength}
            recoveryOnly={gauntletRecovery}
            {...(mode === "extreme-v2"
              ? {
                  banner: gauntletRecovery ? "Extreme V2 Recovery" : "Aerodynamics Extreme V2",
                }
              : mode === "ht-extreme"
                ? {
                    banner: gauntletRecovery
                      ? "Heat Transfer Recovery"
                      : "Heat Transfer Extreme Bananza",
                  }
                : mode === "ht-intro"
                  ? {
                      banner: gauntletRecovery
                        ? "Heat Transfer Intro Recovery"
                        : "Heat Transfer Intro",
                    }
                  : {})}
            onOvercharge={gainRecall}
            onDamage={damageRecall}
            onComplete={(score) => {
              if (mode === "ht-extreme") {
                if (gauntletRecovery) {
                  setExtremeScore((value) => value + score);
                  setGauntletRecovery(false);
                  // After Enoch-Ra (or when already active), offer skip/return; else advance.
                  if (psychedelicActive || enochGatePending) {
                    openHtChapterGate(true);
                  } else {
                    setScreen("play");
                    advance();
                  }
                } else {
                  setExtremeScore(score);
                  // Entry minigame: always offer chapter gate so players can jump or continue.
                  openHtChapterGate(false);
                }
                return;
              }
              if (gauntletRecovery) {
                setExtremeScore((value) => value + score);
                exitRecoveryGauntlet(true);
              } else {
                setExtremeScore(score);
                setScreen("play");
              }
            }}
            onAbort={(score) => {
              if (mode === "ht-extreme" && gauntletRecovery) {
                setExtremeScore((value) => value + score);
                setGauntletRecovery(false);
                if (psychedelicActive || enochGatePending) {
                  openHtChapterGate(true);
                } else {
                  exitRecoveryGauntlet(false);
                }
                return;
              }
              if (gauntletRecovery) {
                setExtremeScore((value) => value + score);
                exitRecoveryGauntlet(false);
              } else {
                setScreen("title");
              }
            }}
          />
        </div>
      )}

      {(screen === "lightcycle" || screen === "maze") && (
        <div className="mx-auto mt-4 w-full max-w-3xl">
          <HealthBar hp={progress.recoveryLength} className="justify-center" glow={isExtremeFamily(mode)} />
        </div>
      )}

      {screen === "play" && question && (
        <div
          className={cn(
            "mx-auto w-full max-w-4xl space-y-4",
            mode === "extreme-v2" && "extreme-v2-shell",
            mode === "ht-extreme" && "ht-extreme-shell",
            mode === "ht-intro" && "ht-intro-shell",
          )}
        >
          <Hud
            question={question}
            number={mode === "campaign" ? question.globalNumber : index + 1}
            total={mode === "campaign" ? TOTAL_QUESTIONS : list.length}
            score={isExtremeFamily(mode) ? extremeScore : progress.score}
            streak={progress.streak}
            recoveryLength={progress.recoveryLength}
            glow={isExtremeFamily(mode)}
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
