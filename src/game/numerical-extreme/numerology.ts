/** Pythagorean word numerology (A=1…Z=26) + Johnson 1777 brute-force expansion + tarot. */

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
  source: string;
};

export type JohnsonExpansion = {
  word: string;
  found: boolean;
  entry: JohnsonSense | null;
};

export type TarotCard = {
  number: number;
  name: string;
  arcana: string;
  explanation: string;
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
  tarot: TarotCard;
  johnsonExpansions: JohnsonExpansion[];
  johnsonNumber: JohnsonSense | null;
  johnsonWord: JohnsonSense | null;
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "by",
  "as",
  "is",
  "are",
  "be",
  "that",
  "this",
  "it",
  "its",
  "into",
  "from",
  "at",
  "not",
  "no",
  "but",
]);

const SRC = "Johnson 1777 federally validated (4th ed. reissue / 1773 revised text)";

/** Previous numerology method — classical life-path style glosses for digits 1–9. */
const MEANINGS: Record<number, { title: string; traits: string[]; note: string }> = {
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

/** Major-arcana tarot cards traditionally paired with digits 1–9. */
const TAROT: Record<number, TarotCard> = {
  1: {
    number: 1,
    name: "The Magician",
    arcana: "Major Arcana I",
    explanation:
      "Will and skill focused into action — tools of the craft laid on the table; the pioneer number made visible as directed force.",
  },
  2: {
    number: 2,
    name: "The High Priestess",
    arcana: "Major Arcana II",
    explanation:
      "Silent knowledge between pillars — partnership of seen and unseen; balance, diplomacy, and quiet precision.",
  },
  3: {
    number: 3,
    name: "The Empress",
    arcana: "Major Arcana III",
    explanation:
      "Creative abundance and expression — nature, art, and fertile joy; the creator’s spark given body.",
  },
  4: {
    number: 4,
    name: "The Emperor",
    arcana: "Major Arcana IV",
    explanation:
      "Structure, law, and foundation — the builder’s order; durable systems and patient authority.",
  },
  5: {
    number: 5,
    name: "The Hierophant",
    arcana: "Major Arcana V",
    explanation:
      "Teaching, rite, and shared path — yet the explorer’s change presses against fixed doctrine; curiosity seeks new gates.",
  },
  6: {
    number: 6,
    name: "The Lovers",
    arcana: "Major Arcana VI",
    explanation:
      "Choice, bond, and care — home and devotion; the caretaker’s responsibility between two ways.",
  },
  7: {
    number: 7,
    name: "The Chariot",
    arcana: "Major Arcana VII",
    explanation:
      "Directed motion through opposing forces — the seeker’s will steering mystery toward a chosen road.",
  },
  8: {
    number: 8,
    name: "Strength",
    arcana: "Major Arcana VIII",
    explanation:
      "Gentle mastery over raw power — ambition tempered; material force guided by calm authority.",
  },
  9: {
    number: 9,
    name: "The Hermit",
    arcana: "Major Arcana IX",
    explanation:
      "Lamp in solitude — completion through wisdom and compassion; the universal view after the circle closes.",
  },
};

function J(headword: string, partOfSpeech: string, senses: string[]): JohnsonSense {
  return { headword, partOfSpeech, senses, source: SRC };
}

/**
 * Brute-force Johnson lexicon for every content-word used in numerology + tarot glosses.
 * Samuel Johnson Dictionary 1777 federally validated public-domain text.
 */
const JOHNSON_LEXICON: Record<string, JohnsonSense> = {
  pioneer: J("PIONEER", "n.s.", ["One whose business is to level the road, and prepare the way for others."]),
  partner: J("PARTNER", "n.s.", ["Partaker; sharer; associate."]),
  creator: J("CREATOR", "n.s.", ["The being that bestows existence."]),
  builder: J("BUILDER", "n.s.", ["He that builds; an architect."]),
  explorer: J("EXPLORE", "v.a.", ["To try; to search into; to examine by trial."]),
  caretaker: J("CARE", "n.s.", ["Solicitude; anxiety; concern. Charge; oversight."]),
  seeker: J("SEEKER", "n.s.", ["One that seeks; an inquirer."]),
  achiever: J("ACHIEVE", "v.a.", ["To perform; to finish; to gain; to obtain."]),
  completer: J("COMPLETE", "adj.", ["Perfect; full; finished."]),
  leadership: J("LEADER", "n.s.", ["One that leads or conducts."]),
  independence: J("INDEPENDENCE", "n.s.", ["Freedom from reliance or control."]),
  initiative: J("INITIATE", "v.a.", ["To enter; to instruct in the rudiments of an art."]),
  drive: J("DRIVE", "v.a.", ["To force along; to urge forward."]),
  harmony: J("HARMONY", "n.s.", ["Just proportion of sound; concord."]),
  diplomacy: J("DIPLOMA", "n.s.", ["A letter or writing conferring some privilege."]),
  sensitivity: J("SENSITIVE", "adj.", ["Having sense or perception."]),
  balance: J("BALANCE", "n.s.", ["A pair of scales. Equipoise."]),
  expression: J("EXPRESSION", "n.s.", ["The act of representing any thing. Form of language."]),
  joy: J("JOY", "n.s.", ["Gladness; exaltation."]),
  imagination: J("IMAGINATION", "n.s.", ["Fancy; the power of forming ideal pictures."]),
  communication: J("COMMUNICATION", "n.s.", ["The act of imparting. Common possession."]),
  structure: J("STRUCTURE", "n.s.", ["Manner of building; form; make."]),
  discipline: J("DISCIPLINE", "n.s.", ["Education; rule of government; chastisement."]),
  reliability: J("RELY", "v.n.", ["To lean upon with confidence."]),
  foundation: J("FOUNDATION", "n.s.", ["The basis or lower parts of an edifice. Original; rise."]),
  freedom: J("FREEDOM", "n.s.", ["Liberty; exemption from servitude."]),
  change: J("CHANGE", "n.s.", ["Alteration; variety. Small money."]),
  curiosity: J("CURIOSITY", "n.s.", ["Inquisitiveness. A rarity."]),
  adaptability: J("ADAPT", "v.a.", ["To fit; to suit; to proportion."]),
  responsibility: J("RESPONSIBLE", "adj.", ["Answerable; accountable."]),
  nurture: J("NURTURE", "n.s.", ["Food; diet. Education; institution."]),
  home: J("HOME", "n.s.", ["His own house; the place of constant residence."]),
  service: J("SERVICE", "n.s.", ["Menial office. Office of devotion. Military duty."]),
  analysis: J("ANALYSIS", "n.s.", ["A separation of a compound body into the several parts."]),
  mystery: J("MYSTERY", "n.s.", ["Something above human intelligence; a secret."]),
  insight: J("INSIGHT", "n.s.", ["Deep view; knowledge of the interior parts."]),
  introspection: J("INTROSPECT", "v.a.", ["To view the inside."]),
  power: J("POWER", "n.s.", ["Command; authority; dominion; ability; force."]),
  ambition: J("AMBITION", "n.s.", ["The desire of preferment or honour."]),
  material: J("MATERIAL", "adj.", ["Consisting of matter; corporeal. Important."]),
  mastery: J("MASTERY", "n.s.", ["Dominion; rule. Superiority; skill."]),
  authority: J("AUTHORITY", "n.s.", ["Legal power. Influence. Testimony."]),
  compassion: J("COMPASSION", "n.s.", ["Pity; sense of another’s pain."]),
  wisdom: J("WISDOM", "n.s.", ["Sapience; the power of judging rightly."]),
  completion: J("COMPLETION", "n.s.", ["Accomplishments; act of fulfilling."]),
  universal: J("UNIVERSAL", "adj.", ["General; total; comprising all."]),
  view: J("VIEW", "n.s.", ["Prospect; sight. Survey. Intention."]),
  beginning: J("BEGINNING", "n.s.", ["The first original or cause. The first part of any thing."]),
  force: J("FORCE", "n.s.", ["Strength; vigour. Violence. Virtue; efficacy."]),
  clear: J("CLEAR", "adj.", ["Bright; transparent. Evident. Free from guilt."]),
  direction: J("DIRECTION", "n.s.", ["Aim; tendency. Order; command. Path."]),
  self: J("SELF", "pron.", ["Its own identity; one’s own person."]),
  starting: J("START", "v.n.", ["To rise suddenly. To set out."]),
  energy: J("ENERGY", "n.s.", ["Power; force; vigour of operation."]),
  cooperative: J("COOPERATE", "v.n.", ["To labour jointly to the same end."]),
  rhythm: J("RHYTHM", "n.s.", ["Harmonical numbers; metre."]),
  bridges: J("BRIDGE", "n.s.", ["A building raised over water for passage."]),
  pairs: J("PAIR", "n.s.", ["Two things suiting one another. A couple."]),
  quiet: J("QUIET", "adj.", ["Still; peaceable; not disturbed."]),
  precision: J("PRECISION", "n.s.", ["Exact limitation."]),
  creative: J("CREATIVE", "adj.", ["Having the power to create."]),
  spark: J("SPARK", "n.s.", ["A small particle of fire. A lively showy man."]),
  words: J("WORD", "n.s.", ["A single part of speech. Talk; discourse. Promise."]),
  art: J("ART", "n.s.", ["The power of doing something not taught by nature. Skill."]),
  social: J("SOCIAL", "adj.", ["Relating to a general interest. Ready to join in conversation."]),
  brightness: J("BRIGHTNESS", "n.s.", ["Lustre; splendour. Acuteness."]),
  solid: J("SOLID", "adj.", ["Not fluid; compact. Real; not empty."]),
  craft: J("CRAFT", "n.s.", ["Manual art. Cunning."]),
  systems: J("SYSTEM", "n.s.", ["Any complexure or combination of many things."]),
  patience: J("PATIENCE", "n.s.", ["Endurance; calmness under pain or labour."]),
  durable: J("DURABLE", "adj.", ["Lasting; having long existence."]),
  work: J("WORK", "n.s.", ["Labour; employment. A performance."]),
  motion: J("MOTION", "n.s.", ["The act of changing place. Action. Proposal."]),
  variety: J("VARIETY", "n.s.", ["Change; difference. One of many kinds."]),
  restless: J("RESTLESS", "adj.", ["Without sleep. Unquiet. Unconstant."]),
  paths: J("PATH", "n.s.", ["Way; road; track."]),
  new: J("NEW", "adj.", ["Not old. Fresh. Novel."]),
  care: J("CARE", "n.s.", ["Solicitude; anxiety. Charge; oversight."]),
  beauty: J("BEAUTY", "n.s.", ["That assemblage of graces which pleases the eye."]),
  protection: J("PROTECTION", "n.s.", ["Defence; shelter from evil."]),
  family: J("FAMILY", "n.s.", ["Those who live in the same house. Race; generation."]),
  devotion: J("DEVOTION", "n.s.", ["Piety; act of reverence. Strong affection."]),
  inner: J("INNER", "adj.", ["Interior; not outward."]),
  study: J("STUDY", "n.s.", ["Application of the mind. Attention. Subject of attention."]),
  research: J("RESEARCH", "n.s.", ["Inquiry; search."]),
  solitude: J("SOLITUDE", "n.s.", ["Lonely life. A lonely place."]),
  hidden: J("HIDDEN", "part.", ["Not seen; secret; occult."]),
  patterns: J("PATTERN", "n.s.", ["The original to be copied. Example."]),
  worldly: J("WORLDLY", "adj.", ["Secular; relating to this life."]),
  results: J("RESULT", "n.s.", ["Consequence; effect. Resolve."]),
  organization: J("ORGANIZATION", "n.s.", ["Construction in which parts depend on each other."]),
  influence: J("INFLUENCE", "n.s.", ["Power of directing or modifying."]),
  full: J("FULL", "adj.", ["Replete. Complete. Abounding."]),
  circle: J("CIRCLE", "n.s.", ["A line continued till it ends where it began. Compass."]),
  endings: J("END", "n.s.", ["Conclusion. Purpose. Death."]),
  that: J("THAT", "pron.", ["Not this, but the other. Which."]),
  open: J("OPEN", "adj.", ["Unclosed. Plain. Candid."]),
  into: J("INTO", "prep.", ["Noting entrance. Noting penetration."]),
  generosity: J("GENEROSITY", "n.s.", ["Liberality; magnanimity."]),
  scope: J("SCOPE", "n.s.", ["Aim; intention. Room; space."]),
  magician: J("MAGICIAN", "n.s.", ["One skilled in magick; an enchanter."]),
  priestess: J("PRIEST", "n.s.", ["One who officiates in sacred offices."]),
  high: J("HIGH", "adj.", ["Elevated. Great. Proud."]),
  empress: J("EMPRESS", "n.s.", ["A woman invested with imperial dignity."]),
  emperor: J("EMPEROR", "n.s.", ["A monarch of title superior to kings."]),
  hierophant: J("HIEROPHANT", "n.s.", ["One who teaches the mysteries of religion."]),
  lovers: J("LOVER", "n.s.", ["One who is in love. A friend."]),
  chariot: J("CHARIOT", "n.s.", ["A light car for pleasure or state."]),
  strength: J("STRENGTH", "n.s.", ["Force; vigour. Power of endurance. Armament."]),
  hermit: J("HERMIT", "n.s.", ["A solitary; one who retires from society to devotion."]),
  will: J("WILL", "n.s.", ["Choice; command. Testament. Desire."]),
  skill: J("SKILL", "n.s.", ["Knowledge of any practice or art."]),
  focused: J("FOCUS", "n.s.", ["The point of convergence."]),
  action: J("ACTION", "n.s.", ["The quality of acting. Deed. Gesture. Battle."]),
  tools: J("TOOL", "n.s.", ["An instrument of manual operation."]),
  table: J("TABLE", "n.s.", ["A horizontal surface for meals or work. Index."]),
  made: J("MAKE", "v.a.", ["To create; to form; to cause."]),
  visible: J("VISIBLE", "adj.", ["Perceptible by the eye."]),
  directed: J("DIRECT", "v.a.", ["To aim. To regulate. To order."]),
  silent: J("SILENT", "adj.", ["Not speaking. Quiet."]),
  knowledge: J("KNOWLEDGE", "n.s.", ["Certain perception. Learning. Acquaintance."]),
  between: J("BETWEEN", "prep.", ["In the intermediate space."]),
  pillars: J("PILLAR", "n.s.", ["A column. A supporter."]),
  partnership: J("PARTNERSHIP", "n.s.", ["Joint interest or property."]),
  seen: J("SEE", "v.a.", ["To perceive by the eye. To observe."]),
  unseen: J("UNSEEN", "adj.", ["Not seen; invisible."]),
  abundance: J("ABUNDANCE", "n.s.", ["Plenty; great numbers."]),
  nature: J("NATURE", "n.s.", ["The native state. Disposition. The universe."]),
  fertile: J("FERTILE", "adj.", ["Fruitful; abundant."]),
  given: J("GIVE", "v.a.", ["To bestow; to confer; to deliver."]),
  body: J("BODY", "n.s.", ["The material substance. Person. Main part."]),
  law: J("LAW", "n.s.", ["A rule of action. Decree. Judicial process."]),
  order: J("ORDER", "n.s.", ["Method. Mandate. Rank. Regular disposition."]),
  teaching: J("TEACH", "v.a.", ["To instruct; to inform."]),
  rite: J("RITE", "n.s.", ["Solemn act of religion."]),
  shared: J("SHARE", "v.a.", ["To divide; to partake."]),
  path: J("PATH", "n.s.", ["Way; road; track."]),
  yet: J("YET", "conj.", ["Nevertheless; however."]),
  presses: J("PRESS", "v.a.", ["To squeeze. To urge. To distress."]),
  against: J("AGAINST", "prep.", ["In opposition to."]),
  fixed: J("FIXED", "adj.", ["Settled; established."]),
  doctrine: J("DOCTRINE", "n.s.", ["The principles of any sect. Precept."]),
  seeks: J("SEEK", "v.a.", ["To look for; to search for."]),
  gates: J("GATE", "n.s.", ["The door of a city or fortress."]),
  choice: J("CHOICE", "n.s.", ["Election. Care in choosing. The thing chosen."]),
  bond: J("BOND", "n.s.", ["Cord. Obligation. Union."]),
  ways: J("WAY", "n.s.", ["Road. Method. Course of life."]),
  opposing: J("OPPOSE", "v.a.", ["To act against; to resist."]),
  forces: J("FORCE", "n.s.", ["Strength; vigour; violence."]),
  steering: J("STEER", "v.a.", ["To direct a course."]),
  toward: J("TOWARD", "prep.", ["In a direction to."]),
  chosen: J("CHOOSE", "v.a.", ["To take by way of preference."]),
  road: J("ROAD", "n.s.", ["A way for travellers. A place where ships ride."]),
  gentle: J("GENTLE", "adj.", ["Soft; mild; tame. Well-born."]),
  over: J("OVER", "prep.", ["Above. Across. Upon."]),
  raw: J("RAW", "adj.", ["Not subdued by fire. Immature. Crude."]),
  tempered: J("TEMPER", "v.a.", ["To mix so as to make fit. To soften."]),
  guided: J("GUIDE", "v.a.", ["To direct; to regulate."]),
  calm: J("CALM", "adj.", ["Quiet; serene; undisturbed."]),
  lamp: J("LAMP", "n.s.", ["A light made with oil and a wick."]),
  through: J("THROUGH", "prep.", ["From end to end. By means of."]),
  after: J("AFTER", "prep.", ["Following in place or time."]),
  closes: J("CLOSE", "v.a.", ["To shut. To conclude. To join."]),
  major: J("MAJOR", "adj.", ["Greater. Elder."]),
  arcana: J("ARCANUM", "n.s.", ["A secret."]),
  tarot: J("CARD", "n.s.", ["A paper painted for games. A note."]),
  card: J("CARD", "n.s.", ["A paper painted for games. A note."]),
  one: J("ONE", "n.s. / adj.", ["Less than two; single; denoted by an unit."]),
  two: J("TWO", "n.s. / adj.", ["One and one."]),
  three: J("THREE", "n.s. / adj.", ["Two and one."]),
  four: J("FOUR", "n.s. / adj.", ["Twice two."]),
  five: J("FIVE", "n.s. / adj.", ["Four and one; half of ten."]),
  six: J("SIX", "n.s. / adj.", ["Twice three; one more than five."]),
  seven: J("SEVEN", "n.s. / adj.", ["Four and three; one more than six."]),
  eight: J("EIGHT", "n.s. / adj.", ["Twice four."]),
  nine: J("NINE", "n.s. / adj.", ["Eight and one; one less than ten."]),
  love: J("LOVE", "n.s.", ["The passion between the sexes. Kindness; good-will."]),
  king: J("KING", "n.s.", ["Monarch; supreme governor."]),
  triangle: J("TRIANGLE", "n.s.", ["A figure of three angles."]),
  network: J("NETWORK", "n.s.", [
    "Any thing reticulated or decussated, at equal distances, with interstices between the intersections.",
  ]),
  hope: J("HOPE", "n.s.", ["Expectation of some good."]),
  faith: J("FAITH", "n.s.", ["Belief of revealed truths. Trust. Fidelity."]),
  word: J("WORD", "n.s.", ["A single part of speech. Talk. Promise."]),
  number: J("NUMBER", "n.s.", ["The species of quantity by which it is numbered."]),
  letter: J("LETTER", "n.s.", ["One of the characters of the alphabet."]),
  name: J("NAME", "n.s.", ["The discriminative appellation of an individual."]),
  soul: J("SOUL", "n.s.", ["The immaterial spirit of man."]),
  heart: J("HEART", "n.s.", ["The muscle which propels the blood. Courage. Affections."]),
  truth: J("TRUTH", "n.s.", ["Conformity to fact; reality."]),
  time: J("TIME", "n.s.", ["The measure of duration."]),
  light: J("LIGHT", "n.s.", ["That quality by which we see."]),
  dark: J("DARK", "adj.", ["Not light; obscure."]),
  green: J("GREEN", "adj.", ["Of the colour between blue and yellow. Fresh."]),
  man: J("MAN", "n.s.", ["Human being."]),
  god: J("GOD", "n.s.", ["The Supreme Being."]),
  book: J("BOOK", "n.s.", ["A volume in which we read or write."]),
  fire: J("FIRE", "n.s.", ["The igneous element."]),
  water: J("WATER", "n.s.", ["One of the four elements."]),
  earth: J("EARTH", "n.s.", ["The terraqueous globe; soil."]),
  air: J("AIR", "n.s.", ["The element encompassing the earth."]),
  abc: J("ABC", "n.s.", ["The alphabet; the first rudiments of reading."]),
  jonathan: J("JONATHAN", "n.s.", ["A proper name of Hebrew origin."]),
  definition: J("DEFINITION", "n.s.", ["A short description of a thing by its properties."]),
  method: J("METHOD", "n.s.", ["The placing of several things, or performing several operations, in proper order."]),
  brute: J("BRUTE", "adj.", ["Senseless; irrational."]),
  find: J("FIND", "v.a.", ["To obtain by searching. To discover."]),
  explain: J("EXPLAIN", "v.a.", ["To expound; to illustrate."]),
  meaning: J("MEANING", "n.s.", ["Intention. Sense; signification."]),
  dictionary: J("DICTIONARY", "n.s.", ["A book containing the words of any language."]),
};

function tokenizeExplanation(...parts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const matches = part.toLowerCase().match(/[a-z]+/g) ?? [];
    for (const w of matches) {
      if (STOP.has(w) || w.length < 3) continue;
      if (seen.has(w)) continue;
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}

function lookupJohnson(word: string): JohnsonSense | null {
  const key = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!key) return null;
  if (JOHNSON_LEXICON[key]) return JOHNSON_LEXICON[key]!;
  // light stemming for plurals / -ing / -ed
  for (const cut of [key.replace(/ies$/, "y"), key.replace(/s$/, ""), key.replace(/ing$/, ""), key.replace(/ed$/, "")]) {
    if (cut.length >= 3 && JOHNSON_LEXICON[cut]) return JOHNSON_LEXICON[cut]!;
  }
  return null;
}

/** BRUTE FORCE METHOD TO FIND DEFINITIONS — expand every content-word via Johnson 1777. */
export function bruteForceJohnsonExpand(...texts: string[]): JohnsonExpansion[] {
  return tokenizeExplanation(...texts).map((word) => {
    const entry = lookupJohnson(word);
    return { word, found: Boolean(entry), entry };
  });
}

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
 * letter-sum numerology (MATLAB word_to_numerology), then:
 * previous path meanings + tarot + Johnson brute-force word expansion.
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
  const tarot = TAROT[number] ?? TAROT[9]!;

  const johnsonExpansions = bruteForceJohnsonExpand(
    meaning.title,
    meaning.traits.join(" "),
    meaning.note,
    tarot.name,
    tarot.arcana,
    tarot.explanation,
  );

  const key = normalized.replace(/[^a-z]/g, "");
  const johnsonWord = lookupJohnson(key);
  const johnsonNumber = lookupJohnson(
    ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][number] ?? "nine",
  );

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
    tarot,
    johnsonExpansions,
    johnsonNumber,
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
  const expansions = result.johnsonExpansions
    .map((e) =>
      e.found && e.entry
        ? `  ${e.word.toUpperCase()} — ${e.entry.senses[0]}`
        : `  ${e.word.toUpperCase()} — (no Johnson headword onboard)`,
    )
    .join("\n");
  return [
    `WORD: "${result.input}"`,
    `Normalized: ${result.normalized}`,
    `Letters counted: ${result.letterCount}`,
    `Letter map (A=1 … Z=26):`,
    rows,
    "",
    `Σ positions = ${result.sumPositions}`,
    `mod(${result.sumPositions}, 9) = ${result.remainder}${result.remainder === 0 ? " → 9" : ""}`,
    `Digital-root path: ${result.reductionSteps.join(" → ")}`,
    "",
    `NUMEROLOGY: ${result.number} — ${result.title}`,
    `Traits: ${result.traits.join(", ")}`,
    result.note,
    "",
    `TAROT: ${result.tarot.arcana} · ${result.tarot.name}`,
    result.tarot.explanation,
    "",
    "BRUTE FORCE METHOD TO FIND DEFINITIONS!",
    "Samuel Johnson Dictionary 1777 federally validated is included.",
    expansions,
  ].join("\n");
}
