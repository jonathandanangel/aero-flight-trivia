/** Deterministic mulberry32. Same seed always yields the same puzzle. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickIndex(rng: () => number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(length - 1, Math.floor(rng() * length));
}

export function randomSeed(): number {
  const a = Math.floor(Math.random() * 0xffffffff);
  const b = Date.now() & 0xffffffff;
  return (a ^ (b * 0x9e3779b9)) >>> 0 || 1;
}
