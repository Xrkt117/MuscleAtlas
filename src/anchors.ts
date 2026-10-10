import * as THREE from "three";

export type Vec3 = { x: number; y: number; z: number };
/** World-space point on the muscle surface plus its outward unit normal. */
export interface Anchor { point: Vec3; normal: Vec3 }

const STRICT = 0.5;
const LOOSE = 0.3;

const MAX_TRIS = 20000; // cap: examine at most this many triangles per mesh (stride sampling) to bound cost

/**
 * Triangle of `g` (world space) that faces `viewDir` and sits nearest the part centroid in the view plane.
 * Face normals are multiplied by sign(det(matrixWorld)): mirrored (negative-scale) parents flip the winding.
 * Allocation-free per triangle: scalar math, two passes over the same sampled triangles.
 */
export function surfaceAnchor(
  g: { position: ArrayLike<number>; index?: ArrayLike<number> | null },
  matrixWorld: THREE.Matrix4,
  viewDir: Vec3,
): Anchor | null {
  const sign = matrixWorld.determinant() < 0 ? -1 : 1;
  const vl = Math.hypot(viewDir.x, viewDir.y, viewDir.z) || 1;
  const vx = viewDir.x / vl, vy = viewDir.y / vl, vz = viewDir.z / vl;
  const e = matrixWorld.elements;
  const pos = g.position, idx = g.index;
  const nTri = idx ? Math.floor(idx.length / 3) : Math.floor(pos.length / 9);
  const stride = Math.max(1, Math.ceil(nTri / MAX_TRIS));
  const w = new Float64Array(9); // world-space a, b, c of the current triangle

  const nrm = new Float64Array(3);
  const load = (t: number): number => {
    for (let v = 0; v < 3; v++) {
      const i = idx ? idx[t * 3 + v] : t * 3 + v;
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      w[v * 3] = e[0] * x + e[4] * y + e[8] * z + e[12];
      w[v * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
      w[v * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
    }
    const ux = w[3] - w[0], uy = w[4] - w[1], uz = w[5] - w[2];
    const wx = w[6] - w[0], wy = w[7] - w[1], wz = w[8] - w[2];
    nrm[0] = uy * wz - uz * wy;
    nrm[1] = uz * wx - ux * wz;
    nrm[2] = ux * wy - uy * wx;
    return nrm[0] * nrm[0] + nrm[1] * nrm[1] + nrm[2] * nrm[2];
  };

  // pass 1: mean of centroids
  let mx = 0, my = 0, mz = 0, count = 0;
  for (let t = 0; t < nTri; t += stride) {
    if (load(t) === 0) continue; // degenerate
    mx += (w[0] + w[3] + w[6]) / 3;
    my += (w[1] + w[4] + w[7]) / 3;
    mz += (w[2] + w[5] + w[8]) / 3;
    count++;
  }
  if (!count) return null;
  mx /= count; my /= count; mz /= count;

  // pass 2: three winners, first minimum wins (strict <); planar = distance perpendicular to the view direction
  let sP = Infinity, lP = Infinity, dBest = -Infinity;
  const sc = [0, 0, 0, 0, 0, 0], lc = [0, 0, 0, 0, 0, 0], dc = [0, 0, 0, 0, 0, 0]; // point xyz + normal xyz
  const put = (o: number[], cx: number, cy: number, cz: number, nx: number, ny: number, nz: number) => {
    o[0] = cx; o[1] = cy; o[2] = cz; o[3] = nx; o[4] = ny; o[5] = nz;
  };
  for (let t = 0; t < nTri; t += stride) {
    const l2 = load(t);
    if (l2 === 0) continue;
    const len = Math.sqrt(l2);
    const nx = (nrm[0] / len) * sign, ny = (nrm[1] / len) * sign, nz = (nrm[2] / len) * sign;
    const d = nx * vx + ny * vy + nz * vz;
    const cx = (w[0] + w[3] + w[6]) / 3, cy = (w[1] + w[4] + w[7]) / 3, cz = (w[2] + w[5] + w[8]) / 3;
    if (d > dBest) { dBest = d; put(dc, cx, cy, cz, nx, ny, nz); }
    if (d > LOOSE) {
      const px = cx - mx, py = cy - my, pz = cz - mz;
      const k = px * vx + py * vy + pz * vz;
      const rx = px - vx * k, ry = py - vy * k, rz = pz - vz * k;
      const p = rx * rx + ry * ry + rz * rz;
      if (p < lP) { lP = p; put(lc, cx, cy, cz, nx, ny, nz); }
      if (d > STRICT && p < sP) { sP = p; put(sc, cx, cy, cz, nx, ny, nz); }
    }
  }
  const r = sP < Infinity ? sc : lP < Infinity ? lc : dc;
  return { point: { x: r[0], y: r[1], z: r[2] }, normal: { x: r[3], y: r[4], z: r[5] } };
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
