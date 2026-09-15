/** Scattered mystery scraps in the grasslands (Fruitful Grape Vine world).
 * Contents stay hidden until every scrap is bound — then Press B opens THE SECRET OF JEHOVAH.
 */

import { TIMOTHY_KJV_FULL } from "./timothy-kjv";

export type ScatteredPaper = {
  id: string;
  order: number;
  tx: number;
  ty: number;
  tab: string;
  text: string;
  /** Pixel paper fill (no white) — rainbow / tinted scrap. */
  color: string;
  ink: string;
  highlightMarkers?: boolean;
};

export const JEHOVAH_BOOK_TITLE = "THE SECRET OF JEHOVAH";

/** Rainbow scrap colors — never pure white. */
const PAPER_COLORS: { color: string; ink: string }[] = [
  { color: "#e84848", ink: "#601010" }, // red
  { color: "#f07828", ink: "#603010" }, // orange
  { color: "#e8c028", ink: "#604810" }, // yellow
  { color: "#48b848", ink: "#104018" }, // green
  { color: "#38a0e8", ink: "#103858" }, // blue
  { color: "#5858c8", ink: "#181848" }, // indigo
  { color: "#a848c8", ink: "#401858" }, // violet
  { color: "#e86898", ink: "#581828" }, // rose
  { color: "#48c8a8", ink: "#104838" }, // teal
  { color: "#c8a038", ink: "#504018" }, // gold-amber
  { color: "#6890e8", ink: "#182858" }, // sky
];

function tint(i: number) {
  return PAPER_COLORS[i % PAPER_COLORS.length]!;
}

/** Fixed scatter across grasslands grass/path — statues stay in Greenvale. */
export const SCATTERED_PAPERS: ScatteredPaper[] = [
  {
    id: "p1",
    order: 1,
    tx: 10,
    ty: 4,
    color: "#e84848",
    ink: "#601010",
    tab: "I · EARTH",
    text: `As gods of Fire, Air, Water, they were celestial gods; as gods of the lower region, they were infernal deities: the latter adjective applying simply to the Earth. They were "Spirits of the Earth" under their respective names of Yama, Pluto, Osiris, the "Lord of the lower kingdom, etc., etc.," and their tellurial character proves it sufficiently.

The ancients knew of no worse abode after death than the Kamaloka, the limbus on this Earth.`,
  },
  {
    id: "p2",
    order: 2,
    tx: 14,
    ty: 5,
    color: "#f07828",
    ink: "#603010",
    tab: "II · ADONAI",
    text: `If it is argued that the Dodonean Jupiter was identified with Aidoneus, the king of the subterranean world, and Dis, or the Roman Pluto and the Dionysius Chthonios, the subterranean, wherein, according to Creuzer (I, vi., ch. 1), oracles were rendered, then it will become the pleasure of the Occultists to prove that both Aidoneus and Dionysius are the bases of Adonai, or "Jurbo Adonai," as Jehovah is called in Codex Nazaraeus.

"Thou shalt not worship the Sun, who is named Adonai, whose name is also Kadush and El-El" (Cod. Naz., I, 47; see also Psalm lxxxix., 18), and also "Lord Bacchus."`,
  },
  {
    id: "p3",
    order: 3,
    tx: 8,
    ty: 8,
    color: "#e8c028",
    ink: "#604810",
    tab: "III · BAAL",
    text: `Baal-Adonis of the Sods or Mysteries of the pre-Babylonian Jews became the Adonai by the Massorah, the later-vowelled Jehovah. Hence the Roman Catholics are right. All these Jupiters are of the same family; but Jehovah has to be included therein to make it complete.

— The Secret Doctrine, Vol. 1, bk 2, ch 14
http://www.theosociety.org/pasadena/sd/sd1-2-14.htm`,
  },
  {
    id: "p4",
    order: 4,
    tx: 16,
    ty: 8,
    color: "#48b848",
    ink: "#104018",
    tab: "IV · JUPITER",
    text: `Jupiter-Aerios or Pan, the Jupiter Ammon, and the Jupiter-Bel-Moloch, are all correlations and one with Yurbo-Adonai, because they are all one cosmic nature. It is that nature and power which create the specific terrestrial symbol, and the physical and material fabric of the latter, which proves the Energy manifesting through it as extrinsic.`,
  },
  {
    id: "p5",
    order: 5,
    tx: 11,
    ty: 11,
    color: "#38a0e8",
    ink: "#103858",
    tab: "V · SOD",
    text: `The dying Jacob thus describes his sons: "Dan," he says, "shall be a serpent by the way, an adder in the path, that biteth the horse-heels, so that his rider shall fall backwards (i.e., he will teach candidates black magic) . . . . I have waited for thy salvation, O Lord!"

Of Simeon and Levi the patriarch remarks that they "are brethren; instruments of cruelty are in their habitations. O my soul, come not thou into their secret; unto their assembly."

Now in the original, the words "their secret" really are "their SOD." And Sod was the name for the great mysteries of Baal, Adonis and Bacchus, who were all sun-gods and had serpents for symbols.`,
  },
  {
    id: "p6",
    order: 6,
    tx: 15,
    ty: 11,
    color: "#5858c8",
    ink: "#181848",
    tab: "VI · 1 TIM.",
    highlightMarkers: true,
    text: TIMOTHY_KJV_FULL,
  },
  {
    id: "p7",
    order: 7,
    tx: 5,
    ty: 5,
    color: "#a848c8",
    ink: "#401858",
    tab: "VII · LEVI",
    text: `The Kabalists explain the allegory of the fiery serpents by saying that this was the name given to the tribe of Levi, to all the Levites, in short, and that Moses was the chief of the Sodales.

It is to the mysteries that the original meaning of the "Dragon-Slayers" has to be traced.

— The Secret Doctrine, Vol. 2, Page 212`,
  },
  {
    id: "p8",
    order: 8,
    tx: 20,
    ty: 5,
    color: "#e86898",
    ink: "#581828",
    tab: "VIII · EGG",
    text: `WHENCE this universal symbol? The Egg was incorporated as a sacred sign in the cosmogony of every people on the Earth, and was revered both on account of its form and its inner mystery. From the earliest mental conceptions of man, it was known as that which represented most successfully the origin and secret of being.

The "First Cause" had no name in the beginnings. Later it was pictured in the fancy of the thinkers as an ever invisible, mysterious Bird that dropped an Egg into Chaos, which Egg becomes the Universe. Hence Brahm was called Kalahansa, "the swan in (Space and) Time." He became the "Swan of Eternity," who lays at the beginning of each Mahamanvantara a "Golden Egg."`,
  },
  {
    id: "p9",
    order: 9,
    tx: 24,
    ty: 12,
    color: "#48c8a8",
    ink: "#104838",
    tab: "IX · SEB",
    text: `As Bryant shows (iii., 165), it was a symbol adopted among the Greeks, the Syrians, Persians, and Egyptians. In chap. liv. of the Egyptian Ritual, Seb, the god of Time and of the Earth, is spoken of as having laid an egg, or the Universe, "an egg conceived at the hour of the great one of the Dual Force."

Ra is shown like Brahma gestating in the Egg of the Universe. The deceased is "resplendent in the Egg of the land of mysteries." "It is the Egg of the great clucking Hen, the Egg of Seb, who issues from it like a hawk."`,
  },
  {
    id: "p10",
    order: 10,
    tx: 13,
    ty: 15,
    color: "#c8a038",
    ink: "#504018",
    tab: "X · ENOCH",
    text: `The story about Enoch, told by Josephus, namely, that he had concealed under the pillars of Mercury or Seth his precious rolls or books, is the same as that told of Hermes, "the father of Wisdom," who concealed his books of Wisdom under a pillar, and then, finding the two pillars of stone, found the science written thereon.

Those pillars were built by Seth — not the Patriarch, nor Teth, Set, Thoth, Tat, Sat (the later Sat-an), or Hermes, who are all one — but by the "sons of the Serpent-god," or "Sons of the Dragon," the name under which the Hierophants of Egypt and Babylon were known before the Deluge, as were their forefathers, the Atlanteans.`,
  },
  {
    id: "p11",
    order: 11,
    tx: 18,
    ty: 15,
    color: "#6890e8",
    ink: "#182858",
    tab: "XI · PHTAH",
    text: `Ammon-Ra, the generator, is the secondary aspect of the concealed deity. Khnoum was adored at Elephanta and Philoe, Ammon at Thebes. But it is Emepht, the One, Supreme Planetary principle, who blows the egg out of his mouth, and who is, therefore, Brahma.

The shadow of the deity, Kosmic and universal, of that which broods over and permeates the egg with its vivifying Spirit until the germ contained in it is ripe, was the mystery god whose name was unpronounceable. It is Phtah, however, "he who opens," the opener of life and Death, who proceeds from the egg of the world to begin his dual work. (Book of Numbers.)`,
  },
];

export function allPapersCollected(collectedIds: Set<string>): boolean {
  return SCATTERED_PAPERS.every((p) => collectedIds.has(p.id));
}

export function nextPaperToCollect(collectedIds: Set<string>): ScatteredPaper | undefined {
  return SCATTERED_PAPERS.find((p) => !collectedIds.has(p.id));
}

export function paperById(id: string): ScatteredPaper | undefined {
  return SCATTERED_PAPERS.find((p) => p.id === id);
}

export function paperAt(tx: number, ty: number): ScatteredPaper | undefined {
  return SCATTERED_PAPERS.find((p) => p.tx === tx && p.ty === ty);
}
