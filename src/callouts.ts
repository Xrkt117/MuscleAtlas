import type { FrameInfo } from "./viewer";
import { layoutCallouts, type Rect } from "./callout-layout";
import { calloutLabel } from "./callout-parts";
import { MUSCLE_BY_ID } from "./muscle-map";
import { ABDOMINAL_SECTION_STYLES, sectionColor } from "./section-colors";

const NS = "http://www.w3.org/2000/svg";
const SETTLE_MS = 120;

interface Block { box: HTMLDivElement; g: SVGGElement; line: SVGLineElement; dot: SVGCircleElement; w: number; h: number; tx: number; ty: number; x1: number; y1: number; x2: number; y2: number; op: number }

const hex = (c: number) => `#${c.toString(16).padStart(6, "0")}`;

/**
 * One callout per visible part of the selected muscle (colour swatch, part name, leader line, dot) over the stage.
 * Layout reads happen on creation, on resize, when the layer turns on and never per frame.
 */
export function createCallouts(stage: HTMLElement, avoidEls: HTMLElement[]) {
  const layer = document.createElement("div");
  layer.className = "callouts";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "callouts-svg");
  svg.setAttribute("aria-hidden", "true");
  layer.appendChild(svg);
  stage.appendChild(layer);

  let blks: Block[] = [];
  let prevSide: ("l" | "r")[] = [];
  let avoid: Rect[] = [];
  let animUntil = Infinity;  // layer shows once now >= animUntil
  let on = false;
  let shownId: string | null = null;
  let anchors: { x: number; y: number; w: number; h: number }[] = [];
  let vis: boolean[] = [];

  // blocks measure 0x0 while the layer is display:none (under 600 px), so measure again on resize and when the layer turns on
  const measure = () => blks.forEach((b, k) => { b.w = b.box.offsetWidth; b.h = b.box.offsetHeight; if (anchors[k]) { anchors[k].w = b.w; anchors[k].h = b.h; } });
  const readAvoid = () => {
    measure();
    // page rects, not offsetLeft: #side and the chat panel sit inside the fixed #right-col
    const s = stage.getBoundingClientRect();
    avoid = avoidEls.filter((e) => e.offsetWidth > 0).map((e) => { const r = e.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; });
  };
  readAvoid();
  const ro = new ResizeObserver(readAvoid);
  ro.observe(stage);
  avoidEls.forEach((e) => ro.observe(e));
  addEventListener("resize", readAvoid);

  const setOn = (v: boolean) => { if (v !== on) { on = v; layer.classList.toggle("on", v); if (v) measure(); } };
  const set = (el: Element, k: string, v: number) => el.setAttribute(k, String(v));

  const show = (f: FrameInfo | null) => {
    shownId = f ? f.id : null;
    svg.replaceChildren();
    layer.querySelectorAll(".callout").forEach((c) => c.remove());
    blks = []; prevSide = []; anchors = []; vis = [];
    animUntil = Infinity;
    setOn(false);
    if (!f) return;
    const m = MUSCLE_BY_ID[f.id];
    for (const p of f.parts) {
      const g = document.createElementNS(NS, "g");
      const line = document.createElementNS(NS, "line");
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", "3.5");
      g.append(line, dot);
      svg.appendChild(g);
      const box = document.createElement("div");
      box.className = "callout";
      const sw = document.createElement("span");
      sw.className = "callout-sw";
      sw.style.background = hex(f.id === "rectus_abdominis" && ABDOMINAL_SECTION_STYLES[p.index] ? ABDOMINAL_SECTION_STYLES[p.index].color : sectionColor(p.index));
      box.append(sw, calloutLabel(p.name, m.label));
      layer.appendChild(box);
      blks.push({ box, g, line, dot, w: 0, h: 0, tx: NaN, ty: NaN, x1: NaN, y1: NaN, x2: NaN, y2: NaN, op: -1 });
      anchors.push({ x: 0, y: 0, w: 0, h: 0 });
      vis.push(false);
    }
    measure();  // one layout read after creation
  };

  return {
    /** Per-frame hook: rebuilds the callouts when the selection changes, hides them on null. */
    update(f: FrameInfo | null) {
      if (!f) { if (shownId !== null) show(null); return; }
      if (f.id !== shownId) show(f);
      if (!blks.length) return;
      const now = performance.now();
      if (f.animating) animUntil = Infinity;
      else if (animUntil === Infinity) animUntil = now + SETTLE_MS;
      setOn(now >= animUntil);
      for (let k = 0; k < blks.length; k++) {
        const p = f.parts[k], a = anchors[k];
        a.x = p.x; a.y = p.y; vis[k] = p.visibility > 0;
      }
      const out = layoutCallouts({ anchors, visible: vis, bounds: { w: f.width, h: f.height }, obstacle: f.bounds, avoid, prevSide });
      for (let k = 0; k < blks.length; k++) {
        const o = out[k], b = blks[k];
        prevSide[k] = o.side;
        const op = o.hidden ? 0 : Math.round(f.parts[k].visibility * 100) / 100;
        if (op !== b.op) { b.op = op; b.box.style.opacity = String(op); b.box.style.visibility = op === 0 ? "hidden" : ""; b.g.setAttribute("opacity", String(op)); }
        if (o.hidden) continue;
        const tx = Math.round(o.label.x), ty = Math.round(o.label.y);
        if (tx !== b.tx || ty !== b.ty) { b.tx = tx; b.ty = ty; b.box.style.transform = `translate(${tx}px,${ty}px)`; }
        // the leader leaves from the label's near edge, level with its underline
        const x1 = Math.round(o.from.x), y1 = Math.round(o.label.y + b.h), x2 = Math.round(o.to.x), y2 = Math.round(o.to.y);
        if (x1 !== b.x1) { b.x1 = x1; set(b.line, "x1", x1); }
        if (y1 !== b.y1) { b.y1 = y1; set(b.line, "y1", y1); }
        if (x2 !== b.x2) { b.x2 = x2; set(b.line, "x2", x2); set(b.dot, "cx", x2); }
        if (y2 !== b.y2) { b.y2 = y2; set(b.line, "y2", y2); set(b.dot, "cy", y2); }
      }
    },
  };
}
