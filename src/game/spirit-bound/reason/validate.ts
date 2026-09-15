import { collectIds, evalRel, evaluate } from "./logicEngine";
import { entityById } from "./catalog";
import type { Challenge, Scene } from "./types";

export function validateScene(scene: Scene): string | null {
  if (scene.entities.length < 2) return "too few entities";
  const ids = new Set<string>();
  const labels = new Set<string>();
  const slots = new Set<string>();
  const arrivals = new Set<number>();
  for (const e of scene.entities) {
    if (ids.has(e.id)) return "duplicate entity id";
    ids.add(e.id);
    if (labels.has(e.label)) return "duplicate label";
    labels.add(e.label);
    const slot = `${e.col},${e.row}`;
    if (slots.has(slot)) return "overlapping positions";
    slots.add(slot);
    if (arrivals.has(e.arrival)) return "tied arrival";
    arrivals.add(e.arrival);
    if (e.ownerId && !scene.entities.some((h) => h.id === e.ownerId)) return "owner missing";
  }
  for (const a of scene.entities) {
    for (const b of scene.entities) {
      if (a.id === b.id) continue;
      if (a.row > b.row && a.arrival >= b.arrival) return "south must arrive before north";
    }
  }
  const times = new Set<number>();
  const eventIds = new Set<string>();
  for (const ev of scene.events) {
    if (eventIds.has(ev.id)) return "duplicate event";
    eventIds.add(ev.id);
    if (times.has(ev.time)) return "tied event time";
    times.add(ev.time);
  }
  return null;
}

export function validateChallenge(challenge: Challenge): string | null {
  const sceneErr = validateScene(challenge.scene);
  if (sceneErr) return sceneErr;
  const refs = collectIds(challenge.atom);
  for (const id of refs.entities) {
    if (!challenge.scene.entities.some((e) => e.id === id)) return `unknown entity ${id}`;
  }
  for (const id of refs.events) {
    if (!challenge.scene.events.some((e) => e.id === id)) return `unknown event ${id}`;
  }
  if (refs.entities.length === 0 && refs.events.length === 0) return "empty atom";
  let truth: boolean;
  try {
    truth = evaluate(challenge.scene, challenge.atom);
  } catch (err) {
    return err instanceof Error ? err.message : "evaluate failed";
  }
  if (truth !== challenge.answer) return "answer mismatch";
  if (!challenge.statement.trim()) return "empty statement";
  const orderErr = validateArrivalLayout(challenge);
  if (orderErr) return orderErr;
  return null;
}

function validateArrivalLayout(challenge: Challenge): string | null {
  const atoms: Array<{ rel: "before" | "after"; a: string; b: string }> = [];
  collectOrderRels(challenge.atom, atoms);
  for (const { rel, a: aid, b: bid } of atoms) {
    const a = entityById(challenge.scene, aid);
    const b = entityById(challenge.scene, bid);
    if (!a || !b) return "order missing entity";
    if (a.row === b.row) return "order pair shares a row";
    const truth = evalRel(rel, a, b);
    if (rel === "before" && truth && !(a.row > b.row && b.row < a.row)) return "before without south/behind";
    if (rel === "after" && truth && !(a.row < b.row && b.row > a.row)) return "after without north";
  }
  return null;
}

function collectOrderRels(atom: Challenge["atom"], out: Array<{ rel: "before" | "after"; a: string; b: string }>) {
  switch (atom.kind) {
    case "rel":
      if (atom.rel === "before" || atom.rel === "after") out.push({ rel: atom.rel, a: atom.a, b: atom.b });
      return;
    case "not":
      collectOrderRels(atom.inner, out);
      return;
    case "and":
    case "or":
      collectOrderRels(atom.left, out);
      collectOrderRels(atom.right, out);
      return;
    default:
      return;
  }
}
