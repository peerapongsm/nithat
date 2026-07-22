import type { CameraPose } from "../types";

const EYE_HEIGHT = 1.7;
const LOOK_AHEAD = 4;

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

// Pure, deterministic: scroll progress alone drives the camera down the hall.
// z runs from 0 (entrance) to hallLength; gentle x sway keeps the walk alive.
export function cameraPoseAt(progress: number, hallLength: number): CameraPose {
  const t = clamp01(progress);
  const z = t * hallLength;
  const x = Math.sin(t * Math.PI * 4) * 0.35; // gentle sway, bounded well inside the hall
  return {
    position: [x, EYE_HEIGHT, z],
    lookAt: [x * 0.5, EYE_HEIGHT, z + LOOK_AHEAD],
  };
}

// Even placement along the hall, strictly inside (0,1).
export function exhibitProgress(index: number, count: number): number {
  return (index + 0.5) / count;
}
