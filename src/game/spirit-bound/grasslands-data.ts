import { TILE } from "./data";

/** EarthBound-style pastoral map — grass, paths, cliffs, houses, vine boss.
 * Bushes (B) are spawned randomly onto grass tiles at runtime — not fixed here.
 */
export const GRASS_ROWS = [
  "############################",
  "#pppppppppppppppppppppppppp#",
  "#p..rrrr....gggggg....rrrrp#",
  "#p..rhr.....gggggg.....rhrp#",
  "#p..rrrr.....ggggg.....rrrrp#",
  "#p..........gggggg.........p#",
  "#p..ccccc...gggggg...ccccc.p#",
  "#p..c...c...ggggg...c...c.p#",
  "#p..c.g.c...gggggg...c.g.c.p#",
  "#p..c...c...ggggg...c...c.p#",
  "#p..ccccc...gggggg...ccccc.p#",
  "#p..........gggggg.........p#",
  "#p..rrrr....ggggg....rrrr..p#",
  "#p..rhr.....gggggg.....rhrp#",
  "#p..rrrr....gggggg....rrrr.p#",
  "#p..........ggggg..........p#",
  "#p..........gggggg....V...p#",
  "#pppppppppppppppppppppppppp#",
  "############################",
];

export const GRASS_W = (GRASS_ROWS[0] ?? "").length;
export const GRASS_H = GRASS_ROWS.length;

export { TILE as GRASS_TILE };

export function grassTileAt(tx: number, ty: number): string {
  if (ty < 0 || ty >= GRASS_H || tx < 0 || tx >= GRASS_W) return "#";
  return GRASS_ROWS[ty]?.[tx] ?? "#";
}

export function grassSolid(tx: number, ty: number, _burnt: Set<string>): boolean {
  const t = grassTileAt(tx, ty);
  if (t === "#" || t === "c" || t === "r" || t === "h" || t === "w") return true;
  return false;
}

export type GrassNpc = {
  id: string;
  name: string;
  tx: number;
  ty: number;
  lines: string[];
};

export const GRASS_NPCS: GrassNpc[] = [
  {
    id: "sign",
    name: "WEATHERED SIGN",
    tx: 3,
    ty: 2,
    lines: [
      "* ONETT? No. This is the IVY LAUREL GRASSLANDS.",
      "* (Someone crossed out the old name with crayon.)",
    ],
  },
  {
    id: "paul",
    name: "WANDERING SCRIBE",
    tx: 22,
    ty: 8,
    lines: [
      "* They call me Paul Barnabus in the old songs.",
      "* The Nazarene's road runs through every bush you burn.",
      "* Level up. The vine drinks starlight.",
    ],
  },
  {
    id: "ness",
    name: "BOY WITH A BAT",
    tx: 12,
    ty: 14,
    lines: [
      "* ...PK THUNDER...?",
      "* (He is thinking about sandwiches.)",
      "* You feel a little homesick for a town you never visited.",
    ],
  },
  {
    id: "vinehermit",
    name: "ROOT LISTENER",
    tx: 6,
    ty: 12,
    lines: [
      "* The FRUITFUL GRAPE VINE sleeps at the eastern path.",
      "* It fed on LORD PETER's crown for centuries.",
      "* You need LV 7 before its grapes even notice you.",
    ],
  },
];

export const VINE_MIN_LEVEL = 7;

/** Golden egg easter egg — northwest edge of the grasslands path ring. */
export const GOLDEN_EGG = { tx: 1, ty: 2 };

/** Hawk egg easter egg — northeast edge, opposite the golden egg. */
export const HAWK_EGG = { tx: 26, ty: 2 };

/** Scatter angry bushes onto grass tiles (random each grasslands visit / new game). */
export function generateRandomBushKeys(count = 14): Set<string> {
  const blocked = new Set<string>([
    `${GOLDEN_EGG.tx},${GOLDEN_EGG.ty}`,
    `${HAWK_EGG.tx},${HAWK_EGG.ty}`,
    ...GRASS_NPCS.map((n) => `${n.tx},${n.ty}`),
    "2,3", // spawn
  ]);
  const candidates: string[] = [];
  for (let ty = 0; ty < GRASS_H; ty++) {
    for (let tx = 0; tx < GRASS_W; tx++) {
      if (grassTileAt(tx, ty) !== "g") continue;
      const key = `${tx},${ty}`;
      if (blocked.has(key)) continue;
      candidates.push(key);
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = a;
  }
  return new Set(candidates.slice(0, Math.min(count, candidates.length)));
}
