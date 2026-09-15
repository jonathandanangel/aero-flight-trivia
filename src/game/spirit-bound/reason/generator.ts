import { mulberry32, pickIndex } from "@/game/spirit-bound/shrine/rng";
import { entityLabel, entityPhrase, holders, items } from "./catalog";
import { chapterFocus, chapterTier, directionalVoice } from "./difficultyManager";
import { buildChallenge } from "./questionFactory";
import type { Col, Entity, Hue, Kind, ReasonTier, Row, Scene, SceneEvent } from "./types";
import { validateChallenge, validateScene } from "./validate";
import type { Challenge } from "./types";

const UNIQUE_KIND: Kind[] = ["king", "sage", "youth", "fairy"];
const HUE_KIND: Kind[] = ["relic", "guardian", "knight", "rune", "sigil", "beacon"];
const HUES: Hue[] = ["gold", "silver", "emerald", "crimson", "azure"];
const SLOTS: Array<{ col: Col; row: Row }> = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 2, row: 0 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
];

const EVENT_POOL: Array<{ id: string; phrase: string }> = [
  { id: "alarm", phrase: "the shrine alarm" },
  { id: "breach", phrase: "the root breach" },
  { id: "flare", phrase: "the mural flare" },
  { id: "door", phrase: "the gold door" },
  { id: "laugh", phrase: "the king's laugh" },
  { id: "call", phrase: "the fairy call" },
];

function pick<T>(rng: () => number, list: readonly T[]): T {
  const item = list[pickIndex(rng, list.length)];
  if (item === undefined) throw new Error("empty pick");
  return item;
}

function shuffle<T>(rng: () => number, list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pickIndex(rng, i + 1);
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) continue;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

function draftKindHue(rng: () => number, used: Set<string>): { kind: Kind; hue: Hue } {
  for (let n = 0; n < 24; n++) {
    const unique = rng() < 0.35;
    const kind = unique ? pick(rng, UNIQUE_KIND) : pick(rng, HUE_KIND);
    const hue = pick(rng, HUES);
    const key = kind === "king" || kind === "sage" || kind === "youth" || kind === "fairy" ? kind : `${kind}:${hue}`;
    if (used.has(key)) continue;
    used.add(key);
    return { kind, hue };
  }
  used.add("relic:gold");
  return { kind: "relic", hue: "gold" };
}

export function generateScene(seed: number, index: number, withEvents: boolean): Scene {
  const rng = mulberry32((seed ^ 0xa5a5a5a5 ^ index * 2654435761) >>> 0 || 1);
  const count = 3 + pickIndex(rng, 2);
  const used = new Set<string>();
  const northSlot = pick(
    rng,
    SLOTS.filter((s) => s.row === 0),
  );
  const southSlot = pick(
    rng,
    SLOTS.filter((s) => s.row === 1),
  );
  const leftover = shuffle(
    rng,
    SLOTS.filter((s) => s !== northSlot && s !== southSlot),
  );
  const slots = [northSlot, southSlot, ...leftover].slice(0, count);
  const powers = shuffle(rng, [1, 2, 3, 4, 5]).slice(0, count);
  const entities: Entity[] = [];
  for (let i = 0; i < count; i++) {
    const slot = slots[i];
    const power = powers[i];
    if (!slot || power === undefined) continue;
    const draft = draftKindHue(rng, used);
    const id = `e${i}-${draft.kind}-${draft.hue}`;
    entities.push({
      id,
      kind: draft.kind,
      hue: draft.hue,
      label: entityLabel(draft.kind, draft.hue),
      phrase: entityPhrase(draft.kind, draft.hue),
      col: slot.col,
      row: slot.row,
      power,
      arrival: 0,
    });
  }
  const ranked = [...entities].sort((a, b) => b.row - a.row || a.col - b.col || a.id.localeCompare(b.id));
  ranked.forEach((e, i) => {
    const idx = entities.findIndex((x) => x.id === e.id);
    const current = idx >= 0 ? entities[idx] : undefined;
    if (idx >= 0 && current) entities[idx] = { ...current, arrival: i + 1 };
  });

  const people = holders({ entities, events: [] });
  const loot = items({ entities, events: [] });
  if (people.length && loot.length) {
    for (const item of loot) {
      if (rng() < 0.7) {
        const owner = pick(rng, people);
        const idx = entities.findIndex((e) => e.id === item.id);
        const current = entities[idx];
        if (idx >= 0 && current) {
          entities[idx] = { ...current, ownerId: owner.id };
        }
      }
    }
  }

  let events: SceneEvent[] = [];
  if (withEvents) {
    const chosen = shuffle(rng, EVENT_POOL).slice(0, 3);
    const times = shuffle(rng, [1, 2, 3]);
    events = chosen.map((ev, i) => ({
      id: ev.id,
      phrase: ev.phrase,
      time: times[i] ?? i + 1,
    }));
  }

  const scene = { entities, events };
  const err = validateScene(scene);
  if (err) throw new Error(err);
  return scene;
}

export function generateChallenge(seed: number, index: number, tier: ReasonTier, chapter?: number): Challenge {
  for (let attempt = 0; attempt < 48; attempt++) {
    const localSeed = (seed + attempt * 9973 + index * 131) >>> 0 || 1;
    const withEvents = tier >= 7 || chapter === 7;
    try {
      const scene = generateScene(localSeed, index, withEvents);
      const focus = chapter ? chapterFocus(chapter) : null;
      const built = buildChallenge({
        seed: localSeed,
        index,
        tier,
        scene,
        focus,
        forcePassive: chapter === 2 ? directionalVoice(chapter) : tier === 2,
      });
      if (!built) continue;
      const err = validateChallenge(built);
      if (err) continue;
      return built;
    } catch {
      continue;
    }
  }
  throw new Error("could not generate a valid challenge");
}

export function generateCampaignChallenge(seed: number, chapter: number, index: number): Challenge {
  return generateChallenge(seed, index, chapterTier(chapter), chapter);
}
