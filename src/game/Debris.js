import * as THREE from 'three';

const GRAVITY = 26;
const LIFE = 2.4;

/**
 * Hand-rolled motion for the trimmed-off pieces: gravity plus a tumble.
 * They never interact with anything, so a physics engine would only add weight.
 */
export class DebrisField {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.pieces = [];
  }

  spawn(mesh, pushDir) {
    mesh.userData.vel = new THREE.Vector3(pushDir.x * 3.2, 1.6, pushDir.z * 3.2);
    mesh.userData.spin = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(6),
      THREE.MathUtils.randFloatSpread(3),
      THREE.MathUtils.randFloatSpread(6)
    );
    mesh.userData.life = 0;
    mesh.material.transparent = true;
    this.group.add(mesh);
    this.pieces.push(mesh);
  }

  update(dt) {
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i];
      const u = p.userData;
      u.life += dt;
      u.vel.y -= GRAVITY * dt;
      p.position.addScaledVector(u.vel, dt);
      p.rotation.x += u.spin.x * dt;
      p.rotation.y += u.spin.y * dt;
      p.rotation.z += u.spin.z * dt;
      if (u.life > LIFE * 0.55) {
        p.material.opacity = Math.max(0, 1 - (u.life - LIFE * 0.55) / (LIFE * 0.45));
      }
      if (u.life > LIFE) this.remove(i);
    }
  }

  remove(i) {
    const p = this.pieces[i];
    this.group.remove(p);
    p.material.dispose();
    this.pieces.splice(i, 1);
  }

  clear() {
    for (let i = this.pieces.length - 1; i >= 0; i--) this.remove(i);
  }
}
