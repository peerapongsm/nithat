import type { Beat, Exhibit, StatsSource } from "../types";
import type { PlacedExhibit } from "../lib/timeline";
import { cardModel, thaiNum } from "./exhibitCard";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function beatSection(b: Beat): HTMLElement {
  const s = el("section", "beat");
  s.dataset.beat = b.id;
  const inner = el("div", "beat-inner");
  inner.appendChild(el("h2", "beat-title", b.title));
  for (const para of b.body.split("\n\n")) inner.appendChild(el("p", "beat-body", para));
  if (b.id === "numbers" && b.totals) {
    const grid = el("div", "totals");
    const label: Record<string, string> = {
      projects: "โปรเจกต์",
      visitors: "ผู้ชมใน 30 วัน",
      downloads: "ดาวน์โหลด",
      liveSites: "เว็บที่ยังออนไลน์",
    };
    for (const [k, v] of Object.entries(b.totals)) {
      const cell = el("div", "total");
      cell.appendChild(el("strong", "total-n", new Intl.NumberFormat("en-US").format(v)));
      cell.appendChild(el("span", "total-k", label[k] ?? k));
      grid.appendChild(cell);
    }
    inner.appendChild(grid);
  }
  s.appendChild(inner);
  return s;
}

function exhibitSection(e: Exhibit, side: "left" | "right"): HTMLElement {
  const m = cardModel(e);
  const s = el("section", `exhibit ${side}${m.isSelf ? " self" : ""}`);
  s.dataset.id = String(e.id);

  const frame = el("figure", "frame");
  frame.style.setProperty("--tint", m.tint);
  if (m.hasImage && m.imageSrc) {
    const img = el("img", "art") as HTMLImageElement;
    img.src = m.imageSrc;
    img.alt = m.title;
    img.loading = "lazy";
    img.decoding = "async";
    frame.appendChild(img);
  } else {
    const ph = el("div", "art placeholder");
    ph.appendChild(el("span", "ph-number", thaiNum(e.builtOrder)));
    ph.appendChild(el("span", "ph-name", m.title));
    frame.appendChild(ph);
  }

  const plaque = el("figcaption", "plaque");
  const head = el("div", "plaque-head");
  head.appendChild(el("span", "plaque-no", `ชิ้นที่ ${m.number}`));
  head.appendChild(el("h3", "plaque-title", m.title));
  plaque.appendChild(head);
  if (m.issue) plaque.appendChild(el("p", "plaque-issue", m.issue));
  if (m.solves) plaque.appendChild(el("p", "plaque-solves", m.solves));
  plaque.appendChild(el("p", `plaque-stats${m.isSelf ? " here" : ""}`, m.plaque));
  if (m.url && !m.isSelf) {
    const a = el("a", "plaque-visit", "เข้าชมของจริง") as HTMLAnchorElement;
    a.href = m.url;
    a.target = "_blank";
    a.rel = "noopener";
    plaque.appendChild(a);
  }
  frame.appendChild(plaque);
  s.appendChild(frame);
  return s;
}

export function render2D(exhibits: PlacedExhibit[], beats: Beat[], source: StatsSource): HTMLElement {
  const root = el("main", "hall2d");

  // Entrance
  const intro = el("header", "entrance");
  intro.appendChild(el("p", "entrance-kicker", "โปรเจกต์ ๓๖๕ — บทส่งท้าย"));
  intro.appendChild(el("h1", "entrance-title", "นิทรรศการ"));
  intro.appendChild(el("p", "entrance-sub", "เดินชมหนึ่งปีแห่งการสร้าง ทั้ง ๕๒ ชิ้น เรียงตามลำดับที่เกิดขึ้นจริง"));
  const asOfDate = new Date(source.asOf).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  intro.appendChild(
    el("p", "asof", source.live ? `สถิติสด ณ วันที่ ${asOfDate}` : `สถิติบันทึกไว้ ณ วันที่ ${asOfDate}`)
  );
  intro.appendChild(el("p", "entrance-hint", "เลื่อนลงเพื่อเริ่มเดิน"));
  root.appendChild(intro);

  // Merge exhibits + beats into one walk, ordered by atProgress.
  type Item = { at: number; node: HTMLElement };
  const items: Item[] = [];
  exhibits.forEach((e, i) => items.push({ at: e.atProgress, node: exhibitSection(e, i % 2 ? "right" : "left") }));
  for (const b of beats) if (b.title || b.body) items.push({ at: b.atProgress - 1e-6, node: beatSection(b) });
  items.sort((a, b) => a.at - b.at);
  for (const it of items) root.appendChild(it.node);

  // Reveal-on-scroll
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add("seen")),
    { threshold: 0.25 }
  );
  root.querySelectorAll("section").forEach((s) => io.observe(s));

  return root;
}
