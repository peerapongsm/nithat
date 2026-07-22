import * as THREE from "three";
import type { Exhibit } from "../types";
import { cardModel, thaiNum } from "../ui/exhibitCard";

export const ART_ASPECT = 1200 / 630;

// Procedural placeholder canvas (category tint + Thai ordinal + name) —
// same card the 2D fallback shows, drawn once per exhibit that lacks art.
export function placeholderCanvas(e: Exhibit): HTMLCanvasElement {
  const m = cardModel(e);
  const c = document.createElement("canvas");
  c.width = 600;
  c.height = 315;
  const g = c.getContext("2d")!;
  g.fillStyle = m.tint;
  g.fillRect(0, 0, c.width, c.height);
  const grad = g.createRadialGradient(180, 60, 20, 180, 60, 380);
  grad.addColorStop(0, "rgba(255,255,255,0.16)");
  grad.addColorStop(1, "rgba(0,0,0,0.12)");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.textAlign = "center";
  g.font = "700 84px Trirong, serif";
  g.fillText(thaiNum(e.builtOrder), c.width / 2, 150);
  g.font = "600 30px 'IBM Plex Sans Thai', sans-serif";
  g.fillText(e.name, c.width / 2, 220, c.width - 60);
  return c;
}

// Brass plaque plate under each frame: number + name + stat line.
export function plaqueCanvas(e: Exhibit): HTMLCanvasElement {
  const m = cardModel(e);
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const g = c.getContext("2d")!;
  g.fillStyle = "#efe9dc";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "#8a7137";
  g.lineWidth = 4;
  g.strokeRect(6, 6, c.width - 12, c.height - 12);
  g.fillStyle = "#8a7137";
  g.textAlign = "center";
  g.font = "600 22px 'IBM Plex Sans Thai', sans-serif";
  g.fillText(`ชิ้นที่ ${m.number}`, c.width / 2, 42);
  g.fillStyle = "#1d1912";
  g.font = "700 34px Trirong, serif";
  g.fillText(m.title, c.width / 2, 88, c.width - 50);
  g.fillStyle = m.isSelf ? "#a3472e" : "#6b6252";
  g.font = "400 22px 'IBM Plex Sans Thai', sans-serif";
  g.fillText(m.plaque, c.width / 2, 130, c.width - 50);
  return c;
}

const loader = new THREE.TextureLoader();

export async function exhibitTexture(e: Exhibit): Promise<THREE.Texture> {
  let tex: THREE.Texture;
  if (e.screenshot) {
    try {
      tex = await loader.loadAsync(e.screenshot);
    } catch {
      tex = new THREE.CanvasTexture(placeholderCanvas(e));
    }
  } else {
    tex = new THREE.CanvasTexture(placeholderCanvas(e));
  }
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
