import * as THREE from "three";

export type Vec3 = { x: number; y: number; z: number };
/** World-space point on the muscle surface plus its outward unit normal. */
export interface Anchor { point: Vec3; normal: Vec3 }

const STRICT = 0.5;
const LOOSE = 0.3;

/**
 * Triangle of `g` (world space) that faces `viewDir` and sits nearest the part centroid in the view plane.
 * Face normals are multiplied by sign(det(matrixWorld)): mirrored (negative-scale) parents flip the winding.
 */
export function surfaceAnchor(
  g: { position: ArrayLike<number>; index?: ArrayLike<number> | null },
  matrixWorld: THREE.Matrix4,
  viewDir: Vec3,
): Anchor | null {
  const sign = matrixWorld.determinant() < 0 ? -1 : 1;
  const view = new THREE.Vector3(viewDir.x, viewDir.y, viewDir.z).normalize();
  const nTri = g.index ? Math.floor(g.index.length / 3) : Math.floor(g.position.length / 9);
  const vtx = (i: number) => new THREE.Vector3(g.position[i * 3], g.position[i * 3 + 1], g.position[i * 3 + 2]).applyMatrix4(matrixWorld);
  const tris: { c: THREE.Vector3; n: THREE.Vector3; d: number }[] = [];
  const mean = new THREE.Vector3();
  for (let t = 0; t < nTri; t++) {
    const [i, j, k] = g.index ? [g.index[t * 3], g.index[t * 3 + 1], g.index[t * 3 + 2]] : [t * 3, t * 3 + 1, t * 3 + 2];
    const a = vtx(i), b = vtx(j), c = vtx(k);
    const n = b.clone().sub(a).cross(c.clone().sub(a));
    if (n.lengthSq() === 0) continue; // degenerate
    n.normalize().multiplyScalar(sign);
    const cen = a.add(b).add(c).divideScalar(3);
    tris.push({ c: cen, n, d: n.dot(view) });
    mean.add(cen);
  }
  if (!tris.length) return null;
  mean.divideScalar(tris.length);

  // distance to the part centroid measured perpendicular to the view direction
  const planar = (p: THREE.Vector3) => {
    const d = p.clone().sub(mean);
    return d.sub(view.clone().multiplyScalar(d.dot(view))).lengthSq();
  };
  let pool = tris.filter((t) => t.d > STRICT);
  if (!pool.length) pool = tris.filter((t) => t.d > LOOSE);
  const best = pool.length
    ? pool.reduce((p, q) => (planar(q.c) < planar(p.c) ? q : p))
    : tris.reduce((p, q) => (q.d > p.d ? q : p));
  return { point: { x: best.c.x, y: best.c.y, z: best.c.z }, normal: { x: best.n.x, y: best.n.y, z: best.n.z } };
}

/** Anchor for a node (a node with several primitives is a Group): per-mesh anchors, nearest to their mean wins. */
export function anchorForObject(obj: THREE.Object3D, viewDir: Vec3): Anchor | null {
  obj.updateWorldMatrix(true, true);
  const cands: Anchor[] = [];
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const geo = m.geometry;
    const a = surfaceAnchor({ position: geo.attributes.position.array, index: geo.index?.array }, m.matrixWorld, viewDir);
    if (a) cands.push(a);
  });
  return cands.length ? nearestToMean(cands) : null;
}

function nearestToMean(c: Anchor[]): Anchor {
  const mean = c.reduce((s, a) => s.add(new THREE.Vector3(a.point.x, a.point.y, a.point.z)), new THREE.Vector3()).divideScalar(c.length);
  const dist = (a: Anchor) => new THREE.Vector3(a.point.x, a.point.y, a.point.z).distanceToSquared(mean);
  return c.reduce((p, q) => (dist(q) < dist(p) ? q : p));
}
