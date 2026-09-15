import { ACTIVE_POWER, type Atom, type Entity, type Rel, type Scene } from "./types";
import { entityById, eventById } from "./catalog";

export function evalRel(rel: Rel, a: Entity, b: Entity): boolean {
  if (rel === "west") return a.col < b.col;
  if (rel === "east") return a.col > b.col;
  if (rel === "north") return a.row < b.row;
  if (rel === "south") return a.row > b.row;
  if (rel === "beside") return a.row === b.row && Math.abs(a.col - b.col) === 1;
  // Arrival is the north-south line: earlier = south/behind, later = north.
  if (rel === "before") return a.row > b.row;
  if (rel === "after") return a.row < b.row;
  if (rel === "owns") return b.ownerId === a.id;
  return a.power > b.power;
}

export function isActive(entity: Entity): boolean {
  return entity.power >= ACTIVE_POWER;
}

export function evaluate(scene: Scene, atom: Atom): boolean {
  switch (atom.kind) {
    case "rel": {
      const a = entityById(scene, atom.a);
      const b = entityById(scene, atom.b);
      if (!a || !b) throw new Error("relation missing entity");
      return evalRel(atom.rel, a, b);
    }
    case "not":
      return !evaluate(scene, atom.inner);
    case "and":
      return evaluate(scene, atom.left) && evaluate(scene, atom.right);
    case "or":
      return evaluate(scene, atom.left) || evaluate(scene, atom.right);
    case "neither": {
      const a = entityById(scene, atom.a);
      const b = entityById(scene, atom.b);
      if (!a || !b) throw new Error("neither missing entity");
      return !evalRel(atom.rels[0], a, b) && !evalRel(atom.rels[1], a, b);
    }
    case "notAbsent": {
      const item = entityById(scene, atom.item);
      const holder = entityById(scene, atom.holder);
      if (!item || !holder) throw new Error("notAbsent missing entity");
      return item.ownerId === holder.id;
    }
    case "cannotDim": {
      const e = entityById(scene, atom.id);
      if (!e) throw new Error("cannotDim missing entity");
      return isActive(e);
    }
    case "eventOrder": {
      const a = eventById(scene, atom.a);
      const b = eventById(scene, atom.b);
      if (!a || !b) throw new Error("event missing");
      return atom.rel === "before" ? a.time < b.time : a.time > b.time;
    }
  }
}

export function collectIds(atom: Atom): { entities: string[]; events: string[] } {
  const entities = new Set<string>();
  const events = new Set<string>();
  walk(atom, entities, events);
  return { entities: [...entities], events: [...events] };
}

function walk(atom: Atom, entities: Set<string>, events: Set<string>) {
  switch (atom.kind) {
    case "rel":
    case "neither":
      entities.add(atom.a);
      entities.add(atom.b);
      return;
    case "not":
      walk(atom.inner, entities, events);
      return;
    case "and":
    case "or":
      walk(atom.left, entities, events);
      walk(atom.right, entities, events);
      return;
    case "notAbsent":
      entities.add(atom.item);
      entities.add(atom.holder);
      return;
    case "cannotDim":
      entities.add(atom.id);
      return;
    case "eventOrder":
      events.add(atom.a);
      events.add(atom.b);
      return;
  }
}
