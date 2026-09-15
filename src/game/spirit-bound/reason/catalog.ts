import type { Entity, Hue, Kind, Rel, Role, Scene, SceneEvent } from "./types";

export const HUE_HEX: Record<Hue, string> = {
  gold: "#f8d030",
  silver: "#d0d8e8",
  emerald: "#38c060",
  crimson: "#e84848",
  azure: "#48a0f8",
};

export const HUE_COLORBLIND: Record<Hue, string> = {
  gold: "#f8d030",
  silver: "#f0f0f0",
  emerald: "#2090d8",
  crimson: "#d07020",
  azure: "#b060e8",
};

export const HUE_MARK: Record<Hue, string> = {
  gold: "G",
  silver: "S",
  emerald: "E",
  crimson: "C",
  azure: "A",
};

export function roleOf(kind: Kind): Role {
  if (kind === "relic" || kind === "rune" || kind === "sigil") return "item";
  if (kind === "beacon") return "landmark";
  return "holder";
}

export function hueAdj(hue: Hue): string {
  if (hue === "gold") return "golden";
  if (hue === "silver") return "silver";
  if (hue === "emerald") return "emerald";
  if (hue === "crimson") return "crimson";
  return "azure";
}

export function kindNoun(kind: Kind): string {
  if (kind === "king") return "Triangle King";
  if (kind === "sage") return "old sage";
  if (kind === "youth") return "village youth";
  if (kind === "fairy") return "great fairy";
  if (kind === "guardian") return "guardian";
  if (kind === "knight") return "knight";
  if (kind === "relic") return "relic";
  if (kind === "rune") return "rune";
  if (kind === "sigil") return "sigil";
  return "beacon";
}

export function entityPhrase(kind: Kind, hue: Hue): string {
  if (kind === "king") return "the Triangle King";
  if (kind === "sage") return "the old sage";
  if (kind === "youth") return "the village youth";
  if (kind === "fairy") return "the great fairy";
  return `the ${hueAdj(hue)} ${kindNoun(kind)}`;
}

export function entityLabel(kind: Kind, hue: Hue): string {
  if (kind === "king") return "TRIANGLE KING";
  if (kind === "sage") return "OLD SAGE";
  if (kind === "youth") return "VILLAGE YOUTH";
  if (kind === "fairy") return "GREAT FAIRY";
  return `${hueAdj(hue).toUpperCase()} ${kindNoun(kind).toUpperCase()}`;
}

export function glyph(kind: Kind): string {
  if (kind === "relic") return "▲";
  if (kind === "rune") return "◆";
  if (kind === "sigil") return "✦";
  if (kind === "beacon") return "△";
  if (kind === "guardian") return "☗";
  if (kind === "knight") return "†";
  if (kind === "sage") return "*";
  if (kind === "fairy") return "♡";
  if (kind === "youth") return "•";
  return "▲▲";
}

export function entityById(scene: Scene, id: string): Entity | null {
  return scene.entities.find((e) => e.id === id) ?? null;
}

export function eventById(scene: Scene, id: string): SceneEvent | null {
  return scene.events.find((e) => e.id === id) ?? null;
}

export function holders(scene: Scene): Entity[] {
  return scene.entities.filter((e) => roleOf(e.kind) === "holder");
}

export function items(scene: Scene): Entity[] {
  return scene.entities.filter((e) => roleOf(e.kind) === "item");
}

export function relWord(rel: Rel, voice: "plain" | "passive" = "plain"): { mid: string; tailPrep: string } {
  if (rel === "west") return { mid: voice === "passive" ? "is posted west of" : "stands west of", tailPrep: "" };
  if (rel === "east") return { mid: voice === "passive" ? "is posted east of" : "stands east of", tailPrep: "" };
  if (rel === "north") return { mid: voice === "passive" ? "is posted north of" : "stands north of", tailPrep: "" };
  if (rel === "south") return { mid: voice === "passive" ? "is posted south of" : "stands south of", tailPrep: "" };
  if (rel === "beside") return { mid: voice === "passive" ? "is posted beside" : "stands beside", tailPrep: "" };
  if (rel === "before") return { mid: voice === "passive" ? "was seen before" : "arrived before", tailPrep: "" };
  if (rel === "after") return { mid: voice === "passive" ? "was seen after" : "arrived after", tailPrep: "" };
  if (rel === "owns") return { mid: voice === "passive" ? "is carried by" : "carries", tailPrep: "" };
  return { mid: voice === "passive" ? "is outshone by" : "holds more fire than", tailPrep: "" };
}

export const SOURCES = [
  "A runner from the grass reports that",
  "Watch notes say",
  "The mural claims",
  "The fairy's echo:",
  "Sealed verse:",
  "A knight's briefing says",
  "The gold door whispers that",
  "Village testimony claims",
] as const;

export const CHAPTERS = [
  {
    id: 1,
    title: "VILLAGE WATCH",
    blurb: "Who stands where on the green.",
  },
  {
    id: 2,
    title: "COMPASS STONES",
    blurb: "North, south, east, west — read the field.",
  },
  {
    id: 3,
    title: "BEACON FIRE",
    blurb: "Which light burns hotter.",
  },
  {
    id: 4,
    title: "FALSE OMENS",
    blurb: "The mural can lie. Catch it.",
  },
  {
    id: 5,
    title: "TWINNED REPORTS",
    blurb: "Two claims. One truth.",
  },
  {
    id: 6,
    title: "SEALED PROPHECY",
    blurb: "Words that undo themselves.",
  },
  {
    id: 7,
    title: "KING'S BRIEFING",
    blurb: "Every operator at once. Do not miss the laugh.",
  },
] as const;

export const COLLECTIBLES = [
  "Moss Compass",
  "Root Ink",
  "Beacon Glass",
  "False-Omen Charm",
  "Twinned Seal",
  "Sealed Verse",
  "King's Briefing Stone",
] as const;
