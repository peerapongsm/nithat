export type Category = string; // e.g. "game" | "tool" | "viz" | ... (from armory tags/track)

export interface Exhibit {
  id: number;
  name: string;
  builtOrder: number;
  issue: string;
  solves: string;
  url?: string;
  screenshot?: string; // undefined → procedural placeholder
  visitors?: number;
  downloads?: number;
  tests?: number;
  category: Category;
  isSelf?: boolean; // #52 "you are here"
}

export type BeatId = "intro" | "early" | "categories" | "hits" | "bugs" | "numbers" | "reflection";

export interface Beat {
  id: BeatId;
  title: string;
  body: string;
  atProgress: number;
  totals?: Record<string, number>;
}

export interface CameraPose {
  position: [number, number, number];
  lookAt: [number, number, number];
}

export interface StatsSource {
  asOf: string;
  live: boolean; // for the "ณ วันที่" marker
}
