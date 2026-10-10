/**
 * Deliberately ordered high-contrast colours. The first five are reserved for the
 * abdominal layers: rectus, external oblique, internal oblique, transversus and
 * pyramidalis. The remaining colours keep the 24-section forearm map unique.
 */
export const SECTION_COLORS = [
  0x0072b2, // blue
  0xe69f00, // orange
  0x009e73, // green
  0xcc79a7, // purple
  0xf0e442, // yellow
  0x56b4e9, // sky blue
  0xd55e00, // vermilion
  0x332288, // indigo
  0x88ccee, // pale blue
  0x44aa99, // teal
  0x117733, // dark green
  0x999933, // olive
  0xddcc77, // sand
  0xcc6677, // rose
  0x882255, // wine
  0xaa4499, // magenta
  0x661100, // brown
  0x6699cc, // slate blue
  0x888888, // grey
  0x44aa44, // leaf green
  0xdddd77, // pale yellow
  0xaa4466, // mauve
  0x4477aa, // steel blue
  0xee6677, // coral
] as const;

/** High-contrast RGB colour for a zero-based mapped section. */
export function sectionColor(index: number): number {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`Section index must be a non-negative integer: ${index}`);
  }
  const color = SECTION_COLORS[index];
  if (color === undefined) throw new Error(`No section colour configured for index ${index}`);
  return color;
}
