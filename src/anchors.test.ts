import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { anchorForObject, surfaceAnchor } from "./anchors";

const FRONT = { x: 0, y: 0, z: 1 };
const BACK = { x: 0, y: 0, z: -1 };
const I = new THREE.Matrix4();
const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;

// Closed tetrahedron with outward (CCW from outside) winding, flat position array.
function tetra(indexed: boolean) {
  const V = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  const faces: number[][] = [];
  for (const f of [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]]) {
    const [a, b, c] = f.map((i) => new THREE.Vector3(...(V[i] as [number, number, number])));
    const n = b.clone().sub(a).cross(c.clone().sub(a));
    const centre = a.clone().add(b).add(c).divideScalar(3);
    faces.push(n.dot(centre) > 0 ? f : [f[0], f[2], f[1]]); // origin is inside, so outward n.dot(centroid) > 0
  }
  return indexed
    ? { position: V.flat(), index: faces.flat() }
    : { position: faces.flat().flatMap((i) => V[i]), index: null };
}

describe("surfaceAnchor", () => {
  const tri = { position: [0, 0, 0, 3, 0, 0, 0, 3, 0] }; // CCW seen from +Z

  it("single triangle facing +Z returns centroid and +Z normal", () => {
    const a = surfaceAnchor(tri, I, FRONT)!;
    expect(a.point).toEqual({ x: 1, y: 1, z: 0 });
    expect(a.normal.z).toBeCloseTo(1);
  });

  it("back view picks a back-facing triangle", () => {
    const flipped = { position: [0, 0, 0, 0, 3, 0, 3, 0, 0] };
    expect(surfaceAnchor(tri, I, BACK)!.normal.z).toBeCloseTo(1); // fallback: only candidate
    expect(surfaceAnchor(flipped, I, BACK)!.normal.z).toBeCloseTo(-1);
    const t = tetra(false);
    expect(dot(surfaceAnchor(t, I, BACK)!.normal, BACK)).toBeGreaterThan(0.5);
  });

  it.each([false, true])("mirrored geometry still yields an outward normal (indexed=%s)", (indexed) => {
    const g = tetra(indexed);
    const m = new THREE.Matrix4().makeTranslation(5, 2, 1).multiply(new THREE.Matrix4().makeScale(-1, 1, 1));
    expect(m.determinant()).toBeLessThan(0);
    const a = surfaceAnchor(g, m, FRONT)!;
    const centre = new THREE.Vector3(5, 2, 1); // image of the tetrahedron's centroid (origin)
    const out = { x: a.point.x - centre.x, y: a.point.y - centre.y, z: a.point.z - centre.z };
    expect(dot(a.normal, out)).toBeGreaterThan(0); // outward
    expect(dot(a.normal, FRONT)).toBeGreaterThan(0.5);
  });

  it("indexed and non-indexed agree", () => {
    const a = surfaceAnchor(tetra(true), I, FRONT)!;
    const b = surfaceAnchor(tetra(false), I, FRONT)!;
    expect(a.point.x).toBeCloseTo(b.point.x);
    expect(a.point.y).toBeCloseTo(b.point.y);
    expect(a.point.z).toBeCloseTo(b.point.z);
  });

  it("picks the facing triangle nearest the part centroid in the view plane", () => {
    // two +Z triangles far apart plus one in the middle, offset in z
    const g = { position: [-10, 0, 0, -9, 0, 0, -10, 1, 0, 0, 0, 5, 1, 0, 5, 0, 1, 5, 10, 0, 0, 11, 0, 0, 10, 1, 0] };
    const a = surfaceAnchor(g, I, FRONT)!;
    expect(a.point.z).toBeCloseTo(5);
  });

  it("falls back to a looser threshold (62 degrees off the view)", () => {
    const ang = (62 * Math.PI) / 180; // dot with +Z = 0.47: fails 0.5, passes 0.3
    const [s, c] = [Math.sin(ang), Math.cos(ang)];
    // t1 x t2 = (s, 0, c)
    const g = { position: [0, 0, 0, c, 0, -s, 0, 1, 0] };
    const a = surfaceAnchor(g, I, FRONT)!;
    expect(a).not.toBeNull();
    expect(a.normal.z).toBeCloseTo(c);
    expect(a.normal.z).toBeLessThan(0.5);
  });

  it("still returns the best triangle when nothing faces the view", () => {
    const a = surfaceAnchor({ position: [0, 0, 0, 0, 3, 0, 3, 0, 0] }, I, FRONT)!; // faces -Z
    expect(a.normal.z).toBeCloseTo(-1);
  });

  it("returns null for empty geometry", () => {
    expect(surfaceAnchor({ position: [] }, I, FRONT)).toBeNull();
    expect(surfaceAnchor({ position: [0, 0, 0, 1, 0, 0, 0, 1, 0], index: [] }, I, FRONT)).toBeNull();
  });
});

// Non-indexed N x N grid on z=0 spanning [-1,1]^2, two CCW (+Z) triangles per cell.
function bigPlane(n = 320) {
  const p = new Float32Array(n * n * 18);
  let o = 0;
  const push = (x: number, y: number) => { p[o++] = x; p[o++] = y; p[o++] = 0; };
  const s = 2 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = -1 + i * s, y = -1 + j * s;
    push(x, y); push(x + s, y); push(x + s, y + s);
    push(x, y); push(x + s, y + s); push(x, y + s);
  }
  return { position: p };
}

describe("surfaceAnchor on large meshes", () => {
  const big = bigPlane();

  it("has more than 100000 triangles", () => {
    expect(big.position.length / 9).toBeGreaterThanOrEqual(100000);
  });

  it("finds the centre of a big +Z plane", () => {
    const a = surfaceAnchor(big, I, FRONT)!;
    expect(a.normal.x).toBeCloseTo(0);
    expect(a.normal.y).toBeCloseTo(0);
    expect(a.normal.z).toBeCloseTo(1);
    expect(Math.abs(a.point.x)).toBeLessThan(0.05);
    expect(Math.abs(a.point.y)).toBeLessThan(0.05);
  });

  it("keeps the determinant correction on a big mirrored mesh", () => {
    const m = new THREE.Matrix4().makeScale(-1, 1, 1);
    expect(dot(surfaceAnchor(big, m, FRONT)!.normal, FRONT)).toBeGreaterThan(0);
  });

  it("runs the 100000+ triangle case in under 2000 ms (coarse bound: the stride cap is the real guard, and a tight wall-clock bound flakes on slow or emulated runners)", () => {
    const t0 = performance.now();
    surfaceAnchor(big, I, FRONT);
    const ms = performance.now() - t0;
    console.log(`big surfaceAnchor: ${ms.toFixed(1)} ms`);
    expect(ms).toBeLessThan(2000);
  });
});

describe("anchorForObject", () => {
  it("combines the meshes of a group and honours parent transforms", () => {
    const mk = (z: number) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, z, 1, 0, z, 0, 1, z], 3));
      return new THREE.Mesh(g);
    };
    const grp = new THREE.Group();
    grp.add(mk(0), mk(0));
    const parent = new THREE.Group();
    parent.position.set(10, 0, 0);
    parent.add(grp);
    const a = anchorForObject(grp, FRONT)!;
    expect(a.point.x).toBeCloseTo(10 + 1 / 3);
    expect(a.normal.z).toBeCloseTo(1);
  });

  it("returns null when the object has no meshes", () => {
    expect(anchorForObject(new THREE.Group(), FRONT)).toBeNull();
  });
});
