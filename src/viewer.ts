import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { MUSCLE_BY_ID, MUSCLES } from "./muscle-map";
import { targetAzimuth } from "./camera";
import { muscleIdForNode, nodeNamesFor, sanitize } from "./muscles";

export interface AtlasApi {
  /** Selected muscles red, everything else dimmed. Throws on an unknown muscle id. */
  highlight(ids: string[]): void;
  /** Back to the base material for every mesh. */
  clear(): void;
  /** Animate the camera to frame the muscle (both sides). Throws on an unknown muscle id. */
  focus(id: string): void;
  /** Pointer over a seed muscle (or null) with client coordinates, at most once per frame. Returns an unsubscribe. */
  onHover(cb: (id: string | null, clientX: number, clientY: number) => void): () => void;
  /** Canvas click: id of the seed muscle hit, or null for empty space / unmapped muscle. Returns an unsubscribe. */
  onSelect(cb: (id: string | null) => void): () => void;
}

const FOCUS_MS = 600;
const CLICK_MAX_PX = 4;
const HOVER_MS = 50;  // hover raycasts on a hit measured up to ~0.5 s worst case, median 0.4 ms (misses are cheap)

export async function createViewer(container: HTMLElement): Promise<AtlasApi> {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.5), new THREE.DirectionalLight(0xffffff, 1.5));
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  const controls = new OrbitControls(camera, renderer.domElement);

  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(container);

  const loader = new GLTFLoader();
  const base = import.meta.env.BASE_URL;
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(`${base}draco/`));
  const gltf = await loader.loadAsync(`${base}models/muscles-draco.glb`);

  // Materials are placeholders in the GLB (FINDINGS #2); the viewer owns them. Shared, never disposed.
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xc87f6e, roughness: 0.6 });
  const highlightMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const hoverMaterial = new THREE.MeshStandardMaterial({ color: 0xffc857 });
  const dimMaterial = new THREE.MeshStandardMaterial({ color: 0xc87f6e, roughness: 0.6, transparent: true, opacity: 0.15, depthWrite: false });
  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { meshes.push(o as THREE.Mesh); (o as THREE.Mesh).material = baseMaterial; } });

  // Skeleton is decoration: own group, added first, never in meshes[] / highlight / clear / picking. A load failure throws to main.ts.
  const skeleton = await loader.loadAsync(`${base}models/skeleton-draco.glb`);
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
  const refresh = () => {
    for (const m of meshes) m.material = selected.length ? dimMaterial : baseMaterial;
    const paint = (id: string, material: THREE.Material) => {
      // a node with two primitives loads as a Group, so always traverse
      for (const n of nodesFor(id)) n.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = material; });
    };
    if (hovered && !selected.includes(hovered)) paint(hovered, hoverMaterial);
    for (const id of selected) paint(id, highlightMaterial);
  };

  type Anim = { t0: number; fromAz: number; toAz: number; fromEl: number; toEl: number; fromDist: number; toDist: number; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 };
  let anim: Anim | null = null;
  const offset = new THREE.Vector3();
  let lastHoverRay = 0;
  let pendingMove: { x: number; y: number } | null = null;  // set by pointermove, consumed once per frame
  const hoverListeners = new Set<(id: string | null, x: number, y: number) => void>();
  const setHover = (id: string | null, x: number, y: number) => {
    if (id !== hovered) { hovered = id; refresh(); renderer.domElement.style.cursor = id ? "pointer" : ""; }
    hoverListeners.forEach((cb) => cb(id, x, y));
  };

  const raycaster = new THREE.Raycaster();
  /** Seed muscle id under the pointer, or null. Muscle scene only: the skeleton lives in a separate group, which is what keeps bones unselectable. */
  const pick = (clientX: number, clientY: number): string | null => {
    const r = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), camera);
    const hit = raycaster.intersectObject(gltf.scene, true)[0];
    let id: string | null = null;
    for (let o: THREE.Object3D | null = hit?.object ?? null; o && !id; o = o.parent) id = muscleIdForNode(o.name) ?? null;
    return id;
  };

  renderer.setAnimationLoop(() => {
    if (anim) {
      const k = Math.min((performance.now() - anim.t0) / FOCUS_MS, 1);
      const lerp = (a: number, b: number) => a + (b - a) * k;
      const az = lerp(anim.fromAz, anim.toAz), el = lerp(anim.fromEl, anim.toEl), d = lerp(anim.fromDist, anim.toDist);
      controls.target.lerpVectors(anim.fromTarget, anim.toTarget, k);
      // camera stays on a circle around the target; lerping the position vector would cut through the body
      camera.position.copy(controls.target).add(offset.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(d));
      if (k === 1) anim = null;
      pendingMove = null;
    } else if (pendingMove && performance.now() - lastHoverRay >= HOVER_MS) {
      const { x, y } = pendingMove;
      pendingMove = null;
      lastHoverRay = performance.now();
      setHover(pick(x, y), x, y);
    }
    controls.update();
    renderer.render(scene, camera);
  });

  const listeners = new Set<(id: string | null) => void>();
  let down: { x: number; y: number } | null = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_MAX_PX) return;  // orbit drag, not a click
    down = null;
    const id = pick(e.clientX, e.clientY);
    listeners.forEach((cb) => cb(id));
  });
  renderer.domElement.addEventListener("pointermove", (e) => { if (e.buttons === 0 && !anim) pendingMove = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerleave", (e) => { pendingMove = null; setHover(null, e.clientX, e.clientY); });

  return {
    highlight(ids) {
      ids.forEach(nodesFor);  // validate all ids before touching any material
      selected = [...ids];
      refresh();
    },
    clear() {
      selected = [];
      refresh();
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
        t0: performance.now(), fromAz, toAz: targetAzimuth(fromAz, MUSCLE_BY_ID[id].view),
        fromEl, toEl: THREE.MathUtils.clamp(fromEl, -0.5, 0.8),  // never end looking straight up or down
        fromDist, toDist: dist, fromTarget: controls.target.clone(), toTarget: center,
      };
      if (hovered) setHover(null, 0, 0);  // hover is paused during the animation; don't leave a stale tooltip
    },
    onHover(cb) {
      hoverListeners.add(cb);
      return () => { hoverListeners.delete(cb); };
    },
    onSelect(cb) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
  };
}
