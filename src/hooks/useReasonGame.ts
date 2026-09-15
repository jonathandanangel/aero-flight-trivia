import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chapterTier, sprintTier, adaptEndless, chapterFocus } from "@/game/spirit-bound/reason/difficultyManager";
import { generateCampaignChallenge, generateChallenge } from "@/game/spirit-bound/reason/generator";
import {
  EMPTY_SCORE,
  chapterRewardRupees,
  scoreAfterAnswer,
  unlockAchievements,
  xpForCorrect,
} from "@/game/spirit-bound/reason/scoring";
import { COLLECTIBLES } from "@/game/spirit-bound/reason/catalog";
import {
  CAMPAIGN_CHAPTERS,
  ENDLESS_LIVES,
  QUESTIONS_PER_CHAPTER,
  SPRINT_SECONDS,
  type AccessMode,
  type ComboRank,
  type ReasonKind,
  type ReasonScore,
  type ReasonTier,
} from "@/game/spirit-bound/reason/types";
import { playSfx } from "@/game/spirit-bound/shrine/audio";
import { randomSeed } from "@/game/spirit-bound/shrine/rng";
import { loadReasonSave, recordReasonRun, saveAccess } from "@/storage/spirit-bound/reason";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type Feedback = {
  correct: boolean;
  key: number;
  rankUp: ComboRank | null;
  legendary: boolean;
};

export function useReasonGame(kind: ReasonKind) {
  const prefersReduced = usePrefersReducedMotion();
  const saved = useMemo(() => loadReasonSave(), []);
  const [seed, setSeed] = useState(randomSeed);
  const [tier, setTier] = useState<ReasonTier>(kind === "campaign" ? chapterTier(saved.campaignChapter) : 1);
  const [chapter, setChapter] = useState(kind === "campaign" ? saved.campaignChapter : 1);
  const [round, setRound] = useState(1);
  const [chapterRound, setChapterRound] = useState(1);
  const [score, setScore] = useState<ReasonScore>(EMPTY_SCORE);
  const [answered, setAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [misses, setMisses] = useState(0);
  const [lives, setLives] = useState(ENDLESS_LIVES);
  const [sessionLeft, setSessionLeft] = useState(kind === "sprint" ? SPRINT_SECONDS : 0);
  const [elapsed, setElapsed] = useState(0);
  const [over, setOver] = useState(false);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [access, setAccessState] = useState<AccessMode>({
    ...saved.access,
    reducedMotion: saved.access.reducedMotion || prefersReduced,
  });
  const [comboBest, setComboBest] = useState(0);
  const [hadInstant, setHadInstant] = useState(false);
  const [hadSavant, setHadSavant] = useState(false);
  const [chapterClear, setChapterClear] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [shown, setShownAt] = useState(() => Date.now());

  const finished = useRef(false);
  const sessionRef = useRef(kind === "sprint" ? SPRINT_SECONDS : 0);
  const scoreRef = useRef(EMPTY_SCORE);
  const answeredRef = useRef(0);
  const correctRef = useRef(0);
  const missesRef = useRef(0);
  const comboBestRef = useRef(0);
  const instantRef = useRef(false);
  const savantRef = useRef(false);
  const xpRef = useRef(0);
  const persistedXp = useRef(0);
  const persistedCorrect = useRef(0);
  const chapterRef = useRef(chapter);
  const chapterRoundRef = useRef(1);
  const roundRef = useRef(1);
  const tierRef = useRef(tier);
  const lockedRef = useRef(false);

  const challenge = useMemo(() => {
    if (kind === "campaign") return generateCampaignChallenge(seed, chapter, round);
    return generateChallenge(seed, round, tier);
  }, [kind, seed, chapter, round, tier]);

  const speak = useCallback(
    (text: string) => {
      if (!access.narration || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    },
    [access.narration],
  );

  useEffect(() => {
    setShownAt(Date.now());
    speak(challenge.statement);
  }, [challenge, speak]);

  useEffect(() => {
    chapterRef.current = chapter;
    chapterRoundRef.current = chapterRound;
    roundRef.current = round;
    tierRef.current = tier;
  }, [chapter, chapterRound, round, tier]);

  const persist = useCallback(
    (endedChapter?: number) => {
      const collectible =
        kind === "campaign" && endedChapter
          ? (COLLECTIBLES[endedChapter - 1] ?? undefined)
          : undefined;
      const xpGain = xpRef.current - persistedXp.current;
      const repGain = correctRef.current - persistedCorrect.current;
      persistedXp.current = xpRef.current;
      persistedCorrect.current = correctRef.current;
      recordReasonRun({
        kind,
        score: scoreRef.current.total,
        xp: Math.max(0, xpGain),
        rupees:
          kind === "campaign"
            ? endedChapter
              ? chapterRewardRupees(endedChapter)
              : 0
            : Math.floor(scoreRef.current.total / 80),
        reputation: Math.max(0, repGain),
        achievements: unlockAchievements({
          correctCount: correctRef.current,
          answered: answeredRef.current,
          misses: missesRef.current,
          comboBest: comboBestRef.current,
          instant: instantRef.current,
          savant: savantRef.current,
          kind,
          over: true,
        }),
        ...(endedChapter != null ? { chapterCleared: endedChapter } : {}),
        ...(collectible ? { collectible } : {}),
      });
    },
    [kind],
  );

  const endRun = useCallback(
    (endedChapter?: number) => {
      if (finished.current) return;
      finished.current = true;
      setOver(true);
      playSfx("fail");
      persist(endedChapter);
    },
    [persist],
  );

  useEffect(() => {
    if (over) return;
    const id = window.setInterval(() => {
      setElapsed((e) => e + 1);
      if (kind !== "sprint") return;
      sessionRef.current -= 1;
      const left = sessionRef.current;
      setSessionLeft(left);
      if (left <= 10 && left > 0) playSfx("tick");
      if (left <= 0) endRun();
    }, 1000);
    return () => window.clearInterval(id);
  }, [kind, over, endRun]);

  const setAccess = useCallback((next: AccessMode) => {
    setAccessState(next);
    saveAccess(next);
  }, []);

  const answer = useCallback(
    (saidTrue: boolean) => {
      if (over || finished.current || lockedRef.current) return;
      lockedRef.current = true;
      setLocked(true);
      const ms = Date.now() - shown;
      const correct = saidTrue === challenge.answer;
      answeredRef.current += 1;
      if (correct) {
        correctRef.current += 1;
        const gain = xpForCorrect(challenge.tier);
        xpRef.current += gain;
        setXpEarned(xpRef.current);
        playSfx("success");
        if (challenge.tier >= 6) {
          savantRef.current = true;
          setHadSavant(true);
        }
      } else {
        missesRef.current += 1;
        setMisses(missesRef.current);
        playSfx("invalid");
      }
      setAnswered(answeredRef.current);
      setCorrectCount(correctRef.current);
      const nextScore = scoreAfterAnswer({
        prev: scoreRef.current,
        correct,
        tier: challenge.tier,
        ms,
        answered: answeredRef.current,
        correctCount: correctRef.current,
      });
      scoreRef.current = nextScore.score;
      setScore(nextScore.score);
      if (nextScore.score.combo > comboBestRef.current) {
        comboBestRef.current = nextScore.score.combo;
        setComboBest(comboBestRef.current);
      }
      if (nextScore.instant) {
        instantRef.current = true;
        setHadInstant(true);
      }
      const legendary = correct && nextScore.score.combo > 0 && nextScore.score.combo % 20 === 0;
      setFeedback({
        correct,
        key: answeredRef.current,
        rankUp: nextScore.rankUp,
        legendary,
      });

      if (kind === "endless" && !correct) {
        const nextLives = lives - 1;
        setLives(nextLives);
        if (nextLives <= 0) {
          window.setTimeout(() => endRun(), 520);
          return;
        }
      }

      window.setTimeout(() => {
        if (finished.current) return;
        setFeedback(null);
        lockedRef.current = false;
        setLocked(false);

        if (kind === "campaign") {
          if (chapterRoundRef.current >= QUESTIONS_PER_CHAPTER) {
            persist(chapterRef.current);
            setChapterClear(true);
            playSfx("success");
            return;
          }
          setChapterRound((n) => n + 1);
          setSeed(randomSeed());
          setRound((n) => n + 1);
          return;
        }

        const nextTier =
          kind === "sprint"
            ? sprintTier(correctRef.current)
            : adaptEndless(tierRef.current, correct, ms);
        setTier(nextTier);
        setSeed(randomSeed());
        setRound((n) => n + 1);
      }, access.reducedMotion ? 180 : 520);
    },
    [over, shown, challenge, kind, lives, endRun, persist, access.reducedMotion],
  );

  const stop = useCallback(() => {
    endRun();
  }, [endRun]);

  const continueCampaign = useCallback(() => {
    if (chapterRef.current >= CAMPAIGN_CHAPTERS) {
      if (!finished.current) {
        finished.current = true;
        setOver(true);
        playSfx("success");
      }
      setChapterClear(false);
      return;
    }
    const next = chapterRef.current + 1;
    setChapter(next);
    setChapterRound(1);
    chapterRoundRef.current = 1;
    setTier(chapterTier(next));
    setSeed(randomSeed());
    setRound((n) => n + 1);
    setChapterClear(false);
  }, []);

  return {
    kind,
    challenge,
    score,
    answered,
    correctCount,
    misses,
    lives,
    sessionLeft,
    elapsed,
    over,
    locked,
    feedback,
    access,
    setAccess,
    answer,
    stop,
    round,
    tier,
    chapter,
    chapterRound,
    chapterClear,
    continueCampaign,
    xpEarned,
    comboBest,
    hadInstant,
    hadSavant,
    focus: kind === "campaign" ? chapterFocus(chapter) : null,
  };
}
