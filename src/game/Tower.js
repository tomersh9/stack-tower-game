import * as THREE from 'three';
import {
	BLOCK_GEOMETRY,
	BLOCK_H,
	TARGET_OUTLINE_SCALE,
	colorForLayer,
	createBlock,
	createInstancedSkinMaterial,
	createTargetOutline,
	disposeBlock,
} from './Block.js';

export const BASE_SIZE = 3;
export const MIN_SIZE = 0.36; // below this the run ends rather than turning into a pixel
export const WARN_SIZE = 0.75; // "width critical" territory
export const TRAVEL = 5.4; // how far the moving block swings from centre
export const PLINTH_DEPTH = 6; // purely decorative layers below the play area
const MAX_PLACED_LAYERS = 4000; // generous cap on landed blocks — real runs never get close

/**
 * Pure overlap maths — no Three.js, no state. Everything the placement rules
 * need is in here, which makes the rules easy to reason about and to test.
 *
 * @param {number} movingPos centre of the moving block on the active axis
 * @param {number} topPos    centre of the block below on the same axis
 * @param {number} size      shared extent of both blocks on that axis
 * @param {number} tolerance how far off centre still counts as perfect
 */
export function computePlacement(movingPos, topPos, size, tolerance) {
	const delta = movingPos - topPos;
	const overlap = size - Math.abs(delta);

	if (overlap <= 0) return { type: 'miss', delta, overlap: 0 };

	if (Math.abs(delta) <= tolerance) {
		return { type: 'perfect', delta, overlap: size, newSize: size, center: topPos };
	}

	const cutSize = Math.abs(delta);
	const sign = Math.sign(delta);
	return {
		type: 'partial',
		delta,
		overlap,
		newSize: overlap,
		center: topPos + delta / 2,
		cutSize,
		cutCenter: topPos + sign * (size / 2 + cutSize / 2),
	};
}

export class Tower {
	constructor(scene, debris) {
		this.group = new THREE.Group();
		scene.add(this.group);
		this.debris = debris;
		this.layers = [];
		this.moving = null;
		this.skin = null;
		this.placed = null; // InstancedMesh holding every landed layer for the current run
		this._dummy = new THREE.Object3D(); // scratch object for composing instance matrices
		this.outline = createTargetOutline();
		// Hide outline by default, only show during perfect placement animation
		this.outline.children.forEach(child => {
			if (child.material) child.material.opacity = 0;
		});
		this.group.add(this.outline);
		this.pulseActive = false;
		this.pulseTime = 0;
		this.pulseDuration = 0.35;
		this.pulseStartScale = TARGET_OUTLINE_SCALE;
		this.pulseEndScale = TARGET_OUTLINE_SCALE * 1.5;
	}

	get top() {
		return this.layers[this.layers.length - 1];
	}

	/** Score/height = placed blocks, not counting the starting base. */
	get height() {
		return this.layers.length - 1;
	}

	get topY() {
		return this.top.y;
	}

	reset(skin) {
		this.skin = skin;
		this.clear();

		this.placed = new THREE.InstancedMesh(BLOCK_GEOMETRY, createInstancedSkinMaterial(skin), MAX_PLACED_LAYERS);
		this.placed.count = 0;
		// Instances live far from the origin as the tower grows; the default bounding
		// sphere is computed around (0,0,0) only, so culling would drop the whole
		// mesh once the camera pans away from it. Never cull it.
		this.placed.frustumCulled = false;
		this.placed.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		this.placed.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PLACED_LAYERS * 3), 3);
		this.placed.instanceColor.setUsage(THREE.DynamicDrawUsage);
		this.group.add(this.placed);

		for (let i = 1; i <= PLINTH_DEPTH; i++) {
			const mesh = createBlock(BASE_SIZE, BASE_SIZE, skin, -i);
			mesh.position.set(0, -i * BLOCK_H, 0);
			this.group.add(mesh);
			this.plinth.push(mesh);
		}

		this.addLayer({ x: 0, z: 0, w: BASE_SIZE, d: BASE_SIZE, y: 0 }, 0);
		this.updateOutline();
	}

	clear() {
		this.plinth?.forEach(m => {
			this.group.remove(m);
			disposeBlock(m);
		});
		this.plinth = [];
		if (this.placed) {
			this.group.remove(this.placed);
			this.placed.material.dispose();
			this.placed.dispose?.();
			this.placed = null;
		}
		this.layers = [];
		if (this.moving) {
			this.group.remove(this.moving.mesh);
			disposeBlock(this.moving.mesh);
			this.moving = null;
		}
	}

	/** Writes a landed layer's transform/colour into the shared InstancedMesh and records its data. */
	addLayer(layer, colorIndex) {
		const i = this.layers.length;
		this._dummy.position.set(layer.x, layer.y, layer.z);
		this._dummy.scale.set(layer.w, BLOCK_H, layer.d);
		this._dummy.rotation.set(0, 0, 0);
		this._dummy.updateMatrix();
		this.placed.setMatrixAt(i, this._dummy.matrix);
		this.placed.setColorAt(i, colorForLayer(this.skin, colorIndex));
		this.placed.count = i + 1;
		this.placed.instanceMatrix.needsUpdate = true;
		this.placed.instanceColor.needsUpdate = true;
		this.layers.push(layer);
	}

	spawnMoving({ speed, startFar = false }) {
		const top = this.top;
		const index = this.layers.length;
		const axis = index % 2 === 1 ? 'x' : 'z';
		const mesh = createBlock(top.w, top.d, this.skin, index);
		const y = index * BLOCK_H;
		const pos = startFar ? TRAVEL : -TRAVEL;

		mesh.position.set(axis === 'x' ? pos : top.x, y, axis === 'z' ? pos : top.z);
		this.group.add(mesh);

		this.moving = {
			axis,
			pos,
			y,
			mesh,
			index,
			speed,
			dir: startFar ? -1 : 1,
			w: top.w,
			d: top.d,
		};
	}

	update(dt) {
		const m = this.moving;
		if (m) {
			m.pos += m.dir * m.speed * dt;
			if (m.pos > TRAVEL) {
				m.pos = TRAVEL;
				m.dir = -1;
			}
			if (m.pos < -TRAVEL) {
				m.pos = -TRAVEL;
				m.dir = 1;
			}

			m.mesh.position[m.axis] = m.pos;
		}

		// Animate outline pulse on perfect placement
		if (this.pulseActive) {
			this.pulseTime += dt;
			const progress = Math.min(1, this.pulseTime / this.pulseDuration);

			// Ease out cubic for smooth deceleration
			const eased = 1 - Math.pow(1 - progress, 3);

			const scale = this.pulseStartScale + (this.pulseEndScale - this.pulseStartScale) * eased;
			const opacity = 0.35 * (1 - eased);

			const t = this.top;
			this.outline.scale.set(t.w * scale, 1, t.d * scale);

			// Update material opacity on all outline parts
			this.outline.children.forEach(child => {
				if (child.material) child.material.opacity = opacity;
			});

			if (progress >= 1) {
				this.pulseActive = false;
				this.updateOutline(); // Reset position and hide
			}
		}
	}

	/**
	 * Lands the moving block.
	 * @returns {{type:'perfect'|'partial'|'miss'|'crumbled', ...}}
	 */
	drop(tolerance) {
		const m = this.moving;
		const top = this.top;
		const size = m.axis === 'x' ? top.w : top.d;
		const result = computePlacement(m.pos, top[m.axis], size, tolerance);

		if (result.type === 'miss') {
			const dir = new THREE.Vector3();
			dir[m.axis] = Math.sign(result.delta) || 1;
			this.debris.spawn(this.detachMoving(), dir);
			this.moving = null;
			return result;
		}

		if (result.type === 'partial' && result.newSize < MIN_SIZE) {
			const dir = new THREE.Vector3();
			dir[m.axis] = Math.sign(result.delta) || 1;
			this.debris.spawn(this.detachMoving(), dir);
			this.moving = null;
			return { ...result, type: 'crumbled' };
		}

		// Snap the kept part into place — lands as an instance, the temp moving mesh is discarded.
		const layer = {
			x: m.axis === 'x' ? result.center : top.x,
			z: m.axis === 'z' ? result.center : top.z,
			w: m.axis === 'x' ? result.newSize : top.w,
			d: m.axis === 'z' ? result.newSize : top.d,
			y: m.y,
		};
		this.lastAxis = m.axis;

		if (result.type === 'partial') {
			const cut = m.mesh.clone();
			cut.material = m.mesh.material.clone();
			cut.scale.set(m.axis === 'x' ? result.cutSize : top.w, BLOCK_H, m.axis === 'z' ? result.cutSize : top.d);
			cut.position.set(m.axis === 'x' ? result.cutCenter : top.x, m.y, m.axis === 'z' ? result.cutCenter : top.z);
			const dir = new THREE.Vector3();
			dir[m.axis] = Math.sign(result.delta);
			this.debris.spawn(cut, dir);
		}

		this.group.remove(m.mesh);
		disposeBlock(m.mesh);
		this.addLayer(layer, m.index);

		this.moving = null;
		this.updateOutline();
		return { ...result, layer, critical: Math.min(layer.w, layer.d) < WARN_SIZE };
	}

	/** Removes the moving mesh from the tower and hands it over as debris. */
	detachMoving() {
		const mesh = this.moving.mesh;
		this.group.remove(mesh);
		return mesh;
	}

	updateOutline() {
		const t = this.top;
		if (!t) return;
		this.outline.scale.set(t.w * TARGET_OUTLINE_SCALE, 1, t.d * TARGET_OUTLINE_SCALE);
		this.outline.position.set(t.x, t.y + BLOCK_H / 2 + 0.015, t.z);

		// Keep outline hidden when not animating
		if (!this.pulseActive) {
			this.outline.children.forEach(child => {
				if (child.material) child.material.opacity = 0;
			});
		}
	}

	pulseOutline() {
		this.pulseActive = true;
		this.pulseTime = 0;
	}

	setOutlineVisible(v) {
		this.outline.visible = v;
	}
}
