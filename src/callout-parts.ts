/** Indices of the `max` largest sizes (ties: lower index first), in original index order. */
export function pickCalloutParts(sizes: number[], max = 6): number[] {
  const all = sizes.map((_, i) => i);
  if (sizes.length <= max) return all;
  return all.sort((a, b) => sizes[b] - sizes[a] || a - b).slice(0, max).sort((a, b) => a - b);
}

/**
 * Short readable callout label for a part. "Clavicular head of pectoralis major" -> "Clavicular head" when the tail
 * repeats the muscle's own name; otherwise (forearm muscles) the full name stays. Strips parentheses, ".l/.r", underscores, " muscle".
 */
export function calloutLabel(partName: string, muscleLabel: string): string {
  let s = partName.replace(/[_]+/g, " ").replace(/\.[lr]$/i, "").replace(/^\((.*)\)$/, "$1").replace(/ muscle$/i, "").trim();
  const m = /^(.+?) of (.+)$/i.exec(s);
  if (m && muscleLabel.toLowerCase().includes(m[2].toLowerCase())) s = m[1];
  return s.charAt(0).toUpperCase() + s.slice(1);
}
