import * as React from "react";
import { audio, type AudioSettings } from "./audio";

export type Mode = "campaign" | "practice" | "high-speed";

export interface Settings extends AudioSettings {
  scanlines: boolean;
  reducedMotion: boolean;
  interstitials: "full" | "short" | "off";
  noTimer: boolean;
  photosensitiveAck: boolean;
}

export interface Progress {
  /** Index into the active question list. */
  index: number;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  answeredCount: number;
  recoveryLength: number;
  missedIds: string[];
  answeredIds: string[];
  recallWins: number;
  recallLosses: number;
  /** Highest 15-correct Grid Run milestone completed. */
  lightCycleMilestone: number;
  /** Highest 50-question intermission checkpoint completed (150, 200, 250, or 300). */
  intermissionQuestionCheckpoint: number;
  /** Permanently activated after the first evolved Electric Recall reveal. */
  bloodMoonAwakened: boolean;
  gameOver: boolean;
  completed: boolean;
}

export interface SaveState {
  settings: Settings;
  progress: Progress;
  version: number;
}

export const defaultSettings: Settings = {
  master: 0.7,
  music: 0.5,
  effects: 0.8,
  muted: false,
  scanlines: true,
  reducedMotion: false,
  interstitials: "full",
  noTimer: false,
  photosensitiveAck: false,
};

export const defaultProgress: Progress = {
  index: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  correctCount: 0,
  answeredCount: 0,
  recoveryLength: 11,
  missedIds: [],
  answeredIds: [],
  recallWins: 0,
  recallLosses: 0,
  lightCycleMilestone: 0,
  intermissionQuestionCheckpoint: 0,
  bloodMoonAwakened: false,
  gameOver: false,
  completed: false,
};

const STORAGE_KEY = "aerogrid99.save.v1";

interface Ctx {
  settings: Settings;
  progress: Progress;
  hydrated: boolean;
  setSettings: (patch: Partial<Settings>) => void;
  setProgress: (patch: Partial<Progress> | ((p: Progress) => Partial<Progress>)) => void;
  resetCampaign: () => void;
  resetChapterProgress: (startIndex: number) => void;
}

const GameContext = React.createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = React.useState<Settings>(defaultSettings);
  const [progress, setProgressState] = React.useState<Progress>(defaultProgress);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SaveState>;
        if (parsed.settings) setSettingsState({ ...defaultSettings, ...parsed.settings });
        if (parsed.progress) setProgressState({ ...defaultProgress, ...parsed.progress });
      }
    } catch {
      /* corrupted save: start fresh */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ settings, progress, version: 1 } satisfies SaveState),
      );
    } catch {
      /* storage unavailable */
    }
  }, [settings, progress, hydrated]);

  React.useEffect(() => {
    audio.applySettings(settings);
  }, [settings]);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("reduced-motion", settings.reducedMotion);
  }, [settings.reducedMotion]);

  const setSettings = React.useCallback((patch: Partial<Settings>) => {
    setSettingsState((s) => ({ ...s, ...patch }));
  }, []);

  const setProgress = React.useCallback(
    (patch: Partial<Progress> | ((p: Progress) => Partial<Progress>)) => {
      setProgressState((p) => ({ ...p, ...(typeof patch === "function" ? patch(p) : patch) }));
    },
    [],
  );

  const resetCampaign = React.useCallback(() => setProgressState(defaultProgress), []);

  const resetChapterProgress = React.useCallback((startIndex: number) => {
    setProgressState((p) => ({
      ...p,
      index: startIndex,
      gameOver: false,
      completed: false,
      streak: 0,
      recoveryLength: Math.max(p.recoveryLength, 5),
    }));
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({
      settings,
      progress,
      hydrated,
      setSettings,
      setProgress,
      resetCampaign,
      resetChapterProgress,
    }),
    [settings, progress, hydrated, setSettings, setProgress, resetCampaign, resetChapterProgress],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = React.useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}

/** 11 -> 8 -> 5 -> 2 and back up again, per the recovery rules. */
export const nextRecoveryLength = (current: number, won: boolean) =>
  won ? Math.min(11, current + 3) : Math.max(2, current - 3);
