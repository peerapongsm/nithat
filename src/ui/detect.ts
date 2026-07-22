// 3D only where it will actually be pleasant: WebGL present, fine pointer,
// not a low-power device. Manual override via ?view=2d|3d or localStorage.
const KEY = "nithat-view";

export function viewOverride(): "2d" | "3d" | null {
  const q = new URLSearchParams(location.search).get("view");
  if (q === "2d" || q === "3d") return q;
  const s = localStorage.getItem(KEY);
  return s === "2d" || s === "3d" ? s : null;
}

export function setViewOverride(v: "2d" | "3d"): void {
  localStorage.setItem(KEY, v);
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function shouldUse3D(): boolean {
  const o = viewOverride();
  if (o) return o === "3d";
  if (!webglAvailable()) return false;
  if (matchMedia("(pointer: coarse)").matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  if (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency < 4) return false;
  return true;
}
