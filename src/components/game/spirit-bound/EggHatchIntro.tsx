import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TILE } from "@/game/spirit-bound/data";
import { drawLegendHero } from "@/game/spirit-bound/hero";
import { pixelTriangle, px } from "@/game/spirit-bound/pixel";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Props = {
  onDone: () => void;
};

const W = 320;
const H = 280;

/**
 * GREENVALE QUEST boot: golden egg cracks open, hero stands at center, then overworld begins.
 */
export function EggHatchIntro({ onDone }: Props) {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const done = useRef(false);
  const [phase, setPhase] = useState<"egg" | "crack" | "hero" | "fade">("egg");

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    if (reduced) {
      const t = window.setTimeout(finish, 400);
      return () => window.clearTimeout(t);
    }
    const t1 = window.setTimeout(() => setPhase("crack"), 700);
    const t2 = window.setTimeout(() => setPhase("hero"), 1600);
    const t3 = window.setTimeout(() => setPhase("fade"), 2800);
    const t4 = window.setTimeout(finish, 3400);
    const onKey = (e: KeyboardEvent) => {
      if (["Enter", " ", "Escape", "z", "Z"].includes(e.key)) {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once boot sequence
  }, [reduced]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let frame = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      frame += 1;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#100808";
      ctx.fillRect(0, 0, W, H);

      // soft meadow glow
      ctx.fillStyle = phase === "hero" || phase === "fade" ? "#183818" : "#181010";
      ctx.fillRect(40, 200, W - 80, 40);

      const cx = W / 2;
      const cy = H / 2;

      if (phase === "egg" || phase === "crack") {
        drawEgg(ctx, cx, cy, frame, phase === "crack");
      }

      if (phase === "crack") {
        // shell shards
        const shake = Math.sin(frame / 3) * 2;
        px(ctx, cx - 40 + shake, cy - 10, 10, 8, "#f8d030");
        px(ctx, cx + 28 - shake, cy - 4, 12, 6, "#e8b820");
        px(ctx, cx - 20, cy + 18 + shake, 8, 6, "#d8a810");
        px(ctx, cx + 16, cy + 22, 10, 5, "#fff8a0");
      }

      if (phase === "hero" || phase === "fade") {
        const bob = Math.sin(frame / 12) * 1.5;
        drawHeroSprite(ctx, cx - TILE / 2, cy - TILE / 2 + bob, frame);
        // residual shell at feet
        px(ctx, cx - 18, cy + 14, 8, 4, "#a88820");
        px(ctx, cx + 10, cy + 16, 10, 3, "#887018");
      }

      if (phase === "fade") {
        ctx.fillStyle = `rgba(16,8,8,${Math.min(1, (frame % 60) / 40)})`;
        ctx.fillRect(0, 0, W, H);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <motion.button
      type="button"
      aria-label="Egg hatching. Hero emerges. Continue to Greenvale."
      onClick={finish}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "fade" ? 0 : 1 }}
      transition={{ duration: 0.45 }}
      className="flex min-h-[420px] w-full flex-col items-center justify-center gap-3 rounded-lg border-4 border-game-yellow bg-game-bg p-4 text-center shadow-[0_0_0_4px_#181010]"
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="h-auto w-full max-w-[420px]"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="font-pixel text-[10px] tracking-[0.2em] text-game-yellow">
        {phase === "egg" && "THE EGG STIRS…"}
        {phase === "crack" && "IT CRACKS!"}
        {(phase === "hero" || phase === "fade") && "A HERO IS BORN"}
      </p>
      <p className="font-pixel text-[8px] text-game-orange">Z / ENTER to skip</p>
    </motion.button>
  );
}

function drawEgg(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  frame: number,
  cracking: boolean,
) {
  const pulse = 0.5 + 0.5 * Math.sin(frame / 14);
  const bob = Math.sin(frame / 18) * (cracking ? 3 : 1.5);
  const gold = cracking ? "#fff060" : "#f8d030";
  const hi = "#fff8a0";
  const shellY = cy + bob;
  px(ctx, cx - 28, shellY - 36, 56, 64, gold);
  px(ctx, cx - 20, shellY - 44, 40, 12, hi);
  px(ctx, cx - 16, shellY - 28, 32, 40, "#e8b820");
  px(ctx, cx - 8, shellY - 20, 16, 20, `rgba(255,255,200,${0.35 + pulse * 0.25})`);
  if (cracking) {
    px(ctx, cx - 2, shellY - 40, 4, 50, "#181010");
    px(ctx, cx - 14, shellY - 8, 28, 3, "#181010");
    px(ctx, cx + 8, shellY - 24, 18, 2, "#181010");
  }
  pixelTriangle(ctx, cx - 8, shellY - 50, 16, hi, "up");
}

function drawHeroSprite(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  drawLegendHero(ctx, x, y, "down", frame, { tile: TILE });
}
