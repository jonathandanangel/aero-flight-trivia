/** Stacked-rect helpers so triangles stay chunky NES pixels. */

export function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function pixelTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  point: "up" | "down" = "up",
) {
  const s = Math.max(4, Math.round(size));
  const rows = Math.max(3, Math.floor(s / 2));
  for (let i = 0; i < rows; i++) {
    const t = point === "up" ? i : rows - 1 - i;
    const w = 2 + t * 2;
    const ox = (s - w) / 2;
    px(ctx, x + ox, y + i * 2, w, 2, color);
  }
}

export function drawTriForce(ctx: CanvasRenderingContext2D, x: number, y: number, piece: number) {
  const gold = "#f8d030";
  pixelTriangle(ctx, x + piece / 2, y, piece, gold, "up");
  pixelTriangle(ctx, x, y + piece * 0.72, piece, gold, "up");
  pixelTriangle(ctx, x + piece, y + piece * 0.72, piece, gold, "up");
}
