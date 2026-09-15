import { useEffect, useRef } from "react";
import {
  GOLDEN_EGG,
  GRASS_H,
  GRASS_NPCS,
  GRASS_TILE,
  GRASS_W,
  grassSolid,
  grassTileAt,
  type GrassNpc,
} from "@/game/spirit-bound/grasslands-data";
import { pixelTriangle, px } from "@/game/spirit-bound/pixel";
import { isDown, useKeys } from "@/game/spirit-bound/useKeys";

type Props = {
  spawn: { x: number; y: number };
  paused: boolean;
  night: boolean;
  burntBushes: Set<string>;
  vineDefeated: boolean;
  onTalk: (npc: GrassNpc) => void;
  onBush: (at: { x: number; y: number }, key: string) => void;
  onVine: (at: { x: number; y: number }) => void;
  onWildGrass: (at: { x: number; y: number }) => void;
  onGoldenEgg: () => void;
};

const W = GRASS_W * GRASS_TILE;
const H = GRASS_H * GRASS_TILE;
const SPEED = 1.9;

export function GrasslandsOverworld({
  spawn,
  paused,
  night,
  burntBushes,
  vineDefeated,
  onTalk,
  onBush,
  onVine,
  onWildGrass,
  onGoldenEgg,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pos = useRef({ ...spawn });
  const dir = useRef<"up" | "down" | "left" | "right">("down");
  const steps = useRef(0);
  const budget = useRef(80 + Math.floor(Math.random() * 90));
  const frame = useRef(0);
  const burnFlash = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const cb = useRef({ onTalk, onBush, onVine, onWildGrass, onGoldenEgg });
  cb.current = { onTalk, onBush, onVine, onWildGrass, onGoldenEgg };

  const facingTile = (): { tx: number; ty: number } => {
    const cx = pos.current.x + GRASS_TILE / 2;
    const cy = pos.current.y + GRASS_TILE / 2;
    const d = dir.current;
    const tx = Math.floor((cx + (d === "left" ? -GRASS_TILE : d === "right" ? GRASS_TILE : 0)) / GRASS_TILE);
    const ty = Math.floor((cy + (d === "up" ? -GRASS_TILE : d === "down" ? GRASS_TILE : 0)) / GRASS_TILE);
    return { tx, ty };
  };

  const facingNpc = (): GrassNpc | undefined => {
    const { tx, ty } = facingTile();
    return GRASS_NPCS.find((n) => n.tx === tx && n.ty === ty);
  };

  const facingGoldenEgg = (): boolean => {
    const { tx, ty } = facingTile();
    return tx === GOLDEN_EGG.tx && ty === GOLDEN_EGG.ty;
  };

  const held = useKeys((key) => {
    if (pausedRef.current) return;
    if (["z", "Z", "Enter", " "].includes(key)) {
      if (facingGoldenEgg()) {
        cb.current.onGoldenEgg();
        return;
      }
      if (night) return;
      const npc = facingNpc();
      if (npc) cb.current.onTalk(npc);
    }
  });

  useEffect(() => {
    pos.current = { ...spawn };
    steps.current = 0;
    budget.current = 80 + Math.floor(Math.random() * 90);
  }, [spawn]);

  useEffect(() => {
    if (night) burnFlash.current = 9999;
  }, [night]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const blocked = (x: number, y: number) => {
      const pad = 4;
      const corners = [
        [x + pad, y + GRASS_TILE / 2],
        [x + GRASS_TILE - pad, y + GRASS_TILE / 2],
        [x + pad, y + GRASS_TILE - 2],
        [x + GRASS_TILE - pad, y + GRASS_TILE - 2],
      ];
      return corners.some(([cx, cy]) => {
        const tx = Math.floor((cx ?? 0) / GRASS_TILE);
        const ty = Math.floor((cy ?? 0) / GRASS_TILE);
        return grassSolid(tx, ty, burntBushes);
      });
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      frame.current += 1;
      if (burnFlash.current > 0 && burnFlash.current < 9000) burnFlash.current += 1;

      const keys = held.current;
      if (!pausedRef.current && !night) {
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
          const tx = Math.floor((p.x + GRASS_TILE / 2) / GRASS_TILE);
          const ty = Math.floor((p.y + GRASS_TILE / 2) / GRASS_TILE);
          const t = grassTileAt(tx, ty);

          if (t === "B" && !burntBushes.has(`${tx},${ty}`)) {
            cb.current.onBush({ x: p.x, y: p.y }, `${tx},${ty}`);
            return;
          }
          if (t === "V" && !vineDefeated) {
            cb.current.onVine({ x: p.x, y: p.y });
            return;
          }
          if (t === "g") {
            steps.current += 2;
            if (steps.current >= budget.current) {
              steps.current = 0;
              budget.current = 80 + Math.floor(Math.random() * 90);
              cb.current.onWildGrass({ x: p.x, y: p.y });
              return;
            }
          } else if (steps.current > 0) {
            steps.current -= 0.15;
          }
        }
      }

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = night ? "#0a1028" : "#58c838";
      ctx.fillRect(0, 0, W, H);

      for (let ty = 0; ty < GRASS_H; ty++) {
        for (let tx = 0; tx < GRASS_W; tx++) {
          drawGrassTile(ctx, tx, ty, frame.current, night, burntBushes);
        }
      }

      if (!night) {
        for (const n of GRASS_NPCS) {
          drawGrassNpc(ctx, n.tx * GRASS_TILE, n.ty * GRASS_TILE, n.id, frame.current);
        }
      }

      drawGoldenEgg(
        ctx,
        GOLDEN_EGG.tx * GRASS_TILE,
        GOLDEN_EGG.ty * GRASS_TILE,
        frame.current,
        night,
      );

      const p = pos.current;
      const walking = isDown(held.current, "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown");
      const walkBob = walking ? Math.sin(frame.current / 5) * 1.5 : 0;
      drawHero(ctx, p.x, p.y + walkBob, dir.current, walking ? frame.current : 0, night);

      if (night && burnFlash.current > 0 && burnFlash.current < 120) {
        ctx.fillStyle = `rgba(255,120,40,${0.35 * (1 - burnFlash.current / 120)})`;
        ctx.fillRect(0, 0, W, H);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [held, night, burntBushes, vineDefeated]);

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

function drawGrassTile(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  frame: number,
  night: boolean,
  burnt: Set<string>,
) {
  const t = grassTileAt(tx, ty);
  const x = tx * GRASS_TILE;
  const y = ty * GRASS_TILE;
  const key = `${tx},${ty}`;

  const grass = night ? "#1a2838" : "#58c838";
  const grassHi = night ? "#243048" : "#78e858";
  const path = night ? "#3a3048" : "#d8b868";
  const cliff = night ? "#2a2038" : "#a85828";

  if (t === "#") {
    px(ctx, x, y, GRASS_TILE, GRASS_TILE, night ? "#181028" : "#387820");
    return;
  }

  if (t === "p") {
    px(ctx, x, y, GRASS_TILE, GRASS_TILE, path);
    px(ctx, x + 2, y + 10, 4, 2, night ? "#504838" : "#c8a858");
    px(ctx, x + 14, y + 4, 3, 2, night ? "#504838" : "#e8c878");
    return;
  }

  if (t === "g") {
    px(ctx, x, y, GRASS_TILE, GRASS_TILE, grass);
    px(ctx, x + 2, y + 2, 6, 4, grassHi);
    if (!night) {
      for (let i = 0; i < 2; i++) {
        const gx = x + 4 + i * 10;
        const sway = Math.sin((frame + tx * 5 + ty * 3) / 18) * 1.2;
        px(ctx, gx + sway, y + 10, 2, 8, "#287818");
      }
    }
    return;
  }

  if (t === "c") {
    px(ctx, x, y, GRASS_TILE, GRASS_TILE, cliff);
    px(ctx, x, y + 14, GRASS_TILE, 10, night ? "#181028" : "#683818");
    px(ctx, x + 2, y + 4, 8, 3, night ? "#3a2838" : "#c87848");
    px(ctx, x + 12, y + 8, 6, 2, night ? "#3a2838" : "#985838");
    return;
  }

  if (t === "r") {
    px(ctx, x, y, GRASS_TILE, GRASS_TILE, night ? "#382858" : "#9858c8");
    px(ctx, x + 2, y + 6, GRASS_TILE - 4, GRASS_TILE - 6, night ? "#281838" : "#7858a8");
    return;
  }

  if (t === "h") {
    px(ctx, x, y, GRASS_TILE, GRASS_TILE, night ? "#484038" : "#f0e0a8");
    px(ctx, x + 4, y + 8, 6, 8, night ? "#383028" : "#c8a878");
    px(ctx, x + 14, y + 10, 4, 6, night ? "#585048" : "#887858");
    return;
  }

  if (t === "B") {
    if (burnt.has(key)) {
      px(ctx, x, y, GRASS_TILE, GRASS_TILE, night ? "#1a2838" : grass);
      px(ctx, x + 6, y + 12, 12, 8, "#181010");
      px(ctx, x + 8, y + 8, 8, 4, "#402818");
      return;
    }
    px(ctx, x, y, GRASS_TILE, GRASS_TILE, grass);
    px(ctx, x + 4, y + 10, 16, 10, "#287818");
    px(ctx, x + 6, y + 6, 12, 8, "#48a828");
    px(ctx, x + 8, y + 4, 8, 6, "#68c848");
    pixelTriangle(ctx, x + 10, y + 2, 6, "#78d858");
    return;
  }

  if (t === "V" && !night) {
    px(ctx, x, y, GRASS_TILE, GRASS_TILE, grass);
    px(ctx, x + 8, y + 2, 8, 20, "#481868");
    px(ctx, x + 2, y + 8, 20, 6, "#581878");
    for (let i = 0; i < 4; i++) {
      px(ctx, x + 4 + i * 5, y + 4 + (i % 2) * 6, 4, 4, "#802898");
    }
    return;
  }

  px(ctx, x, y, GRASS_TILE, GRASS_TILE, grass);
}

function drawGoldenEgg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  night: boolean,
) {
  const pulse = 0.5 + 0.5 * Math.sin(frame / 14);
  const gold = night ? "#a88820" : "#f8d030";
  const hi = night ? "#d8b848" : "#fff8a0";
  const bob = Math.sin(frame / 18) * 1.5;
  const cx = x + GRASS_TILE / 2;
  const cy = y + GRASS_TILE / 2 + bob;
  px(ctx, cx - 7, cy - 9, 14, 16, gold);
  px(ctx, cx - 5, cy - 11, 10, 4, hi);
  px(ctx, cx - 4, cy - 7, 8, 10, night ? "#887018" : "#e8b820");
  px(ctx, cx - 2, cy - 5, 4, 5, `rgba(255,255,200,${0.35 + pulse * 0.25})`);
  pixelTriangle(ctx, cx - 3, cy - 13, 6, hi, "up");
}

function drawGrassNpc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  id: string,
  frame: number,
) {
  const bob = Math.sin(frame / 20) * 1;
  if (id === "sign") {
    px(ctx, x + 8, y + 6 + bob, 8, 14, "#705018");
    px(ctx, x + 4, y + 4 + bob, 16, 8, "#f0e8c8");
    px(ctx, x + 6, y + 6 + bob, 12, 4, "#201008");
    return;
  }
  if (id === "paul") {
    px(ctx, x + 8, y + 14, 8, 8, "#483018");
    px(ctx, x + 7, y + 8, 10, 8, "#e8d8b0");
    px(ctx, x + 6, y + 4, 12, 5, "#f8f0d8");
    return;
  }
  if (id === "ness") {
    px(ctx, x + 8, y + 16, 3, 6, "#203878");
    px(ctx, x + 13, y + 16, 3, 6, "#203878");
    px(ctx, x + 7, y + 10, 10, 8, "#f0c090");
    px(ctx, x + 6, y + 4, 12, 6, "#c03030");
    px(ctx, x + 4, y + 12, 3, 8, "#887858");
    return;
  }
  px(ctx, x + 7, y + 14, 10, 8, "#584838");
  px(ctx, x + 8, y + 8, 8, 6, "#a89878");
}

function drawHero(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: "up" | "down" | "left" | "right",
  frame: number,
  night: boolean,
) {
  px(ctx, x + 5, y + GRASS_TILE - 3, GRASS_TILE - 10, 3, "rgba(0,0,0,0.35)");
  const step = frame ? (Math.floor(frame / 6) % 2 === 0 ? -1 : 1) : 0;
  const shirt = night ? "#284878" : "#20a838";
  px(ctx, x + 8, y + 16, 3, 6, "#703818");
  px(ctx, x + 13, y + 16, 3, 6, "#703818");
  if (step) px(ctx, x + 8 + step, y + 20, 3, 2, "#502010");
  px(ctx, x + 6, y + 10, 12, 8, shirt);
  px(ctx, x + 8, y + 6, 8, 6, "#f0c090");
  if (dir !== "up") {
    px(ctx, x + 9, y + 8, 2, 2, "#201008");
    if (dir === "down") px(ctx, x + 13, y + 8, 2, 2, "#201008");
  }
  px(ctx, x + 7, y + 2, 10, 5, shirt);
  pixelTriangle(ctx, x + 9, y - 1, 6, shirt);
}
