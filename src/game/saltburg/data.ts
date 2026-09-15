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
    name: "GRANDPA PIXEL",
    tx: 8,
    ty: 1,
    color: "#ffd166",
    lines: [
      "* Howdy, kid! Welcome to SALTBURG.",
      "* Arrow keys to walk. Z or ENTER to talk.",
      "* The tall grass is crawling with critters.",
      "* Fight 'em... or try MERCY. Your call.",
    ],
  },
  {
    id: "nurse",
    name: "MISS MENDER",
    tx: 20,
    ty: 5,
    color: "#7ee787",
    lines: [
      "* You look scuffed, sweetheart.",
      "* There. All patched up, HP restored!",
      "* In battle, your HP rolls down slowly.",
      "* Heal fast enough and a fatal hit won't stick.",
    ],
  },
  {
    id: "kid",
    name: "STATIC KID",
    tx: 8,
    ty: 12,
    color: "#79c0ff",
    lines: [
      "* zzzt... the SALT KING lives past the door.",
      "* It's the gap in the wall, way down south.",
      "* When he attacks, dodge with the red heart!",
      "* Don't get hit. Getting hit is bad. zzzt.",
    ],
  },
  {
    id: "dog",
    name: "A SUSPICIOUS DOG",
    tx: 17,
    ty: 12,
    color: "#f0f0f0",
    lines: [
      "* (The dog is asleep on the job.)",
      "* ...",
      "* (It dreams of a game it never finished.)",
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
    name: "FLOWERLING",
    hp: 34,
    atk: 4,
    def: 2,
    exp: 6,
    gold: 9,
    color: "#f78fb3",
    flavor: "A FLOWERLING waggles its petals.",
    check: "* FLOWERLING - ATK 4 DEF 2\n* Spits seeds. Hates being ignored.",
    mercyText: "* You complimented its petals. It blushes.",
    mercyTurns: 2,
    attackTime: 6000,
    pattern: "seeds",
  },
  saltshaker: {
    id: "saltshaker",
    name: "SALT SHAKER",
    hp: 46,
    atk: 6,
    def: 4,
    exp: 11,
    gold: 15,
    color: "#c7d2fe",
    flavor: "A SALT SHAKER rattles menacingly.",
    check: "* SALT SHAKER - ATK 6 DEF 4\n* Seasoned veteran. Literally.",
    mercyText: "* You told a joke. It shakes with laughter.",
    mercyTurns: 3,
    attackTime: 7000,
    pattern: "salt",
  },
  saltking: {
    id: "saltking",
    name: "THE SALT KING",
    hp: 120,
    atk: 8,
    def: 6,
    exp: 80,
    gold: 120,
    color: "#ffb703",
    flavor: "THE SALT KING blocks the way. The air hums.",
    check: "* SALT KING - ATK 8 DEF 6\n* Rules a kingdom of one. Very lonely.",
    mercyText: "* You offered to stay and talk a while.",
    mercyTurns: 4,
    attackTime: 9000,
    pattern: "king",
    boss: true,
  },
};

export const WILD_POOL = ["flowerling", "saltshaker"];
