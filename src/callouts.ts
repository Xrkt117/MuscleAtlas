import type { FrameInfo } from "./viewer";
import { partsFor } from "./muscles";
import { layoutCallouts, type Rect } from "./callout-layout";

const NS = "http://www.w3.org/2000/svg";
const SETTLE_MS = 120;

interface Item { chip: HTMLElement; g: SVGGElement; line: SVGLineElement; dot: SVGCircleElement; w: number; h: number; tx: number; ty: number; x1: number; y1: number; x2: number; y2: number; op: number }

/** Leader-line callouts over the stage. Layout reads happen on resize only, never per frame. */
export function createCallouts(stage: HTMLElement, avoidEls: HTMLElement[]) {
  const layer = document.createElement("div");
  layer.className = "callouts";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "callouts-svg");
  svg.setAttribute("aria-hidden", "true");
  layer.appendChild(svg);
  stage.appendChild(layer);

  let items: Item[] = [];
  let prevSide: ("l" | "r")[] = [];
  let avoid: Rect[] = [];
  let animUntil = Infinity;  // layer shows once now >= animUntil
  let on = false;
  let shownId: string | null = null;

  // chips measure 0x0 while the layer is display:none (under 600 px), so measure again on resize and when the layer turns on
  const measure = () => items.forEach((it) => { it.w = it.chip.offsetWidth; it.h = it.chip.offsetHeight; });
  const readAvoid = () => {
    measure();
    avoid = avoidEls.filter((e) => e.offsetWidth > 0).map((e) => ({ x: e.offsetLeft - stage.offsetLeft, y: e.offsetTop - stage.offsetTop, w: e.offsetWidth, h: e.offsetHeight }));
  };
  readAvoid();
  const ro = new ResizeObserver(readAvoid);
  ro.observe(stage);
  avoidEls.forEach((e) => ro.observe(e));
  addEventListener("resize", readAvoid);

  const setOn = (v: boolean) => { if (v !== on) { on = v; layer.classList.toggle("on", v); if (v) measure(); } };
  const set = (el: Element, k: string, v: number) => el.setAttribute(k, String(v));

  const show = (id: string | null) => {
    shownId = id;
    svg.replaceChildren();
    layer.querySelectorAll(".callout").forEach((c) => c.remove());
    items = []; prevSide = [];
    animUntil = Infinity;
    setOn(false);
    if (id === null) return;
    const parts = partsFor(id);
    const made = parts.map((p) => {
      const g = document.createElementNS(NS, "g");
      const line = document.createElementNS(NS, "line");
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", "4");
      g.append(line, dot);
      svg.appendChild(g);
      const chip = document.createElement("div");
      chip.className = "callout";
      chip.textContent = p.name;
      layer.appendChild(chip);
      return { chip, g, line, dot };
    });
    items = made.map((m) => ({ ...m, w: 0, h: 0, tx: NaN, ty: NaN, x1: NaN, y1: NaN, x2: NaN, y2: NaN, op: -1 }));
    measure();  // one layout read after creation
  };

  return {
    /** Per-frame hook: rebuilds the chips when the selection changes, hides them on null. */
    update(f: FrameInfo | null) {
      if (!f) { if (shownId !== null) show(null); return; }
      if (f.id !== shownId) show(f.id);
      const n = Math.min(items.length, f.parts.length);  // never index past the frame's parts
      if (!n) return;
      const now = performance.now();
      if (f.animating) animUntil = Infinity;
      else if (animUntil === Infinity) animUntil = now + SETTLE_MS;
      setOn(now >= animUntil);
      const out = layoutCallouts({
        anchors: items.slice(0, n).map((it, i) => ({ x: f.parts[i].x, y: f.parts[i].y, w: it.w, h: it.h })),
        visible: items.slice(0, n).map((_, i) => f.parts[i].visibility > 0),
        bounds: { w: f.width, h: f.height },
        obstacle: f.bounds,
        avoid,
        prevSide,
      });
      out.forEach((o, i) => {
        const it = items[i];
        prevSide[i] = o.side;
        const op = o.hidden ? 0 : Math.round(f.parts[i].visibility * 100) / 100;
        if (op !== it.op) { it.op = op; it.chip.style.opacity = String(op); it.g.setAttribute("opacity", String(op)); }
        if (o.hidden) return;
        const tx = Math.round(o.label.x), ty = Math.round(o.label.y);
        if (tx !== it.tx || ty !== it.ty) { it.tx = tx; it.ty = ty; it.chip.style.transform = `translate(${tx}px,${ty}px)`; }
        const x1 = Math.round(o.from.x), y1 = Math.round(o.from.y), x2 = Math.round(o.to.x), y2 = Math.round(o.to.y);
        if (x1 !== it.x1) { it.x1 = x1; set(it.line, "x1", x1); }
        if (y1 !== it.y1) { it.y1 = y1; set(it.line, "y1", y1); }
        if (x2 !== it.x2) { it.x2 = x2; set(it.line, "x2", x2); set(it.dot, "cx", x2); }
        if (y2 !== it.y2) { it.y2 = y2; set(it.line, "y2", y2); set(it.dot, "cy", y2); }
      });
    },
  };
}
