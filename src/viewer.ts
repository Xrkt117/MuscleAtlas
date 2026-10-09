import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { MUSCLES } from "./muscle-map";
import { muscleIdForNode, nodeNamesFor, sanitize } from "./muscles";

export interface AtlasApi {
  /** Selected muscles red, everything else dimmed. Throws on an unknown muscle id. */
  highlight(ids: string[]): void;
  /** Back to the base material for every mesh. */
  clear(): void;
  /** Animate the camera to frame the muscle (both sides). Throws on an unknown muscle id. */
  focus(id: string): void;
  /** Canvas click: id of the seed muscle hit, or null for empty space / unmapped muscle. Returns an unsubscribe. */
  onSelect(cb: (id: string | null) => void): () => void;
}

const FOCUS_MS = 600;
const CLICK_MAX_PX = 4;

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
  const dimMaterial = new THREE.MeshStandardMaterial({ color: 0xc87f6e, roughness: 0.6, transparent: true, opacity: 0.15, depthWrite: false });
  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { meshes.push(o as THREE.Mesh); (o as THREE.Mesh).material = baseMaterial; } });
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

  let anim: { t0: number; fromPos: THREE.Vector3; toPos: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 } | null = null;
  renderer.setAnimationLoop(() => {
    if (anim) {
      const k = Math.min((performance.now() - anim.t0) / FOCUS_MS, 1);
      camera.position.lerpVectors(anim.fromPos, anim.toPos, k);
      controls.target.lerpVectors(anim.fromTarget, anim.toTarget, k);
      if (k === 1) anim = null;
    }
    controls.update();
    renderer.render(scene, camera);
  });

  const listeners = new Set<(id: string | null) => void>();
  const raycaster = new THREE.Raycaster();
  let down: { x: number; y: number } | null = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_MAX_PX) return;  // orbit drag, not a click
    down = null;
    const r = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const hit = raycaster.intersectObject(gltf.scene, true)[0];
    let id: string | null = null;
    for (let o: THREE.Object3D | null = hit?.object ?? null; o && !id; o = o.parent) id = muscleIdForNode(o.name) ?? null;
    listeners.forEach((cb) => cb(id));
  });

  return {
    highlight(ids) {
      const selected = ids.map(nodesFor);  // validate all ids before touching any material
      for (const m of meshes) m.material = dimMaterial;
      // a node with two primitives loads as a Group, so always traverse
      for (const nodes of selected) for (const n of nodes) n.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = highlightMaterial; });
    },
    clear() {
      for (const m of meshes) m.material = baseMaterial;
    },
    focus(id) {
      const nodes = nodesFor(id);
      const b = new THREE.Box3();
      for (const n of nodes) b.expandByObject(n);  // applies world matrices, incl. the negative-scale mirror
      const center = b.getCenter(new THREE.Vector3());
      const dist = (b.getSize(new THREE.Vector3()).length() / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.2;
      const dir = camera.position.clone().sub(controls.target).normalize();  // keep the viewing direction
      anim = { t0: performance.now(), fromPos: camera.position.clone(), toPos: center.clone().addScaledVector(dir, dist), fromTarget: controls.target.clone(), toTarget: center };
    },
    onSelect(cb) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
  };
}
