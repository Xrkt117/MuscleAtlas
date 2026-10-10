export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
export interface LayoutIn {
  /** anchor in px; w,h = measured label size */
  anchors: { x: number; y: number; w: number; h: number }[];
  bounds: { w: number; h: number };
  /** padded projected bbox of the selected muscle */
  obstacle: Rect;
  /** floating panels */
  avoid: Rect[];
  gap?: number;
  margin?: number;
  space?: number;
  prevSide?: ("l" | "r")[];
  /** per anchor; false = not drawn, so it is hidden from the start and takes no room */
  visible?: boolean[];
}
export interface LayoutOut { label: Rect; side: "l" | "r"; from: Pt; to: Pt; hidden: boolean }

const HYST = 12;
const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (p: Pt, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

/** Pure, allocation-light label placement; output order matches `i.anchors`. */
export function layoutCallouts(i: LayoutIn): LayoutOut[] {
  const { anchors, bounds, obstacle, avoid, gap = 16, margin = 12, space = 6, prevSide, visible } = i;
  const cx = obstacle.x + obstacle.w / 2;
  const stage: Rect = { x: 0, y: 0, w: bounds.w, h: bounds.h };

  const out: LayoutOut[] = anchors.map((a, k) => {
    const prev = prevSide?.[k];
    const side: "l" | "r" =
      prev === "l" && a.x <= cx + HYST ? "l" : prev === "r" && a.x >= cx - HYST ? "r" : a.x < cx ? "l" : "r";
    const x = side === "l" ? obstacle.x - gap - a.w : obstacle.x + obstacle.w + gap;
    const label = { x, y: a.y - a.h / 2, w: a.w, h: a.h };
    const hidden = visible?.[k] === false || !inside(a, stage) || avoid.some((r) => inside(a, r));
    return { label, side, from: { x: 0, y: 0 }, to: { x: a.x, y: a.y }, hidden };
  });

  // vertical relaxation per side, among labels whose anchor is usable
  for (const side of ["l", "r"] as const) {
    const col = out.map((o, k) => k).filter((k) => out[k].side === side && !out[k].hidden).sort((p, q) => anchors[p].y - anchors[q].y);
    let top = margin;
    for (const k of col) {
      const l = out[k].label;
      l.y = Math.max(l.y, top);
      top = l.y + l.h + space;
    }
    let limit = bounds.h - margin;
    for (let n = col.length - 1; n >= 0; n--) {
      const l = out[col[n]].label;
      l.y = Math.max(margin, Math.min(l.y, limit - l.h));
      limit = l.y - space;
    }
  }

  const kept: Rect[] = [];
  out.forEach((o) => {
    const l = o.label;
    if (!o.hidden) {
      // slide toward the figure past any panel in the way
      const dir = o.side === "l" ? 1 : -1;
      for (let n = 0; n <= avoid.length; n++) {
        const r = avoid.find((p) => hit(l, p));
        if (!r) break;
        l.x = dir > 0 ? r.x + r.w + space : r.x - space - l.w;
      }
      o.hidden =
        avoid.some((p) => hit(l, p)) ||
        l.x < 0 || l.y < 0 || l.x + l.w > bounds.w || l.y + l.h > bounds.h ||
        hit(l, obstacle) ||
        kept.some((m) => hit(l, m));
      if (!o.hidden) kept.push(l);
    }
    o.from = { x: o.side === "l" ? l.x + l.w : l.x, y: l.y + l.h / 2 };
  });
  return out;
}
