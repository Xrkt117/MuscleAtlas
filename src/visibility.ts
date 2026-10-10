export function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Callout opacity from dot(surface normal, direction to camera): hidden when edge-on or facing away. */
export const facingVisibility = (dot: number): number => smoothstep(0.1, 0.35, dot);
