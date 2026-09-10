import * as React from "react";
import { audio } from "@/game/audio";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right";
type Point = { x: number; y: number };
type Outcome = "won" | "lost" | "draw";

const COLS = 48;
const ROWS = 27;
const DIRECTIONS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

interface Racer {
  head: Point;
  direction: Direction;
  trail: Point[];
}

const keyFor = ({ x, y }: Point) => `${x}:${y}`;
const nextPoint = (head: Point, direction: Direction) => ({
  x: head.x + DIRECTIONS[direction].x,
  y: head.y + DIRECTIONS[direction].y,
});
const outside = ({ x, y }: Point) => x < 0 || x >= COLS || y < 0 || y >= ROWS;

function openDistance(start: Point, direction: Direction, occupied: Set<string>) {
  let cursor = start;
  let distance = 0;
  while (distance < 12) {
    cursor = nextPoint(cursor, direction);
    if (outside(cursor) || occupied.has(keyFor(cursor))) break;
    distance += 1;
  }
  return distance;
}

function chooseAiDirection(racer: Racer, occupied: Set<string>, player: Racer, tick: number): Direction {
  const choices = (Object.keys(DIRECTIONS) as Direction[]).filter(
    (direction) => direction !== OPPOSITE[racer.direction],
  );
  const ranked = choices
    .map((direction, index) => {
      const next = nextPoint(racer.head, direction);
      const open = outside(next) || occupied.has(keyFor(next)) ? -100 : openDistance(next, direction, occupied);
      const chase = Math.abs(next.x - player.head.x) + Math.abs(next.y - player.head.y);
      const turnCost = direction === racer.direction ? 1.5 : 0;
      const variation = ((tick + index * 7) % 5) * 0.08;
      return { direction, score: open * 3 - chase * 0.025 + turnCost + variation };
    })
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.direction ?? racer.direction;
}

function drawScene(
  canvas: HTMLCanvasElement,
  player: Racer,
  opponent: Racer,
  skyPhase: number,
  reducedMotion: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  const cellW = width / COLS;
  const cellH = height / ROWS;
  const cycle = reducedMotion ? 0.72 : skyPhase;
  const daylight = (Math.cos(cycle * Math.PI * 2) + 1) / 2;

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, daylight > 0.55 ? "#185b88" : "#090722");
  sky.addColorStop(0.55, daylight > 0.55 ? "#b34776" : "#241147");
  sky.addColorStop(1, "#050816");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const celestialX = width * (0.12 + cycle * 0.76);
  const celestialY = height * (0.24 - Math.sin(cycle * Math.PI) * 0.13);
  ctx.beginPath();
  ctx.arc(celestialX, celestialY, 20, 0, Math.PI * 2);
  ctx.fillStyle = daylight > 0.5 ? "#ffc857" : "#eaf7ff";
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 28;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(234,247,255,0.12)";
  for (let i = 0; i < 4; i += 1) {
    const cloudX = ((i * 173 + skyPhase * width * 0.35) % (width + 120)) - 60;
    ctx.fillRect(cloudX, 48 + i * 31, 80 + i * 9, 5);
  }

  ctx.fillStyle = "#071225";
  ctx.strokeStyle = "rgba(37,217,255,0.45)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i += 1) {
    const buildingW = 22 + ((i * 13) % 25);
    const buildingH = 38 + ((i * 31) % 105);
    const x = i * (width / 17) - 6;
    ctx.fillRect(x, height - buildingH, buildingW, buildingH);
    ctx.strokeRect(x, height - buildingH, buildingW, buildingH);
    ctx.fillStyle = i % 2 ? "rgba(255,138,61,0.65)" : "rgba(37,217,255,0.65)";
    for (let wy = height - buildingH + 9; wy < height - 10; wy += 14) ctx.fillRect(x + 6, wy, 3, 3);
    ctx.fillStyle = "#071225";
  }

  ctx.fillStyle = "rgba(5,8,22,0.78)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(37,217,255,0.13)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * cellW, 0);
    ctx.lineTo(x * cellW, height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellH);
    ctx.lineTo(width, y * cellH);
    ctx.stroke();
  }

  const drawTrail = (racer: Racer, color: string) => {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    racer.trail.forEach((point) => {
      ctx.fillRect(point.x * cellW + 1, point.y * cellH + 1, Math.max(2, cellW - 2), Math.max(2, cellH - 2));
    });
    ctx.shadowBlur = 0;
    const head = racer.head;
    ctx.fillStyle = "#eaf7ff";
    ctx.fillRect(head.x * cellW - 1, head.y * cellH - 1, cellW + 2, cellH + 2);
    ctx.fillStyle = color;
    const nose = nextPoint(head, racer.direction);
    ctx.fillRect(
      (head.x + (nose.x - head.x) * 0.45) * cellW,
      (head.y + (nose.y - head.y) * 0.45) * cellH,
      cellW * 0.7,
      cellH * 0.7,
    );
  };

  drawTrail(player, "#25d9ff");
  drawTrail(opponent, "#ff633d");
  ctx.strokeStyle = "rgba(234,247,255,0.5)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, width - 3, height - 3);
}

const controlClass =
  "grid size-12 place-items-center rounded-md border border-cyan/60 bg-deepblue/85 font-display text-xl text-cyan transition-colors hover:bg-cyan/20 active:bg-cyan/30 disabled:opacity-40";

export function LightCycleGame({
  milestone,
  reducedMotion,
  onComplete,
}: {
  milestone: number;
  reducedMotion: boolean;
  onComplete: (outcome: Outcome) => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const playerRef = React.useRef<Racer>({ head: { x: 8, y: 13 }, direction: "right", trail: [{ x: 8, y: 13 }] });
  const opponentRef = React.useRef<Racer>({ head: { x: 39, y: 13 }, direction: "left", trail: [{ x: 39, y: 13 }] });
  const requestedDirection = React.useRef<Direction>("right");
  const tickRef = React.useRef(0);
  const skyPhaseRef = React.useRef(0.08);
  const [phase, setPhase] = React.useState<"ready" | "running" | "done">("ready");
  const [outcome, setOutcome] = React.useState<Outcome | null>(null);
  const [skyPhase, setSkyPhase] = React.useState(0.08);
  const tickMs = Math.max(58, 132 - (milestone - 1) * 7);
  const tempo = Math.min(1.85, 1 + (milestone - 1) * 0.09);

  const steer = React.useCallback((direction: Direction) => {
    if (direction === OPPOSITE[playerRef.current.direction]) return;
    requestedDirection.current = direction;
    if (phase === "running") audio.play("cycle-turn");
  }, [phase]);

  React.useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const direction = ({
        ArrowUp: "up",
        w: "up",
        W: "up",
        ArrowDown: "down",
        s: "down",
        S: "down",
        ArrowLeft: "left",
        a: "left",
        A: "left",
        ArrowRight: "right",
        d: "right",
        D: "right",
      } as Record<string, Direction | undefined>)[event.key];
      if (!direction) return;
      event.preventDefault();
      steer(direction);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [steer]);

  React.useEffect(() => {
    audio.setGenre("chiptune", Math.min(1, 0.68 + milestone * 0.025));
    audio.setTempoMultiplier(tempo);
    return () => audio.setTempoMultiplier(1);
  }, [milestone, tempo]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawScene(canvas, playerRef.current, opponentRef.current, skyPhase, reducedMotion);
  }, [skyPhase, reducedMotion]);

  React.useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => {
      tickRef.current += 1;
      const player = playerRef.current;
      const opponent = opponentRef.current;
      if (requestedDirection.current !== OPPOSITE[player.direction]) player.direction = requestedDirection.current;
      const occupied = new Set([...player.trail, ...opponent.trail].map(keyFor));
      opponent.direction = chooseAiDirection(opponent, occupied, player, tickRef.current);
      const playerNext = nextPoint(player.head, player.direction);
      const opponentNext = nextPoint(opponent.head, opponent.direction);
      const sameCell = keyFor(playerNext) === keyFor(opponentNext);
      const crossed = keyFor(playerNext) === keyFor(opponent.head) && keyFor(opponentNext) === keyFor(player.head);
      const playerHit = outside(playerNext) || occupied.has(keyFor(playerNext)) || sameCell || crossed;
      const opponentHit = outside(opponentNext) || occupied.has(keyFor(opponentNext)) || sameCell || crossed;
      if (playerHit || opponentHit) {
        const nextOutcome: Outcome = playerHit && opponentHit ? "draw" : playerHit ? "lost" : "won";
        setOutcome(nextOutcome);
        setPhase("done");
        audio.play(nextOutcome === "won" ? "cycle-win" : "cycle-crash");
        return;
      }
      player.head = playerNext;
      opponent.head = opponentNext;
      player.trail = [...player.trail, playerNext];
      opponent.trail = [...opponent.trail, opponentNext];
      skyPhaseRef.current = (skyPhaseRef.current + 0.0025 * Math.min(3, 1 + milestone * 0.12)) % 1;
      setSkyPhase(skyPhaseRef.current);
      const canvas = canvasRef.current;
      if (canvas) drawScene(canvas, player, opponent, skyPhaseRef.current, reducedMotion);
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [milestone, phase, reducedMotion, tickMs]);

  const start = () => {
    audio.play("cycle-start");
    setPhase("running");
  };

  const outcomeCopy = outcome === "won" ? "GRID DOMINATED" : outcome === "lost" ? "CYCLE DEREZZED" : "DOUBLE CRASH";

  return (
    <section className="lightcycle-shell mx-auto w-full max-w-6xl" aria-label="Grid Run light cycle minigame">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-cyan/30 px-4 py-3 font-mono text-xs uppercase tracking-widest">
        <h1 className="font-display text-lg text-cyan text-glow">GRID RUN</h1>
        <span className="text-amber">Milestone {milestone}</span>
        <span className="text-mint">Tempo {Math.round(tempo * 100)}%</span>
        <span className="ml-auto text-muted-foreground">Arrow keys / WASD</span>
      </header>

      <div className="relative overflow-hidden bg-midnight">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="block aspect-video w-full"
          aria-label="Neon light cycle arena. Cyan player versus orange opponent."
        />
        {phase !== "running" && (
          <div className="absolute inset-0 grid place-items-center bg-midnight/65 p-4 text-center backdrop-blur-[2px]">
            <div>
              <p className={cn("font-display text-2xl sm:text-4xl", outcome === "won" ? "text-mint" : "text-cyan")}>
                {phase === "ready" ? "ENTER THE GRID" : outcomeCopy}
              </p>
              <p className="mx-auto mt-2 max-w-md font-mono text-xs uppercase tracking-widest text-moon">
                {phase === "ready"
                  ? "Outlast the orange cycle. Every wall and light trail is lethal."
                  : outcome === "won"
                    ? "Opponent eliminated. Flight path restored."
                    : "Run complete. Your trivia campaign remains intact."}
              </p>
              {phase === "ready" ? (
                <button type="button" className="mt-5 rounded-md border border-cyan bg-cyan/15 px-5 py-3 font-display text-sm text-cyan" onClick={start}>
                  Start grid run
                </button>
              ) : (
                <button
                  type="button"
                  className="mt-5 rounded-md border border-mint bg-mint/10 px-5 py-3 font-display text-sm text-mint"
                  onClick={() => outcome && onComplete(outcome)}
                >
                  Return to flight deck
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-cyan/30 px-4 py-3">
        <div className="flex gap-5 font-mono text-[11px] uppercase tracking-widest">
          <span className="text-cyan">■ Player</span>
          <span className="text-orange">■ AI cycle</span>
        </div>
        <div className="grid grid-cols-3 gap-1" aria-label="Touch steering controls">
          <span />
          <button type="button" className={controlClass} onClick={() => steer("up")} aria-label="Steer up">↑</button>
          <span />
          <button type="button" className={controlClass} onClick={() => steer("left")} aria-label="Steer left">←</button>
          <button type="button" className={controlClass} onClick={() => steer("down")} aria-label="Steer down">↓</button>
          <button type="button" className={controlClass} onClick={() => steer("right")} aria-label="Steer right">→</button>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {phase === "ready" ? "Grid Run ready" : phase === "running" ? "Grid Run in progress" : outcomeCopy}
      </p>
    </section>
  );
}