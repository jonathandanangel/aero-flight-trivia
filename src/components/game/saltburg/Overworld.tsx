import { useEffect, useRef } from "react";
import { isSolid, MAP_H, MAP_W, NPCS, TILE, tileAt, WILD_POOL, type Npc } from "@/game/saltburg/data";
import { isDown, useKeys } from "@/game/saltburg/useKeys";

type Props = {
  spawn: { x: number; y: number };
  paused: boolean;
  onTalk: (npc: Npc) => void;
  onEncounter: (enemyId: string, at: { x: number; y: number }) => void;
  onBossDoor: (at: { x: number; y: number }) => void;
};

const W = MAP_W * TILE;
const H = MAP_H * TILE;
const SPEED = 1.9;

export function Overworld({ spawn, paused, onTalk, onEncounter, onBossDoor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pos = useRef({ ...spawn });
  const dir = useRef<"up" | "down" | "left" | "right">("down");
  const steps = useRef(0);
  const budget = useRef(90 + Math.floor(Math.random() * 120));
  const frame = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const cb = useRef({ onTalk, onEncounter, onBossDoor });
  cb.current = { onTalk, onEncounter, onBossDoor };

  const facingNpc = (): Npc | undefined => {
    const cx = pos.current.x + TILE / 2;
    const cy = pos.current.y + TILE / 2;
    const d = dir.current;
    const tx = Math.floor((cx + (d === "left" ? -TILE : d === "right" ? TILE : 0)) / TILE);
    const ty = Math.floor((cy + (d === "up" ? -TILE : d === "down" ? TILE : 0)) / TILE);
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
            cb.current.onBossDoor({ x: p.x, y: p.y + TILE });
            return;
          }
          // EarthBound-style step counter: a random budget of grass steps per fight,
          // so encounters never feel instant and never dry up for too long.
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
            steps.current -= 0.15; // cool down slightly on safe ground
          }
        }
      }

      // ---- render ----
      ctx.fillStyle = "#0d0f1a";
      ctx.fillRect(0, 0, W, H);
      for (let ty = 0; ty < MAP_H; ty++) {
        for (let tx = 0; tx < MAP_W; tx++) {
          const t = tileAt(tx, ty);
          const x = tx * TILE;
          const y = ty * TILE;
          if (t === "#") {
            ctx.fillStyle = "#2b2f45";
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = "#3a4066";
            ctx.fillRect(x + 2, y + 2, TILE - 4, 4);
          } else if (t === "w") {
            ctx.fillStyle = "#12457a";
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = "#2f7fc4";
            ctx.fillRect(x + 3, y + 8 + Math.sin((frame.current + tx * 9) / 22) * 2, 12, 2);
          } else if (t === "g") {
            ctx.fillStyle = "#123b22";
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = "#1f6b36";
            for (let i = 0; i < 3; i++) {
              const gx = x + 4 + i * 7;
              const sway = Math.sin((frame.current + tx * 5 + ty * 3 + i * 11) / 20) * 1.5;
              ctx.fillRect(gx + sway, y + 8, 3, 12);
            }
          } else if (t === "D") {
            ctx.fillStyle = "#3b1d2b";
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = "#ffb703";
            ctx.fillRect(x + 5, y + 4, TILE - 10, TILE - 6);
            ctx.fillStyle = "#3b1d2b";
            ctx.fillRect(x + TILE - 9, y + TILE / 2, 3, 3);
          } else if (t === "f") {
            ctx.fillStyle = "#171c2e";
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = "#f78fb3";
            ctx.fillRect(x + 9, y + 8, 6, 6);
            ctx.fillStyle = "#ffd166";
            ctx.fillRect(x + 11, y + 10, 2, 2);
            ctx.fillStyle = "#1f6b36";
            ctx.fillRect(x + 11, y + 14, 2, 6);
          } else {
            ctx.fillStyle = (tx + ty) % 2 === 0 ? "#171c2e" : "#141928";
            ctx.fillRect(x, y, TILE, TILE);
          }
        }
      }

      // NPCs
      for (const n of NPCS) {
        const bob = Math.sin((frame.current + n.tx * 17) / 25) * 1.5;
        drawChar(ctx, n.tx * TILE, n.ty * TILE + bob, n.color, "down");
      }

      // player
      const p = pos.current;
      const walkBob = isDown(held.current, "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown")
        ? Math.sin(frame.current / 5) * 1.5
        : 0;
      drawChar(ctx, p.x, p.y + walkBob, "#ff4d6d", dir.current);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [held]);

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

function drawChar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  dir: "up" | "down" | "left" | "right",
) {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(x + 5, y + TILE - 3, TILE - 10, 3);
  ctx.fillStyle = "#1b1f30";
  ctx.fillRect(x + 6, y + 14, 12, 8);
  ctx.fillStyle = color;
  ctx.fillRect(x + 5, y + 4, 14, 12);
  if (dir !== "up") {
    ctx.fillStyle = "#0d0f1a";
    const ex = dir === "left" ? 7 : dir === "right" ? 12 : 8;
    ctx.fillRect(x + ex, y + 9, 2, 3);
    if (dir === "down") ctx.fillRect(x + 14, y + 9, 2, 3);
  }
}
