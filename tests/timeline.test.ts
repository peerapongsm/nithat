import { it, expect } from "vitest";
import { buildTimeline } from "../src/lib/timeline";

it("orders chronologically + injects totals into the numbers beat", () => {
  const { exhibits, beats } = buildTimeline(
    [{ id: 2, builtOrder: 2 } as any, { id: 1, builtOrder: 1 } as any],
    [{ id: "numbers", atProgress: 0.9 } as any, { id: "intro", atProgress: 0 } as any],
    { projects: 52, tests: 1234 }
  );
  expect(exhibits.map((e) => e.builtOrder)).toEqual([1, 2]);
  expect(beats.find((b) => b.id === "numbers")!.totals!.projects).toBe(52);
  expect(beats[0]!.id).toBe("intro"); // sorted by atProgress
});
