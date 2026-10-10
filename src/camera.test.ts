import { describe, expect, it } from "vitest";
import { easeInOutCubic, scaledDistance, targetAzimuth } from "./camera";

const PI = Math.PI;

describe("targetAzimuth", () => {
  it("keeps the azimuth when already on the muscle's side", () => {
    expect(targetAzimuth(0.2, "front")).toBe(0.2);
    expect(targetAzimuth(3, "back")).toBe(3);
  });

  it("turns the short way round to the back", () => {
    expect(targetAzimuth(0.2, "back")).toBeCloseTo(PI, 10);   // positive way
    expect(targetAzimuth(-0.2, "back")).toBeCloseTo(-PI, 10); // negative way
  });

  it("keeps wrapped azimuths wrapped", () => {
    expect(targetAzimuth(2 * PI + 0.1, "front")).toBe(2 * PI + 0.1);
    expect(targetAzimuth(2 * PI + 0.2, "back")).toBeCloseTo(3 * PI, 10);
  });

  it("turns when exactly 90 degrees off (boundary counts as the wrong side)", () => {
    expect(targetAzimuth(PI / 2, "back")).toBeCloseTo(PI, 10);
    expect(targetAzimuth(PI / 2, "front")).toBeCloseTo(0, 10);
    expect(targetAzimuth(-PI / 2, "front")).toBeCloseTo(0, 10);
    expect(targetAzimuth(-PI / 2, "back")).toBeCloseTo(-PI, 10);
  });

  it("goes the positive way when directly opposite", () => {
    expect(targetAzimuth(0, "back")).toBeCloseTo(PI, 10);
    expect(targetAzimuth(PI, "front")).toBeCloseTo(2 * PI, 10);
  });
});

describe("easeInOutCubic", () => {
  it("hits the endpoints and the midpoint", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 12);
  });

  it("is monotonic on a sample", () => {
    let prev = -1;
    for (let i = 0; i <= 100; i++) { const v = easeInOutCubic(i / 100); expect(v).toBeGreaterThanOrEqual(prev); prev = v; }
  });

  it("clamps outside [0, 1]", () => {
    expect(easeInOutCubic(-0.5)).toBe(0);
    expect(easeInOutCubic(1.5)).toBe(1);
  });
});

describe("scaledDistance", () => {
  it("zooms in and out within the supplied limits", () => {
    expect(scaledDistance(10, 0.8, 2, 20)).toBe(8);
    expect(scaledDistance(10, 1.25, 2, 20)).toBe(12.5);
  });

  it("clamps at both ends of the orbit range", () => {
    expect(scaledDistance(3, 0.5, 2, 20)).toBe(2);
    expect(scaledDistance(18, 2, 2, 20)).toBe(20);
  });
});
