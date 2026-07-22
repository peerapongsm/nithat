import { describe, it, expect } from "vitest";
import { loadExhibits, mergeStats } from "../src/lib/data";

describe("data merge + fallback", () => {
  it("mergeStats orders by builtOrder and marks #52 as self", () => {
    const ex = mergeStats(
      [{ id: 52, name: "nithat", builtOrder: 52 }, { id: 1, name: "A", builtOrder: 1 }] as any,
      [{ id: 1, visitors: 100 }, { id: 52, visitors: 0 }] as any
    );
    expect(ex.map((e) => e.builtOrder)).toEqual([1, 52]);
    expect(ex.find((e) => e.id === 52)!.isSelf).toBe(true);
    expect(ex[0]!.visitors).toBe(100);
  });

  it("maps real summary shape (web.visitors / downloads) and slug screenshots", () => {
    const ex = mergeStats(
      [{ id: 3, name: "B", slug: "armory", tags: ["meta"] }] as any,
      [{ id: 3, web: { visitors: 42 }, downloads: null }] as any,
      ["armory"]
    );
    expect(ex[0]!.visitors).toBe(42);
    expect(ex[0]!.screenshot).toBe("/shots/armory.png");
    expect(ex[0]!.category).toBe("meta");
  });

  it("uses live stats when fetch succeeds (source.live = true)", async () => {
    const fetchOk = (async () => ({
      ok: true,
      json: async () => ({ asOf: "2026-07-06", projects: [{ id: 1, visitors: 5 }] }),
    })) as any;
    const { source } = await loadExhibits({ fetchImpl: fetchOk });
    expect(source.live).toBe(true);
    expect(source.asOf).toBe("2026-07-06");
  });

  it("falls back to the baked snapshot when fetch fails (never throws)", async () => {
    const fetchFail = (async () => {
      throw new Error("network down");
    }) as any;
    const { exhibits, source } = await loadExhibits({ fetchImpl: fetchFail });
    expect(exhibits.length).toBeGreaterThan(0); // from the committed snapshot
    expect(source.live).toBe(false);
    expect(source.asOf).toBeTruthy(); // "ณ วันที่" marker present
  });

  it("falls back when the response is non-ok", async () => {
    const fetch500 = (async () => ({ ok: false, status: 500, json: async () => ({}) })) as any;
    const { exhibits, source } = await loadExhibits({ fetchImpl: fetch500 });
    expect(exhibits.length).toBeGreaterThan(0);
    expect(source.live).toBe(false);
  });
});
