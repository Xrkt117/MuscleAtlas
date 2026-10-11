/** Dataset muscle-group names for display: trimmed, first letter capitalised, duplicates (case-insensitive) dropped. */
export function datasetGroups(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const n = raw.trim();
    if (!n || seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    out.push(n[0].toUpperCase() + n.slice(1));
  }
  return out;
}
