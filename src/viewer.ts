import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { MUSCLE_BY_ID, MUSCLES } from "./muscle-map";
import { easeInOutCubic, targetAzimuth } from "./camera";
import { muscleIdForNode, nodeNamesFor, partsFor, sanitize } from "./muscles";
import { anchorForObject } from "./anchors";
import { facingVisibility } from "./visibility";
import { progressFraction } from "./progress";

/** Per-frame projection of the selected muscle. One object, reused: valid only inside the callback. */
export interface FrameInfo {
  /** the selected muscle (first of highlight()'s ids) */
  id: string;
  width: number;
  height: number;
  animating: boolean;
  /** padded projected bbox of the selected muscle (both sides), CSS px */
  bounds: { x: number; y: number; w: number; h: number };
  /** one per partsFor(selected[0]), same order */
  parts: { x: number; y: number; visibility: number }[];
}

export interface AtlasApi {
  /** Selected muscles red, everything else dimmed. Throws on an unknown muscle id. */
  highlight(ids: string[]): void;
  /** Back to the base material for every mesh. */
  clear(): void;
  /** Animate the camera to frame the muscle (both sides). Throws on an unknown muscle id. */
  focus(id: string): void;
  /** Sidebar preview: same hover highlight as the pointer, but ignored while the pointer is on the canvas. null clears it. */
  preview(id: string | null): void;
  /** Pointer over a seed muscle (or null) with client coordinates, at most once per frame. Returns an unsubscribe. */
  onHover(cb: (id: string | null, clientX: number, clientY: number) => void): () => void;
  /** Canvas click: id of the seed muscle hit, or null for empty space / unmapped muscle. Returns an unsubscribe. */
  onSelect(cb: (id: string | null) => void): () => void;
  /** After each render while a muscle is selected (and once with null when the selection clears). Returns an unsubscribe. */
  onFrame(cb: (f: FrameInfo | null) => void): () => void;
}

const FOCUS_MS = 600;
const BOUNDS_PAD = 12;
const CLICK_MAX_PX = 4;
const HOVER_MS = 50;

/** onProgress gets the combined loaded fraction of both GLBs, or null while a total is unknown. Resolves after the first rendered frame. */
export async function createViewer(container: HTMLElement, onProgress?: (fraction: number | null) => void): Promise<AtlasApi> {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.5), new THREE.DirectionalLight(0xffffff, 1.5));
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  const controls = new OrbitControls(camera, renderer.domElement);

  let cssW = 1, cssH = 1;
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    cssW = renderer.domElement.clientWidth || w;
    cssH = renderer.domElement.clientHeight || h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(container);

  const loader = new GLTFLoader();
  const base = import.meta.env.BASE_URL;
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(`${base}draco/`));
  const bytes = [{ loaded: 0, total: 0 }, { loaded: 0, total: 0 }];
  const track = (i: number) => (e: ProgressEvent) => {
    bytes[i] = { loaded: e.loaded, total: e.total };
    const total = bytes[0].total + bytes[1].total;
    onProgress?.(bytes.every((b) => b.total > 0) ? progressFraction(bytes[0].loaded + bytes[1].loaded, total) : null);
  };
  // both files load at once; a failure in either rejects to main.ts
  const [gltf, skeleton] = await Promise.all([
    loader.loadAsync(`${base}models/muscles-draco.glb`, track(0)),
    loader.loadAsync(`${base}models/skeleton-draco.glb`, track(1)),
  ]);

  // Materials are placeholders in the GLB (FINDINGS #2); the viewer owns them. Shared, never disposed.
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xc87f6e, roughness: 0.6 });
  const highlightMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const hoverMaterial = new THREE.MeshStandardMaterial({ color: 0xffc857 });
  const dimMaterial = new THREE.MeshStandardMaterial({ color: 0xc87f6e, roughness: 0.6, transparent: true, opacity: 0.15, depthWrite: false });
  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { meshes.push(o as THREE.Mesh); (o as THREE.Mesh).material = baseMaterial; } });

  // Skeleton is decoration: own group, added first, never in meshes[] / highlight / clear / picking. A load failure throws to main.ts.
  const boneMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e0cc, roughness: 0.8 });
  skeleton.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = boneMaterial; });
  const skeletonGroup = new THREE.Group();
  skeletonGroup.add(skeleton.scene);
  scene.add(skeletonGroup);
  scene.add(gltf.scene);

  const box = new THREE.Box3().setFromObject(gltf.scene);
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  controls.target.copy(c);
  camera.position.set(c.x, c.y, c.z + size.y * 1.8);  // front view (+Z) after Blender's Y-up conversion

  // muscle id -> node objects, looked up by three.js-sanitised name. A missing node means the map and GLB disagree.
  const nodesById = new Map<string, THREE.Object3D[]>();
  for (const m of MUSCLES) {
    nodesById.set(m.id, nodeNamesFor(m.id).map((name) => {
      const obj = gltf.scene.getObjectByName(sanitize(name));
      if (!obj) throw new Error(`Node "${name}" (muscle ${m.id}) not found in the model`);
      return obj;
    }));
  }
  const nodesFor = (id: string): THREE.Object3D[] => {
    const nodes = nodesById.get(id);
    if (!nodes) throw new Error(`Unknown muscle id: ${id}`);
    return nodes;
  };

  // Selection and hover are state; refresh() is the only place materials are assigned.
  let selected: string[] = [];
  let hovered: string | null = null;
  // one throwing listener must not end setAnimationLoop (three.js does not request the next frame after a throw)
  const guard = (fn: () => void) => { try { fn(); } catch (err) { console.error(err); } };
  const refresh = () => {
    for (const m of meshes) m.material = selected.length ? dimMaterial : baseMaterial;
    const paint = (id: string, material: THREE.Material) => {
      // a node with two primitives loads as a Group, so always traverse
      for (const n of nodesFor(id)) n.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = material; });
    };
    if (hovered && !selected.includes(hovered)) paint(hovered, hoverMaterial);
    for (const id of selected) paint(id, highlightMaterial);
  };

  type Anim = { t0: number; ms: number; fromAz: number; toAz: number; fromEl: number; toEl: number; fromDist: number; toDist: number; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 };
  let anim: Anim | null = null;
  const offset = new THREE.Vector3();
  let lastHoverRay = 0;
  let pointerOnCanvas = false;
  let pendingMove: { x: number; y: number } | null = null;  // set by pointermove, consumed once per frame
  const hoverListeners = new Set<(id: string | null, x: number, y: number) => void>();
  const setHover = (id: string | null, x: number, y: number) => {
    if (id !== hovered) { hovered = id; refresh(); renderer.domElement.style.cursor = id ? "pointer" : ""; }
    hoverListeners.forEach((cb) => guard(() => cb(id, x, y)));
  };

  // GPU picking: a raycast against ~1M vertices with no BVH stalled frames (measured under Rosetta, ADR 0006). Instead render the muscles once into a
  // 1x1 target through a view offset, each mesh flat-coloured with its muscle index+1 in the red channel (0 = background/unmapped).
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, format: THREE.RGBAFormat });
  const idMaterials = MUSCLES.map((_, i) => new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB((i + 1) / 255, 0, 0, THREE.LinearSRGBColorSpace) }));
  const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });  // unmapped muscles still occlude
  const muscleIndexOf = new Map<THREE.Mesh, number>();
  for (const m of meshes) {
    let id: string | undefined;
    for (let o: THREE.Object3D | null = m; o && !id; o = o.parent) id = muscleIdForNode(o.name);
    muscleIndexOf.set(m, id ? MUSCLES.findIndex((x) => x.id === id) : -1);
  }
  const pixel = new Uint8Array(4);
  /** Seed muscle id under the pointer, or null. The skeleton is hidden while picking, which is what keeps bones unselectable. */
  const pick = (clientX: number, clientY: number, warmUp = false): string | null => {
    const r = renderer.domElement.getBoundingClientRect();
    const fullW = renderer.domElement.width, fullH = renderer.domElement.height;
    const px = Math.floor(((clientX - r.left) / r.width) * fullW), py = Math.floor(((clientY - r.top) / r.height) * fullH);
    if (px < 0 || py < 0 || px >= fullW || py >= fullH) return null;
    for (const m of meshes) { const i = muscleIndexOf.get(m)!; m.material = i < 0 ? blackMaterial : idMaterials[i]; }
    skeletonGroup.visible = false;
    if (!warmUp) camera.setViewOffset(fullW, fullH, px, py, 1, 1);  // warm-up renders the whole view so every mesh gets its GPU state
    const prevColor = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha();
    try {
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.readRenderTargetPixels(target, 0, 0, 1, 1, pixel);
    } finally {
      camera.clearViewOffset();
      renderer.setRenderTarget(null);
      renderer.setClearColor(prevColor, prevAlpha);
      skeletonGroup.visible = true;
      refresh();
    }
    return pixel[0] ? MUSCLES[pixel[0] - 1].id : null;
  };

  // Callout anchors: per muscle, per side, one surface anchor per part (cached; the model never moves).
  interface SideAnchors { points: THREE.Vector3[]; normals: THREE.Vector3[]; mean: THREE.Vector3 }
  interface MuscleAnchors { sides: [SideAnchors, SideAnchors]; box: THREE.Box3 }
  const anchorCache = new Map<string, MuscleAnchors>();
  const anchorsFor = (id: string): MuscleAnchors => {
    let a = anchorCache.get(id);
    if (a) return a;
    const nodes = nodesFor(id), viewDir = MUSCLE_BY_ID[id].view === "back" ? { x: 0, y: 0, z: -1 } : { x: 0, y: 0, z: 1 };
    const n = partsFor(id).length;
    const side = (k: number): SideAnchors => {
      const sa: SideAnchors = { points: [], normals: [], mean: new THREE.Vector3() };
      for (let i = 0; i < n; i++) {
        const an = anchorForObject(nodes[2 * i + k], viewDir);
        if (!an) throw new Error(`No surface anchor for ${id} part ${i}`);
        sa.points.push(new THREE.Vector3(an.point.x, an.point.y, an.point.z));
        sa.normals.push(new THREE.Vector3(an.normal.x, an.normal.y, an.normal.z));
        sa.mean.add(sa.points[i]);
      }
      sa.mean.divideScalar(n);
      return sa;
    };
    const box = new THREE.Box3();
    for (const nd of nodes) box.expandByObject(nd);
    a = { sides: [side(0), side(1)], box };
    anchorCache.set(id, a);
    return a;
  };

  // onFrame state. Everything below is reused every frame (no allocation).
  const frameListeners = new Set<(f: FrameInfo | null) => void>();
  const callFrame = (cb: (f: FrameInfo | null) => void, f: FrameInfo | null) => { try { cb(f); } catch (err) { console.error(err); } };  // no closure per frame
  const frame: FrameInfo = { id: "", width: 1, height: 1, animating: false, bounds: { x: 0, y: 0, w: 0, h: 0 }, parts: [] };
  let frameAnchors: MuscleAnchors | null = null, frameSide = 0, emitNull = false;
  const pv = new THREE.Vector3(), toCam = new THREE.Vector3(), fwd = new THREE.Vector3(), corner = new THREE.Vector3();
  const emitFrame = () => {
    if (!frameListeners.size) return;
    if (!frameAnchors) {
      if (emitNull) { emitNull = false; frameListeners.forEach((cb) => callFrame(cb, null)); }
      return;
    }
    const A = frameAnchors, cp = camera.position;
    const d0 = A.sides[0].mean.distanceTo(cp), d1 = A.sides[1].mean.distanceTo(cp);
    if (anim) {  // settling: nearer side; when about equal (head-on view) the screen-left limb, where the label column has room
      frameSide = Math.max(d0, d1) < Math.min(d0, d1) * 1.15
        ? (pv.copy(A.sides[0].mean).project(camera).x <= pv.copy(A.sides[1].mean).project(camera).x ? 0 : 1)
        : (d0 <= d1 ? 0 : 1);
    } else if ((frameSide === 0 ? d1 < d0 * 0.85 : d0 < d1 * 0.85)) frameSide = 1 - frameSide;  // hysteresis
    const S = A.sides[frameSide];
    frame.width = cssW; frame.height = cssH; frame.animating = anim !== null;
    camera.getWorldDirection(fwd);
    for (let i = 0; i < S.points.length; i++) {
      const p = S.points[i], out = frame.parts[i];
      toCam.subVectors(cp, p);
      const behind = toCam.dot(fwd) >= 0;  // point is behind the camera plane
      const dot = S.normals[i].dot(toCam.normalize());
      pv.copy(p).project(camera);
      out.x = (pv.x + 1) / 2 * cssW; out.y = (1 - pv.y) / 2 * cssH;
      const outside = pv.x < -1 || pv.x > 1 || pv.y < -1 || pv.y > 1;
      out.visibility = behind || outside ? 0 : facingVisibility(dot);
    }
    const bb = A.box;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let c = 0; c < 8; c++) {
      corner.set(c & 1 ? bb.max.x : bb.min.x, c & 2 ? bb.max.y : bb.min.y, c & 4 ? bb.max.z : bb.min.z).project(camera);
      const x = (corner.x + 1) / 2 * cssW, y = (1 - corner.y) / 2 * cssH;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    frame.bounds.x = x0 - BOUNDS_PAD; frame.bounds.y = y0 - BOUNDS_PAD;
    frame.bounds.w = x1 - x0 + 2 * BOUNDS_PAD; frame.bounds.h = y1 - y0 + 2 * BOUNDS_PAD;
    frameListeners.forEach((cb) => callFrame(cb, frame));
  };

  // All anchors now, behind the loading overlay: ~15 ms in native arm64 Chrome. Under x64 Chrome on Rosetta (e.g. launched
  // by an x64 Node test harness) the cold JIT is far slower; see ADR 0006.
  scene.updateMatrixWorld(true);
  for (const m of MUSCLES) anchorsFor(m.id);

  // Warm-up. One full-view pick now: it uploads the geometry and binds every mesh to the id program, work the first frame needs anyway.
  // The first partial picks are slow, then fast (measured under Rosetta, ADR 0006), so spend them in the loop below,
  // one per idle frame, instead of making the page load wait for them.
  const centre = () => { const r = renderer.domElement.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] as const; };
  pick(...centre(), true);
  let warmPicks = 9;
  renderer.setAnimationLoop(() => {
    if (anim) {
      const raw = Math.min((performance.now() - anim.t0) / anim.ms, 1), k = easeInOutCubic(raw);
      const lerp = (a: number, b: number) => a + (b - a) * k;
      const az = lerp(anim.fromAz, anim.toAz), el = lerp(anim.fromEl, anim.toEl), d = lerp(anim.fromDist, anim.toDist);
      controls.target.lerpVectors(anim.fromTarget, anim.toTarget, k);
      // camera stays on a circle around the target; lerping the position vector would cut through the body
      camera.position.copy(controls.target).add(offset.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(d));
      if (raw === 1) anim = null;
      pendingMove = null;
    } else if (!pendingMove && warmPicks > 0) {
      warmPicks--;
      pick(...centre());
    } else if (pendingMove && performance.now() - lastHoverRay >= HOVER_MS) {
      const { x, y } = pendingMove;
      pendingMove = null;
      lastHoverRay = performance.now();
      setHover(pick(x, y), x, y);
    }
    controls.update();
    renderer.render(scene, camera);
    emitFrame();
  });

  const listeners = new Set<(id: string | null) => void>();
  let down: { x: number; y: number } | null = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_MAX_PX) return;  // orbit drag, not a click
    down = null;
    const id = pick(e.clientX, e.clientY);
    listeners.forEach((cb) => guard(() => cb(id)));
  });
  renderer.domElement.addEventListener("pointermove", (e) => { if (e.buttons === 0 && !anim) pendingMove = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerenter", () => { pointerOnCanvas = true; });
  renderer.domElement.addEventListener("pointerleave", (e) => { pointerOnCanvas = false; pendingMove = null; setHover(null, e.clientX, e.clientY); });

  await new Promise(requestAnimationFrame);  // the loop above has rendered its first frame by now

  return {
    highlight(ids) {
      ids.forEach(nodesFor);  // validate all ids before touching any material
      selected = [...ids];
      refresh();
      if (ids.length) {
        frameAnchors = anchorsFor(ids[0]);
        frame.id = ids[0];
        const n = frameAnchors.sides[0].points.length;
        frame.parts = Array.from({ length: n }, () => ({ x: 0, y: 0, visibility: 0 }));
        const c = camera.position;  // initial side: nearer one, no hysteresis
        frameSide = frameAnchors.sides[0].mean.distanceTo(c) <= frameAnchors.sides[1].mean.distanceTo(c) ? 0 : 1;
      } else if (frameAnchors) { frameAnchors = null; emitNull = true; }
    },
    clear() {
      selected = [];
      refresh();
      if (frameAnchors) { frameAnchors = null; emitNull = true; }
    },
    focus(id) {
      const nodes = nodesFor(id);
      const b = new THREE.Box3();
      for (const n of nodes) b.expandByObject(n);  // applies world matrices, incl. the negative-scale mirror
      const center = b.getCenter(new THREE.Vector3());
      const dist = (b.getSize(new THREE.Vector3()).length() / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.2;
      const off = camera.position.clone().sub(controls.target);
      const fromDist = off.length(), fromAz = Math.atan2(off.x, off.z), fromEl = Math.asin(off.y / fromDist);
      anim = {
        t0: performance.now(), ms: matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : FOCUS_MS /* 1, not 0: the loop divides by it */, fromAz, toAz: targetAzimuth(fromAz, MUSCLE_BY_ID[id].view),
        fromEl, toEl: THREE.MathUtils.clamp(fromEl, -0.5, 0.8),  // never end looking straight up or down
        fromDist, toDist: dist, fromTarget: controls.target.clone(), toTarget: center,
      };
      if (hovered) setHover(null, 0, 0);  // hover is paused during the animation; don't leave a stale tooltip
    },
    preview(id) {
      if (pointerOnCanvas || id === hovered) return;
      if (id) nodesFor(id);  // validate
      hovered = id;
      refresh();  // no hover listeners: the tooltip is pointer-only
    },
    onHover(cb) {
      hoverListeners.add(cb);
      return () => { hoverListeners.delete(cb); };
    },
    onSelect(cb) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
    onFrame(cb) {
      frameListeners.add(cb);
      return () => { frameListeners.delete(cb); };
    },
  };
}
