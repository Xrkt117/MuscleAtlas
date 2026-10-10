const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;
const LIGHTNESSES = [0.48, 0.6, 0.54] as const;

export interface SectionHsl {
  hue: number;
  saturation: number;
  lightness: number;
}

/** Deterministic, visually separated highlight colour for a zero-based group section. */
export function sectionHsl(index: number): SectionHsl {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`Section index must be a non-negative integer: ${index}`);
  }
  return {
    hue: (index * GOLDEN_RATIO_CONJUGATE) % 1,
    saturation: 0.78,
    lightness: LIGHTNESSES[index % LIGHTNESSES.length],
  };
}
