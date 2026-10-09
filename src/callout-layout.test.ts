import { describe, expect, it } from "vitest";
import { layoutCallouts, type LayoutIn, type Rect } from "./callout-layout";

const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const bounds = { w: 1000, h: 700 };
const obstacle: Rect = { x: 400, y: 100, w: 200, h: 500 }; // centre x = 500
const lab = (x: number, y: number) => ({ x, y, w: 100, h: 20 });
const base = (anchors: LayoutIn["anchors"], extra: Partial<LayoutIn> = {}): LayoutIn => ({ anchors, bounds, obstacle, avoid: [], ...extra });

describe("layoutCallouts", () => {
  it("empty input returns []", () => {
    expect(layoutCallouts(base([]))).toEqual([]);
  });

  it("anchor left of centre -> left label hugging the obstacle", () => {
    const [o] = layoutCallouts(base([lab(450, 300)]));
    expect(o.side).toBe("l");
    expect(o.label.x + o.label.w).toBe(obstacle.x - 16);
    expect(o.label.y).toBe(300 - 10);
    expect(o.from).toEqual({ x: o.label.x + o.label.w, y: 300 });
    expect(o.to).toEqual({ x: 450, y: 300 });
    expect(o.hidden).toBe(false);
  });

  it("anchor right of centre -> right label", () => {
    const [o] = layoutCallouts(base([lab(550, 300)]));
    expect(o.side).toBe("r");
    expect(o.label.x).toBe(obstacle.x + obstacle.w + 16);
    expect(o.from).toEqual({ x: o.label.x, y: 300 });
    expect(o.hidden).toBe(false);
  });

  it("hysteresis keeps prevSide within 12 px of the centre line, flips beyond", () => {
    expect(layoutCallouts(base([lab(508, 300)], { prevSide: ["l"] }))[0].side).toBe("l");
    expect(layoutCallouts(base([lab(492, 300)], { prevSide: ["r"] }))[0].side).toBe("r");
    expect(layoutCallouts(base([lab(520, 300)], { prevSide: ["l"] }))[0].side).toBe("r");
    expect(layoutCallouts(base([lab(480, 300)], { prevSide: ["r"] }))[0].side).toBe("l");
  });

  it("near-equal y anchors get non-overlapping labels in anchor-y order", () => {
    const anchors = [lab(450, 303), lab(440, 300), lab(430, 301), lab(420, 302)];
    const out = layoutCallouts(base(anchors));
    const order = [1, 2, 3, 0]; // by anchor y
    for (let k = 1; k < order.length; k++) {
      const a = out[order[k - 1]].label, b = out[order[k]].label;
      expect(b.y).toBeGreaterThanOrEqual(a.y + a.h + 6);
    }
    expect(out.every((o) => !o.hidden)).toBe(true);
  });

  it("bottom overflow shifts the stack up inside the bounds", () => {
    const anchors = [lab(450, 660), lab(450, 665), lab(450, 670), lab(450, 675)];
    const out = layoutCallouts(base(anchors));
    for (const o of out) {
      expect(o.hidden).toBe(false);
      expect(o.label.y + o.label.h).toBeLessThanOrEqual(bounds.h - 12);
      expect(o.label.y).toBeGreaterThanOrEqual(12);
    }
    for (let k = 1; k < 4; k++) expect(out[k].label.y).toBeGreaterThanOrEqual(out[k - 1].label.y + 26);
  });

  it("a panel covering the ideal column slides the label clear, or hides it when no room", () => {
    const col = { x: 270, y: 280, w: 20, h: 60 }; // overlaps the left end of the label (x 284..384)
    const [slid] = layoutCallouts(base([lab(450, 300)], { avoid: [col] }));
    expect(slid.hidden).toBe(false);
    expect(hit(slid.label, col)).toBe(false);
    expect(hit(slid.label, obstacle)).toBe(false);
    const wide = { x: 200, y: 280, w: 400, h: 60 }; // swallows the gap and the obstacle edge
    expect(layoutCallouts(base([lab(450, 300)], { avoid: [wide] }))[0].hidden).toBe(true);
  });

  it("anchor under a panel or off-screen is hidden", () => {
    const out = layoutCallouts(base([lab(450, 300), lab(-5, 300), lab(450, 900)], { avoid: [{ x: 420, y: 280, w: 60, h: 40 }] }));
    expect(out.map((o) => o.hidden)).toEqual([true, true, true]);
  });

  it("a tiny 300x300 stage hides without throwing", () => {
    const out = layoutCallouts({ anchors: [lab(150, 150), lab(100, 160)], bounds: { w: 300, h: 300 }, obstacle: { x: 60, y: 20, w: 180, h: 260 }, avoid: [{ x: 0, y: 0, w: 300, h: 40 }] });
    expect(out).toHaveLength(2);
    expect(out.every((o) => o.hidden)).toBe(true);
  });

  it("seeded property test: no overlaps, inside bounds, outside obstacle", () => {
    let s = 12345;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    const between = (a: number, b: number) => a + rnd() * (b - a);
    for (let c = 0; c < 200; c++) {
      const b = { w: between(300, 1600), h: between(300, 1000) };
      const ob: Rect = { x: between(0, b.w * 0.6), y: between(0, b.h * 0.5), w: between(50, b.w * 0.4), h: between(50, b.h * 0.5) };
      const avoid: Rect[] = Array.from({ length: Math.floor(rnd() * 3) }, () => ({ x: between(0, b.w), y: between(0, b.h), w: between(20, 300), h: between(20, 300) }));
      const anchors = Array.from({ length: Math.floor(rnd() * 8) }, () => ({ x: between(-20, b.w + 20), y: between(-20, b.h + 20), w: between(30, 180), h: between(14, 32) }));
      const out = layoutCallouts({ anchors, bounds: b, obstacle: ob, avoid });
      expect(out).toHaveLength(anchors.length);
      const shown = out.filter((o) => !o.hidden).map((o) => o.label);
      shown.forEach((l, i) => {
        expect(l.x).toBeGreaterThanOrEqual(0);
        expect(l.y).toBeGreaterThanOrEqual(0);
        expect(l.x + l.w).toBeLessThanOrEqual(b.w);
        expect(l.y + l.h).toBeLessThanOrEqual(b.h);
        expect(hit(l, ob)).toBe(false);
        for (const r of avoid) expect(hit(l, r)).toBe(false);
        for (const m of shown.slice(i + 1)) expect(hit(l, m)).toBe(false);
      });
    }
  });
});
