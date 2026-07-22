import type { Beat, Exhibit } from "../types";
import { exhibitProgress } from "./scroll";

export interface PlacedExhibit extends Exhibit {
  atProgress: number;
}

// Sorts exhibits chronologically, places them evenly along the walk,
// sorts beats by position, and injects live totals into the "numbers" beat.
export function buildTimeline(
  exhibits: Exhibit[],
  beats: Beat[],
  totals: Record<string, number>
): { exhibits: PlacedExhibit[]; beats: Beat[] } {
  const ordered = [...exhibits]
    .sort((a, b) => a.builtOrder - b.builtOrder)
    .map((e, i, arr) => ({ ...e, atProgress: exhibitProgress(i, arr.length) }));
  const placedBeats = [...beats]
    .sort((a, b) => a.atProgress - b.atProgress)
    .map((b) => (b.id === "numbers" ? { ...b, totals: { ...b.totals, ...totals } } : b));
  return { exhibits: ordered, beats: placedBeats };
}
