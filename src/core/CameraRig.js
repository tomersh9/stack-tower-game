import * as THREE from 'three';

const OFFSET = new THREE.Vector3(30, 26, 30);

/** Follows the top of the tower with a critically-damped-ish lerp. */
export class CameraRig {
	constructor(camera) {
		this.camera = camera;
		this.targetY = 0;
		this.currentY = 0;
		this.lookAhead = 1.1;
		this.followSpeed = 3.6; // lowered temporarily for the slow end-of-run reveal pan
	}

	setTarget(y) {
		this.targetY = y;
	}

	snap(y = this.targetY) {
		this.targetY = y;
		this.currentY = y;
		this.apply();
	}

	update(dt) {
		this.currentY += (this.targetY - this.currentY) * Math.min(1, dt * this.followSpeed);
		this.apply();
	}

	apply() {
		this.camera.position.set(OFFSET.x, OFFSET.y + this.currentY, OFFSET.z);
		this.camera.lookAt(0, this.currentY + this.lookAhead, 0);
	}
}
