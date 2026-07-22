// Bakes the offline fallback snapshot + exhibit screenshots.
// Run from project-49-nithat: node scripts/bake-snapshot.mjs
import { writeFileSync, mkdirSync, readdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECTS_URL = "https://peerapongsm.dev/projects.json";
const SUMMARY_URL = "https://armory-analytics-peerapongsms-projects.vercel.app/api/summary";
const SHOTS_SRC = join(root, "..", "docs", "out", "facebook");

const [projects, summary] = await Promise.all(
  [PROJECTS_URL, SUMMARY_URL].map(async (u) => {
    const r = await fetch(u);
    if (!r.ok) throw new Error(`${u} -> ${r.status}`);
    return r.json();
  })
);

mkdirSync(join(root, "src", "data"), { recursive: true });
writeFileSync(
  join(root, "src", "data", "stats-snapshot.json"),
  JSON.stringify({ asOf: summary.asOf ?? new Date().toISOString(), projects, stats: summary.projects }, null, 2) + "\n"
);

// Copy per-slug hero screenshots (1200x630) into public/shots + manifest of slugs that have one.
const shots = [];
mkdirSync(join(root, "public", "shots"), { recursive: true });
if (existsSync(SHOTS_SRC)) {
  for (const f of readdirSync(SHOTS_SRC).filter((f) => f.endsWith(".png"))) {
    copyFileSync(join(SHOTS_SRC, f), join(root, "public", "shots", f));
    shots.push(f.replace(/\.png$/, ""));
  }
}
writeFileSync(join(root, "src", "data", "shots.json"), JSON.stringify(shots.sort(), null, 2) + "\n");

console.log(`baked: ${projects.length} projects, ${summary.projects.length} stats, ${shots.length} shots, asOf ${summary.asOf}`);
