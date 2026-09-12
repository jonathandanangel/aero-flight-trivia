import type { Question } from "./types";

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Number of answer slots a question expects before it can be submitted. */
export function slotCount(q: Question): number {
  switch (q.interactionType) {
    case "multiple-choice":
    case "compare-select":
    case "hotspot":
    case "fill-in":
      return 1;
    case "sequencing":
      return q.steps?.length ?? q.correctAnswer.length;
    case "matching":
      return q.pairs?.length ?? q.correctAnswer.length;
    default:
      return q.correctAnswer.length;
  }
}

export function isComplete(q: Question, answer: string[]): boolean {
  const needed = slotCount(q);
  const filled = answer.filter((a) => a !== undefined && a !== null && a !== "").length;
  return filled >= needed;
}

function compactEq(s: string): string {
  return s
    .toLowerCase()
    .replace(/α/g, "alpha")
    .replace(/λ/g, "lambda")
    .replace(/c̄|cbar/g, "c_bar")
    .replace(/squared/g, "^2")
    .replace(/\*\*/g, "^")
    .replace(/×|·/g, "*")
    .replace(/−/g, "-")
    .replace(/[^a-z0-9=^/*+_()-]/g, "");
}

function extractNumber(s: string): number | null {
  const match = s.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function fillInMatches(q: Question, givenRaw: string): boolean {
  const given = norm(givenRaw);
  if (!given) return false;
  const accepted = [q.correctAnswer[0] ?? "", ...(q.acceptedAnswers ?? [])];
  if (accepted.map(norm).includes(given)) return true;
  const compactGiven = compactEq(given);
  if (accepted.some((item) => compactEq(item) === compactGiven)) return true;

  const targetNum = extractNumber(q.correctAnswer[0] ?? "");
  const givenNum = extractNumber(given);
  if (targetNum !== null && givenNum !== null && Number.isFinite(targetNum) && Number.isFinite(givenNum)) {
    const canonicalIsNumeric = accepted.every((item) => {
      const compact = compactEq(item);
      return extractNumber(item) !== null && !compact.includes("integral") && compact.length < 24;
    });
    if (canonicalIsNumeric && Math.abs(givenNum - targetNum) < 1e-9) return true;
  }

  const wantsMac = accepted.some((item) => /mac|c_bar|mean aerodynamic/i.test(item));
  if (wantsMac) {
    const hasEquation =
      (compactGiven.includes("mac=") || compactGiven.includes("c_bar=") || compactGiven.includes("cbar=")) &&
      (compactGiven.includes("integral") || compactGiven.includes("intfrom") || given.includes("∫"));
    if (hasEquation) return true;
  }
  return false;
}

export function isCorrect(q: Question, answer: string[]): boolean {
  if (q.interactionType === "fill-in") {
    return fillInMatches(q, answer[0] ?? "");
  }
  if (q.correctAnswer.length !== answer.length) return false;
  return q.correctAnswer.every((c, i) => norm(c) === norm(answer[i] ?? ""));
}

/** Targeted feedback for the first wrong slot, when the author supplied it. */
export function misconceptionFor(q: Question, answer: string[]): string | null {
  const map = q.misconceptionFeedback;
  if (!map) return null;
  for (const given of answer) {
    if (!given) continue;
    const hit = Object.keys(map).find((k) => norm(k) === norm(given));
    if (hit && !q.correctAnswer.some((c) => norm(c) === norm(given))) return map[hit] ?? null;
  }
  return null;
}

/** Deterministic shuffle so option order is stable per question across renders. */
export function stableShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    h = (Math.imul(h, 48271) + 11) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
