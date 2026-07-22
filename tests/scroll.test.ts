import { describe, it, expect } from "vitest";
import { cameraPoseAt, exhibitProgress } from "../src/lib/scroll";

describe("cameraPoseAt", () => {
  it("is monotonic in z and bounded, clamped to [0,1]", () => {
    const a = cameraPoseAt(0, 100);
    const mid = cameraPoseAt(0.5, 100);
    const b = cameraPoseAt(1, 100);
    expect(a.position[2]).toBeLessThan(mid.position[2]);
    expect(mid.position[2]).toBeLessThan(b.position[2]);
    expect(cameraPoseAt(-1, 100)).toEqual(a); // clamp low
    expect(cameraPoseAt(2, 100)).toEqual(b); // clamp high
  });

  it("looks down the hall (lookAt ahead of position in z)", () => {
    const p = cameraPoseAt(0.3, 100);
    expect(p.lookAt[2]).toBeGreaterThan(p.position[2]);
  });
});

describe("exhibitProgress", () => {
  it("places exhibits evenly, strictly inside (0,1)", () => {
    expect(exhibitProgress(0, 52)).toBeGreaterThan(0);
    expect(exhibitProgress(51, 52)).toBeLessThan(1);
    expect(exhibitProgress(0, 4)).toBeCloseTo(0.125);
    expect(exhibitProgress(3, 4)).toBeCloseTo(0.875);
  });
});
