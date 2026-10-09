/** Azimuth = atan2(x, z) of the camera offset from the orbit target: 0 is the front (+Z), pi the back. */
export type View = "front" | "back";

/**
 * Azimuth to end at so the muscle's side is visible. Unchanged if already within 90 degrees of it;
 * otherwise current + the shortest signed turn (positive when directly opposite), so the result may leave [-pi, pi]
 * and the animation never swings the long way round. Exactly 90 degrees off counts as the wrong side.
 */
export function targetAzimuth(current: number, view: View): number {
  const wanted = view === "front" ? 0 : Math.PI;
  const tau = 2 * Math.PI;
  let d = (((wanted - current + Math.PI) % tau) + tau) % tau - Math.PI;  // [-pi, pi)
  if (d <= -Math.PI) d = Math.PI;
  return Math.abs(d) < Math.PI / 2 - 1e-9 ? current : current + d;
}

/** Cubic ease-in-out of k, clamped to [0, 1]. */
export function easeInOutCubic(k: number): number {
  const t = Math.min(Math.max(k, 0), 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
