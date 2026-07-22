import { loadExhibits } from "./lib/data";
import { buildTimeline } from "./lib/timeline";
import { beats } from "./content/beats";
import { render2D } from "./ui/fallback2d";
import { shouldUse3D, setViewOverride } from "./ui/detect";
import type { Beat, StatsSource } from "./types";
import type { PlacedExhibit } from "./lib/timeline";

const app = document.getElementById("app")!;

function computeTotals(exhibits: { visitors?: number; downloads?: number; url?: string }[]) {
  return {
    projects: exhibits.length,
    visitors: exhibits.reduce((s, e) => s + (e.visitors ?? 0), 0),
    downloads: exhibits.reduce((s, e) => s + (e.downloads ?? 0), 0),
    liveSites: exhibits.filter((e) => e.url).length,
  };
}

let destroy3D: (() => void) | null = null;

async function mount(use3D: boolean, data: { exhibits: PlacedExhibit[]; beats: Beat[]; source: StatsSource }) {
  destroy3D?.();
  destroy3D = null;
  app.replaceChildren();
  if (use3D) {
    const { mount3D } = await import("./three/scene");
    destroy3D = mount3D(app, data.exhibits, data.beats, data.source).destroy;
  } else {
    app.appendChild(render2D(data.exhibits, data.beats, data.source));
    window.scrollTo(0, 0);
  }
  const toggle = document.createElement("button");
  toggle.id = "view-toggle";
  toggle.type = "button";
  toggle.textContent = use3D ? "ดูแบบ 2D" : "ดูแบบ 3D";
  toggle.addEventListener("click", () => {
    const next = use3D ? "2d" : "3d";
    setViewOverride(next);
    void mount(next === "3d", data);
  });
  app.appendChild(toggle);
}

async function boot() {
  const { exhibits, source } = await loadExhibits();
  const timeline = buildTimeline(exhibits, beats, computeTotals(exhibits));
  await mount(shouldUse3D(), { ...timeline, source });
}

void boot();
