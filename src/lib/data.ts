import type { Exhibit, StatsSource } from "../types";
import snapshot from "../data/stats-snapshot.json";
import shotSlugs from "../data/shots.json";

const PROJECTS_URL = "https://peerapongsm.dev/projects.json";
const SUMMARY_URL = "https://armory-analytics-peerapongsms-projects.vercel.app/api/summary";
const FETCH_TIMEOUT_MS = 6000;

// Loose shapes of the two upstream feeds (armory projects.json + #2 /api/summary).
export interface RawProject {
  id: number;
  name: string;
  builtOrder?: number;
  slug?: string;
  issue?: string;
  solves?: string;
  url?: string;
  tags?: string[];
  medium?: string;
}
export interface RawStats {
  id: number;
  visitors?: number;
  downloads?: number | null;
  web?: { visitors?: number } | null;
}

export function mergeStats(projects: RawProject[], stats: RawStats[], shots: string[] = shotSlugs): Exhibit[] {
  const byId = new Map(stats.map((s) => [s.id, s]));
  const shotSet = new Set(shots);
  return projects
    .map((p): Exhibit => {
      const s = byId.get(p.id);
      const hasShot = p.slug !== undefined && shotSet.has(p.slug);
      return {
        id: p.id,
        name: p.name,
        builtOrder: p.builtOrder ?? p.id,
        issue: p.issue ?? "",
        solves: p.solves ?? "",
        url: p.url || undefined,
        screenshot: hasShot ? `/shots/${p.slug}.png` : undefined,
        visitors: s?.visitors ?? s?.web?.visitors,
        downloads: s?.downloads ?? undefined,
        category: p.tags?.[0] ?? p.medium ?? "web",
        isSelf: p.id === 52 || undefined,
      };
    })
    .sort((a, b) => a.builtOrder - b.builtOrder);
}

async function fetchJson(url: string, fetchImpl: typeof fetch): Promise<unknown> {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function fromSnapshot(): { exhibits: Exhibit[]; source: StatsSource } {
  return {
    exhibits: mergeStats(snapshot.projects as RawProject[], snapshot.stats as RawStats[]),
    source: { asOf: snapshot.asOf, live: false },
  };
}

// Never throws into the UI: any fetch failure/timeout/non-ok → committed baked snapshot.
export async function loadExhibits(opts?: {
  fetchImpl?: typeof fetch;
}): Promise<{ exhibits: Exhibit[]; source: StatsSource }> {
  const fetchImpl = opts?.fetchImpl ?? fetch;
  try {
    const summary = (await fetchJson(SUMMARY_URL, fetchImpl)) as {
      asOf?: string;
      projects: RawStats[];
    };
    // Live stats are what matter; project metadata may still come from the
    // snapshot if the projects.json fetch fails or returns an odd shape.
    let projects = snapshot.projects as RawProject[];
    try {
      const fetched = await fetchJson(PROJECTS_URL, fetchImpl);
      if (Array.isArray(fetched) && fetched.length > 0) projects = fetched as RawProject[];
    } catch {
      /* keep snapshot projects */
    }
    return {
      exhibits: mergeStats(projects, summary.projects ?? []),
      source: { asOf: summary.asOf ?? new Date().toISOString(), live: true },
    };
  } catch {
    return fromSnapshot();
  }
}
