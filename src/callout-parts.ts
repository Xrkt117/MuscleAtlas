/** Indices of the `max` largest sizes (ties: lower index first), in original index order. */
export function pickCalloutParts(sizes: number[], max = 6): number[] {
  const all = sizes.map((_, i) => i);
  if (sizes.length <= max) return all;
  return all.sort((a, b) => sizes[b] - sizes[a] || a - b).slice(0, max).sort((a, b) => a - b);
}
