import { mulberry32, pickIndex } from "@/game/spirit-bound/shrine/rng";
import { entityById, eventById, holders, items, SOURCES } from "./catalog";
import { typesForTier } from "./difficultyManager";
import { evaluate } from "./logicEngine";
import type { Atom, Challenge, ChallengeType, Entity, Rel, ReasonTier, Scene, Voice } from "./types";

const POS_RELS: Rel[] = ["west", "east", "north", "south", "beside"];
const ORDER_RELS: Rel[] = ["before", "after"];

function pick<T>(rng: () => number, list: readonly T[]): T {
  const item = list[pickIndex(rng, list.length)];
  if (item === undefined) throw new Error("empty pick");
  return item;
}

function pickNorthSouth(rng: () => number, scene: Scene): [Entity, Entity] | null {
  const north = scene.entities.filter((e) => e.row === 0);
  const south = scene.entities.filter((e) => e.row === 1);
  if (north.length === 0 || south.length === 0) return null;
  return [pick(rng, south), pick(rng, north)];
}

function pickTwo<T>(rng: () => number, list: readonly T[]): [T, T] | null {
  if (list.length < 2) return null;
  const i = pickIndex(rng, list.length);
  let j = pickIndex(rng, list.length);
  if (j === i) j = (i + 1) % list.length;
  const a = list[i];
  const b = list[j];
  if (a === undefined || b === undefined) return null;
  return [a, b];
}

function cap(text: string): string {
  const t = text.trim();
  if (!t) return t;
  const first = t[0];
  if (!first) return t;
  return `${first.toUpperCase()}${t.slice(1)}`;
}

function phraseOf(scene: Scene, id: string): string {
  return entityById(scene, id)?.phrase ?? "the figure";
}

function renderRel(atom: Extract<Atom, { kind: "rel" }>, scene: Scene, voice: Voice, negated: boolean): string {
  const a = phraseOf(scene, atom.a);
  const b = phraseOf(scene, atom.b);
  if (atom.rel === "owns") {
    if (voice === "passive") {
      return negated ? `${b} is not carried by ${a}` : `${b} is carried by ${a}`;
    }
    return negated ? `${a} does not possess ${b}` : `${a} carries ${b}`;
  }
  if (atom.rel === "stronger") {
    return negated ? `${a} is not stronger than ${b}` : `${a} holds more fire than ${b}`;
  }
  if (atom.rel === "before") {
    return negated ? `${a} did not arrive before ${b}` : `${a} arrived before ${b}`;
  }
  if (atom.rel === "after") {
    return negated ? `${a} did not arrive after ${b}` : `${a} arrived after ${b}`;
  }
  const dir =
    atom.rel === "west"
      ? "west of"
      : atom.rel === "east"
        ? "east of"
        : atom.rel === "north"
          ? "north of"
          : atom.rel === "south"
            ? "south of"
            : "beside";
  if (voice === "passive") {
    return negated ? `${a} is not posted ${dir} ${b}` : `${a} is posted ${dir} ${b}`;
  }
  return negated ? `${a} does not stand ${dir} ${b}` : `${a} stands ${dir} ${b}`;
}

function renderAtom(atom: Atom, scene: Scene, voice: Voice): string {
  switch (atom.kind) {
    case "rel":
      return renderRel(atom, scene, voice, false);
    case "not":
      if (atom.inner.kind === "rel") return renderRel(atom.inner, scene, voice, true);
      return `it is not true that ${renderAtom(atom.inner, scene, voice)}`;
    case "and":
      return `${renderAtom(atom.left, scene, voice)} and ${renderAtom(atom.right, scene, voice)}`;
    case "or":
      return `${renderAtom(atom.left, scene, voice)} or ${renderAtom(atom.right, scene, voice)}`;
    case "neither": {
      const a = phraseOf(scene, atom.a);
      const b = phraseOf(scene, atom.b);
      const w1 = neitherWord(atom.rels[0]);
      const w2 = neitherWord(atom.rels[1]);
      return `${a} is neither ${w1} nor ${w2} ${b}`;
    }
    case "notAbsent":
      return `${phraseOf(scene, atom.item)} is not absent from ${phraseOf(scene, atom.holder)}`;
    case "cannotDim":
      return `${phraseOf(scene, atom.id)} cannot be considered dim`;
    case "eventOrder": {
      const a = eventById(scene, atom.a)?.phrase ?? "the omen";
      const b = eventById(scene, atom.b)?.phrase ?? "the second omen";
      return atom.rel === "before" ? `${a} happened before ${b}` : `${a} triggered after ${b}`;
    }
  }
}

function neitherWord(rel: Rel): string {
  if (rel === "west") return "west of";
  if (rel === "east") return "east of";
  if (rel === "north") return "north of";
  if (rel === "south") return "south of";
  if (rel === "beside") return "beside";
  if (rel === "before") return "behind";
  if (rel === "after") return "north of";
  if (rel === "owns") return "bound to";
  return "brighter than";
}

function simpleRel(rng: () => number, scene: Scene, type: ChallengeType): Atom | null {
  if (type === "own") {
    const held = items(scene);
    const people = holders(scene);
    if (held.length === 0 || people.length === 0) return null;
    const item = pick(rng, held);
    const person = pick(rng, people);
    return { kind: "rel", rel: "owns", a: person.id, b: item.id };
  }
  if (type === "order") {
    const pair = pickNorthSouth(rng, scene);
    if (!pair) return null;
    const [south, north] = pair;
    if (rng() < 0.5) {
      return { kind: "rel", rel: pick(rng, ORDER_RELS), a: south.id, b: north.id };
    }
    return { kind: "rel", rel: pick(rng, ORDER_RELS), a: north.id, b: south.id };
  }
  if (type === "compare") {
    const pair = pickTwo(rng, scene.entities);
    if (!pair) return null;
    return { kind: "rel", rel: "stronger", a: pair[0].id, b: pair[1].id };
  }
  const pair = pickTwo(rng, scene.entities);
  if (!pair) return null;
  return { kind: "rel", rel: pick(rng, POS_RELS), a: pair[0].id, b: pair[1].id };
}

function distinctRelAtom(rng: () => number, scene: Scene, avoid?: Atom | null): Atom | null {
  for (let i = 0; i < 8; i++) {
    const type = pick(rng, ["position", "order", "compare"] as const);
    const atom = simpleRel(rng, scene, type);
    if (!atom) continue;
    if (!avoid) return atom;
    if (JSON.stringify(atom) !== JSON.stringify(avoid)) return atom;
  }
  return simpleRel(rng, scene, "position");
}

export function makeAtom(
  rng: () => number,
  scene: Scene,
  type: ChallengeType,
): Atom | null {
  if (type === "temporal") {
    const pair = pickTwo(rng, scene.events);
    if (!pair) return null;
    return { kind: "eventOrder", rel: pick(rng, ["before", "after"] as const), a: pair[0].id, b: pair[1].id };
  }
  if (type === "doubleNeg") {
    if (rng() < 0.5) {
      const held = items(scene);
      const people = holders(scene);
      if (held.length && people.length) {
        return { kind: "notAbsent", item: pick(rng, held).id, holder: pick(rng, people).id };
      }
    }
    return { kind: "cannotDim", id: pick(rng, scene.entities).id };
  }
  if (type === "negation") {
    const inner = simpleRel(rng, scene, pick(rng, ["position", "order", "compare", "own"] as const));
    if (!inner) return null;
    if (rng() < 0.45) return { kind: "not", inner };
    const pair = pickTwo(rng, scene.entities);
    if (!pair) return { kind: "not", inner };
    let r1 = pick(rng, POS_RELS);
    let r2 = pick(rng, POS_RELS);
    if (r1 === r2) r2 = r1 === "beside" ? "west" : "beside";
    return { kind: "neither", a: pair[0].id, b: pair[1].id, rels: [r1, r2] };
  }
  if (type === "compound") {
    const left = distinctRelAtom(rng, scene);
    const right = distinctRelAtom(rng, scene, left);
    if (!left || !right) return null;
    return { kind: rng() < 0.55 ? "and" : "or", left, right };
  }
  if (type === "mixed") {
    const left = simpleRel(rng, scene, "position");
    const mid = simpleRel(rng, scene, pick(rng, ["order", "compare"] as const));
    const right = simpleRel(rng, scene, pick(rng, ["position", "own"] as const));
    if (!left || !mid || !right) return null;
    const inner: Atom = { kind: "and", left, right: { kind: "not", inner: mid } };
    return { kind: "or", left: inner, right };
  }
  return simpleRel(rng, scene, type === "own" || type === "order" || type === "compare" ? type : "position");
}

export function renderStatement(scene: Scene, atom: Atom, voice: Voice, source: string): string {
  const body = cap(renderAtom(atom, scene, voice));
  if (source.endsWith(":")) return `${source} ${body}.`;
  return `${source} ${body.charAt(0).toLowerCase()}${body.slice(1)}.`;
}

export function buildChallenge(input: {
  seed: number;
  index: number;
  tier: ReasonTier;
  scene: Scene;
  focus?: ChallengeType | null;
  forcePassive?: boolean;
}): Challenge | null {
  const rng = mulberry32((input.seed ^ (input.index * 0x9e3779b9) ^ (input.tier * 97)) >>> 0 || 1);
  const hasOwn = items(input.scene).length > 0 && holders(input.scene).length > 0;
  const allowed = typesForTier(input.tier, hasOwn, input.scene.events.length >= 2);
  let type = input.focus && allowed.includes(input.focus) ? input.focus : pick(rng, allowed);
  if (input.tier <= 2 && (type === "negation" || type === "compound")) type = "position";
  const atom = makeAtom(rng, input.scene, type);
  if (!atom) return null;
  const voice: Voice = input.forcePassive || input.tier === 2 ? "passive" : rng() < 0.2 ? "verse" : "field";
  const source = pick(rng, SOURCES);
  const statement = renderStatement(input.scene, atom, voice, source);
  const answer = evaluate(input.scene, atom);
  return {
    seed: input.seed,
    index: input.index,
    tier: input.tier,
    type,
    scene: input.scene,
    atom,
    statement,
    source,
    answer,
  };
}
