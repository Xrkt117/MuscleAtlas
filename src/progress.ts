/** Loaded fraction in [0, 1], or null while the total is unknown. Loaded bytes can exceed Content-Length when the server compresses. */
export const progressFraction = (loaded: number, total: number): number | null =>
  total > 0 ? Math.min(1, loaded / total) : null;
