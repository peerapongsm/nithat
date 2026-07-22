import { describe, it, expect } from "vitest";
import { cardModel } from "../src/ui/exhibitCard";

describe("cardModel", () => {
  it("uses a placeholder when no screenshot", () => {
    const m = cardModel({ id: 3, name: "CLI Tool", builtOrder: 3, issue: "", solves: "", category: "tool" } as any);
    expect(m.hasImage).toBe(false);
    expect(m.imageSrc).toBeUndefined();
    expect(m.title).toBe("CLI Tool");
    expect(m.tint).toBeTruthy();
  });

  it("uses the screenshot when present", () => {
    const m = cardModel({ id: 1, name: "Armory", builtOrder: 1, issue: "", solves: "", category: "meta", screenshot: "/shots/armory.png" } as any);
    expect(m.hasImage).toBe(true);
    expect(m.imageSrc).toBe("/shots/armory.png");
  });

  it("self exhibit shows 'you are here', not visitors", () => {
    const m = cardModel({ id: 52, name: "nithat", builtOrder: 52, isSelf: true, visitors: 0, issue: "", solves: "", category: "viz" } as any);
    expect(m.plaque).toMatch(/คุณ|ยืนอยู่|here/i);
    expect(m.plaque).not.toMatch(/ผู้ชม/);
  });

  it("plaque shows visitors for a normal web exhibit and downloads for desktop", () => {
    const w = cardModel({ id: 1, name: "A", builtOrder: 1, issue: "", solves: "", category: "web", visitors: 1443 } as any);
    expect(w.plaque).toMatch(/1,443/);
    const d = cardModel({ id: 12, name: "B", builtOrder: 12, issue: "", solves: "", category: "desktop", downloads: 33 } as any);
    expect(d.plaque).toMatch(/33/);
  });

  it("same category maps to the same tint (stable)", () => {
    const a = cardModel({ id: 1, name: "A", builtOrder: 1, issue: "", solves: "", category: "game" } as any);
    const b = cardModel({ id: 2, name: "B", builtOrder: 2, issue: "", solves: "", category: "game" } as any);
    expect(a.tint).toBe(b.tint);
  });
});
