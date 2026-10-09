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
