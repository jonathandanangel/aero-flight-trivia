export const TILE = 24;

// # wall, . floor, g grass (encounters), w water (blocked), D boss door, f flower
export const MAP_ROWS = [
  "#########################",
  "#.......................#",
  "#..###......ggggg.......#",
  "#..#.#......ggggg....##.#",
  "#..#.#...............##.#",
  "#..###.......ff.........#",
  "#............ff.........#",
  "#...wwww................#",
  "#...wwww......ggggggg...#",
  "#...wwww......ggggggg...#",
  "#.............ggggggg...#",
  "#....##.................#",
  "#....##.......ff........#",
  "#.............ff........#",
  "#..ggg..................#",
  "#..ggg......#####D#####.#",
  "#...........#.........#.#",
  "#########################",
];

export const MAP_W = (MAP_ROWS[0] ?? "").length;
export const MAP_H = MAP_ROWS.length;

export function tileAt(tx: number, ty: number): string {
  if (ty < 0 || ty >= MAP_H || tx < 0 || tx >= MAP_W) return "#";
  return MAP_ROWS[ty]?.[tx] ?? "#";
}

export function isSolid(tx: number, ty: number): boolean {
  const t = tileAt(tx, ty);
  return t === "#" || t === "w";
}

export type Npc = {
  id: string;
  name: string;
  tx: number;
  ty: number;
  color: string;
  lines: string[];
};

export const NPCS: Npc[] = [
  {
    id: "toby",
    name: "OLD SAGE",
    tx: 8,
    ty: 1,
    color: "#d8a858",
    lines: [
      "* Welcome to GREENVALE, hero.",
      "* Arrow keys to walk. Z or ENTER to talk.",
      "* Tall grass hides monsters. Watch your step.",
      "* Draw your sword... or try MERCY. Your call.",
      "* The gold door is a shrine first. Align the living roots.",
    ],
  },
  {
    id: "nurse",
    name: "GREAT FAIRY",
    tx: 20,
    ty: 5,
    color: "#f8b0d8",
    lines: [
      "* Your hearts look dim, traveler.",
      "* There. Life force restored!",
      "* In battle, your hearts roll down slowly.",
      "* Heal fast enough and a fatal hit won't stick.",
    ],
  },
  {
    id: "kid",
    name: "VILLAGE YOUTH",
    tx: 8,
    ty: 12,
    color: "#58c878",
    lines: [
      "* The TRIANGLE KING waits past the gold door.",
      "* South wall. Three roots. The mural must match before he wakes.",
      "* When he attacks, dodge with the red triangle!",
      "* Don't get hit. Getting hit is bad.",
    ],
  },
  {
    id: "dog",
    name: "SLEEPING KNIGHT",
    tx: 17,
    ty: 12,
    color: "#c8c0a8",
    lines: [
      "* (The knight is asleep on watch.)",
      "* ...",
      "* (He dreams of a triangle he never found.)",
    ],
  },
];

export type Enemy = {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
  color: string;
  flavor: string;
  check: string;
  mercyText: string;
  mercyTurns: number;
  attackTime: number;
  pattern: "seeds" | "salt" | "king";
  boss?: boolean;
};

export const ENEMIES: Record<string, Enemy> = {
  flowerling: {
    id: "flowerling",
    name: "BUSHLING",
    hp: 34,
    atk: 4,
    def: 2,
    exp: 6,
    gold: 9,
    color: "#48a828",
    flavor: "A BUSHLING rustles out of the grass.",
    check: "* BUSHLING - ATK 4 DEF 2\n* Spits triangle seeds. Hates being ignored.",
    mercyText: "* You complimented its leaves. It blushes.",
    mercyTurns: 2,
    attackTime: 6000,
    pattern: "seeds",
  },
  saltshaker: {
    id: "saltshaker",
    name: "ROCKTOAD",
    hp: 46,
    atk: 6,
    def: 4,
    exp: 11,
    gold: 15,
    color: "#c06030",
    flavor: "A ROCKTOAD hops into your path.",
    check: "* ROCKTOAD - ATK 6 DEF 4\n* Stone-skinned. Spits pebbles.",
    mercyText: "* You told a joke. It croaks with laughter.",
    mercyTurns: 3,
    attackTime: 7000,
    pattern: "salt",
  },
  saltking: {
    id: "saltking",
    name: "TRIANGLE KING",
    hp: 120,
    atk: 8,
    def: 6,
    exp: 80,
    gold: 120,
    color: "#f8d030",
    flavor: "THE TRIANGLE KING blocks the way. The air hums.",
    check: "* TRIANGLE KING - ATK 8 DEF 6\n* Guards three relics. Very lonely.",
    mercyText: "* You offered to stay and talk a while.",
    mercyTurns: 4,
    attackTime: 9000,
    pattern: "king",
    boss: true,
  },
};

export const WILD_POOL = ["flowerling", "saltshaker"];
