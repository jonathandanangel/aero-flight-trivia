/** Offscreen map-layer cache — redraw static tiles once, blit each frame. */

export function makeLayer(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export type LayerCache = {
  canvas: HTMLCanvasElement;
  key: string;
};

/** Rebuild when key changes; returns the canvas to blit. */
export function ensureLayer(
  cache: { current: LayerCache | null },
  key: string,
  w: number,
  h: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
  if (cache.current && cache.current.key === key) return cache.current.canvas;
  const canvas = makeLayer(w, h);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    paint(ctx);
  }
  cache.current = { canvas, key };
  return canvas;
}
