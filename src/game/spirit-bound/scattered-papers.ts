/** Scattered Secret Doctrine scraps — appear on Greenvale after the boss door opens.
 * Bound in order into THE SECRET OF JEHOVAH REVEALED as separate tabs (not one continuous text).
 */

import { TIMOTHY_KJV_FULL } from "./timothy-kjv";

export type ScatteredPaper = {
  id: string;
  /** Collection order (1-based). Must pick up in this sequence. */
  order: number;
  tx: number;
  ty: number;
  /** Short tab label inside THE SECRET OF JEHOVAH REVEALED */
  tab: string;
  text: string;
  /** If true, [[HL]]…[[/HL]] markers render in red (1 Tim 5:23 wine verse). */
  highlightMarkers?: boolean;
};

export const JEHOVAH_BOOK_TITLE = "THE SECRET OF JEHOVAH REVEALED";

/** Hard hunt: many scraps sit in tall grass (encounters), far corners, and the shrine approach.
 * Collect strictly in order — wrong scrap stays sealed. That hunt is harder than the vine boss.
 */
export const SCATTERED_PAPERS: ScatteredPaper[] = [
  {
    id: "p1",
    order: 1,
    tx: 22,
    ty: 1,
    tab: "I · EARTH",
    text: `As gods of Fire, Air, Water, they were celestial gods; as gods of the lower region, they were infernal deities: the latter adjective applying simply to the Earth. They were "Spirits of the Earth" under their respective names of Yama, Pluto, Osiris, the "Lord of the lower kingdom, etc., etc.," and their tellurial character proves it sufficiently.

The ancients knew of no worse abode after death than the Kamaloka, the limbus on this Earth.`,
  },
  {
    id: "p2",
    order: 2,
    tx: 14,
    ty: 2,
    tab: "II · ADONAI",
    text: `If it is argued that the Dodonean Jupiter was identified with Aidoneus, the king of the subterranean world, and Dis, or the Roman Pluto and the Dionysius Chthonios, the subterranean, wherein, according to Creuzer (I, vi., ch. 1), oracles were rendered, then it will become the pleasure of the Occultists to prove that both Aidoneus and Dionysius are the bases of Adonai, or "Jurbo Adonai," as Jehovah is called in Codex Nazaraeus.

"Thou shalt not worship the Sun, who is named Adonai, whose name is also Kadush and El-El" (Cod. Naz., I, 47; see also Psalm lxxxix., 18), and also "Lord Bacchus."`,
  },
  {
    id: "p3",
    order: 3,
    tx: 4,
    ty: 7,
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
    tab: "IV · JUPITER",
    text: `Jupiter-Aerios or Pan, the Jupiter Ammon, and the Jupiter-Bel-Moloch, are all correlations and one with Yurbo-Adonai, because they are all one cosmic nature. It is that nature and power which create the specific terrestrial symbol, and the physical and material fabric of the latter, which proves the Energy manifesting through it as extrinsic.`,
  },
  {
    id: "p5",
    order: 5,
    tx: 1,
    ty: 12,
    tab: "V · SOD",
    text: `The dying Jacob thus describes his sons: "Dan," he says, "shall be a serpent by the way, an adder in the path, that biteth the horse-heels, so that his rider shall fall backwards (i.e., he will teach candidates black magic) . . . . I have waited for thy salvation, O Lord!"

Of Simeon and Levi the patriarch remarks that they "are brethren; instruments of cruelty are in their habitations. O my soul, come not thou into their secret; unto their assembly."

Now in the original, the words "their secret" really are "their SOD." And Sod was the name for the great mysteries of Baal, Adonis and Bacchus, who were all sun-gods and had serpents for symbols.`,
  },
  {
    id: "p6",
    order: 6,
    tx: 18,
    ty: 9,
    tab: "VI · 1 TIM.",
    highlightMarkers: true,
    text: TIMOTHY_KJV_FULL,
  },
  {
    id: "p7",
    order: 7,
    tx: 3,
    ty: 14,
    tab: "VII · LEVI",
    text: `The Kabalists explain the allegory of the fiery serpents by saying that this was the name given to the tribe of Levi, to all the Levites, in short, and that Moses was the chief of the Sodales.

It is to the mysteries that the original meaning of the "Dragon-Slayers" has to be traced.

— The Secret Doctrine, Vol. 2, Page 212`,
  },
  {
    id: "p8",
    order: 8,
    tx: 13,
    ty: 5,
    tab: "VIII · EGG",
    text: `WHENCE this universal symbol? The Egg was incorporated as a sacred sign in the cosmogony of every people on the Earth, and was revered both on account of its form and its inner mystery. From the earliest mental conceptions of man, it was known as that which represented most successfully the origin and secret of being.

The "First Cause" had no name in the beginnings. Later it was pictured in the fancy of the thinkers as an ever invisible, mysterious Bird that dropped an Egg into Chaos, which Egg becomes the Universe. Hence Brahm was called Kalahansa, "the swan in (Space and) Time." He became the "Swan of Eternity," who lays at the beginning of each Mahamanvantara a "Golden Egg."`,
  },
  {
    id: "p9",
    order: 9,
    tx: 21,
    ty: 14,
    tab: "IX · SEB",
    text: `As Bryant shows (iii., 165), it was a symbol adopted among the Greeks, the Syrians, Persians, and Egyptians. In chap. liv. of the Egyptian Ritual, Seb, the god of Time and of the Earth, is spoken of as having laid an egg, or the Universe, "an egg conceived at the hour of the great one of the Dual Force."

Ra is shown like Brahma gestating in the Egg of the Universe. The deceased is "resplendent in the Egg of the land of mysteries." "It is the Egg of the great clucking Hen, the Egg of Seb, who issues from it like a hawk."`,
  },
  {
    id: "p10",
    order: 10,
    tx: 10,
    ty: 9,
    tab: "X · ENOCH",
    text: `The story about Enoch, told by Josephus, namely, that he had concealed under the pillars of Mercury or Seth his precious rolls or books, is the same as that told of Hermes, "the father of Wisdom," who concealed his books of Wisdom under a pillar, and then, finding the two pillars of stone, found the science written thereon.

Those pillars were built by Seth — not the Patriarch, nor Teth, Set, Thoth, Tat, Sat (the later Sat-an), or Hermes, who are all one — but by the "sons of the Serpent-god," or "Sons of the Dragon," the name under which the Hierophants of Egypt and Babylon were known before the Deluge, as were their forefathers, the Atlanteans.`,
  },
  {
    id: "p11",
    order: 11,
    tx: 19,
    ty: 15,
    tab: "XI · PHTAH",
    text: `Ammon-Ra, the generator, is the secondary aspect of the concealed deity. Khnoum was adored at Elephanta and Philoe, Ammon at Thebes. But it is Emepht, the One, Supreme Planetary principle, who blows the egg out of his mouth, and who is, therefore, Brahma.

The shadow of the deity, Kosmic and universal, of that which broods over and permeates the egg with its vivifying Spirit until the germ contained in it is ripe, was the mystery god whose name was unpronounceable. It is Phtah, however, "he who opens," the opener of life and Death, who proceeds from the egg of the world to begin his dual work. (Book of Numbers.)`,
  },
];

export function nextPaperToCollect(collectedIds: Set<string>): ScatteredPaper | undefined {
  return SCATTERED_PAPERS.find((p) => !collectedIds.has(p.id));
}

export function paperById(id: string): ScatteredPaper | undefined {
  return SCATTERED_PAPERS.find((p) => p.id === id);
}

export function paperAt(tx: number, ty: number): ScatteredPaper | undefined {
  return SCATTERED_PAPERS.find((p) => p.tx === tx && p.ty === ty);
}
