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
      "* LORD PETER waits past the gold door.",
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
  pattern: "seeds" | "salt" | "king" | "bush" | "vine";
  boss?: boolean;
  minLevel?: number;
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
    name: "LORD PETER KING DE MI URGOS DE LOS CHRISTOS",
    hp: 120,
    atk: 8,
    def: 6,
    exp: 80,
    gold: 120,
    color: "#f8d030",
    flavor:
      "LORD PETER KING DE MI URGOS DE LOS CHRISTOS blocks the way. One eye watches. The hat tilts.",
    check:
      "* LORD PETER - ATK 8 DEF 6\n* Triangle crown. All-seeing eye. Very lonely.",
    mercyText: "* You offered to stay and talk a while.",
    mercyTurns: 4,
    attackTime: 9000,
    pattern: "king",
    boss: true,
  },
  wildbush: {
    id: "wildbush",
    name: "ANGRY BUSH",
    hp: 52,
    atk: 5,
    def: 3,
    exp: 14,
    gold: 12,
    color: "#287818",
    flavor: "An ANGRY BUSH rattles its leaves at you.",
    check: "* ANGRY BUSH - ATK 5 DEF 3\n* Burns when defeated. Smells like smoke.",
    mercyText: "* You watered it politely. It is still angry.",
    mercyTurns: 3,
    attackTime: 5500,
    pattern: "bush",
  },
  grapevine: {
    id: "grapevine",
    name: "POISONOUS IVY LAUREL VINE",
    hp: 420,
    atk: 14,
    def: 10,
    exp: 200,
    gold: 0,
    color: "#581878",
    flavor: "The POISONOUS IVY LAUREL VINE uncoils. Grapes drip like poison.",
    check:
      "* IVY LAUREL VINE - ATK 14 DEF 10\n* Requires LV 7+. Impossible without training.",
    mercyText: "* The vine laughs with a thousand leaves.",
    mercyTurns: 99,
    attackTime: 7500,
    pattern: "vine",
    boss: true,
    minLevel: 7,
  },
};

export const WILD_POOL = ["flowerling", "saltshaker"];
