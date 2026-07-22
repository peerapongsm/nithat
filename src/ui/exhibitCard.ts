import type { Exhibit } from "../types";

export interface CardModel {
  hasImage: boolean;
  imageSrc?: string;
  title: string;
  number: string; // "๐๑" style ordinal plaque number
  plaque: string; // stats line
  issue: string;
  solves: string;
  tint: string; // category tint for placeholder frames
  url?: string;
  isSelf: boolean;
}

const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"] as const;

export function thaiNum(n: number): string {
  return String(n)
    .split("")
    .map((d) => THAI_DIGITS[Number(d)] ?? d)
    .join("");
}

// Stable category → hue mapping (same category, same tint).
export function categoryTint(category: string): string {
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) % 360;
  return `hsl(${h} 42% 46%)`;
}

const fmt = new Intl.NumberFormat("en-US");

export function cardModel(e: Exhibit): CardModel {
  let plaque: string;
  if (e.isSelf) {
    plaque = "ห้องที่คุณกำลังยืนอยู่";
  } else if (e.visitors !== undefined) {
    plaque = `ผู้ชม ${fmt.format(e.visitors)} คนใน 30 วัน`;
  } else if (e.downloads !== undefined) {
    plaque = `ดาวน์โหลด ${fmt.format(e.downloads)} ครั้ง`;
  } else {
    plaque = "งานชิ้นเงียบ ไม่มีตัวเลขติดตาม";
  }
  return {
    hasImage: !!e.screenshot,
    imageSrc: e.screenshot,
    title: e.name,
    number: thaiNum(e.builtOrder),
    plaque,
    issue: e.issue,
    solves: e.solves,
    tint: categoryTint(e.category),
    url: e.url,
    isSelf: !!e.isSelf,
  };
}
