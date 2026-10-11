import { MUSCLES } from "./muscle-map";

/** Part ids for GPU picking: one flat id per GLB node (a muscle's part), 1-based, stored in the red channel. 0 = background / unmapped. */
export const MAX_PART_IDS = 255;

export interface PartRef { muscleId: string; partIndex: number }

const refs: PartRef[] = MUSCLES.flatMap((m) => m.nodes.map((_, partIndex) => ({ muscleId: m.id, partIndex })));
const idOf = new Map<string, number>(refs.map((r, i) => [`${r.muscleId}:${r.partIndex}`, i + 1]));
if (refs.length > MAX_PART_IDS) throw new Error(`${refs.length} parts do not fit in one colour channel (max ${MAX_PART_IDS})`);

export const PART_COUNT = refs.length;

/** Pick id (1..PART_COUNT) of a muscle's part. Throws on an unknown muscle or part. */
export function partId(muscleId: string, partIndex: number): number {
  const id = idOf.get(`${muscleId}:${partIndex}`);
  if (id === undefined) throw new Error(`Unknown part: ${muscleId} #${partIndex}`);
  return id;
}

/** Red-channel value (0..1) to render a part id with; exact after 8-bit quantisation. */
export const encodeRed = (id: number): number => id / 255;

/** Pick id read back from the red byte -> muscle and part, or null for background (0) and out-of-range ids. */
export function decodePartId(id: number): PartRef | null {
  return Number.isInteger(id) && id >= 1 && id <= refs.length ? refs[id - 1] : null;
}
