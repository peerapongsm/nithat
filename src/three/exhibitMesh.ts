import * as THREE from "three";
import type { PlacedExhibit } from "../lib/timeline";
import { HALL_WIDTH } from "./hall";
import { exhibitTexture, plaqueCanvas, ART_ASPECT } from "./textures";

const ART_W = 3.1;
const ART_H = ART_W / ART_ASPECT;
const FRAME_PAD = 0.12;
const MAT_PAD = 0.1;
const HANG_Y = 2.1;
const LOAD_RADIUS = 26; // lazy-load window (metres of camera z)

export interface ExhibitNode {
  group: THREE.Group;
  art: THREE.Mesh;
  exhibit: PlacedExhibit;
  z: number;
  loaded: boolean;
  loading: boolean;
}

const frameMat = new THREE.MeshStandardMaterial({ color: 0xc9a24b, roughness: 0.35, metalness: 0.65 });
const matboardMat = new THREE.MeshStandardMaterial({ color: 0xefe9dc, roughness: 0.9 });
const pendingMat = new THREE.MeshBasicMaterial({ color: 0x241f18 }); // shared until texture loads

export function buildExhibit(e: PlacedExhibit, hallLength: number, index: number): ExhibitNode {
  const group = new THREE.Group();
  const side = index % 2 === 0 ? -1 : 1; // alternate walls, like the 2D walk
  const z = e.atProgress * hallLength;
  const x = (side * (HALL_WIDTH - 0.1)) / 2;

  // frame → mat → art, stacked slightly off the wall
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(ART_W + 2 * (FRAME_PAD + MAT_PAD), ART_H + 2 * (FRAME_PAD + MAT_PAD), 0.08),
    frameMat
  );
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(ART_W + 2 * MAT_PAD, ART_H + 2 * MAT_PAD), matboardMat);
  mat.position.z = 0.045;
  const art = new THREE.Mesh(new THREE.PlaneGeometry(ART_W, ART_H), pendingMat);
  art.position.z = 0.05;
  art.userData.exhibitId = e.id;

  const plaqueTex = new THREE.CanvasTexture(plaqueCanvas(e));
  plaqueTex.colorSpace = THREE.SRGBColorSpace;
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.47),
    new THREE.MeshBasicMaterial({ map: plaqueTex })
  );
  plaque.position.set(0, -(ART_H / 2 + 0.55), 0.05);

  group.add(frame, mat, art, plaque);
  group.position.set(x, HANG_Y, z);
  group.rotation.y = (-side * Math.PI) / 2; // face into the hall
  if (e.isSelf) {
    const halo = new THREE.PointLight(0xffd98a, 10, 8, 1.6);
    halo.position.set(0, 1.2, 1.2);
    group.add(halo);
  }
  return { group, art, exhibit: e, z, loaded: false, loading: false };
}

// Lazy texture window: load near the camera, dispose far behind/ahead.
export function updateExhibitLOD(nodes: ExhibitNode[], cameraZ: number): void {
  for (const n of nodes) {
    const near = Math.abs(n.z - cameraZ) < LOAD_RADIUS;
    if (near && !n.loaded && !n.loading) {
      n.loading = true;
      void exhibitTexture(n.exhibit).then((tex) => {
        n.art.material = new THREE.MeshBasicMaterial({ map: tex });
        n.loaded = true;
        n.loading = false;
      });
    } else if (!near && n.loaded) {
      const m = n.art.material as THREE.MeshBasicMaterial;
      m.map?.dispose();
      m.dispose();
      n.art.material = pendingMat;
      n.loaded = false;
    }
  }
}
