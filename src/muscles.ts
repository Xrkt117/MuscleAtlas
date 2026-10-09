import { MUSCLES, MUSCLE_BY_ID } from "./muscle-map";

// = THREE.PropertyBinding.sanitizeNodeName (GLTFLoader renames nodes this way)
export const sanitize = (n: string): string => n.replace(/\s/g, "_").replace(/[[\].:/]/g, "");

/** Raw GLB node names ("<base>.l" / "<base>.r") for a muscle id. Throws on unknown id. */
export function nodeNamesFor(id: string): string[] {
  const m = MUSCLE_BY_ID[id];
  if (!m) throw new Error(`Unknown muscle id: ${id}`);
  return m.nodes.flatMap((n) => [`${n}.l`, `${n}.r`]);
}

const idBySanitisedNode = new Map<string, string>(
  MUSCLES.flatMap((m) => m.nodes.flatMap((n) => [`${n}.l`, `${n}.r`].map((s) => [sanitize(s), m.id] as const))),
);

/** Muscle id for a raw or three.js-sanitised node name, or undefined. */
export const muscleIdForNode = (name: string): string | undefined => idBySanitisedNode.get(sanitize(name));

export interface Part { name: string; base: string }

/** "(Abdominal part of x muscle)" -> "Abdominal part of x". */
export const partLabel = (base: string): string => {
  const s = base.replace(/^\((.*)\)$/, "$1").replace(/ muscle$/, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** One part per node; a single-node muscle's part carries the muscle label. Throws on unknown id. */
export function partsFor(id: string): Part[] {
  const m = MUSCLE_BY_ID[id];
  if (!m) throw new Error(`Unknown muscle id: ${id}`);
  return m.nodes.map((base) => ({ name: m.nodes.length > 1 ? partLabel(base) : m.label, base }));
}
