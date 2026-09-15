/** Classical Pythagorean word numerology (A=1 … Z=26, digital root 1–9). */

export type NumerologyLetter = {
  char: string;
  position: number;
  runningSum: number;
  kind: "vowel" | "consonant";
};

export type NumerologyResult = {
  input: string;
  normalized: string;
  letters: NumerologyLetter[];
  ignored: string[];
  letterCount: number;
  vowelSum: number;
  consonantSum: number;
  sumPositions: number;
  remainder: number;
  number: number;
  reductionSteps: number[];
  title: string;
  traits: string[];
  note: string;
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

const MEANINGS: Record<
  number,
  { title: string; traits: string[]; note: string }
> = {
  1: {
    title: "The Pioneer",
    traits: ["leadership", "independence", "initiative", "drive"],
    note: "A beginning force — clear direction and self-starting energy.",
  },
  2: {
    title: "The Partner",
    traits: ["harmony", "diplomacy", "sensitivity", "balance"],
    note: "Cooperative rhythm — bridges, pairs, and quiet precision.",
  },
  3: {
    title: "The Creator",
    traits: ["expression", "joy", "imagination", "communication"],
    note: "Creative spark — words, art, and social brightness.",
  },
  4: {
    title: "The Builder",
    traits: ["structure", "discipline", "reliability", "foundation"],
    note: "Solid craft — systems, patience, and durable work.",
  },
  5: {
    title: "The Explorer",
    traits: ["freedom", "change", "curiosity", "adaptability"],
    note: "Motion and variety — restless curiosity and new paths.",
  },
  6: {
    title: "The Caretaker",
    traits: ["responsibility", "nurture", "home", "service"],
    note: "Care and beauty — protection, family, and devotion.",
  },
  7: {
    title: "The Seeker",
    traits: ["analysis", "mystery", "insight", "introspection"],
    note: "Inner study — research, solitude, and hidden patterns.",
  },
  8: {
    title: "The Achiever",
    traits: ["power", "ambition", "material mastery", "authority"],
    note: "Worldly force — results, organization, and influence.",
  },
  9: {
    title: "The Completer",
    traits: ["compassion", "wisdom", "completion", "universal view"],
    note: "Full circle — endings that open into generosity and scope.",
  },
};

/** Reduce positive integers the classical way: keep summing digits, or mod-9 with 0→9. */
export function digitalRoot(n: number): { number: number; steps: number[] } {
  const steps: number[] = [n];
  let value = Math.abs(Math.trunc(n));
  while (value > 9) {
    value = String(value)
      .split("")
      .reduce((acc, d) => acc + Number(d), 0);
    steps.push(value);
  }
  if (value === 0) value = 9;
  return { number: value, steps };
}

/**
 * Port of word_to_numerology (MATLAB intent):
 * lowercase letters only, A=1…Z=26, mod(sum,9) with 0 → 9.
 */
export function wordToNumerology(word: string): NumerologyResult {
  const input = word;
  const normalized = word.toLowerCase();
  const letters: NumerologyLetter[] = [];
  const ignored: string[] = [];
  let sumPositions = 0;
  let vowelSum = 0;
  let consonantSum = 0;

  for (const ch of normalized) {
    const code = ch.charCodeAt(0);
    if (code >= 97 && code <= 122) {
      const position = code - 96;
      sumPositions += position;
      const kind = VOWELS.has(ch) ? "vowel" : "consonant";
      if (kind === "vowel") vowelSum += position;
      else consonantSum += position;
      letters.push({ char: ch, position, runningSum: sumPositions, kind });
    } else if (ch.trim() !== "") {
      ignored.push(ch);
    }
  }

  if (letters.length === 0) {
    throw new Error("Enter at least one A–Z letter.");
  }

  const remainder = sumPositions % 9;
  const number = remainder === 0 ? 9 : remainder;
  const { steps: reductionSteps } = digitalRoot(sumPositions);
  const meaning = MEANINGS[number] ?? MEANINGS[9]!;

  return {
    input,
    normalized,
    letters,
    ignored,
    letterCount: letters.length,
    vowelSum,
    consonantSum,
    sumPositions,
    remainder,
    number,
    reductionSteps,
    title: meaning.title,
    traits: meaning.traits,
    note: meaning.note,
  };
}

export function formatNumerologyReport(result: NumerologyResult): string {
  const rows = result.letters
    .map(
      (L, i) =>
        `  ${String(i + 1).padStart(2)}. '${L.char}' → ${String(L.position).padStart(2)}  (${L.kind})  Σ=${L.runningSum}`,
    )
    .join("\n");
  const ignored =
    result.ignored.length > 0
      ? `Ignored symbols: ${result.ignored.map((c) => `'${c}'`).join(" ")}\n`
      : "";
  return [
    `WORD: "${result.input}"`,
    `Normalized: ${result.normalized}`,
    ignored.trimEnd(),
    `Letters counted: ${result.letterCount}`,
    `Letter map (A=1 … Z=26):`,
    rows,
    "",
    `Σ positions = ${result.sumPositions}`,
    `  vowels Σ = ${result.vowelSum}`,
    `  consonants Σ = ${result.consonantSum}`,
    `mod(${result.sumPositions}, 9) = ${result.remainder}${result.remainder === 0 ? " → 9 (numerology zero ≡ nine)" : ""}`,
    `Digital-root path: ${result.reductionSteps.join(" → ")}`,
    "",
    `NUMEROLOGY NUMBER: ${result.number} — ${result.title}`,
    `Traits: ${result.traits.join(", ")}`,
    result.note,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}
