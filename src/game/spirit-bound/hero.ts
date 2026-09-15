/** Shared Minish Cap–style hero (green tunic, blonde fringe, pointed ears, RED eyes). */

import { px } from "@/game/spirit-bound/pixel";

export type HeroDir = "up" | "down" | "left" | "right";

const GREEN = "#38a028";
const GREEN_DK = "#187018";
const GREEN_MID = "#288820";
const SKIN = "#f0d8a8";
const SKIN_EAR = "#d8b070";
const HAIR = "#f8d030";
const HAIR_DK = "#c8a018";
const BELT = "#583818";
const BOOT = "#402010";
const BUCKLE = "#f8d030";
const HAND = "#f8f0e0";
const EYE = "#e82828"; // red eyes
const OUT = "#181010";

/**
 * Draw the player at top-left (x,y) inside a tile (~24×24).
 * Closely matches the reference Link-like pixel hero with red eyes.
 */
export function drawLegendHero(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: HeroDir,
  frame: number,
  opts?: { night?: boolean; tile?: number },
) {
  const T = opts?.tile ?? 24;
  const night = opts?.night ?? false;
  const g = night ? "#284878" : GREEN;
  const gd = night ? "#183858" : GREEN_DK;
  const gm = night ? "#203868" : GREEN_MID;
  const step = frame ? (Math.floor(frame / 6) % 2 === 0 ? -1 : 1) : 0;

  // shadow
  px(ctx, x + 5, y + T - 3, T - 10, 3, "rgba(0,0,0,0.35)");

  // boots
  px(ctx, x + 7, y + 19, 4, 3, BOOT);
  px(ctx, x + 13, y + 19, 4, 3, BOOT);
  if (step) px(ctx, x + 7 + step, y + 21, 4, 2, OUT);

  // legs / tunic hem
  px(ctx, x + 8, y + 16, 3, 4, g);
  px(ctx, x + 13, y + 16, 3, 4, g);

  // belt + gold buckle
  px(ctx, x + 7, y + 15, 10, 2, BELT);
  px(ctx, x + 10, y + 15, 3, 2, BUCKLE);

  // torso tunic
  px(ctx, x + 7, y + 10, 10, 5, g);
  px(ctx, x + 8, y + 10, 8, 1, gd); // collar shade

  // arms + white mittens
  px(ctx, x + 5, y + 11, 2, 4, gm);
  px(ctx, x + 17, y + 11, 2, 4, gm);
  px(ctx, x + 4, y + 14, 3, 2, HAND);
  px(ctx, x + 17, y + 14, 3, 2, HAND);

  // head / face
  px(ctx, x + 8, y + 5, 8, 6, SKIN);

  // pointed ears
  if (dir !== "up") {
    px(ctx, x + 5, y + 7, 3, 2, SKIN_EAR);
    px(ctx, x + 16, y + 7, 3, 2, SKIN_EAR);
    px(ctx, x + 4, y + 7, 1, 1, OUT);
    px(ctx, x + 19, y + 7, 1, 1, OUT);
  }

  // blonde fringe
  if (dir !== "up") {
    px(ctx, x + 8, y + 5, 8, 2, HAIR);
    px(ctx, x + 8, y + 6, 3, 2, HAIR);
    px(ctx, x + 14, y + 6, 2, 1, HAIR_DK);
  } else {
    px(ctx, x + 8, y + 5, 8, 2, HAIR_DK);
  }

  // RED eyes (vertical rectangles like the reference)
  if (dir === "down") {
    px(ctx, x + 9, y + 8, 2, 3, EYE);
    px(ctx, x + 13, y + 8, 2, 3, EYE);
  } else if (dir === "left") {
    px(ctx, x + 9, y + 8, 2, 3, EYE);
  } else if (dir === "right") {
    px(ctx, x + 13, y + 8, 2, 3, EYE);
  }

  // floppy pointed green hat
  px(ctx, x + 7, y + 2, 10, 4, g);
  px(ctx, x + 8, y + 1, 8, 2, gm);
  px(ctx, x + 9, y + 0, 5, 2, g);
  // hat tip flop
  if (dir === "left") {
    px(ctx, x + 3, y + 2, 5, 3, gd);
    px(ctx, x + 2, y + 3, 3, 2, g);
  } else if (dir === "right") {
    px(ctx, x + 16, y + 2, 5, 3, gd);
    px(ctx, x + 19, y + 3, 3, 2, g);
  } else {
    px(ctx, x + 14, y + 1, 4, 3, gd);
    px(ctx, x + 17, y + 2, 3, 2, g);
  }
  // hat outline accents
  px(ctx, x + 7, y + 2, 1, 3, OUT);
  px(ctx, x + 16, y + 2, 1, 3, OUT);
}
