import * as THREE from "three";

export const HALL_WIDTH = 9;
export const HALL_HEIGHT = 5.2;
export const EXHIBIT_SPACING = 6; // metres of wall per exhibit

export function hallLengthFor(count: number): number {
  return count * EXHIBIT_SPACING + 24; // entrance + reflection space
}

// Low-poly gallery: floor, two walls, ceiling, rhythmic downlights.
export function buildHall(scene: THREE.Scene, length: number): void {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x16130f, roughness: 0.95 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x241f18, roughness: 0.7, metalness: 0.05 });
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x0d0b08, roughness: 1 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALL_WIDTH, length + 40), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, length / 2);
  scene.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALL_WIDTH, length + 40), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, HALL_HEIGHT, length / 2);
  scene.add(ceil);

  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(length + 40, HALL_HEIGHT), wallMat);
    wall.rotation.y = (side * Math.PI) / 2;
    wall.position.set((side * HALL_WIDTH) / 2, HALL_HEIGHT / 2, length / 2);
    scene.add(wall);
  }

  // End wall behind the reflection space
  const endWall = new THREE.Mesh(new THREE.PlaneGeometry(HALL_WIDTH, HALL_HEIGHT), wallMat);
  endWall.position.set(0, HALL_HEIGHT / 2, length + 18);
  endWall.rotation.y = Math.PI;
  scene.add(endWall);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(HALL_WIDTH, HALL_HEIGHT), wallMat);
  backWall.position.set(0, HALL_HEIGHT / 2, -12);
  scene.add(backWall);

  // Ambience + warm downlights every few metres (cheap: low-intensity points)
  scene.add(new THREE.AmbientLight(0xf5ead0, 0.55));
  const hemi = new THREE.HemisphereLight(0xf5ead0, 0x0d0b08, 0.35);
  scene.add(hemi);
  for (let z = 0; z < length + 12; z += 12) {
    const p = new THREE.PointLight(0xffd98a, 14, 18, 1.8);
    p.position.set(0, HALL_HEIGHT - 0.4, z);
    scene.add(p);
  }
}
