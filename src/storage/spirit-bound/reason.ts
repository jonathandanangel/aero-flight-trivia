import { ACHIEVEMENTS, type ReasonAchievementId } from "@/game/spirit-bound/reason/scoring";
import type { AccessMode } from "@/game/spirit-bound/reason/types";

const KEY = "trianglebound.reason.v1";

export type ReasonSave = {
  bestSprint: number;
  bestEndless: number;
  campaignChapter: number;
  xp: number;
  rupees: number;
  reputation: number;
  collectibles: string[];
  achievements: ReasonAchievementId[];
  access: AccessMode;
};

const EMPTY_ACCESS: AccessMode = {
  highContrast: false,
  colorblind: false,
  reducedMotion: false,
  dyslexia: false,
  textSize: "md",
  narration: false,
};

const EMPTY: ReasonSave = {
  bestSprint: 0,
  bestEndless: 0,
  campaignChapter: 1,
  xp: 0,
  rupees: 0,
  reputation: 0,
  collectibles: [],
  achievements: [],
  access: EMPTY_ACCESS,
};

function parseAccess(raw: unknown): AccessMode {
  if (!raw || typeof raw !== "object") return { ...EMPTY_ACCESS };
  const a = raw as Partial<AccessMode>;
  return {
    highContrast: Boolean(a.highContrast),
    colorblind: Boolean(a.colorblind),
    reducedMotion: Boolean(a.reducedMotion),
    dyslexia: Boolean(a.dyslexia),
    textSize: a.textSize === "sm" || a.textSize === "lg" ? a.textSize : "md",
    narration: Boolean(a.narration),
  };
}

export function loadReasonSave(): ReasonSave {
  if (typeof window === "undefined") return { ...EMPTY, collectibles: [], achievements: [], access: { ...EMPTY_ACCESS } };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, collectibles: [], achievements: [], access: { ...EMPTY_ACCESS } };
    const parsed = JSON.parse(raw) as Partial<ReasonSave>;
    const achievements = Array.isArray(parsed.achievements)
      ? parsed.achievements.filter((id): id is ReasonAchievementId => id in ACHIEVEMENTS)
      : [];
    return {
      bestSprint: typeof parsed.bestSprint === "number" ? parsed.bestSprint : 0,
      bestEndless: typeof parsed.bestEndless === "number" ? parsed.bestEndless : 0,
      campaignChapter: typeof parsed.campaignChapter === "number" ? Math.min(7, Math.max(1, parsed.campaignChapter)) : 1,
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      rupees: typeof parsed.rupees === "number" ? parsed.rupees : 0,
      reputation: typeof parsed.reputation === "number" ? parsed.reputation : 0,
      collectibles: Array.isArray(parsed.collectibles) ? parsed.collectibles.filter((x) => typeof x === "string") : [],
      achievements,
      access: parseAccess(parsed.access),
    };
  } catch {
    return { ...EMPTY, collectibles: [], achievements: [], access: { ...EMPTY_ACCESS } };
  }
}

function write(next: ReasonSave) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function saveAccess(access: AccessMode): ReasonSave {
  const next = { ...loadReasonSave(), access };
  write(next);
  return next;
}

export function recordReasonRun(input: {
  kind: "sprint" | "endless" | "campaign";
  score: number;
  xp: number;
  rupees: number;
  reputation: number;
  achievements: ReasonAchievementId[];
  chapterCleared?: number;
  collectible?: string;
}): ReasonSave {
  const prev = loadReasonSave();
  const collectibles = input.collectible
    ? Array.from(new Set([...prev.collectibles, input.collectible]))
    : prev.collectibles;
  const next: ReasonSave = {
    ...prev,
    bestSprint: input.kind === "sprint" ? Math.max(prev.bestSprint, input.score) : prev.bestSprint,
    bestEndless: input.kind === "endless" ? Math.max(prev.bestEndless, input.score) : prev.bestEndless,
    campaignChapter:
      input.chapterCleared != null
        ? Math.max(prev.campaignChapter, Math.min(7, input.chapterCleared + 1))
        : prev.campaignChapter,
    xp: prev.xp + input.xp,
    rupees: prev.rupees + input.rupees,
    reputation: prev.reputation + input.reputation,
    collectibles,
    achievements: Array.from(new Set([...prev.achievements, ...input.achievements])),
  };
  write(next);
  return next;
}
