import * as THREE from "three";
import type { Beat, StatsSource } from "../types";
import type { PlacedExhibit } from "../lib/timeline";
import { cameraPoseAt } from "../lib/scroll";
import { cardModel } from "../ui/exhibitCard";
import { buildHall, hallLengthFor } from "./hall";
import { buildExhibit, updateExhibitLOD, type ExhibitNode } from "./exhibitMesh";

const BEAT_WINDOW = 0.045; // how close (in progress) a beat panel stays visible

// Exhibit fields come from remotely fetched JSON — escape before innerHTML.
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function overlay(cls: string, html: string): HTMLDivElement {
  const d = document.createElement("div");
  d.className = cls;
  d.innerHTML = html;
  return d;
}

export function mount3D(
  root: HTMLElement,
  exhibits: PlacedExhibit[],
  beats: Beat[],
  source: StatsSource
): { destroy: () => void } {
  const hallLength = hallLengthFor(exhibits.length);

  // ── DOM: canvas + scroll spacer + overlays ──────────────────
  const wrap = overlay("scene3d", "");
  const canvas = document.createElement("canvas");
  canvas.className = "gl";
  const spacer = overlay("scroll-spacer", "");
  spacer.style.height = `${exhibits.length * 130 + 400}vh`;

  const asOfDate = new Date(source.asOf).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  const hud = overlay(
    "hud",
    `<p class="hud-kicker">โปรเจกต์ ๓๖๕ — บทส่งท้าย</p>
     <h1 class="hud-title">นิทรรศการ</h1>
     <p class="hud-sub">เดินชมหนึ่งปีแห่งการสร้าง ทั้ง ๕๒ ชิ้น</p>
     <p class="asof">${source.live ? "สถิติสด" : "สถิติบันทึกไว้"} ณ วันที่ ${asOfDate}</p>
     <p class="hud-hint">เลื่อนลงเพื่อเริ่มเดิน · คลิกภาพเพื่อดูใกล้ ๆ</p>`
  );
  const beatPanel = overlay("beat3d", "");
  beatPanel.dataset.testid = "beat-panel";
  const detail = overlay("detail3d", "");
  detail.addEventListener("click", (ev) => {
    if (ev.target === detail) closeDetail();
  });

  wrap.append(canvas, hud, beatPanel, detail);
  root.append(wrap, spacer);

  // ── three ───────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0d0b08, 14, 46);
  scene.background = new THREE.Color(0x0d0b08);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 80);

  buildHall(scene, hallLength);
  const nodes: ExhibitNode[] = exhibits.map((e, i) => buildExhibit(e, hallLength, i));
  nodes.forEach((n) => scene.add(n.group));

  // ── scroll → camera ─────────────────────────────────────────
  let progress = 0;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress = max > 0 ? scrollY / max : 0;
  };
  addEventListener("scroll", onScroll, { passive: true });

  const onResize = () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  };
  addEventListener("resize", onResize);
  onResize();

  // ── click-to-focus ──────────────────────────────────────────
  const ray = new THREE.Raycaster();
  let focused: ExhibitNode | null = null;
  const focusTarget = new THREE.Vector3();
  const focusLook = new THREE.Vector3();

  function openDetail(n: ExhibitNode) {
    focused = n;
    const world = new THREE.Vector3();
    n.art.getWorldPosition(world);
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(n.group.quaternion);
    focusTarget.copy(world).addScaledVector(normal, 3.1);
    focusLook.copy(world);
    const m = cardModel(n.exhibit);
    detail.innerHTML = `
      <article class="detail-card">
        <p class="plaque-no">ชิ้นที่ ${m.number}</p>
        <h3>${esc(m.title)}</h3>
        ${m.issue ? `<p class="d-issue">${esc(m.issue)}</p>` : ""}
        ${m.solves ? `<p class="d-solves">${esc(m.solves)}</p>` : ""}
        <p class="d-stats${m.isSelf ? " here" : ""}">${esc(m.plaque)}</p>
        <div class="d-actions">
          ${m.url && !m.isSelf && /^https:/.test(m.url) ? `<a href="${esc(m.url)}" target="_blank" rel="noopener">เข้าชมของจริง</a>` : ""}
          <button type="button" class="d-close">กลับสู่ทางเดิน</button>
        </div>
      </article>`;
    detail.querySelector(".d-close")!.addEventListener("click", closeDetail);
    detail.classList.add("open");
  }
  function closeDetail() {
    focused = null;
    detail.classList.remove("open");
  }
  canvas.addEventListener("click", (ev) => {
    if (focused) return;
    const ndc = new THREE.Vector2((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(nodes.map((n) => n.art));
    const hit = hits[0];
    if (hit) {
      const node = nodes.find((n) => n.art === hit.object);
      if (node) openDetail(node);
    }
  });

  // ── beats + reflection overlay ──────────────────────────────
  let activeBeat: Beat | null = null;
  function updateBeat() {
    const beat = beats.find((b) => (b.title || b.body) && Math.abs(progress - b.atProgress) < BEAT_WINDOW) ?? null;
    if (beat === activeBeat) return;
    activeBeat = beat;
    if (!beat) {
      beatPanel.classList.remove("show");
      return;
    }
    let totals = "";
    if (beat.id === "numbers" && beat.totals) {
      const label: Record<string, string> = {
        projects: "โปรเจกต์", visitors: "ผู้ชมใน 30 วัน", downloads: "ดาวน์โหลด", liveSites: "เว็บที่ยังออนไลน์",
      };
      totals =
        `<div class="totals">` +
        Object.entries(beat.totals)
          .map(([k, v]) => `<div class="total"><strong class="total-n">${new Intl.NumberFormat("en-US").format(v)}</strong><span class="total-k">${label[k] ?? k}</span></div>`)
          .join("") +
        `</div>`;
    }
    beatPanel.innerHTML = `<h2 class="beat-title">${beat.title}</h2>${beat.body
      .split("\n\n")
      .map((p) => `<p class="beat-body">${p}</p>`)
      .join("")}${totals}`;
    beatPanel.classList.add("show");
  }

  // ── render loop ─────────────────────────────────────────────
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (focused) {
      camPos.lerp(focusTarget, 0.08);
      camLook.lerp(focusLook, 0.12);
    } else {
      const pose = cameraPoseAt(progress, hallLength);
      camPos.lerp(new THREE.Vector3(...pose.position), 0.1);
      camLook.lerp(new THREE.Vector3(...pose.lookAt), 0.12);
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    hud.style.opacity = String(Math.max(0, 1 - progress * 14));
    updateBeat();
    updateExhibitLOD(nodes, camPos.z);
    renderer.render(scene, camera);
  }
  const initial = cameraPoseAt(0, hallLength);
  camPos.set(...initial.position);
  camLook.set(...initial.lookAt);
  onScroll();
  frame();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.MeshBasicMaterial | undefined;
        if (mat?.map) mat.map.dispose();
        if (mat?.dispose) mat.dispose();
      });
      renderer.dispose();
      wrap.remove();
      spacer.remove();
    },
  };
}
