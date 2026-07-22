import { describe, it, expect } from "vitest";
import type { Exhibit, Beat, CameraPose, StatsSource } from "../src/types";

describe("types", () => {
  it("constructs an Exhibit literal", () => {
    const e: Exhibit = {
      id: 52,
      name: "nithat",
      builtOrder: 52,
      issue: "x",
      solves: "y",
      category: "viz",
      isSelf: true,
    };
    expect(e.screenshot).toBeUndefined();
    expect(e.isSelf).toBe(true);
  });

  it("constructs a Beat + CameraPose + StatsSource literal", () => {
    const b: Beat = { id: "numbers", title: "ตัวเลข", body: "...", atProgress: 0.9, totals: { projects: 52 } };
    const p: CameraPose = { position: [0, 1.6, 0], lookAt: [0, 1.6, -1] };
    const s: StatsSource = { asOf: "2026-07-22", live: false };
    expect(b.totals!.projects).toBe(52);
    expect(p.position.length).toBe(3);
    expect(s.live).toBe(false);
  });
});
