import * as React from "react";
import { audio } from "@/game/audio";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right";
type Point = { x: number; y: number };
type Phase = "ready" | "running" | "won" | "lost";
type GhostMode = "chase" | "frightened" | "eaten";

interface Ghost {
  color: string;
  direction: Direction;
  home: Point;
  mode: GhostMode;
  position: Point;
  personality: number;
}

const MAZE = [
  "#####################",
  "#o........#........o#",
  "#.###.###.#.###.###.#",
  "#...................#",
  "#.###.#.#####.#.###.#",
  "#.....#...#...#.....#",
  "#####.###.#.###.#####",
  "#.........G.........#",
  "#.###.#.GGG.#.#.###.#",
  "#.....#.     .#.....#",
  "#.###.####.####.###.#",
  "#...#...........#...#",
  "#.#.#.###.#.###.#.#.#",
  "#.#.....#.P.#.....#.#",
  "#o..###.......###..o#",
  "#...................#",
  "#####################",
] as const;

const COLS = MAZE[0].length;
const ROWS = MAZE.length;
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
const GHOST_COLORS = ["#ff4d78", "#ff8a3d", "#53f4ff", "#da4dff"];
const keyFor = ({ x, y }: Point) => `${x}:${y}`;
const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const move = (point: Point, direction: Direction) => ({
  x: point.x + DIRECTIONS[direction].x,
  y: point.y + DIRECTIONS[direction].y,
});
const walls = new Set<string>();
const initialPellets = new Set<string>();
const initialPowerPellets = new Set<string>();
let playerSpawn: Point = { x: 10, y: 13 };
const ghostSpawns: Point[] = [];

MAZE.forEach((row, y) => {
  [...row].forEach((cell, x) => {
    const point = { x, y };
    if (cell === "#") walls.add(keyFor(point));
    if (cell === ".") initialPellets.add(keyFor(point));
    if (cell === "o") initialPowerPellets.add(keyFor(point));
    if (cell === "P") playerSpawn = point;
    if (cell === "G") ghostSpawns.push(point);
  });
});

const isOpen = (point: Point) =>
  point.x >= 0 && point.x < COLS && point.y >= 0 && point.y < ROWS && !walls.has(keyFor(point));

function targetFor(ghost: Ghost, player: Point, direction: Direction, tick: number): Point {
  if (ghost.mode === "eaten") return ghost.home;
  if (ghost.mode === "frightened") {
    return { x: (tick * 7 + ghost.personality * 5) % COLS, y: (tick * 3 + ghost.personality * 7) % ROWS };
  }
  if (ghost.personality === 1) {
    return {
      x: player.x + DIRECTIONS[direction].x * 3,
      y: player.y + DIRECTIONS[direction].y * 3,
    };
  }
  if (ghost.personality === 2) return { x: COLS - 1 - player.x, y: ROWS - 1 - player.y };
  if (ghost.personality === 3) return { x: player.x, y: Math.max(1, player.y - 4) };
  return player;
}

function chooseGhostDirection(ghost: Ghost, player: Point, playerDirection: Direction, tick: number) {
  const target = targetFor(ghost, player, playerDirection, tick);
  const choices = (Object.keys(DIRECTIONS) as Direction[]).filter((direction) => {
    if (direction === OPPOSITE[ghost.direction]) return false;
    return isOpen(move(ghost.position, direction));
  });
  const available = choices.length
    ? choices
    : (Object.keys(DIRECTIONS) as Direction[]).filter((direction) => isOpen(move(ghost.position, direction)));
  return available.sort((a, b) => {
    const pa = move(ghost.position, a);
    const pb = move(ghost.position, b);
    const da = Math.abs(pa.x - target.x) + Math.abs(pa.y - target.y);
    const db = Math.abs(pb.x - target.x) + Math.abs(pb.y - target.y);
    return ghost.mode === "frightened" ? db - da : da - db;
  })[(tick + ghost.personality) % Math.max(available.length, 1)] ?? ghost.direction;
}

function drawMaze(
  canvas: HTMLCanvasElement,
  player: Point,
  direction: Direction,
  ghosts: Ghost[],
  pellets: Set<string>,
  powerPellets: Set<string>,
  tick: number,
  reducedMotion: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  const cell = Math.min(width / COLS, height / ROWS);
  const offsetX = (width - COLS * cell) / 2;
  const offsetY = (height - ROWS * cell) / 2;
  const hue = reducedMotion ? 188 : (tick * 13) % 360;

  ctx.fillStyle = "#03040d";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = `hsla(${hue}, 96%, 62%, 0.11)`;
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x += 1) {
    ctx.beginPath(); ctx.moveTo(offsetX + x * cell, offsetY); ctx.lineTo(offsetX + x * cell, offsetY + ROWS * cell); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y += 1) {
    ctx.beginPath(); ctx.moveTo(offsetX, offsetY + y * cell); ctx.lineTo(offsetX + COLS * cell, offsetY + y * cell); ctx.stroke();
  }

  walls.forEach((value) => {
    const [x = 0, y = 0] = value.split(":").map(Number);
    const wallHue = reducedMotion ? 188 : (hue + x * 11 + y * 17) % 360;
    ctx.fillStyle = `hsla(${wallHue}, 88%, 46%, 0.22)`;
    ctx.strokeStyle = `hsl(${wallHue}, 98%, 64%)`;
    ctx.shadowColor = reducedMotion ? "transparent" : ctx.strokeStyle;
    ctx.shadowBlur = reducedMotion ? 0 : 9;
    ctx.lineWidth = Math.max(1.5, cell * 0.09);
    ctx.fillRect(offsetX + x * cell + 2, offsetY + y * cell + 2, cell - 4, cell - 4);
    ctx.strokeRect(offsetX + x * cell + 2, offsetY + y * cell + 2, cell - 4, cell - 4);
  });
  ctx.shadowBlur = 0;

  pellets.forEach((value) => {
    const [x = 0, y = 0] = value.split(":").map(Number);
    ctx.beginPath();
    ctx.arc(offsetX + (x + 0.5) * cell, offsetY + (y + 0.5) * cell, Math.max(1.6, cell * 0.08), 0, Math.PI * 2);
    ctx.fillStyle = "#eaf7ff";
    ctx.fill();
  });
  powerPellets.forEach((value) => {
    const [x = 0, y = 0] = value.split(":").map(Number);
    const pulse = reducedMotion ? 0 : Math.sin(tick * 0.8) * cell * 0.04;
    ctx.beginPath();
    ctx.arc(offsetX + (x + 0.5) * cell, offsetY + (y + 0.5) * cell, cell * 0.22 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = "#ffc857";
    ctx.shadowColor = "#ffc857";
    ctx.shadowBlur = reducedMotion ? 0 : 14;
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  const px = offsetX + (player.x + 0.5) * cell;
  const py = offsetY + (player.y + 0.5) * cell;
  const angles: Record<Direction, number> = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  const mouth = reducedMotion ? 0.28 : 0.2 + Math.abs(Math.sin(tick)) * 0.24;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, cell * 0.38, angles[direction] + mouth, angles[direction] + Math.PI * 2 - mouth);
  ctx.closePath();
  ctx.fillStyle = "#ffe55c";
  ctx.shadowColor = "#ffe55c";
  ctx.shadowBlur = reducedMotion ? 0 : 13;
  ctx.fill();

  ghosts.forEach((ghost) => {
    const gx = offsetX + (ghost.position.x + 0.5) * cell;
    const gy = offsetY + (ghost.position.y + 0.5) * cell;
    const color = ghost.mode === "frightened" ? "#286cff" : ghost.mode === "eaten" ? "#eaf7ff" : ghost.color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = reducedMotion ? 0 : 12;
    ctx.beginPath();
    ctx.arc(gx, gy - cell * 0.04, cell * 0.34, Math.PI, 0);
    ctx.lineTo(gx + cell * 0.34, gy + cell * 0.31);
    ctx.lineTo(gx + cell * 0.17, gy + cell * 0.18);
    ctx.lineTo(gx, gy + cell * 0.31);
    ctx.lineTo(gx - cell * 0.17, gy + cell * 0.18);
    ctx.lineTo(gx - cell * 0.34, gy + cell * 0.31);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#eaf7ff";
    ctx.beginPath(); ctx.arc(gx - cell * 0.12, gy - cell * 0.06, cell * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(gx + cell * 0.12, gy - cell * 0.06, cell * 0.08, 0, Math.PI * 2); ctx.fill();
  });
}

const controlClass =
  "grid size-12 place-items-center rounded-md border border-cyan/60 bg-deepblue/85 font-display text-xl text-cyan transition-colors hover:bg-cyan/20 active:bg-cyan/30";

export function NeonMazeGame({ milestone, reducedMotion, onComplete }: {
  milestone: number;
  reducedMotion: boolean;
  onComplete: (outcome: "won" | "lost") => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const playerRef = React.useRef<Point>({ ...playerSpawn });
  const directionRef = React.useRef<Direction>("left");
  const requestedDirection = React.useRef<Direction>("left");
  const ghostsRef = React.useRef<Ghost[]>(ghostSpawns.slice(0, 4).map((position, personality) => ({
    position: { ...position }, home: { ...position }, direction: personality % 2 ? "right" : "left",
    personality, mode: "chase", color: GHOST_COLORS[personality] ?? "#ff4d78",
  })));
  const pelletsRef = React.useRef(new Set(initialPellets));
  const powerPelletsRef = React.useRef(new Set(initialPowerPellets));
  const tickRef = React.useRef(0);
  const poweredUntilRef = React.useRef(0);
  const safeUntilRef = React.useRef(0);
  const [phase, setPhase] = React.useState<Phase>("ready");
  const [lives, setLives] = React.useState(3);
  const [score, setScore] = React.useState(0);
  const [pelletsLeft, setPelletsLeft] = React.useState(initialPellets.size + initialPowerPellets.size);
  const tempo = Math.min(1.9, 1.18 + milestone * 0.035);
  const tickMs = Math.max(82, 130 - milestone * 2);

  const redraw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) drawMaze(canvas, playerRef.current, directionRef.current, ghostsRef.current, pelletsRef.current, powerPelletsRef.current, tickRef.current, reducedMotion);
  }, [reducedMotion]);

  const steer = React.useCallback((direction: Direction) => {
    requestedDirection.current = direction;
  }, []);

  React.useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const direction = ({ ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" } as Record<string, Direction | undefined>)[event.key];
      if (!direction) return;
      event.preventDefault();
      steer(direction);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [steer]);

  React.useEffect(() => {
    audio.setGenre("chiptune", 0.82);
    audio.setTempoMultiplier(tempo);
    redraw();
    return () => audio.setTempoMultiplier(1);
  }, [redraw, tempo]);

  React.useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;
      const previousPlayer = playerRef.current;
      const requested = move(previousPlayer, requestedDirection.current);
      if (isOpen(requested)) directionRef.current = requestedDirection.current;
      const candidate = move(previousPlayer, directionRef.current);
      const nextPlayer = isOpen(candidate) ? candidate : previousPlayer;
      playerRef.current = nextPlayer;

      const playerKey = keyFor(nextPlayer);
      if (pelletsRef.current.delete(playerKey)) {
        setScore((value) => value + 10);
        audio.play("maze-pellet");
      }
      if (powerPelletsRef.current.delete(playerKey)) {
        setScore((value) => value + 50);
        poweredUntilRef.current = tick + 54;
        ghostsRef.current.forEach((ghost) => { if (ghost.mode !== "eaten") ghost.mode = "frightened"; });
        audio.play("maze-power");
      }

      const previousGhosts = ghostsRef.current.map((ghost) => ({ ...ghost.position }));
      ghostsRef.current.forEach((ghost, index) => {
        if (ghost.mode === "frightened" && tick >= poweredUntilRef.current) ghost.mode = "chase";
        if (ghost.mode === "frightened" && tick % 2 === 1) return;
        ghost.direction = chooseGhostDirection(ghost, nextPlayer, directionRef.current, tick);
        ghost.position = move(ghost.position, ghost.direction);
        if (ghost.mode === "eaten" && samePoint(ghost.position, ghost.home)) ghost.mode = "chase";
        const crossed = samePoint(previousGhosts[index] ?? ghost.position, nextPlayer) && samePoint(ghost.position, previousPlayer);
        if ((samePoint(ghost.position, nextPlayer) || crossed) && tick >= safeUntilRef.current) {
          if (ghost.mode === "frightened") {
            ghost.mode = "eaten";
            setScore((value) => value + 200);
            audio.play("maze-ghost");
          } else if (ghost.mode !== "eaten") {
            setLives((value) => {
              const nextLives = value - 1;
              audio.play(nextLives <= 0 ? "maze-lose" : "maze-hit");
              if (nextLives <= 0) setPhase("lost");
              return nextLives;
            });
            playerRef.current = { ...playerSpawn };
            directionRef.current = "left";
            requestedDirection.current = "left";
            ghostsRef.current.forEach((item) => { item.position = { ...item.home }; item.mode = "chase"; });
            safeUntilRef.current = tick + 12;
          }
        }
      });

      const remaining = pelletsRef.current.size + powerPelletsRef.current.size;
      setPelletsLeft(remaining);
      if (remaining === 0) {
        setPhase("won");
        audio.play("maze-win");
      }
      redraw();
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [phase, redraw, tickMs]);

  const outcomeCopy = phase === "won" ? "MAZE CLEARED" : "SIGNAL LOST";

  return (
    <section className="maze-shell mx-auto w-full max-w-5xl" aria-label="Neon Maze intermission">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-cyan/30 px-4 py-3 font-mono text-xs uppercase tracking-widest">
        <h1 className="font-display text-lg text-cyan text-glow">NEON MAZE</h1>
        <span className="text-amber">Score {score}</span>
        <span className="text-mint">Lives {Math.max(0, lives)}</span>
        <span className="text-magenta">Pellets {pelletsLeft}</span>
        <span className="ml-auto text-muted-foreground">Arrow keys / WASD</span>
      </header>
      <div className="relative overflow-hidden bg-midnight">
        <canvas ref={canvasRef} width={960} height={720} className="block aspect-[4/3] w-full" aria-label={`Cyber maze with ${pelletsLeft} pellets and ${Math.max(0, lives)} lives remaining.`} />
        {phase !== "running" && (
          <div className="absolute inset-0 grid place-items-center bg-midnight/70 p-4 text-center backdrop-blur-[2px]">
            <div>
              <p className={cn("font-display text-2xl sm:text-4xl", phase === "won" ? "text-mint" : "text-cyan")}>{phase === "ready" ? "ENTER THE NEON MAZE" : outcomeCopy}</p>
              <p className="mx-auto mt-2 max-w-md font-mono text-xs uppercase tracking-widest text-moon">
                {phase === "ready" ? "Clear the grid. Power pellets let you capture the ghost programs." : phase === "won" ? "Every signal collected. Flight path restored." : "Run complete. Your trivia score and streak remain intact."}
              </p>
              {phase === "ready" ? (
                <button type="button" className="mt-5 rounded-md border border-cyan bg-cyan/15 px-5 py-3 font-display text-sm text-cyan" onClick={() => { audio.play("maze-start"); setPhase("running"); }}>Start maze run</button>
              ) : (
                <button type="button" className="mt-5 rounded-md border border-mint bg-mint/10 px-5 py-3 font-display text-sm text-mint" onClick={() => onComplete(phase)}>Return to flight deck</button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-cyan/30 px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Power pellets turn ghost programs vulnerable</p>
        <div className="grid shrink-0 grid-cols-3 gap-1" aria-label="Touch maze controls">
          <span /><button type="button" className={controlClass} onClick={() => steer("up")} aria-label="Move up">↑</button><span />
          <button type="button" className={controlClass} onClick={() => steer("left")} aria-label="Move left">←</button>
          <button type="button" className={controlClass} onClick={() => steer("down")} aria-label="Move down">↓</button>
          <button type="button" className={controlClass} onClick={() => steer("right")} aria-label="Move right">→</button>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{phase === "ready" ? "Neon Maze ready" : phase === "running" ? `Neon Maze in progress. ${pelletsLeft} pellets remain.` : outcomeCopy}</p>
    </section>
  );
}