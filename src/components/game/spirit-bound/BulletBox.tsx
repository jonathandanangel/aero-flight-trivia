import { useEffect, useRef } from "react";
import { isDown, useKeys } from "@/game/spirit-bound/useKeys";

type Bullet = { x: number; y: number; vx: number; vy: number; r: number; kind: "dot" | "bar" };

type Props = {
  pattern: "seeds" | "salt" | "king" | "bush" | "vine";
  duration: number;
  damage: number;
  onHit: (dmg: number) => void;
  onDone: () => void;
};

const W = 480;
const H = 110;

export function BulletBox({ pattern, duration, damage, onHit, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const held = useKeys();
  const cb = useRef({ onHit, onDone });
  cb.current = { onHit, onDone };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const heart = { x: W / 2, y: H / 2 };
    const bullets: Bullet[] = [];
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let spawnTimer = 0;
    let invuln = 0;
    let done = false;

    const spawn = () => {
      if (pattern === "seeds") {
        const fromLeft = Math.random() < 0.5;
        bullets.push({
          x: fromLeft ? -6 : W + 6,
          y: 10 + Math.random() * (H - 20),
          vx: (fromLeft ? 1 : -1) * (70 + Math.random() * 60),
          vy: (Math.random() - 0.5) * 50,
          r: 4,
          kind: "dot",
        });
      } else if (pattern === "salt") {
        const top = Math.random() < 0.5;
        for (let i = 0; i < 3; i++) {
          bullets.push({
            x: 20 + Math.random() * (W - 40),
            y: top ? -6 - i * 18 : H + 6 + i * 18,
            vx: (Math.random() - 0.5) * 30,
            vy: (top ? 1 : -1) * (60 + Math.random() * 40),
            r: 3,
            kind: "dot",
          });
        }
      } else if (pattern === "bush") {
        for (let i = 0; i < 5; i++) {
          bullets.push({
            x: Math.random() * W,
            y: -8 - i * 12,
            vx: (Math.random() - 0.5) * 40,
            vy: 50 + Math.random() * 40,
            r: 3,
            kind: "dot",
          });
        }
      } else if (pattern === "vine") {
        const phase = elapsed / 500;
        for (let i = 0; i < 6; i++) {
          const a = phase + (i / 6) * Math.PI * 2;
          bullets.push({
            x: heart.x + Math.cos(a) * 160,
            y: H / 2 + Math.sin(a) * 70,
            vx: -Math.cos(a) * 85,
            vy: -Math.sin(a) * 65,
            r: 5,
            kind: "dot",
          });
        }
        if (Math.random() < 0.4) {
          const gapX = 40 + Math.random() * (W - 120);
          for (let x = 4; x < W; x += 12) {
            if (x > gapX && x < gapX + 36) continue;
            bullets.push({ x, y: H + 6, vx: 0, vy: -95, r: 4, kind: "bar" });
          }
        }
      } else if (pattern === "king") {
        const mode = Math.random();
        if (mode < 0.5) {
          const cx = heart.x;
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + elapsed / 400;
            bullets.push({
              x: cx + Math.cos(a) * 140,
              y: H / 2 + Math.sin(a) * 90,
              vx: -Math.cos(a) * 70,
              vy: -Math.sin(a) * 55,
              r: 4,
              kind: "dot",
            });
          }
        } else {
          const gapY = 15 + Math.random() * (H - 50);
          for (let y = 4; y < H; y += 10) {
            if (y > gapY && y < gapY + 34) continue;
            bullets.push({ x: W + 8, y, vx: -120, vy: 0, r: 4, kind: "bar" });
          }
        }
      }
    };

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      elapsed += dt * 1000;
      spawnTimer -= dt * 1000;
      invuln -= dt * 1000;

      const speed = 130 * dt;
      const k = held.current;
      if (isDown(k, "ArrowLeft")) heart.x -= speed;
      if (isDown(k, "ArrowRight")) heart.x += speed;
      if (isDown(k, "ArrowUp")) heart.y -= speed;
      if (isDown(k, "ArrowDown")) heart.y += speed;
      heart.x = Math.max(8, Math.min(W - 8, heart.x));
      heart.y = Math.max(8, Math.min(H - 8, heart.y));

      const interval =
        pattern === "king" || pattern === "vine"
          ? 900
          : pattern === "salt"
            ? 520
            : pattern === "bush"
              ? 400
              : 340;
      if (spawnTimer <= 0 && elapsed < duration - 900) {
        spawnTimer = interval;
        spawn();
      }

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]!;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < -40 || b.x > W + 40 || b.y < -60 || b.y > H + 60) {
          bullets.splice(i, 1);
          continue;
        }
        const dx = b.x - heart.x;
        const dy = b.y - heart.y;
        if (invuln <= 0 && Math.hypot(dx, dy) < b.r + 5) {
          invuln = 700;
          cb.current.onHit(damage);
        }
      }

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#181010";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f8d030";
      ctx.fillRect(0, 0, W, 4);
      ctx.fillRect(0, H - 4, W, 4);
      ctx.fillRect(0, 0, 4, H);
      ctx.fillRect(W - 4, 0, 4, H);
      ctx.fillStyle = "#705018";
      ctx.fillRect(4, 4, W - 8, 2);
      ctx.fillRect(4, H - 6, W - 8, 2);

      ctx.fillStyle = "#f8f0c8";
      for (const b of bullets) {
        if (b.kind === "bar") {
          ctx.fillRect(b.x - 6, b.y - 3, 12, 6);
          ctx.fillStyle = "#f8d030";
          ctx.fillRect(b.x - 2, b.y - 5, 4, 10);
          ctx.fillStyle = "#f8f0c8";
        } else {
          const r = Math.max(4, b.r);
          ctx.fillStyle = "#f8d030";
          ctx.fillRect(b.x - 1, b.y - r, 2, 2);
          ctx.fillRect(b.x - 2, b.y - r + 2, 4, 2);
          ctx.fillRect(b.x - 3, b.y - r + 4, 6, 2);
          ctx.fillRect(b.x - r + 1, b.y, r * 2 - 2, 2);
          ctx.fillStyle = "#f8f0c8";
        }
      }

      const flash = invuln > 0 && Math.floor(elapsed / 80) % 2 === 0;
      ctx.fillStyle = flash ? "#7a1b2b" : "#e83828";
      ctx.fillRect(heart.x - 1, heart.y - 6, 2, 2);
      ctx.fillRect(heart.x - 3, heart.y - 4, 6, 2);
      ctx.fillRect(heart.x - 5, heart.y - 2, 10, 2);
      ctx.fillRect(heart.x - 6, heart.y, 12, 2);
      ctx.fillRect(heart.x - 4, heart.y + 2, 8, 2);
      ctx.fillStyle = flash ? "#7a1b2b" : "#f8d030";
      ctx.fillRect(heart.x - 1, heart.y - 2, 2, 2);

      if (elapsed >= duration && !done) {
        done = true;
        cb.current.onDone();
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pattern, duration, damage, held]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="mx-auto block h-[110px] w-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
