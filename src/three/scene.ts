import type { Beat, StatsSource } from "../types";
import type { PlacedExhibit } from "../lib/timeline";
import { render2D } from "../ui/fallback2d";

// Stub — real Three.js scene lands in Task 6. Until then the 3D mount
// serves the 2D walk so the toggle is never a dead end.
export function mount3D(
  root: HTMLElement,
  exhibits: PlacedExhibit[],
  beats: Beat[],
  source: StatsSource
): { destroy: () => void } {
  const node = render2D(exhibits, beats, source);
  root.appendChild(node);
  return { destroy: () => node.remove() };
}
