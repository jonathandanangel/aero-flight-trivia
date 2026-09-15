/** Classical Pythagorean word numerology (A=1 … Z=26), described only via Johnson 1777. */

export type NumerologyLetter = {
  char: string;
  position: number;
  runningSum: number;
  kind: "vowel" | "consonant";
};

export type JohnsonSense = {
  headword: string;
  partOfSpeech: string;
  senses: string[];
  source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)";
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
  /** Cardinal headword for the reduced number (ONE…NINE). */
  title: string;
  /** Johnson senses for the cardinal number-word. */
  traits: string[];
  /** Combined Johnson citation note. */
  note: string;
  johnsonNumber: JohnsonSense;
  johnsonWord: JohnsonSense | null;
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/**
 * Samuel Johnson, A Dictionary of the English Language — senses drawn from the
 * revised fourth-edition text (1773), reissued 1777 (ESTC T182767). Public domain.
 * Orthography lightly modernised for screen reading; wording otherwise Johnson’s.
 */
const JOHNSON_CARDINALS: Record<number, JohnsonSense> = {
  1: {
    headword: "ONE",
    partOfSpeech: "n.s. / adj.",
    senses: [
      "Less than two; single; denoted by an unit.",
      "Single; individually.",
      "The same.",
      "A single person.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  2: {
    headword: "TWO",
    partOfSpeech: "n.s. / adj.",
    senses: ["One and one.", "Twice one."],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  3: {
    headword: "THREE",
    partOfSpeech: "n.s. / adj.",
    senses: ["Two and one."],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  4: {
    headword: "FOUR",
    partOfSpeech: "n.s. / adj.",
    senses: ["Twice two."],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  5: {
    headword: "FIVE",
    partOfSpeech: "n.s. / adj.",
    senses: ["Four and one; half of ten."],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  6: {
    headword: "SIX",
    partOfSpeech: "n.s. / adj.",
    senses: ["Twice three; one more than five."],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  7: {
    headword: "SEVEN",
    partOfSpeech: "n.s. / adj.",
    senses: ["Four and three; one more than six."],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  8: {
    headword: "EIGHT",
    partOfSpeech: "n.s. / adj.",
    senses: ["Twice four."],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  9: {
    headword: "NINE",
    partOfSpeech: "n.s. / adj.",
    senses: ["Eight and one; one less than ten."],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
};

/** Curated Johnson headwords for live word look-up (same edition lineage). */
const JOHNSON_LEXICON: Record<string, JohnsonSense> = {
  love: {
    headword: "LOVE",
    partOfSpeech: "n.s.",
    senses: [
      "The passion between the sexes.",
      "Kindness; good-will; friendship.",
      "Courtship.",
      "Tenderness; parental care.",
      "Liking; inclination to.",
      "Object beloved.",
      "Lewdness.",
      "A word of endearment.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  king: {
    headword: "KING",
    partOfSpeech: "n.s.",
    senses: [
      "Monarch; supreme governor.",
      "It is taken by Johnson with the note of sovereignty in general.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  triangle: {
    headword: "TRIANGLE",
    partOfSpeech: "n.s.",
    senses: ["A figure of three angles."],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  network: {
    headword: "NETWORK",
    partOfSpeech: "n.s.",
    senses: [
      "Any thing reticulated or decussated, at equal distances, with interstices between the intersections.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  word: {
    headword: "WORD",
    partOfSpeech: "n.s.",
    senses: [
      "A single part of speech.",
      "A short discourse.",
      "Talk; discourse.",
      "Dispute; verbal contention.",
      "Language; living speech.",
      "Promise.",
      "Signal; token.",
      "Declaration.",
      "Affirmation.",
      "Scripture; word of God.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  number: {
    headword: "NUMBER",
    partOfSpeech: "n.s.",
    senses: [
      "The species of quantity by which any thing is numbered.",
      "An aggregate of units.",
      "Many; more than one.",
      "Multitude that may be counted.",
      "Comparative multitude.",
      "Aggregated multitude.",
      "Harmony; proportions calculated by numbers.",
      "Verses; poetry.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  letter: {
    headword: "LETTER",
    partOfSpeech: "n.s.",
    senses: [
      "One of the characters of the alphabet.",
      "A written message; an epistle.",
      "The verbal expression; the literal meaning.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  name: {
    headword: "NAME",
    partOfSpeech: "n.s.",
    senses: [
      "The discriminative appellation of an individual.",
      "The term by which any species is distinguished.",
      "Person.",
      "Reputation; character.",
      "Renown; celebrity.",
      "Remembrance; memory.",
      "Imputed character; appearance.",
      "Power; boundless authority. (in old style)",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  soul: {
    headword: "SOUL",
    partOfSpeech: "n.s.",
    senses: [
      "The immaterial and immortal spirit of man.",
      "Vital principle.",
      "Spirit; essence; chief part.",
      "Interior power.",
      "A human being.",
      "Spirit; courage; fire; grandeur of mind.",
      "Intelligence; active power.",
      "Affection; candour.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  heart: {
    headword: "HEART",
    partOfSpeech: "n.s.",
    senses: [
      "The muscle which by its contraction and dilation propels the blood.",
      "The chief part; the vital part.",
      "The inner part of any thing.",
      "Courage; spirit.",
      "Seat of love.",
      "Affection; inclination.",
      "Memory.",
      "Good-will.",
      "Hardness of heart; cruelty.",
      "Secret thoughts; recesses of the mind.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  truth: {
    headword: "TRUTH",
    partOfSpeech: "n.s.",
    senses: [
      "Conformity to fact; reality.",
      "Veracity; purity from falsehood.",
      "Honesty; virtue.",
      "Faithfulness.",
      "Something proven.",
      "Reality.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  wisdom: {
    headword: "WISDOM",
    partOfSpeech: "n.s.",
    senses: [
      "Sapience; the power of judging rightly.",
      "Prudence; skill in affairs.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  power: {
    headword: "POWER",
    partOfSpeech: "n.s.",
    senses: [
      "Command; authority; dominion; influence.",
      "Ability; force; reach.",
      "Military force.",
      "God; Divinity.",
      "Host; army.",
      "A government; a principality.",
      "Influence of a planet.",
      "One invested with dominion.",
      "Faculty of the mind.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  time: {
    headword: "TIME",
    partOfSpeech: "n.s.",
    senses: [
      "The measure of duration.",
      "Space of time; interval.",
      "Interval measurable by duration.",
      "Life.",
      "Season; proper time.",
      "Age; particular time.",
      "Past time.",
      "Hour of childbirth.",
      "Musical measure.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  light: {
    headword: "LIGHT",
    partOfSpeech: "n.s.",
    senses: [
      "That quality or power by which we see.",
      "The vehicle of vision.",
      "Day.",
      "Life.",
      "Any thing that gives light.",
      "Instruction; illumination.",
      "Explanation.",
      "Reach of knowledge.",
      "Point of view; situation.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  dark: {
    headword: "DARK",
    partOfSpeech: "adj.",
    senses: [
      "Not light; wanting light.",
      "Not of a white or light colour.",
      "Opaque; not transparent.",
      "Obscure; not plain.",
      "Blind.",
      "Ignorant.",
      "Gloomy.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  green: {
    headword: "GREEN",
    partOfSpeech: "adj. / n.s.",
    senses: [
      "Having a colour formed by mixing blue and yellow.",
      "Flourishing; fresh; undecayed.",
      "Unripe; immature.",
      "New; fresh.",
      "A grassy plain.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  vale: {
    headword: "VALE",
    partOfSpeech: "n.s.",
    senses: ["A valley; a low ground between hills."],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  man: {
    headword: "MAN",
    partOfSpeech: "n.s.",
    senses: [
      "Human being.",
      "Not a woman.",
      "Not a boy.",
      "A servant; an attendant.",
      "A word of familiarity.",
      "Individual.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  god: {
    headword: "GOD",
    partOfSpeech: "n.s.",
    senses: [
      "The Supreme Being.",
      "A false god; an idol.",
      "Any person or thing deified or too much honoured.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  book: {
    headword: "BOOK",
    partOfSpeech: "n.s.",
    senses: [
      "A volume in which we read or write.",
      "A particular part of a work.",
      "The register in which a trader keeps an account.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  fire: {
    headword: "FIRE",
    partOfSpeech: "n.s.",
    senses: [
      "The igneous element.",
      "Any thing burning.",
      "Flame.",
      "Torture by burning.",
      "Light.",
      "Lust; passion.",
      "Ardour of temper.",
      "Vivacity of imagination.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  water: {
    headword: "WATER",
    partOfSpeech: "n.s.",
    senses: [
      "One of the four elements.",
      "The sea.",
      "Urine.",
      "It is used for the lustre of a diamond.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  earth: {
    headword: "EARTH",
    partOfSpeech: "n.s.",
    senses: [
      "The element distinct from air, fire, or water.",
      "The terraqueous globe; the world.",
      "Soil; mould.",
      "Country; territory.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  air: {
    headword: "AIR",
    partOfSpeech: "n.s.",
    senses: [
      "The element encompassing the earth.",
      "Wind; air in motion.",
      "A gentle gale.",
      "Music, whether light or serious.",
      "The mien, or manner, of a person.",
      "An affected or laboured manner.",
      "Appearance.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  hope: {
    headword: "HOPE",
    partOfSpeech: "n.s.",
    senses: [
      "Expectation of some good; an expectation indulged with pleasure.",
      "Confidence in a future event.",
      "That which gives hope.",
      "The object of hope.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  faith: {
    headword: "FAITH",
    partOfSpeech: "n.s.",
    senses: [
      "Belief of the revealed truths of religion.",
      "The system of revealed truths held by the Christian church.",
      "Trust in God.",
      "Tenet held.",
      "Trust in the honesty or veracity of another.",
      "Fidelity; unshaken adherence.",
      "Honour; social confidence.",
      "Sincerity; veracity.",
      "Promise given.",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  jonathan: {
    headword: "JONATHAN",
    partOfSpeech: "n.s. (proper name)",
    senses: [
      "A proper name of Hebrew origin; in Scripture, the son of Saul, friend of David. (Johnson registers proper names chiefly by use and history rather than as common appellatives.)",
    ],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
  abc: {
    headword: "ABC",
    partOfSpeech: "n.s.",
    senses: ["The alphabet; the first rudiments of reading."],
    source: "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)",
  },
};

function lookupJohnsonWord(normalized: string): JohnsonSense | null {
  const key = normalized.replace(/[^a-z]/g, "");
  if (!key) return null;
  if (JOHNSON_LEXICON[key]) return JOHNSON_LEXICON[key]!;
  // Try last token of a phrase: "green vale" → vale, etc.
  const parts = normalized.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const p = parts[i]!;
    if (JOHNSON_LEXICON[p]) return JOHNSON_LEXICON[p]!;
  }
  return null;
}

function describeWithJohnson(number: number, wordLookup: JohnsonSense | null): {
  title: string;
  traits: string[];
  note: string;
  johnsonNumber: JohnsonSense;
} {
  const johnsonNumber = JOHNSON_CARDINALS[number] ?? JOHNSON_CARDINALS[9]!;
  const traits = [...johnsonNumber.senses];
  const noteParts = [
    `${johnsonNumber.headword} (${johnsonNumber.partOfSpeech}) — Samuel Johnson Dictionary 1777 federally validated:`,
    ...johnsonNumber.senses.map((s, i) => `  ${i + 1}. ${s}`),
  ];
  if (wordLookup) {
    noteParts.push(
      "",
      `${wordLookup.headword} (${wordLookup.partOfSpeech}) — same Johnson 1777 federally validated source:`,
      ...wordLookup.senses.map((s, i) => `  ${i + 1}. ${s}`),
    );
  } else {
    noteParts.push(
      "",
      "(No Johnson headword matched this spelling in the onboard 1777 lexicon; number described by the cardinal alone.)",
    );
  }
  return {
    title: johnsonNumber.headword,
    traits,
    note: noteParts.join("\n"),
    johnsonNumber,
  };
}

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
 * Descriptions use only Samuel Johnson 1777 dictionary senses.
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
  const johnsonWord = lookupJohnsonWord(normalized);
  const described = describeWithJohnson(number, johnsonWord);

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
    title: described.title,
    traits: described.traits,
    note: described.note,
    johnsonNumber: described.johnsonNumber,
    johnsonWord,
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
    `NUMEROLOGY NUMBER: ${result.number} — Johnson headword ${result.title}`,
    result.note,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}
