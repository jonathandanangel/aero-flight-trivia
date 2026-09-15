import { useEffect, useRef } from "react";
import {
  GOLDEN_EGG,
  GRASS_H,
  GRASS_NPCS,
  GRASS_TILE,
  GRASS_W,
  HAWK_EGG,
  grassSolid,
  grassTileAt,
  type GrassNpc,
} from "@/game/spirit-bound/grasslands-data";
import { SCATTERED_PAPERS, paperAt, type ScatteredPaper } from "@/game/spirit-bound/scattered-papers";
import { drawLegendHero } from "@/game/spirit-bound/hero";
import { frameDt, HERO_SPEED, isWalking, moveFromKeys } from "@/game/spirit-bound/move";
import { ensureLayer, type LayerCache } from "@/game/spirit-bound/layer-cache";
import { pixelTriangle, px } from "@/game/spirit-bound/pixel";
import { useKeys } from "@/game/spirit-bound/useKeys";

type Props = {
  spawn: { x: number; y: number };
  paused: boolean;
  night: boolean;
  /** Random bush positions as "tx,ty" keys. */
  bushTiles: Set<string>;
  burntBushes: Set<string>;
  /** Bush key currently playing flame animation (just defeated). */
  burningBushKey: string | null;
  vineDefeated: boolean;
  collectedPaperIds: Set<string>;
  onTalk: (npc: GrassNpc) => void;
  onBush: (at: { x: number; y: number }, key: string) => void;
  onVine: (at: { x: number; y: number }) => void;
  onWildGrass: (at: { x: number; y: number }) => void;
  onGoldenEgg: () => void;
  onHawkEgg: () => void;
  onPaper: (paper: ScatteredPaper) => void;
};

const W = GRASS_W * GRASS_TILE;
const H = GRASS_H * GRASS_TILE;

export function GrasslandsOverworld({
  spawn,
  paused,
  night,
  bushTiles,
  burntBushes,
  burningBushKey,
  vineDefeated,
  collectedPaperIds,
  onTalk,
  onBush,
  onVine,
  onWildGrass,
  onGoldenEgg,
  onHawkEgg,
  onPaper,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pos = useRef({ ...spawn });
  const dir = useRef<"up" | "down" | "left" | "right">("down");
  const steps = useRef(0);
  const budget = useRef(80 + Math.floor(Math.random() * 90));
  const frame = useRef(0);
  const burnFlash = useRef(0);
  const bushBurnFrame = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const bushRef = useRef(bushTiles);
  bushRef.current = bushTiles;
  const burntRef = useRef(burntBushes);
  burntRef.current = burntBushes;
  const burningRef = useRef(burningBushKey);
  burningRef.current = burningBushKey;
  const collectedRef = useRef(collectedPaperIds);
  collectedRef.current = collectedPaperIds;

  const cb = useRef({ onTalk, onBush, onVine, onWildGrass, onGoldenEgg, onHawkEgg, onPaper });
  cb.current = { onTalk, onBush, onVine, onWildGrass, onGoldenEgg, onHawkEgg, onPaper };

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

  const facingPaper = (): ScatteredPaper | undefined => {
    const { tx, ty } = facingTile();
    const p = paperAt(tx, ty);
    if (!p || collectedRef.current.has(p.id)) return undefined;
    return p;
  };

  const facingGoldenEgg = (): boolean => {
    const { tx, ty } = facingTile();
    return tx === GOLDEN_EGG.tx && ty === GOLDEN_EGG.ty;
  };

  const facingHawkEgg = (): boolean => {
    const { tx, ty } = facingTile();
    return tx === HAWK_EGG.tx && ty === HAWK_EGG.ty;
  };

  const held = useKeys((key) => {
    if (pausedRef.current) return;
    if (["z", "Z", "Enter", " "].includes(key)) {
      const paper = facingPaper();
      if (paper) {
        cb.current.onPaper(paper);
        return;
      }
      if (facingGoldenEgg()) {
        cb.current.onGoldenEgg();
        return;
      }
      if (facingHawkEgg()) {
        cb.current.onHawkEgg();
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
    if (burningBushKey) bushBurnFrame.current = 0;
  }, [burningBushKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    const layerCache: { current: LayerCache | null } = { current: null };

    // Precompute bush coords + night smolder tiles once per loop setup.
    const bushList: { key: string; tx: number; ty: number }[] = [];
    for (const key of bushTiles) {
      const [tsx, tsy] = key.split(",").map(Number);
      bushList.push({ key, tx: tsx ?? 0, ty: tsy ?? 0 });
    }
    const smolder: { tx: number; ty: number }[] = [];
    if (night) {
      for (let ty = 0; ty < GRASS_H; ty++) {
        for (let tx = 0; tx < GRASS_W; tx++) {
          const t = grassTileAt(tx, ty);
          if (t === "h" || t === "r" || t === "c") smolder.push({ tx, ty });
        }
      }
    }

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
        return grassSolid(tx, ty, burntRef.current);
      });
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = frameDt(now, last);
      last = now;
      frame.current += 1;
      if (burnFlash.current > 0 && burnFlash.current < 9000) burnFlash.current += 1;
      if (burningRef.current) bushBurnFrame.current += 1;

      const keys = held.current;
      if (!pausedRef.current) {
        const { ax, ay, facing } = moveFromKeys(keys);
        if (facing) dir.current = facing;
        const dx = ax * HERO_SPEED * dt;
        const dy = ay * HERO_SPEED * dt;

        const p = pos.current;
        if (dx && !blocked(p.x + dx, p.y)) p.x += dx;
        if (dy && !blocked(p.x, p.y + dy)) p.y += dy;

        if (dx || dy) {
          if (!night) {
            steps.current += 1;
            const tx = Math.floor((p.x + GRASS_TILE / 2) / GRASS_TILE);
            const ty = Math.floor((p.y + GRASS_TILE / 2) / GRASS_TILE);
            const key = `${tx},${ty}`;
            const t = grassTileAt(tx, ty);

            if (bushRef.current.has(key) && !burntRef.current.has(key)) {
              cb.current.onBush({ x: p.x, y: p.y }, key);
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
      }

      ctx.imageSmoothingEnabled = false;
      // Cache base map; rebuild only when night/burnt set changes.
      const burntKey = burntRef.current.size;
      const base = ensureLayer(layerCache, `n${night ? 1 : 0}:b${burntKey}:v${vineDefeated ? 1 : 0}`, W, H, (g) => {
        g.fillStyle = night ? "#0a1028" : "#58c838";
        g.fillRect(0, 0, W, H);
        for (let ty = 0; ty < GRASS_H; ty++) {
          for (let tx = 0; tx < GRASS_W; tx++) {
            drawGrassTile(g, tx, ty, 0, night, false);
          }
        }
      });
      ctx.drawImage(base, 0, 0);

      // Live / burning / ash bushes (sparse)
      for (const b of bushList) {
        const x = b.tx * GRASS_TILE;
        const y = b.ty * GRASS_TILE;
        const isBurning = burningRef.current === b.key;
        const isBurnt = burntRef.current.has(b.key);
        if (isBurning) {
          drawBushOnFire(ctx, x, y, bushBurnFrame.current);
        } else if (isBurnt || night) {
          drawBushAsh(ctx, x, y, night);
          if (night && frame.current % 2 === 0) drawFireFlicker(ctx, x, y, frame.current + b.tx * 7);
        } else {
          drawLiveBush(ctx, x, y, frame.current);
        }
      }

      for (const paper of SCATTERED_PAPERS) {
        if (collectedRef.current.has(paper.id)) continue;
        drawRainbowPaper(ctx, paper, frame.current);
      }

      if (!night) {
        for (const n of GRASS_NPCS) {
          drawGrassNpc(ctx, n.tx * GRASS_TILE, n.ty * GRASS_TILE, n.id, frame.current);
        }
      } else {
        if (frame.current % 2 === 0) {
          for (const s of smolder) {
            drawFireFlicker(ctx, s.tx * GRASS_TILE, s.ty * GRASS_TILE, frame.current + s.tx * 3 + s.ty);
          }
        }
        if (vineDefeated) {
          drawBurningVineDistant(ctx, 20 * GRASS_TILE, 15 * GRASS_TILE, frame.current);
        }
      }

      drawGoldenEgg(ctx, GOLDEN_EGG.tx * GRASS_TILE, GOLDEN_EGG.ty * GRASS_TILE, frame.current, night);
      drawHawkEgg(ctx, HAWK_EGG.tx * GRASS_TILE, HAWK_EGG.ty * GRASS_TILE, frame.current, night);

      const p = pos.current;
      const walking = isWalking(held.current);
      const walkBob = walking ? Math.sin(now / 90) * 1.2 : 0;
      drawHero(ctx, p.x, p.y + walkBob, dir.current, walking ? frame.current : 0, night);

      if (night && burnFlash.current > 0 && burnFlash.current < 120) {
        ctx.fillStyle = `rgba(255,120,40,${0.35 * (1 - burnFlash.current / 120)})`;
        ctx.fillRect(0, 0, W, H);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [held, night, vineDefeated, bushTiles, burntBushes]);

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
  animate = true,
) {
  const t = grassTileAt(tx, ty);
  const x = tx * GRASS_TILE;
  const y = ty * GRASS_TILE;

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
        const sway = animate ? Math.sin((frame + tx * 5 + ty * 3) / 18) * 1.2 : 0;
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

/** Pixel folded scrap — body = paper.color, ink lines = paper.ink, no white bg. */
function drawRainbowPaper(ctx: CanvasRenderingContext2D, paper: ScatteredPaper, frame: number) {
  const bob = Math.sin((frame + paper.order * 9) / 16) * 1.2;
  const dx = paper.tx * GRASS_TILE + 2;
  const dy = paper.ty * GRASS_TILE + 2 + bob;
  const fold = paper.ink; // darker same-hue fold (ink is already a deep shade of the scrap)
  px(ctx, dx + 2, dy + 1, 14, 18, "#181010"); // outline
  px(ctx, dx + 3, dy + 2, 12, 16, paper.color); // body
  px(ctx, dx + 11, dy + 2, 4, 4, "#181010");
  px(ctx, dx + 11, dy + 3, 3, 3, fold); // dog-ear
  px(ctx, dx + 5, dy + 6, 8, 1, paper.ink);
  px(ctx, dx + 5, dy + 9, 6, 1, paper.ink);
  px(ctx, dx + 5, dy + 12, 9, 1, paper.ink);
  px(ctx, dx + 5, dy + 15, 5, 1, paper.ink);
}

function drawLiveBush(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const sway = Math.sin(frame / 14) * 1;
  px(ctx, x + 4 + sway, y + 10, 16, 10, "#287818");
  px(ctx, x + 6 + sway, y + 6, 12, 8, "#48a828");
  px(ctx, x + 8 + sway, y + 4, 8, 6, "#68c848");
  pixelTriangle(ctx, x + 10 + sway, y + 2, 6, "#78d858");
}

function drawBushAsh(ctx: CanvasRenderingContext2D, x: number, y: number, night: boolean) {
  px(ctx, x + 6, y + 14, 12, 6, "#181010");
  px(ctx, x + 8, y + 10, 8, 5, "#402818");
  px(ctx, x + 10, y + 8, 4, 3, night ? "#503828" : "#604028");
}

function drawBushOnFire(ctx: CanvasRenderingContext2D, x: number, y: number, f: number) {
  drawBushAsh(ctx, x, y, false);
  const flicker = Math.sin(f / 3) * 2;
  px(ctx, x + 8, y + 4 + flicker, 8, 10, "#f86020");
  px(ctx, x + 10, y + 1 + flicker, 4, 8, "#f8d030");
  px(ctx, x + 6, y + 8, 3, 6, "#f04010");
  px(ctx, x + 15, y + 7, 3, 5, "#f87828");
  pixelTriangle(ctx, x + 9, y - 2 + flicker, 6, "#fff060", "up");
}

function drawFireFlicker(ctx: CanvasRenderingContext2D, x: number, y: number, f: number) {
  const flicker = Math.sin(f / 4) * 2;
  px(ctx, x + 8, y + 6 + flicker, 6, 8, "#f85018");
  px(ctx, x + 10, y + 3 + flicker, 3, 6, "#f8c030");
}

function drawBurningVineDistant(ctx: CanvasRenderingContext2D, x: number, y: number, f: number) {
  px(ctx, x + 8, y + 2, 8, 18, "#2a1020");
  px(ctx, x + 2, y + 8, 20, 5, "#3a1830");
  drawFireFlicker(ctx, x, y, f);
  drawFireFlicker(ctx, x + 8, y - 4, f + 9);
  drawFireFlicker(ctx, x + 4, y + 6, f + 17);
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

function drawHawkEgg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  night: boolean,
) {
  const pulse = 0.5 + 0.5 * Math.sin(frame / 12);
  const shell = night ? "#8a5030" : "#c87838";
  const hi = night ? "#b87848" : "#e8a858";
  const bob = Math.sin(frame / 16) * 1.5;
  const cx = x + GRASS_TILE / 2;
  const cy = y + GRASS_TILE / 2 + bob;
  px(ctx, cx - 7, cy - 9, 14, 16, shell);
  px(ctx, cx - 5, cy - 11, 10, 4, hi);
  px(ctx, cx - 4, cy - 7, 8, 10, night ? "#6a3820" : "#a85828");
  px(ctx, cx - 2, cy - 5, 4, 5, `rgba(255,200,140,${0.3 + pulse * 0.25})`);
  // hawk beak hint on top
  pixelTriangle(ctx, cx - 2, cy - 14, 4, night ? "#d8a040" : "#f0c060", "up");
  px(ctx, cx + 4, cy - 6, 3, 2, night ? "#403018" : "#201808");
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
  drawLegendHero(ctx, x, y, dir, frame, { night, tile: GRASS_TILE });
}
