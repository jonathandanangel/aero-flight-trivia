import { useEffect, useRef } from "react";
import { isSolid, MAP_H, MAP_W, NPCS, TILE, tileAt, WILD_POOL, type Npc } from "@/game/spirit-bound/data";
import { drawTriForce, pixelTriangle, px } from "@/game/spirit-bound/pixel";
import { isDown, useKeys } from "@/game/spirit-bound/useKeys";

type Props = {
  spawn: { x: number; y: number };
  paused: boolean;
  exitDoorOpen?: boolean;
  onTalk: (npc: Npc) => void;
  onEncounter: (enemyId: string, at: { x: number; y: number }) => void;
  onBossDoor: (at: { x: number; y: number }) => void;
  onExitToGrasslands?: (at: { x: number; y: number }) => void;
};

const W = MAP_W * TILE;
const H = MAP_H * TILE;
const SPEED = 1.9;

export function Overworld({
  spawn,
  paused,
  exitDoorOpen = false,
  onTalk,
  onEncounter,
  onBossDoor,
  onExitToGrasslands,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pos = useRef({ ...spawn });
  const dir = useRef<"up" | "down" | "left" | "right">("down");
  const steps = useRef(0);
  const budget = useRef(90 + Math.floor(Math.random() * 120));
  const frame = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const cb = useRef({ onTalk, onEncounter, onBossDoor, onExitToGrasslands });
  cb.current = { onTalk, onEncounter, onBossDoor, onExitToGrasslands };

  const facingTile = (): { tx: number; ty: number } => {
    const cx = pos.current.x + TILE / 2;
    const cy = pos.current.y + TILE / 2;
    const d = dir.current;
    const tx = Math.floor((cx + (d === "left" ? -TILE : d === "right" ? TILE : 0)) / TILE);
    const ty = Math.floor((cy + (d === "up" ? -TILE : d === "down" ? TILE : 0)) / TILE);
    return { tx, ty };
  };

  const facingNpc = (): Npc | undefined => {
    const { tx, ty } = facingTile();
    return NPCS.find((n) => n.tx === tx && n.ty === ty);
  };

  const held = useKeys((key) => {
    if (pausedRef.current) return;
    if (["z", "Z", "Enter", " "].includes(key)) {
      const npc = facingNpc();
      if (npc) cb.current.onTalk(npc);
    }
  });

  useEffect(() => {
    pos.current = { ...spawn };
    steps.current = 0;
    budget.current = 90 + Math.floor(Math.random() * 120);
  }, [spawn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const blocked = (x: number, y: number) => {
      const pad = 4;
      const corners = [
        [x + pad, y + TILE / 2],
        [x + TILE - pad, y + TILE / 2],
        [x + pad, y + TILE - 2],
        [x + TILE - pad, y + TILE - 2],
      ];
      return corners.some(([cx, cy]) =>
        isSolid(Math.floor((cx ?? 0) / TILE), Math.floor((cy ?? 0) / TILE)),
      );
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      frame.current += 1;
      const keys = held.current;

      if (!pausedRef.current) {
        let dx = 0;
        let dy = 0;
        if (isDown(keys, "ArrowLeft", "a")) {
          dx -= SPEED;
          dir.current = "left";
        }
        if (isDown(keys, "ArrowRight", "d")) {
          dx += SPEED;
          dir.current = "right";
        }
        if (isDown(keys, "ArrowUp", "w")) {
          dy -= SPEED;
          dir.current = "up";
        }
        if (isDown(keys, "ArrowDown", "s")) {
          dy += SPEED;
          dir.current = "down";
        }

        const p = pos.current;
        if (dx && !blocked(p.x + dx, p.y)) p.x += dx;
        if (dy && !blocked(p.x, p.y + dy)) p.y += dy;

        if (dx || dy) {
          steps.current += 1;
          const tx = Math.floor((p.x + TILE / 2) / TILE);
          const ty = Math.floor((p.y + TILE / 2) / TILE);
          const t = tileAt(tx, ty);
          if (t === "D") {
            if (exitDoorOpen) {
              cb.current.onExitToGrasslands?.({ x: p.x, y: p.y });
            } else {
              cb.current.onBossDoor({ x: p.x, y: p.y });
            }
            return;
          }
          if (t === "g") {
            steps.current += 2;
            if (steps.current >= budget.current) {
              steps.current = 0;
              budget.current = 90 + Math.floor(Math.random() * 120);
              const id = WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)] ?? "flowerling";
              cb.current.onEncounter(id, { x: p.x, y: p.y });
              return;
            }
          } else if (steps.current > 0) {
            steps.current -= 0.15;
          }
        }
      }

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#183010";
      ctx.fillRect(0, 0, W, H);
      for (let ty = 0; ty < MAP_H; ty++) {
        for (let tx = 0; tx < MAP_W; tx++) {
          drawTile(ctx, tx, ty, frame.current, exitDoorOpen);
        }
      }

      for (const n of NPCS) {
        const bob = Math.sin((frame.current + n.tx * 17) / 25) * 1.5;
        drawNpc(ctx, n.tx * TILE, n.ty * TILE + bob, n.id, n.color);
      }

      const p = pos.current;
      const walking = isDown(held.current, "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown");
      const walkBob = walking ? Math.sin(frame.current / 5) * 1.5 : 0;
      drawHero(ctx, p.x, p.y + walkBob, dir.current, walking ? frame.current : 0);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [held, exitDoorOpen]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="h-auto w-full max-w-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

function drawTile(ctx: CanvasRenderingContext2D, tx: number, ty: number, frame: number, openDoor = false) {
  const t = tileAt(tx, ty);
  const x = tx * TILE;
  const y = ty * TILE;

  if (t === "#") {
    px(ctx, x, y, TILE, TILE, "#5a3a18");
    px(ctx, x, y, TILE, 4, "#387820");
    px(ctx, x + 2, y + 1, 6, 3, "#58a030");
    px(ctx, x + 14, y, 8, 4, "#286018");
    px(ctx, x + 2, y + 8, 8, 6, "#7a5028");
    px(ctx, x + 12, y + 14, 10, 6, "#3a2410");
    if ((tx + ty) % 4 === 0) pixelTriangle(ctx, x + 8, y + 8, 8, "#f8d030");
    return;
  }

  if (t === "w") {
    px(ctx, x, y, TILE, TILE, "#1858a8");
    px(ctx, x, y, TILE, TILE, (tx + ty) % 2 === 0 ? "#1858a8" : "#104888");
    const wave = Math.sin((frame + tx * 9) / 22) * 2;
    px(ctx, x + 3, y + 8 + wave, 10, 2, "#58a8f0");
    px(ctx, x + 12, y + 14 - wave, 6, 2, "#f0f8ff");
    if ((tx + ty) % 5 === 0) pixelTriangle(ctx, x + 8, y + 4, 6, "#88c8ff");
    return;
  }

  if (t === "g") {
    px(ctx, x, y, TILE, TILE, "#389028");
    px(ctx, x + 1, y + 1, 6, 4, "#58c040");
    for (let i = 0; i < 3; i++) {
      const gx = x + 4 + i * 7;
      const sway = Math.sin((frame + tx * 5 + ty * 3 + i * 11) / 20) * 1.5;
      px(ctx, gx + sway, y + 8, 3, 12, "#186818");
      px(ctx, gx + sway, y + 8, 3, 3, "#70d848");
    }
    if ((tx * 3 + ty) % 7 === 0) pixelTriangle(ctx, x + 14, y + 2, 6, "#f8d030");
    return;
  }

  if (t === "D") {
    px(ctx, x, y, TILE, TILE, "#2a2010");
    if (openDoor) {
      px(ctx, x + 3, y + 2, TILE - 6, TILE - 4, "#88e8ff");
      px(ctx, x + 5, y + 4, TILE - 10, TILE - 8, "#c8f8ff");
      px(ctx, x + 8, y + 6, 8, 4, "#f8ffff");
    } else {
      px(ctx, x + 3, y + 2, TILE - 6, TILE - 4, "#705018");
      px(ctx, x + 5, y + 4, TILE - 10, TILE - 8, "#181010");
      drawTriForce(ctx, x + 4, y + 5, 5);
    }
    return;
  }

  if (t === "f") {
    px(ctx, x, y, TILE, TILE, (tx + ty) % 2 === 0 ? "#c8a048" : "#b89038");
    px(ctx, x + 11, y + 14, 2, 6, "#186818");
    pixelTriangle(ctx, x + 6, y + 4, 12, "#f06088");
    pixelTriangle(ctx, x + 9, y + 8, 6, "#f8d030");
    return;
  }

  px(ctx, x, y, TILE, TILE, (tx + ty) % 2 === 0 ? "#c8a048" : "#b89038");
  px(ctx, x + 2, y + 10, 3, 2, "#a87828");
  px(ctx, x + 16, y + 4, 2, 2, "#d8b860");
  if ((tx + ty * 2) % 11 === 0) pixelTriangle(ctx, x + 16, y + 14, 6, "#e8c860");
}

function drawHero(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: "up" | "down" | "left" | "right",
  frame: number,
) {
  px(ctx, x + 5, y + TILE - 3, TILE - 10, 3, "rgba(0,0,0,0.35)");
  const step = frame ? (Math.floor(frame / 6) % 2 === 0 ? -1 : 1) : 0;

  px(ctx, x + 8, y + 16, 3, 6, "#703818");
  px(ctx, x + 13, y + 16, 3, 6, "#703818");
  if (step) px(ctx, x + 8 + step, y + 20, 3, 2, "#502010");

  px(ctx, x + 6, y + 10, 12, 8, "#20a838");
  px(ctx, x + 5, y + 11, 2, 6, "#187828");
  px(ctx, x + 17, y + 11, 2, 6, "#187828");

  px(ctx, x + 8, y + 6, 8, 6, "#f0c090");
  if (dir !== "up") {
    const ex = dir === "left" ? 9 : dir === "right" ? 13 : 9;
    px(ctx, x + ex, y + 8, 2, 2, "#201008");
    if (dir === "down") px(ctx, x + 13, y + 8, 2, 2, "#201008");
  }

  px(ctx, x + 7, y + 2, 10, 5, "#187828");
  pixelTriangle(ctx, x + 9, y - 1, 6, "#20a838");
  if (dir === "left") px(ctx, x + 5, y + 3, 4, 3, "#187828");
  if (dir === "right") px(ctx, x + 15, y + 3, 4, 3, "#187828");
}

function drawNpc(ctx: CanvasRenderingContext2D, x: number, y: number, id: string, color: string) {
  px(ctx, x + 5, y + TILE - 3, TILE - 10, 3, "rgba(0,0,0,0.35)");

  if (id.startsWith("statue-")) {
    drawGreekStatue(ctx, x, y, id);
    return;
  }

  if (id === "nurse") {
    px(ctx, x + 8, y + 16, 8, 6, "#f8b0d8");
    px(ctx, x + 6, y + 8, 12, 10, "#f8e8f8");
    px(ctx, x + 8, y + 6, 8, 5, "#f0c090");
    pixelTriangle(ctx, x + 6, y, 12, "#58d0f8");
    pixelTriangle(ctx, x + 9, y + 4, 6, "#f8f8f8");
    return;
  }

  if (id === "dog") {
    px(ctx, x + 4, y + 14, 16, 6, "#c8c0a8");
    px(ctx, x + 2, y + 16, 4, 3, "#a89878");
    px(ctx, x + 16, y + 12, 6, 6, "#c8c0a8");
    px(ctx, x + 17, y + 14, 2, 2, "#201008");
    pixelTriangle(ctx, x + 8, y + 8, 8, "#705838");
    return;
  }

  px(ctx, x + 7, y + 16, 4, 6, "#4a3018");
  px(ctx, x + 13, y + 16, 4, 6, "#4a3018");
  px(ctx, x + 6, y + 10, 12, 8, color);
  px(ctx, x + 8, y + 5, 8, 6, "#f0c090");
  px(ctx, x + 9, y + 7, 2, 2, "#201008");
  px(ctx, x + 13, y + 7, 2, 2, "#201008");
  if (id === "toby") {
    px(ctx, x + 6, y + 3, 12, 4, "#f0e8d0");
    pixelTriangle(ctx, x + 8, y - 2, 8, "#f8d030");
  } else {
    pixelTriangle(ctx, x + 9, y + 1, 6, "#20a838");
  }
}

/** Ancient marble god statues — pedestal + classic silhouette props. */
function drawGreekStatue(ctx: CanvasRenderingContext2D, x: number, y: number, id: string) {
  if (id === "statue-atreides") {
    drawPaulAtreidesStatue(ctx, x, y);
    return;
  }

  const marble = "#e8e0d0";
  const shade = "#b8b0a0";
  const base = "#908878";
  // pedestal
  px(ctx, x + 4, y + 18, 16, 4, base);
  px(ctx, x + 6, y + 16, 12, 3, shade);
  // body
  px(ctx, x + 8, y + 8, 8, 9, marble);
  px(ctx, x + 7, y + 10, 2, 6, shade);
  // head
  px(ctx, x + 9, y + 4, 6, 5, marble);
  px(ctx, x + 10, y + 5, 2, 2, "#201008");
  px(ctx, x + 13, y + 5, 1, 2, "#201008");

  if (id === "statue-heracles") {
    // club
    px(ctx, x + 16, y + 6, 3, 12, "#705838");
    px(ctx, x + 15, y + 4, 5, 3, "#887048");
  } else if (id === "statue-athena") {
    // helmet crest + shield
    px(ctx, x + 8, y + 1, 8, 3, shade);
    px(ctx, x + 11, y - 1, 2, 3, marble);
    px(ctx, x + 3, y + 8, 5, 7, "#c8c0b0");
    px(ctx, x + 4, y + 10, 3, 3, "#f8d030");
  } else if (id === "statue-zeus") {
    // thunderbolt
    px(ctx, x + 16, y + 7, 2, 8, "#f8d030");
    px(ctx, x + 15, y + 9, 4, 2, "#fff8a0");
    px(ctx, x + 7, y + 2, 10, 2, shade); // beard hint
  } else if (id === "statue-apollo") {
    // lyre
    px(ctx, x + 3, y + 8, 4, 8, "#d8b868");
    px(ctx, x + 4, y + 9, 2, 6, "#f8e8c0");
    px(ctx, x + 8, y + 2, 8, 2, "#f8d030"); // sun band
  } else if (id === "statue-artemis") {
    // bow + crescent
    px(ctx, x + 3, y + 6, 2, 10, "#887858");
    px(ctx, x + 4, y + 7, 3, 1, "#887858");
    px(ctx, x + 4, y + 14, 3, 1, "#887858");
    px(ctx, x + 10, y + 2, 4, 2, "#f0f0f8");
  } else if (id === "statue-poseidon") {
    // trident
    px(ctx, x + 17, y + 4, 2, 14, "#58a0c8");
    px(ctx, x + 15, y + 4, 6, 2, "#88c8e8");
    px(ctx, x + 15, y + 3, 2, 2, "#88c8e8");
    px(ctx, x + 19, y + 3, 2, 2, "#88c8e8");
  }
}

/** Paul Atreides — name carved on a forehead band (clearly readable). */
function drawPaulAtreidesStatue(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // pedestal + body
  px(ctx, x + 5, y + TILE - 2, TILE - 10, 2, "rgba(0,0,0,0.35)");
  px(ctx, x - 2, y + 16, TILE + 4, 8, "#706858");
  px(ctx, x - 1, y + 17, TILE + 2, 6, "#908878");
  px(ctx, x + 7, y + 8, 10, 10, "#c8b898");
  px(ctx, x + 17, y + 10, 2, 8, "#705838");
  // head / hood
  px(ctx, x + 8, y + 1, 8, 6, "#a89878");
  px(ctx, x + 9, y + 3, 2, 2, "#201008");
  px(ctx, x + 13, y + 3, 2, 2, "#201008");
  // forehead name band — tight under the brow line
  const px0 = x - 6;
  const py0 = y - 1;
  const pw = TILE + 12;
  const ph = 10;
  px(ctx, px0, py0, pw, ph, "#f8d030");
  px(ctx, px0 + 1, py0 + 1, pw - 2, ph - 2, "#181010");
  px(ctx, px0 + 2, py0 + 2, pw - 4, ph - 4, "#fff8e0");
  drawPixelWord(ctx, "PAUL", x + TILE / 2 - 10, py0 + 2, "#100808", 1);
  drawPixelWord(ctx, "ATREIDES", x + TILE / 2 - 18, py0 + 6, "#100808", 1);
  // crumpled note at feet
  px(ctx, x + TILE - 1, y + 20, 8, 4, "#f0e8c8");
  px(ctx, x + TILE, y + 21, 6, 1, "#201008");
  px(ctx, x + TILE, y + 23, 5, 1, "#201008");
}

/** 3×5 block capitals for statue plaques. */
const PIXEL_GLYPHS: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "111", "100", "111"],
  I: ["111", "010", "010", "010", "111"],
  L: ["100", "100", "100", "100", "111"],
  P: ["111", "101", "111", "100", "100"],
  R: ["110", "101", "110", "101", "101"],
  S: ["111", "100", "111", "001", "111"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
};

function drawPixelWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  ox: number,
  oy: number,
  color: string,
  scale: number,
) {
  let cursor = 0;
  for (const ch of word) {
    const g = PIXEL_GLYPHS[ch];
    if (!g) {
      cursor += 2 * scale;
      continue;
    }
    for (let row = 0; row < g.length; row++) {
      const line = g[row] ?? "";
      for (let col = 0; col < line.length; col++) {
        if (line[col] === "1") {
          px(ctx, ox + cursor + col * scale, oy + row * scale, scale, scale, color);
        }
      }
    }
    cursor += 4 * scale;
  }
}
